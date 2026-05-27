const User = require('../models/User');
const DietPlan = require('../models/DietPlan');
const masterDietChart = require('../data/masterDietData'); // Make sure this path is correct!
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

// Helper to send email
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
    
    const user = await User.findOne({ phone, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up as a new user.' });
    }

    if (role === 'patient' && user.opId !== opId) {
      return res.status(401).json({ message: 'Invalid OP ID for this phone number.' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);

    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. REQUEST OTP
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ message: 'Phone or Email is already registered. Please login.' });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    try {
      await sendOtpEmail(email, otp);
    } catch (emailErr) {
      console.log("Email not sent (Check .env credentials):", emailErr.message);
    }

    res.status(200).json({ message: 'OTP sent to email!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. VERIFY OTP & REGISTER USER
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, role, opId, height, weight, clientOtp, serverOtp } = req.body;

    if (clientOtp !== serverOtp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // Create the user
    const newUser = new User({
      name, email, phone, role, opId, height, weight, isVerified: true
    });
    await newUser.save();

    // 🚀 RESTORED LOGIC: Assign Personal Diet Plan to Patient
    if (role === 'patient') {
      const personalDietPlan = new DietPlan({
        ...masterDietChart, 
        patientId: newUser._id // Link it to this exact patient
      });
      await personalDietPlan.save();
    }

    // Generate token
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET);

    res.status(201).json({ message: 'Account created & Diet Plan Assigned!', user: newUser, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};