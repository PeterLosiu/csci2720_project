const mongoose = require('mongoose');

// 香港中文大学经纬度（用于距离计算基准）
const CUHK_COORD = { latitude: 22.4148, longitude: 114.2045 };

const locationSchema = new mongoose.Schema({
  // 原有字段（保持原始顺序）
  locationId: { type: Number, required: true, unique: true },
  nameC: { type: String, required: true },
  nameE: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  eventCount: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  lastUpdated: { type: Date, default: Date.now },
  // 新增字段（放在最后）
  distanceKm: { type: Number } // 距离香港中文大学的公里数
});

// 保存前自动计算距离（放在文档末尾）
locationSchema.pre('save', function(next) {
  // 半正矢公式计算球面距离（单位：千米）
  const R = 6371; // 地球半径（千米）
  const dLat = (this.latitude - CUHK_COORD.latitude) * Math.PI / 180;
  const dLon = (this.longitude - CUHK_COORD.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(CUHK_COORD.latitude * Math.PI / 180) * Math.cos(this.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  this.distanceKm = parseFloat((R * c).toFixed(2)); // 保留2位小数
  next();
});

module.exports = mongoose.model('Location', locationSchema);