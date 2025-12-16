// 添加npm依赖
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initData } = require('./services/dataFetcher'); // 确保路径正确

// 创建Express应用
const app = express();
const PORT = 3000;

// 导入路由Routes
const locationRoutes = require('./routes/locations.js');
// 取消注释：后续功能需要的路由（收藏/评论/权限）
// const adminRoutes = require('./routes/admin.js');
// const favoritesRoutes = require('./routes/favorites.js');
// const commentRoutes = require('./routes/comments.js');
// const authRoutes = require('./routes/auth.js');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库连接 + 服务启动核心逻辑
async function startServer() {
  try {
    // 1. 连接MongoDB（自动创建projectDB）
    await mongoose.connect('mongodb://localhost:27017/projectDB');
    console.log('MongoDB connected successfully → 已创建projectDB');

    // 2. 执行数据初始化（仅首次启动时导入数据）
    await initData();
    console.log('数据初始化完成 → locations数据已写入projectDB');

    // 3. 注册API路由
    app.use('/api/locations', locationRoutes);
    // app.use('/api/auth', authRoutes);
    // app.use('/api/admin', adminRoutes);
    // app.use('/api/favorites', favoritesRoutes);
    // app.use('/api/comments', commentRoutes);

    // 4. 启动Express服务（关键：不退出进程）
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1); // 仅在连接/初始化失败时退出
  }
}

// 启动服务（核心：替换原有test()函数）
startServer();