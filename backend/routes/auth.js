// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DietPlan = require('../models/DietPlan');
const masterDietChart = require('../data/masterDietData'); // The PDF data

const router = express.Router();
const JWT_SECRET = 'supersecretkey123'; 

// --- 1. SIGNUP ROUTE ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, opId, height, weight } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists!' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name, email, password: hashedPassword, role,
      opId: role === 'patient' ? opId : undefined,
      height: role === 'patient' ? height : undefined,
      weight: role === 'patient' ? weight : undefined,
    });

    await newUser.save();

    // 🚀 NEW LOGIC: If it's a patient, give them a personal copy of the Diet Plan!
    if (role === 'patient') {
      const personalDietPlan = new DietPlan({
        ...masterDietChart, 
        patientId: newUser._id // Link it to this exact patient
      });
      await personalDietPlan.save();

      // Save the diet plan ID back to the user
      newUser.dietPlanId = personalDietPlan._id;
      await newUser.save();
    }

    res.status(201).json({ message: 'User created & Diet Plan Assigned!', user: newUser });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- 2. LOGIN ROUTE ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong password!' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, role: user.role, name: user.name, id: user._id, opId: user.opId });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;