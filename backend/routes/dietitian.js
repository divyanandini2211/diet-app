const express = require('express');
const User = require('../models/User');
const DietPlan = require('../models/DietPlan');
const DailyLog = require('../models/DailyLog'); 
// ✅ IMPORT THE TEMPLATES HERE
const dietTemplates = require('../data/masterDietData'); 

const router = express.Router();

// 📱 ✅ NEW: Get Templates Route for the Dropdown Menu!
router.get('/templates', (req, res) => {
  res.json(dietTemplates);
});

// 📱 PAGE 1: Get list of all Patients
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 PAGE 2: Get Patient Diet Plan (Starts Empty if none exists)
router.get('/patient/:patientId/diet', async (req, res) => {
  try {
    const { patientId } = req.params;
    let dietPlan = await DietPlan.findOne({ patientId: patientId });
    
    // ✅ NEW PATIENTS START EMPTY! Wait for Dietitian to load a template.
    if (!dietPlan) {
      dietPlan = new DietPlan({
        patientId: patientId,
        dietCategory: "Not Assigned",
        sessions: [], // Empty sessions
        avoidables: '',
        dailyGoals: { calorieTarget: 0, proteinTarget: 0, carbsTarget: 0, fatTarget: 0, fiberTarget: 0 }
      });
      await dietPlan.save();
    }
    
    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 PAGE 2: Edit or Delete items in a Patient's Diet Plan
router.put('/patient/:patientId/diet/:sessionId', async (req, res) => {
  try {
    const { patientId, sessionId } = req.params;
    const { updatedItems } = req.body; 

    const dietPlan = await DietPlan.findOne({ patientId });
    if (!dietPlan) return res.status(404).json({ message: 'Diet plan not found' });

    const session = dietPlan.sessions.id(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.items = updatedItems; 
    await dietPlan.save();
    
    res.json({ message: 'Diet Plan updated successfully!', dietPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 Update EVERYTHING: Sessions, Goals, Avoidables, AND Category
router.put('/patient/:patientId/diet-full', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { sessions, avoidables, dailyGoals, dietCategory } = req.body; // ✅ Added dietCategory

    let dietPlan = await DietPlan.findOne({ patientId });
    
    if (!dietPlan) {
      dietPlan = new DietPlan({ patientId, sessions, avoidables, dailyGoals, dietCategory });
      await dietPlan.save();
    } else {
      dietPlan.sessions = sessions;
      dietPlan.avoidables = avoidables;
      dietPlan.dailyGoals = dailyGoals;
      if (dietCategory) dietPlan.dietCategory = dietCategory; // ✅ Saves the loaded template name
      await dietPlan.save();
    }

    res.json({ message: 'Diet plan saved successfully!', dietPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 Get ALL AI Logs & Photos for a Patient (for monitoring!)
router.get('/patient/:patientId/all-logs', async (req, res) => {
  try {
    const { patientId } = req.params;
    const logs = await DailyLog.find({ patientId }).sort({ createdAt: -1 }); 
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 NEW: Approve and Edit a Pending Log (Dietitian Side)
router.put('/log/:logId/approve', async (req, res) => {
  try {
    const { logId } = req.params;
    const { actualMacros, feedback } = req.body;

    const log = await DailyLog.findById(logId);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    log.actualMacros = actualMacros;
    log.feedback = feedback;
    log.approvalStatus = 'APPROVED'; 

    await log.save();
    res.json({ message: 'Log approved successfully!', log });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🧹 CLEANUP: Delete all old diet plans to force rebuild from new master data
router.delete('/cleanup/all-diet-plans', async (req, res) => {
  try {
    const result = await DietPlan.deleteMany({});
    res.json({ message: `✅ Deleted ${result.deletedCount} old diet plans.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ✅ KEPT YOUR CUSTOM PROGRESS ANALYTICS ROUTE! ---
router.get('/patient/:id/progress', async (req, res) => {
  try {
    const logs = await DailyLog.find({ patientId: req.params.id });
    const dailyStats = {};

    logs.forEach(log => {
      let normalizedDate = log.date;
      if (typeof log.date === 'string' && log.date.includes('/')) {
        const [day, month, year] = log.date.split('/');
        normalizedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      if (!dailyStats[normalizedDate]) {
        dailyStats[normalizedDate] = {
          actual: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
          prescribed: log.prescribedMacros || { calories: 2000, protein: 100, carbs: 250, fat: 65, fiber: 30 }
        };
      }

      ['calories', 'protein', 'carbs', 'fat', 'fiber'].forEach(metric => {
        dailyStats[normalizedDate].actual[metric] += (log.actualMacros?.[metric] || 0);
      });
    });

    const progressData = {};
    for (const date in dailyStats) {
      progressData[date] = {};
      ['calories', 'protein', 'carbs', 'fat', 'fiber'].forEach(metric => {
        const actual = dailyStats[date].actual[metric];
        const prescribed = dailyStats[date].prescribed[metric];
        const percentage = prescribed > 0 ? Math.round((actual / prescribed) * 100) : 0;

        progressData[date][metric] = {
          actualPercentage: percentage,
          chartPercentage: Math.min(percentage, 100)
        };
      });
    }

    res.json(progressData);
  } catch (error) {
    console.error('Progress Route Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;