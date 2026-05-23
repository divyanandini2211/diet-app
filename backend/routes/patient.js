const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import Models
const DietPlan = require('../models/DietPlan');
const DailyLog = require('../models/DailyLog');
const User = require('../models/User'); 

// --- Route 1: Get the Patient's Diet Plan ---
router.get('/my-diet/:patientId', async (req, res) => {
  try {
    const dietPlan = await DietPlan.findOne({ patientId: req.params.patientId });
    if (!dietPlan) return res.status(404).json({ message: 'No diet plan found' });
    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Route 2: The Core Gemini AI Meal Analysis ---
router.post('/:patientId/analyze-meal', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { sessionName, imageBase64, date } = req.body; 

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing!" });
    }

    // 1. Fetch the patient's diet plan to get DAILY targets
    const dietPlan = await DietPlan.findOne({ patientId });
    if (!dietPlan) return res.status(404).json({ error: 'No diet plan found for this patient.' });
    
    const dailyGoals = dietPlan.dailyGoals;

    // 2. Set up Google Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-flash-lite", // Using the correct current model name
        generationConfig: { responseMimeType: "application/json" }
    });
   
    // 3. The Refined Prompt
    const prompt = `
      You are the patient's personal, human clinical dietitian. Speak directly to the patient using "you" and "your". 
      Tone: Warm, encouraging, but clinical and strict about restricted foods.
      
      ⚠️ RESTRICTED FOODS: "${dietPlan.avoidables || "None"}".
      
      CONTEXT: The patient eats traditional Indian home-cooked meals (e.g., puri, roti, dal, curries). DO NOT classify traditional home-cooked Indian foods as "bakery items" or "junk food". Evaluate them fairly based on their ingredients.
      
      Tasks:
      1. Identify all food items in the meal.
      2. Estimate the nutritional content (calories, protein, carbs, fat, fiber).
      3. CRITICAL: If a food EXACTLY matches the restricted list, start your feedback with "🚨 WARNING:". Otherwise, give 2 sentences of encouraging feedback.
      
      Return ONLY a JSON object in this exact format:
      {
        "aiDetectedItems": ["food 1", "food 2"],
        "actualMacros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
        "feedback": "Write human-like feedback here."
      }
    `;

    // 4. Send the Image and Prompt to Gemini
    console.log(`Analyzing ${sessionName} for patient ${patientId}...`);
    const result = await model.generateContent([
      prompt, 
      { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
    ]);
    
    // 5. Parse the AI's response safely
    let responseText = result.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResult = JSON.parse(responseText);

    // 6. CALCULATE DAILY MATH & STATUS
    const todayLogs = await DailyLog.find({ patientId, date });
    
    let caloriesEatenToday = 0;
    todayLogs.forEach(log => {
      if (log.actualMacros && log.actualMacros.calories) {
        caloriesEatenToday += log.actualMacros.calories;
      }
    });

    const newTotalCalories = caloriesEatenToday + aiResult.actualMacros.calories;

    let status = "GOOD";
    if (aiResult.feedback.includes("🚨 WARNING:")) {
      status = "WARNING"; // AI noticed they ate a restricted food
    } else if (newTotalCalories > dailyGoals.calorieTarget) {
      status = "EXCEEDED"; // Pushed them over the daily limit
    } else if (newTotalCalories > (dailyGoals.calorieTarget * 0.85)) {
      status = "WARNING"; // Approaching limit (85%+)
    }

    // 7. Save the complete log to the database
    const newLog = new DailyLog({
      patientId,
      date,
      sessionName,
      imageUrl: `data:image/jpeg;base64,${imageBase64}`, 
      aiDetectedItems: aiResult.aiDetectedItems,
      
      // ✅ FIXED: Mapping DietPlan target names to DailyLog schema names!
      prescribedMacros: {
        calories: dailyGoals.calorieTarget || 2000,
        protein: dailyGoals.proteinTarget || 100,
        carbs: dailyGoals.carbsTarget || 250,
        fat: dailyGoals.fatTarget || 65,
        fiber: dailyGoals.fiberTarget || 30
      },

      actualMacros: aiResult.actualMacros,
      status: status, 
      feedback: aiResult.feedback
    });
    
    await newLog.save();

    // 8. Send the full log record back to the Mobile App
    res.json(newLog);

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to analyze the meal. " + error.message });
  }
});

// --- Route 3: Get all AI logs for a patient (Dietitian's Monitor tab) ---
router.get('/:patientId/all-logs', async (req, res) => {
    try {
      const logs = await DailyLog.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});

// --- Route 4: Get today's logs for a patient (Patient Dashboard) ---
router.get('/:patientId/today-logs/:date', async (req, res) => {
    try {
      const { patientId, date } = req.params;
      const logs = await DailyLog.find({ patientId, date });
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});

module.exports = router;