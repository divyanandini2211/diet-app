const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
const authRoutes = require('./routes/auth');
const dietitianRoutes = require('./routes/dietitian'); // <-- Add this
const patientRoutes = require('./routes/patient'); // <-- Add
const chatRoutes = require('./routes/chat'); 
app.use('/api/auth', authRoutes);
app.use('/api/dietitian', dietitianRoutes); // <-- Add this
app.use('/api/chat', chatRoutes); // <-- Add

// IMPORT FILES DIRECTLY TO SEE REAL ERRORS
const DietPlan = require('./models/DietPlan');
const masterDietChart = require('./data/masterDietData');
app.use('/api/patient', patientRoutes);
// 🟢 CONNECT TO MONGODB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dietAppDB';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🟢 MongoDB Connected successfully to dietAppDB!'))
  .catch((err) => {
    console.log('🔴 MONGODB CRASH REASON:');
    console.error(err);
    console.log('👉 Check Atlas Network Access (IP whitelist), DB user credentials, and that the connection string in your .env is correct.');
  });

// 🏠 DEFAULT ROUTE
app.get('/', (req, res) => {
  res.send('Diet App Server is running! 🚀');
});

// 🚀 MAGIC SEED ROUTE
app.get('/setup-db', async (req, res) => {
  if (!DietPlan || !masterDietChart) {
    return res.status(500).send('Cannot setup DB. Missing DietPlan.js or masterDietData.js files.');
  }

  try {
    console.log('Deleting old data...');
    await DietPlan.deleteMany({}); 
    
    console.log('Injecting PDF data into DB...');
    const newDietPlan = new DietPlan(masterDietChart);
    await newDietPlan.save();
    
    res.send('✅ Database setup complete! Open MongoDB Compass to see the data!');
  } catch (error) {
    console.log('Database Setup Error:', error);
    res.status(500).send('Error setting up database: ' + error.message);
  }
});

// 🟡 START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🟡 Server is running on port ${PORT}`);
  console.log(`=========================================\n`);
});