const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import Models
const DietPlan = require('../models/DietPlan');
const DailyLog = require('../models/DailyLog');

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

// --- Route 2: STEP 1 - FAST AI DETECTION (No Saving) ---
// This just quickly looks at the photo and lists the food names so the patient doesn't have to type them.
router.post('/:patientId/detect-items', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Gemini API key is missing!" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" } });

    const prompt = `Identify the food items in this image. Do not calculate macros yet. Return ONLY a JSON object in this format: { "items": ["Food 1", "Food 2"] }`;
    
    console.log(`Detecting food items for patient ${req.params.patientId}...`);
    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }]);
    
    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(responseText));

  } catch (error) {
    console.error("Detect Error:", error);
    res.status(500).json({ error: "Failed to detect items." });
  }
});

// --- Route 3: STEP 2 - CALCULATE MACROS & SAVE AS PENDING ---
router.post('/:patientId/analyze-and-save', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { sessionName, imageBase64, date, finalizedItems } = req.body; 
    // finalizedItems looks like: [{name: "Roti", quantity: "2"}, {name: "Dal", quantity: "1 bowl"}]

    const dietPlan = await DietPlan.findOne({ patientId });
    if (!dietPlan) return res.status(404).json({ error: 'No diet plan found.' });
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite", generationConfig: { responseMimeType: "application/json" }});
   
    // The AI now calculates macros based on the EXACT quantities the patient typed!
    // The AI now calculates macros based on the quantities OR the image if they left it blank!
    const prompt = `
      You are a clinical dietitian AI. 
      RESTRICTED FOODS: "${dietPlan.avoidables || "None"}".
      
      The patient provided this list of foods and quantities:
      ${JSON.stringify(finalizedItems)}
      🥘 TRADITIONAL FRIED FOOD RULE: 
      - DO NOT issue a WARNING for traditional home-cooked Indian fried foods (like Puri, Vada, Pakora, Paratha, etc.) just because they use oil or are fried. 
      - ONLY issue a WARNING if the specific item, or the phrase "fried foods", is explicitly written in the RESTRICTED FOODS list above.
      
      Tasks:
      1. Estimate the exact nutritional content (calories, protein, carbs, fat, fiber).
      2. CRITICAL RULES FOR QUANTITY: 
         - If the patient typed a specific quantity (e.g., "2", "150g"), calculate exactly for that.
         - If the quantity is BLANK, vague (e.g., "some"), or just "1", look at the provided IMAGE to visually estimate the portion size.
         - If you still cannot determine the size, assume 1 standard average serving for that food.
      3. Check if any of these foods match the restricted list. If so, start your feedback with "🚨 WARNING:". Otherwise, give encouraging feedback.
      
      Return ONLY a JSON object in this format:
      {
        "actualMacros": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0},
        "feedback": "Write feedback here."
      }
    `;

    console.log(`Calculating final macros and saving as PENDING...`);
    const result = await model.generateContent([prompt, { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }]);
    
    let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResult = JSON.parse(responseText);

    // Format the items so they look nice in the database (e.g. "2 x Roti", "1 bowl x Dal")
    const formattedItems = finalizedItems.map(item => `${item.quantity} x ${item.name}`);

    // SAVE AS PENDING
    const newLog = new DailyLog({
      patientId,
      date,
      sessionName,
      imageUrl: `data:image/jpeg;base64,${imageBase64}`, 
      aiDetectedItems: formattedItems,
      prescribedMacros: {
        calories: dietPlan.dailyGoals.calorieTarget || 2000,
        protein: dietPlan.dailyGoals.proteinTarget || 100,
        carbs: dietPlan.dailyGoals.carbsTarget || 250,
        fat: dietPlan.dailyGoals.fatTarget || 65,
        fiber: dietPlan.dailyGoals.fiberTarget || 30
      },
      actualMacros: aiResult.actualMacros,
      approvalStatus: 'PENDING', // 👈 MANDATORY REVIEW FOR DIETITIAN
      status: aiResult.feedback.includes("🚨 WARNING:") ? "WARNING" : "GOOD", 
      feedback: aiResult.feedback
    });
    
    await newLog.save();
    res.json(newLog);

  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ error: "Failed to save the meal." });
  }
});

// --- Route 4: Get all logs ---
router.get('/:patientId/all-logs', async (req, res) => {
    try {
      const logs = await DailyLog.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
      res.json(logs);
    } catch (err) {
      res.status(500).send('Server Error');
    }
});

// --- Route 5: Get today's logs ---
router.get('/:patientId/today-logs/:date', async (req, res) => {
    try {
      const { patientId, date } = req.params;
      const logs = await DailyLog.find({ patientId, date });
      res.json(logs);
    } catch (err) {
      res.status(500).send('Server Error');
    }
});

module.exports = router;