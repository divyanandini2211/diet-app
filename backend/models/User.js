const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  phone: { type: String, required: true, unique: true }, // 👈 New primary login method
  role: { type: String, enum: ['patient', 'dietitian'], required: true },
  
  // Patient specific details
  opId: { type: String }, 
  height: { type: String },
  weight: { type: String },
  
  // OTP logic
  otp: { type: String },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);