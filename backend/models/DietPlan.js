// models/DietPlan.js
const mongoose = require('mongoose');

const DietItemSchema = new mongoose.Schema({
  categoryName: String, 
  options: [String],    
  quantityValue: String,
  unit: String          
});

const SessionSchema = new mongoose.Schema({
  sessionName: String, 
  time: String,
  items: [DietItemSchema]
});

const DietPlanSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Daily nutrition goals set by dietitian
  dailyGoals: {
    calorieTarget: { type: Number, default: 2000 },
    proteinTarget: { type: Number, default: 100 },
    carbsTarget: { type: Number, default: 250 },
    fatTarget: { type: Number, default: 65 },
    fiberTarget: { type: Number, default: 30 }
  },

  dailyAllowances: {
    oil: { value: String, unit: { type: String, default: "ml / teaspoons" } },
    sugar: { value: String, unit: { type: String, default: "Grams / teaspoons" } },
    water: { value: String, unit: { type: String, default: "Liters per day" } },
    salt: { value: String, unit: { type: String, default: "Grams / teaspoons" } }
  },

  reference: { type: String, default: "1 Cup = 200 ml, 1 Tablespoon = 15 ml, 1 Teaspoon = 5 ml" },
  
  sessions: [SessionSchema],

  // Restricted/avoidable foods
  avoidables: { type: String, default: "" },

  // Calculated totals (from AI)
  totalDailyTarget: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 }
  }

}, { timestamps: true });

// Helper function to create a default 3-meal diet plan
const createDefaultDietPlan = (patientId) => {
  return {
    patientId,
    dailyGoals: {
      calorieTarget: 2000,
      proteinTarget: 100,
      carbsTarget: 250,
      fatTarget: 65,
      fiberTarget: 30
    },
    sessions: [
      {
        sessionName: "Breakfast",
        time: "8:00 AM",
        items: []
      },
      {
        sessionName: "Lunch",
        time: "12:30 PM",
        items: []
      },
      {
        sessionName: "Dinner",
        time: "7:30 PM",
        items: []
      }
    ],
    dailyAllowances: {
      oil: { value: "", unit: { type: String, default: "ml / teaspoons" } },
      sugar: { value: "", unit: { type: String, default: "Grams / teaspoons" } },
      water: { value: "", unit: { type: String, default: "Liters per day" } },
      salt: { value: "", unit: { type: String, default: "Grams / teaspoons" } }
    },
    avoidables: ""
  };
};

module.exports = mongoose.model('DietPlan', DietPlanSchema);
module.exports.createDefaultDietPlan = createDefaultDietPlan;