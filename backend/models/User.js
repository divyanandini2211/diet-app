// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'dietitian'], required: true },
  
  // Patient specific details
  opId: { type: String },
  height: { type: String }, 
  weight: { type: String }, 

  // New fields for Monitoring
  weightHistory: [
    {
      weight: Number,
      date: { type: Date, default: Date.now }
    }
  ],
  streak: { type: Number, default: 0 },

  dietPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'DietPlan' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);