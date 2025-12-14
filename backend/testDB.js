const mongoose = require('mongoose');
const { initData } = require('./services/dataFetcher'); // Keep the correct path

// Database connection function (merged from db.js)
async function connectDB() {
  try {
    // Removed deprecated options (useNewUrlParser, useUnifiedTopology)
    await mongoose.connect('mongodb://localhost:27017/testDB');
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    process.exit(1); // Exit on connection failure
  }
}

// Test function (from test.js)
async function test() {
  await connectDB(); // Connect to MongoDB first
  await initData(); // Run data fetching and saving
  console.log('Test completed');
  process.exit(0); // Exit after successful test
}

// Execute the test
test();