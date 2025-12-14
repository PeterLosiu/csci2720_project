const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

// 公开路由
router.post('/location/:id', authenticate, favoriteController.addLocationToFavorites);

// 受保护的管理员路由
// router.post('/', authenticate, requireAdmin, LocationController.createLocation);
// router.put('/:id', authenticate, requireAdmin, LocationController.updateLocation);
// 执行流程：
// 1. authenticate → 验证是否登录
// 2. requireAdmin → 验证是否是管理员
// 3. LocationController.createLocation → 执行业务逻辑

module.exports = router;