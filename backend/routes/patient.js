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

// --- Route 2: Update Patient's Weight ---
router.post('/update-weight', async (req, res) => {
  try {
    const { patientId, weight } = req.body;
    await User.findByIdAndUpdate(patientId, { weight: weight });
    res.json({ message: "Weight updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Route 3: The Core Gemini AI Meal Analysis ---
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

    // Use daily goals, not per-meal targets
    const dailyGoals = dietPlan.dailyGoals;

    // 2. Set up Google Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-pro-vision", // Vision model is required for images
        generationConfig: { responseMimeType: "application/json" }
    });
   
    // 3. The Refined Prompt
    const prompt = `
      You are an expert clinical dietitian AI. 
      ⚠️ The user's RESTRICTED FOODS are: "${dietPlan.avoidables || "None"}".
      
      Look at the image of the meal the user ACTUALLY ate. Your tasks are:
      1. Identify all food items in the image.
      2. Estimate the nutritional content (calories, protein, carbs, fat, fiber) of the food in the image. This is the "actualMacros".
      3. CRITICAL: Check if any food you identified is on the RESTRICTED FOODS list. If so, you MUST start your feedback with "🚨 WARNING:" and explain the issue.
      
      Return ONLY a JSON object in this exact format:
      {
        "aiDetectedItems": ["food 1", "food 2"],
        "actualMacros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
        "feedback": "Write 2-3 sentences of helpful feedback. Include the 🚨 WARNING here if they ate a restricted food."
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

    // 6. Save the complete log to the database
    const newLog = new DailyLog({
      patientId,
      date,
      sessionName,
      imageUrl: `data:image/jpeg;base64,${imageBase64}`, 
      aiDetectedItems: aiResult.aiDetectedItems,
      prescribedMacros: dailyGoals, // Store daily goals for reference
      actualMacros: aiResult.actualMacros, // Saving the AI's estimate of the photo
      feedback: aiResult.feedback
    });
    await newLog.save();

    // 7. Send the full log record back to the Mobile App
    res.json(newLog);

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to analyze the meal. " + error.message });
  }
});

// --- Route 4: Get all AI logs for a patient (for Dietitian's Monitor tab) ---
router.get('/:patientId/all-logs', async (req, res) => {
    try {
      const logs = await DailyLog.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
      res.json(logs);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
});

// --- Route 5: Get today's logs for a patient (for remaining macros calculation) ---
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

// --- Route 6: Save simple meal log (patient manually entering quantities) ---
router.post('/:patientId/log', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { sessionName, date, items } = req.body;

    const newLog = new DailyLog({
      patientId,
      sessionName,
      date,
      aiDetectedItems: items.map(i => i.categoryName),
      prescribedMacros: {},
      actualMacros: {},
      status: 'LOGGED',
      feedback: 'Manual log entry by patient'
    });

    await newLog.save();
    res.json({ message: 'Meal logged successfully', log: newLog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;