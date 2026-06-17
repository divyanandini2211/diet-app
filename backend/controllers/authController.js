const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

// 1. 🚀 FAST LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, role, opId } = req.body;
    const cleanPhone = phone ? phone.toString().trim() : '';

    const user = await User.findOne({ phone: cleanPhone, role });
    if (!user) return res.status(404).json({ message: 'User not found. Please sign up.' });

    if (!user.isVerified) return res.status(403).json({ message: 'Account not verified. Please sign up and enter your OTP.' });

    if (role === 'patient' && user.opId !== opId) return res.status(401).json({ message: 'Invalid OP ID.' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. ⚡ INSTANT PROTOTYPE OTP
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone, name, role, opId, height, weight } = req.body;
    
    const cleanPhone = phone ? phone.toString().trim() : '';
    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';

    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    
    if (existing && existing.isVerified) {
      return res.status(400).json({ message: 'Already registered. Please login.' });
    }

    // Generate strict 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    let user;
    if (existing) {
      user = existing;
      user.otp = otp;
      user.name = name || user.name;
    } else {
      user = new User({ 
        name, email: cleanEmail, phone: cleanPhone, role, opId, height, weight, otp, isVerified: false 
      });
    }
    
    await user.save();
    
    // 🔥 SEND OTP DIRECTLY TO THE FRONTEND (NO EMAILS)
    return res.status(200).json({ 
      message: 'OTP Generated!',
      testOtp: otp // <--- Handing it right back to the app
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. ✅ VERIFY OTP & CREATE ACCOUNT
exports.registerUser = async (req, res) => {
  try {
    const { phone, clientOtp } = req.body;
    const cleanPhone = phone.toString().trim();
    const cleanOtp = clientOtp.toString().trim();

    const user = await User.findOne({ phone: cleanPhone });

    if (!user || user.otp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified and erase the OTP
    user.isVerified = true;
    user.otp = ''; 
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(201).json({ message: 'Account created successfully!', user, token });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};