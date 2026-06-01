const mongoose = require('mongoose');

// ✅ PERFECT SIMPLE SCHEMA: Just Name and Quantity
const DietItemSchema = new mongoose.Schema({
  name: String, 
  quantity: String
});

const SessionSchema = new mongoose.Schema({
  sessionName: String, 
  time: String,
  items: [DietItemSchema]
});

const DietPlanSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dietCategory: { type: String, default: "Custom/None" }, 
  
  dailyGoals: {
    calorieTarget: { type: Number, default: 0 },
    proteinTarget: { type: Number, default: 0 },
    carbsTarget: { type: Number, default: 0 },
    fatTarget: { type: Number, default: 0 },
    fiberTarget: { type: Number, default: 0 }
  },

  sessions: [SessionSchema],
  avoidables: { type: String, default: "" },

}, { timestamps: true });

module.exports = mongoose.model('DietPlan', DietPlanSchema);