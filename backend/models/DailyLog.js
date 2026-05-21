const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: String, required: true }, // Format: "YYYY-MM-DD"
  sessionName: { type: String }, // e.g., "Lunch"
  
  // What the user uploaded
  imageUrl: { type: String }, // Can be base64 string or a URL
  
  // AI Analysis Results
  aiDetectedItems: [String],
  
  prescribedMacros: {
    calories: Number, protein: Number, carbs: Number, fat: Number, fiber: Number
  },
  
  actualMacros: {
    calories: Number, protein: Number, carbs: Number, fat: Number, fiber: Number
  },
  
  // AI feedback message
  feedback: String

}, { timestamps: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);