const mongoose = require('mongoose');

// 套餐模型
const PlanSchema = new mongoose.Schema({
  // 套餐名称
  name: {
    type: String,
    required: true,
    trim: true
  },
  // 套餐描述
  description: {
    type: String,
    required: true,
    trim: true
  },
  // 套餐时长（天）
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  // 原价（元）
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // 折扣价（元）
  discountPrice: {
    type: Number,
    min: 0
  },
  // 套餐功能列表
  features: {
    type: [String],
    required: true
  },
  // 是否激活
  isActive: {
    type: Boolean,
    default: true
  },
  // 是否为系统默认套餐
  isSystem: {
    type: Boolean,
    default: false
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 自动更新更新时间
PlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
PlanSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加索引
PlanSchema.index({ isActive: 1, price: 1 });
PlanSchema.index({ createdAt: -1 });
PlanSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Plan', PlanSchema);
