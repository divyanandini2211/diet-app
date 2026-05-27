const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: String, required: true }, 
  sessionName: { type: String }, 
  capturedAt: { type: Date },
  displayTime: { type: String },
  imageUrl: { type: String }, 
  patientNote: { type: String }, // 👈 NEW: For "2 rotis"
  
  approvalStatus: { type: String, default: 'PENDING' }, // 👈 NEW: 'PENDING' or 'APPROVED'
  
  aiDetectedItems: [String],
  prescribedMacros: { calories: Number, protein: Number, carbs: Number, fat: Number, fiber: Number },
  actualMacros: { calories: Number, protein: Number, carbs: Number, fat: Number, fiber: Number },
  
  status: String,
  feedback: String
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);