// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventId: {
    type: Number,
    required: true,
    unique: true
  },
  titleC: {     // 中文标题
    type: String,
    trim: true,
  },
  titleE: {     // 英文标题（必填）
    type: String,
    required: true,
    trim: true,
  },
  venue: {      // 关联的场地（对应Location模型）
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true,
  },
  dateTime: {   // 事件时间
    type: Date,
    required: true,
  },
  description: { // 事件描述
    type: String,
    trim: true,
  },
  presenter: {  // 主办方
    type: String,
    trim: true,
  },
  // 可在末尾补充需要的字段（如类别）
  category: { type: String }, // 新增：事件类别
  createdAt: { type: Date, default: Date.now } // 新增：创建时间
});

// 只导出一个Event模型
const Event = mongoose.model('Event', eventSchema);
module.exports = Event;