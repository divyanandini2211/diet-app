const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OncoDiet OTP Code',
    text: `Your registration OTP is: ${otp}. Welcome to OncoDiet!`
  });
};

// 1. FAST LOGIN (For switching between Patient and Dietitian easily)
exports.login = async (req, res) => {
  try {
    const { phone, role, opId } = req.body;
    
    const user = await User.findOne({ phone, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up as a new user.' });
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

// 2. REQUEST OTP (For Brand New Users ONLY)
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone, name, role, opId, height, weight } = req.body;
    
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    
    // Protects existing users from being overwritten!
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'Phone or Email is already registered. Please login.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    if (existing) {
      existing.otp = otp;
      await existing.save();
    } else {
      const newUser = new User({
        name, email, phone, role, opId, height, weight, otp, isVerified: false
      });
      await newUser.save();
    }
    
    try {
      await sendOtpEmail(email, otp);
    } catch (emailErr) {
      console.log("Email not sent:", emailErr.message);
    }

    res.status(200).json({ message: 'OTP sent to email!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. VERIFY OTP & CREATE ACCOUNT
exports.registerUser = async (req, res) => {
  try {
    const { phone, clientOtp } = req.body;

    console.log(`Verifying OTP for Phone: ${phone}. User typed: ${clientOtp}`);

    if (!phone || !clientOtp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }

    // Find the user by phone number
    const user = await User.findOne({ phone: phone });

    if (!user) {
      console.log(`❌ User with phone ${phone} not found in database!`);
      return res.status(404).json({ message: 'Account not found. Please request a new OTP.' });
    }

    console.log(`Database OTP is: ${user.otp}`);

    if (user.otp !== clientOtp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Success! Mark as verified and erase the OTP for security
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