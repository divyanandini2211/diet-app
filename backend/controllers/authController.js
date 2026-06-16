const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

// HELPER: Send Email
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

// 1. FAST LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, role, opId } = req.body;
    
    // Clean inputs just in case
    const cleanPhone = phone ? phone.toString().trim() : '';

    const user = await User.findOne({ phone: cleanPhone, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up as a new user.' });
    }

    // 🛑 THE FIX: Block unverified ghost users!
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

// 2. REQUEST OTP
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone, name, role, opId, height, weight } = req.body;
    
    // Clean phone input
    const cleanPhone = phone ? phone.toString().trim() : '';
    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';

    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    
    // Protects fully verified users from being overwritten
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'Phone or Email is already registered. Please login.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // If user exists but IS NOT verified, update them with new OTP
    if (existing) {
      existing.otp = otp;
      existing.name = name || existing.name;
      existing.opId = opId || existing.opId;
      await existing.save();
    } else {
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
      return res.status(200).json({ message: 'OTP sent to email!' });
    } catch (emailErr) {
      console.log("Email not sent:", emailErr.message);
      // 🛑 FIX: If email fails, tell the frontend!
      return res.status(500).json({ message: 'Failed to send email. Check email address and try again.' });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. VERIFY OTP & CREATE ACCOUNT
exports.registerUser = async (req, res) => {
  try {
    const { phone, clientOtp } = req.body;

    if (!phone || !clientOtp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }

    // 🛠️ BUG FIX: Clean the phone number of any accidental spaces!
    const cleanPhone = phone.toString().trim();
    const cleanOtp = clientOtp.toString().trim();
    
    console.log(`\n🔍 VERIFYING: phone='${cleanPhone}', otp='${cleanOtp}'`);

    // Search using the clean phone number
    const user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      console.log(`❌ FAILED: Could not find phone '${cleanPhone}' in database!`);
      return res.status(404).json({ message: 'Account not found. Please request a new OTP.' });
    }

    if (!user.otp || user.otp !== cleanOtp) {
      console.log(`❌ FAILED: DB OTP is '${user.otp}', but user typed '${cleanOtp}'`);
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Success! Mark as verified and erase the OTP for security
    user.isVerified = true;
    user.otp = ''; 
    await user.save();

    console.log(`✅ SUCCESS: User ${user.name} is now verified!`);

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(201).json({ message: 'Account created successfully!', user, token });

  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};