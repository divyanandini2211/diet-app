const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Clean, 1-line routes mapping to our controller!
router.post('/login', authController.login);
router.post('/request-otp', authController.requestOtp);
router.post('/register', authController.registerUser);

module.exports = router;