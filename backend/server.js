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
const locationRoutes = require('./routes/locations.js');
const favoritsRoutes = require('./routes/favorites.js');
const commentRoutes = require('./routes/comments.js');
const authRoutes = require('./routes/auth.js');
const eventRoutes = require('./routes/events.js');
const userRoutes = require('./routes/user.js');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接
async function connectDB() {
  try {
    // Removed deprecated options (useNewUrlParser, useUnifiedTopology)
    await mongoose.connect('mongodb://localhost:27017/projectDB');
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
  // process.exit(0); // Exit after successful test
}

test();

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/user', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/favorites', favoritsRoutes);
app.use('/api/comments', commentRoutes);

app.post('/registerAdmin', async (req, res) => {
  const { username, password } = req.body;
  try {
    const UserModel = require('./models/User.js');
    const existingUser = await UserModel.findOne({ username }); 
    if(existingUser){res.status(400).json({message:"Admin name already exist."})}
    const newUser = new UserModel({username, password, isAdmin:true});
    await newUser.save();
    res.status(201).json({ message: 'Admin created successfully', userId: newUser._id });
  }catch(error){
    res.status(500).json({message: "Server internal error.", error});
  }
})

app.listen(PORT)