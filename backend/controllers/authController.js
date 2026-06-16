const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

// 📧 BREVO SMTP SETUP (The only way to avoid Render timeouts!)
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Must be false for port 587
    auth: { 
      user: process.env.EMAIL_USER, // Your Brevo Login Email
      pass: process.env.EMAIL_PASS  // Your Brevo SMTP Key
    }
  });
  
  await transporter.sendMail({
    from: process.env.EMAIL_USER, // Sender must be verified in Brevo
    to: email,
    subject: 'Your OncoDiet OTP Code',
    text: `Your registration OTP is: ${otp}. Welcome to OncoDiet!`
  });
};

// 1. 🚀 FAST LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, role, opId } = req.body;
    
    const cleanPhone = phone ? phone.toString().trim() : '';

    const user = await User.findOne({ phone: cleanPhone, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up as a new user.' });
    }

    // 🛑 SECURITY BLOCK: Stop unverified "Ghost" users from logging in!
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please sign up and enter your OTP.' });
    }

    if (role === 'patient' && user.opId !== opId) {
      return res.status(401).json({ message: 'Invalid OP ID for this phone number.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. 📨 REQUEST OTP (REAL SECURITY + BREVO)
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone, name, role, opId, height, weight } = req.body;
    
    const cleanPhone = phone ? phone.toString().trim() : '';
    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';

    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'Phone or Email is already registered. Please login.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    let isNewUser = false;

    if (existing) {
      existing.otp = otp;
      existing.name = name || existing.name;
      existing.opId = opId || existing.opId;
      await existing.save();
    } else {
      isNewUser = true;
      const newUser = new User({
        name, 
        email: cleanEmail, 
        phone: cleanPhone, 
        role, 
        opId, 
        height, 
        weight, 
        otp, 
        isVerified: false 
      });
      await newUser.save();
    }
    
    try {
      await sendOtpEmail(cleanEmail, otp);
      return res.status(200).json({ message: 'OTP successfully sent to your email!' });
      
    } catch (emailErr) {
      console.log("Nodemailer failed:", emailErr.message);
      
      if (isNewUser) {
        await User.findOneAndDelete({ email: cleanEmail });
        console.log("Deleted ghost user because email failed to send.");
      }
      
      return res.status(500).json({ message: 'Failed to send OTP email. Check SMTP settings.' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. ✅ VERIFY OTP & CREATE ACCOUNT
exports.registerUser = async (req, res) => {
  try {
    const { phone, clientOtp } = req.body;

    if (!phone || !clientOtp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }

    const cleanPhone = phone.toString().trim();
    const cleanOtp = clientOtp.toString().trim();

    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please request a new OTP.' });
    }

    if (!user.otp || user.otp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    user.isVerified = true;
    user.otp = ''; 
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(201).json({ message: 'Account created successfully!', user, token });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};