const mongoose = require('mongoose');

// 浏览器标签页模型
const BrowserTabSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  tabId: {
    type: String,
    required: [true, '标签页ID不能为空'],
    unique: true
  },
  title: {
    type: String,
    default: '新标签页'
  },
  url: {
    type: String,
    default: 'https://www.feishu.cn'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  position: {
    type: Number,
    default: 0
  },
  favicon: {
    type: String,
    default: ''
  },
  lastVisited: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新updatedAt字段
BrowserTabSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
BrowserTabSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加索引
BrowserTabSchema.index({ userId: 1 });
BrowserTabSchema.index({ tabId: 1 }, { unique: true });
BrowserTabSchema.index({ userId: 1, isActive: 1 });
BrowserTabSchema.index({ userId: 1, lastVisited: -1 });

const BrowserTab = mongoose.model('BrowserTab', BrowserTabSchema);

module.exports = BrowserTab;
