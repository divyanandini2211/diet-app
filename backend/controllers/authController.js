const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

// 1. 🚀 LOGIN WITH CLEAR ROLE & VERIFICATION CHECKS
exports.login = async (req, res) => {
  try {
    const { phone, role, opId } = req.body;
    const cleanPhone = phone ? phone.toString().trim() : '';

    // First, check if the phone number exists at all in the database
    const user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up.' });
    }

    // Prevent contradiction: Check if the role matches the registered role
    if (user.role !== role) {
      return res.status(400).json({ 
        message: `This phone number is registered as a ${user.role.toUpperCase()}, not a ${role.toUpperCase()}.` 
      });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Account not verified. Please sign up to receive and enter your OTP.' 
      });
    }

    // Verify Patient OP ID
    if (role === 'patient' && user.opId !== opId) {
      return res.status(401).json({ message: 'Invalid OP ID.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    console.error("Login Error: ", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. ⚡ REQUEST OTP (WITH SEPARATE EMAIL & PHONE CHECKS)
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone, name, role, opId, height, weight } = req.body;
    
    const cleanPhone = phone ? phone.toString().trim() : '';
    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';

    // Check phone registration status
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone && existingPhone.isVerified) {
      return res.status(400).json({ message: 'This phone number is already registered. Please login.' });
    }

    // Check email registration status separately
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail && existingEmail.isVerified) {
      return res.status(400).json({ message: 'This email is already in use by another verified account.' });
    }

    // Generate strict 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    let user;
    if (existingPhone) {
      // Re-use the existing unverified document and update details
      user = existingPhone;
      user.otp = otp;
      user.name = name || user.name;
      user.email = cleanEmail || user.email;
      user.role = role || user.role;
      user.opId = opId || user.opId;
      user.height = height || user.height;
      user.weight = weight || user.weight;
    } else {
      // Create a new unverified user record
      user = new User({ 
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
    }
    
    await user.save();
    
    // Return the OTP in the JSON body so the frontend can capture and show it
    return res.status(200).json({ 
      message: 'OTP Generated successfully!',
      testOtp: otp 
    });

  } catch (error) {
    console.error("Request OTP Error: ", error);
    res.status(500).json({ message: 'Server error during OTP generation' });
  }
};

// 3. ✅ VERIFY OTP & CREATE ACCOUNT
exports.registerUser = async (req, res) => {
  try {
    const { phone, clientOtp } = req.body;
    const cleanPhone = phone ? phone.toString().trim() : '';
    const cleanOtp = clientOtp ? clientOtp.toString().trim() : '';

    const user = await User.findOne({ phone: cleanPhone });

    if (!user || user.otp !== cleanOtp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // Mark as verified and clear the temporary OTP
    user.isVerified = true;
    user.otp = ''; 
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(201).json({ message: 'Account created successfully!', user, token });

  } catch (error) {
    console.error("Register User Error: ", error);
    res.status(500).json({ message: 'Server error during verification' });
  }
};