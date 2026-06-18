const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User'); 

// 📱 1. Send a message
router.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const newMessage = new Message({ senderId, receiverId, text });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 📱 2. Get chat history
router.get('/history/:user1/:user2', async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 }
      ]
    }).sort({ createdAt: 1 }); 
    res.status(200).json(messages);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 📱 3. Find Dietitian (For the Patient App)
router.get('/get-dietitian', async (req, res) => {
  try {
    const dietitian = await User.findOne({ role: 'dietitian' }).select('_id name');
    res.status(200).json(dietitian);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 📱 4. Check for Unread Messages (Red Dot)
router.get('/unread/:userId', async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({ 
      receiverId: req.params.userId, 
      read: false 
    });
    res.status(200).json({ unreadCount });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// 📱 5. Mark messages as read (When chat is opened)
router.put('/mark-read/:senderId/:receiverId', async (req, res) => {
  try {
    await Message.updateMany(
      { senderId: req.params.senderId, receiverId: req.params.receiverId, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;