// 添加npm依赖
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initData } = require('./services/dataFetcher'); // Keep the correct path


// 创建Express应用
const app = express();
// 定义监听端口
const PORT = 3000;

// 导入路由Routes
const locationRoutes = require('./routes/locations');
const adminRoutes = require('./routes/admin');
const favoritsRoutes = require('./routes/favorites');
const commentRoutes = require('./routes/comments');
const authRoutes = require('./routes/auth');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
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

test();

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoritsRoutes);
app.use('/api/comments', commentRoutes);


app.listen(PORT)