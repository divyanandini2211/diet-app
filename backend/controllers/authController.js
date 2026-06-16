const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SibApiV3Sdk = require('@getbrevo/brevo');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; 

// 📧 BREVO API SETUP (Instant & Reliable)
const sendOtpEmail = async (email, otp) => {
  let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  let apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.EMAIL_PASS; // Your Brevo API Key

  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = "Your OncoDiet OTP Code";
  sendSmtpEmail.htmlContent = `<html><body><p>Your registration OTP is: <strong>${otp}</strong></p></body></html>`;
  sendSmtpEmail.sender = { "name": "OncoDiet", "email": "send22divya@gmail.com" }; // Must be a verified sender in Brevo
  sendSmtpEmail.to = [{ "email": email }];

  return await apiInstance.sendTransEmail(sendSmtpEmail);
};

// 1. 🚀 FAST LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, role, opId } = req.body;
    const cleanPhone = phone ? phone.toString().trim() : '';

    const user = await User.findOne({ phone: cleanPhone, role });
    if (!user) return res.status(404).json({ message: 'User not found. Please sign up.' });

    if (!user.isVerified) return res.status(403).json({ message: 'Account not verified.' });

    if (role === 'patient' && user.opId !== opId) return res.status(401).json({ message: 'Invalid OP ID.' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(200).json({ message: 'Login successful', user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. 📨 REQUEST OTP (NON-BLOCKING FAST VERSION)
exports.requestOtp = async (req, res) => {
  try {
    const { email, phone, name, role, opId, height, weight } = req.body;
    const cleanPhone = phone ? phone.toString().trim() : '';
    const cleanEmail = email ? email.toString().trim().toLowerCase() : '';

    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    if (existing && existing.isVerified) return res.status(400).json({ message: 'Already registered. Please login.' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    let isNewUser = !existing;
    const user = existing || new User({ name, email: cleanEmail, phone: cleanPhone, role, opId, height, weight, otp, isVerified: false });
    
    if (existing) {
        user.otp = otp;
        user.name = name || user.name;
    }
    await user.save();
    
    // 🔥 INSTANT RESPONSE: We don't wait for the email to finish sending!
    sendOtpEmail(cleanEmail, otp).catch(async (err) => {
        console.error("Brevo API Error:", err);
        if (isNewUser) await User.findOneAndDelete({ email: cleanEmail });
    });

    return res.status(200).json({ message: 'OTP sent! Please check your email.' });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. ✅ VERIFY OTP
exports.registerUser = async (req, res) => {
  try {
    const { phone, clientOtp } = req.body;
    const cleanPhone = phone.toString().trim();
    const cleanOtp = clientOtp.toString().trim();

    const user = await User.findOne({ phone: cleanPhone });
    if (!user || user.otp !== cleanOtp) return res.status(400).json({ message: 'Invalid OTP.' });

    user.isVerified = true;
    user.otp = ''; 
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.status(201).json({ message: 'Account created!', user, token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};