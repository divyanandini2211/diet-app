const express = require('express');
const User = require('../models/User');
const DietPlan = require('../models/DietPlan');
// It's good practice to import DailyLog at the top!
const DailyLog = require('../models/DailyLog'); 

const router = express.Router();

// 📱 PAGE 1: Get list of all Patients
router.get('/patients', async (req, res) => {
  try {
    // Find all users where role is 'patient'. (Don't send passwords back!)
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 PAGE 2: Get a specific patient's Diet Plan (or create a new one from master data)
router.get('/patient/:patientId/diet', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // First, check if a plan already exists (dietician might have already edited it)
    let dietPlan = await DietPlan.findOne({ patientId: patientId });
    
    // If no plan exists, create one from master diet data (first-time access)
    if (!dietPlan) {
      const masterDietData = require('../data/masterDietData');
      const defaultPlan = {
        patientId: patientId,
        sessions: masterDietData.sessions,
        dailyAllowances: masterDietData.dailyAllowances,
        dailyGoals: {
          calorieTarget: 2000,
          proteinTarget: 100,
          carbsTarget: 250,
          fatTarget: 65,
          fiberTarget: 30
        },
        avoidables: ''
      };
      dietPlan = new DietPlan(defaultPlan);
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
    const { updatedItems } = req.body; // The mobile app sends the new list of food here

    const dietPlan = await DietPlan.findOne({ patientId });
    if (!dietPlan) return res.status(404).json({ message: 'Diet plan not found' });

    // Find the specific session (e.g., Breakfast) and update its items
    const session = dietPlan.sessions.id(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.items = updatedItems; // This handles both Edits and Deletes!
    await dietPlan.save();
    
    res.json({ message: 'Diet Plan updated successfully!', dietPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 PAGE 2 (Activity Tab): View what the patient ate today
router.get('/patient/:patientId/log/:date', async (req, res) => {
  try {
    const { patientId, date } = req.params;
    const log = await DailyLog.findOne({ patientId, date });
    res.json(log || { message: 'No logs for this date yet.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 Update EVERYTHING: Sessions, Goals, Avoidables
router.put('/patient/:patientId/diet-full', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { sessions, avoidables, dailyGoals } = req.body;

    // Check if diet plan exists, if not create it
    let dietPlan = await DietPlan.findOne({ patientId });
    
    if (!dietPlan) {
      dietPlan = new DietPlan({
        patientId,
        sessions,
        avoidables,
        dailyGoals: dailyGoals || {
          calorieTarget: 2000,
          proteinTarget: 100,
          carbsTarget: 250,
          fatTarget: 65,
          fiberTarget: 30
        }
      });
      await dietPlan.save();
    } else {
      // Update existing plan
      dietPlan.sessions = sessions;
      dietPlan.avoidables = avoidables;
      dietPlan.dailyGoals = dailyGoals || {
        calorieTarget: 2000,
        proteinTarget: 100,
        carbsTarget: 250,
        fatTarget: 65,
        fiberTarget: 30
      };
      await dietPlan.save();
    }

    res.json({ message: 'Diet plan saved successfully!', dietPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 Get Heatmap Data (Last 30 days)
router.get('/patient/:patientId/activity', async (req, res) => {
  try {
    const { patientId } = req.params;
    const logs = await DailyLog.find({ patientId });
    const activeDates = logs.map(log => log.date); 
    res.json(activeDates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📱 Get ALL AI Logs & Photos for a Patient (for monitoring!)
router.get('/patient/:patientId/all-logs', async (req, res) => {
  try {
    const { patientId } = req.params;
    const logs = await DailyLog.find({ patientId }).sort({ createdAt: -1 }); // -1 means newest first!
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

    // Update the macros and feedback with the Dietitian's final numbers
    log.actualMacros = actualMacros;
    log.feedback = feedback;
    
    // Change the status to APPROVED so it unlocks on the Patient's screen!
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
// --- NEW: Progress Analytics Route ---
router.get('/patient/:id/progress', async (req, res) => {
  try {

    const logs = await DailyLog.find({
      patientId: req.params.id
    });

    const dailyStats = {};

    logs.forEach(log => {

      let normalizedDate = log.date;

      // Handles DD/MM/YYYY format safely
      if (typeof log.date === 'string' && log.date.includes('/')) {

        const [day, month, year] = log.date.split('/');

        normalizedDate =
          `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      if (!dailyStats[normalizedDate]) {

        dailyStats[normalizedDate] = {

          actual: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          },

          prescribed:
            log.prescribedMacros || {
              calories: 2000,
              protein: 100,
              carbs: 250,
              fat: 65,
              fiber: 30
            }
        };
      }

      ['calories', 'protein', 'carbs', 'fat', 'fiber']
        .forEach(metric => {

          dailyStats[normalizedDate]
            .actual[metric] += (
              log.actualMacros?.[metric] || 0
            );
        });
    });

    const progressData = {};

    for (const date in dailyStats) {

      progressData[date] = {};

      ['calories', 'protein', 'carbs', 'fat', 'fiber']
        .forEach(metric => {

          const actual =
            dailyStats[date].actual[metric];

          const prescribed =
            dailyStats[date].prescribed[metric];

          const percentage =
            prescribed > 0
              ? Math.round((actual / prescribed) * 100)
              : 0;

          progressData[date][metric] = {

            // Real percentage for tooltip
            actualPercentage: percentage,

            // Chart-safe percentage
            chartPercentage: Math.min(percentage, 100)
          };
        });
    }

    res.json(progressData);

  } catch (error) {

    console.error('Progress Route Error:', error);

    res.status(500).json({
      error: error.message
    });
  }
});
module.exports = router;