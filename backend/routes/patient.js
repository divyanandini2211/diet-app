const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import Models
const DietPlan = require('../models/DietPlan');
const DailyLog = require('../models/DailyLog');

// --- Helper: Parse logged volume to a multiplier (e.g., "200 ml" or "2" -> multiplier 2) ---
function getVolumeMultiplier(quantityStr) {
  const clean = quantityStr.toString().toLowerCase().trim();
  const num = parseFloat(clean);
  
  if (!isNaN(num)) {
    // If they typed "2" or "1" (syringe count)
    if (num <= 10) return num; 
    // If they typed raw ml "200" or "100"
    if (num >= 50) return num / 100; 
  }
  
  // If they logged "200 ml" or "100 ml"
  if (clean.includes("ml")) {
    const parsedMl = parseFloat(clean.replace("ml", "").trim());
    if (!isNaN(parsedMl)) return parsedMl / 100;
  }
  
  return 2; // Default to 2 units (200ml) if unspecified
}

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
    const { imageBase64, date, finalizedItems, capturedAt, displayTime } = req.body;

    const dietPlan = await DietPlan.findOne({ patientId });
    if (!dietPlan) return res.status(404).json({ error: 'No diet plan found.' });

    // 📋 DIETITIAN'S EXACT RECIPE STANDARDS (per 100ml unit)
    const clinicalRecipes = {
      "milk": { calories: 73, carbs: 5.0, protein: 3.0, fat: 4.0 },
      "almond milk": { calories: 73, carbs: 5.0, protein: 3.0, fat: 4.0 },
      "hccm with milk": { calories: 117.8, carbs: 8.7, protein: 1.72, fat: 7.07 },
      "health mix porridge / hccm": { calories: 117.8, carbs: 8.7, protein: 1.72, fat: 7.07 },
      "egg blend": { calories: 100, carbs: 10.0, protein: 4.8, fat: 4.3 },
      "nutritive kanjee": { calories: 45.5, carbs: 6.5, protein: 1.875, fat: 1.6 },
      "paneer blend": { calories: 105.2, carbs: 11.8, protein: 4.3, fat: 4.25 }
    };

    let calculatedMacros = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    let isClinicalMeal = false;

    // Check if the items logged match any clinical formula keys
    finalizedItems.forEach(item => {
      const nameClean = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
      if (clinicalRecipes[nameClean]) {
        isClinicalMeal = true;
      }
    });

    let feedback = "";
    let isWarning = false;

    if (isClinicalMeal) {
      // ⚙️ CALCULATE CLINICAL MATHEMATICAL TOTALS
      console.log("Processing clinical formula macros mathematically...");
      
      finalizedItems.forEach(item => {
        const nameClean = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
        const recipe = clinicalRecipes[nameClean];

        if (recipe) {
          const multiplier = getVolumeMultiplier(item.quantity);
          calculatedMacros.calories += multiplier * recipe.calories;
          calculatedMacros.carbs += multiplier * recipe.carbs;
          calculatedMacros.protein += multiplier * recipe.protein;
          calculatedMacros.fat += multiplier * recipe.fat;
        }
      });

      // Format decimal points safely
      calculatedMacros = {
        calories: parseFloat(calculatedMacros.calories.toFixed(1)),
        carbs: parseFloat(calculatedMacros.carbs.toFixed(1)),
        protein: parseFloat(calculatedMacros.protein.toFixed(1)),
        fat: parseFloat(calculatedMacros.fat.toFixed(1)),
        fiber: 0
      };

      feedback = "Good job! Added a great nutritional meal to your log.";

    } else {
      // 🤖 DEFAULT BEHAVIOR: Use Gemini AI standard image/text macro generator
      console.log("Calculating macros via Gemini AI...");
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is missing!" });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.1-flash-lite", 
        generationConfig: { responseMimeType: "application/json" }
      });

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

      const result = await model.generateContent([
        prompt, 
        { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
      ]);
      
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResult = JSON.parse(responseText);

      calculatedMacros = aiResult.actualMacros;
      feedback = aiResult.feedback;
      isWarning = feedback?.includes("🚨 WARNING:");
    }

    // Save Log as Pending
    const formattedItems = finalizedItems.map(item => `${item.quantity} x ${item.name}`);

    const newLog = new DailyLog({
      patientId,
      date,
      capturedAt,
      displayTime,
      imageUrl: `data:image/jpeg;base64,${imageBase64}`, 
      aiDetectedItems: formattedItems,
      prescribedMacros: {
        calories: dietPlan.dailyGoals.calorieTarget || 2000,
        protein: dietPlan.dailyGoals.proteinTarget || 100,
        carbs: dietPlan.dailyGoals.carbsTarget || 250,
        fat: dietPlan.dailyGoals.fatTarget || 65,
        fiber: dietPlan.dailyGoals.fiberTarget || 30
      },
      actualMacros: calculatedMacros,
      approvalStatus: 'PENDING', 
      status: isWarning ? "WARNING" : "GOOD", 
      feedback: feedback
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