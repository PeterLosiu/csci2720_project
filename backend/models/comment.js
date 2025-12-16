// models/Comment.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // 原有核心字段（保留第一个Schema的完整定义）
  content: {
    type: String,
    required: true,
    trim: true, // 保留去空格功能
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // 新增字段（放在末尾，来自第二个Schema）
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: null // 可选：默认无评分
  }, // 评分（1-5星）
  isAnonymous: { 
    type: Boolean, 
    default: false 
  } // 是否匿名评论
});

// 只导出一个Comment模型
const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;