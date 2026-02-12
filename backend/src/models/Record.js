const mongoose = require('mongoose');

// 记录模型
const RecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  title: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'archived'],
    default: 'pending'
  },
  tags: {
    type: [String],
    default: []
  },
  link: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  files: [{
    name: String,
    type: String,
    url: String,
    key: String
  }],
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
RecordSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
RecordSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加索引
RecordSchema.index({ userId: 1, type: 1 });
RecordSchema.index({ userId: 1, status: 1 });
RecordSchema.index({ userId: 1, createdAt: -1 });
RecordSchema.index({ userId: 1, updatedAt: -1 });

const Record = mongoose.model('Record', RecordSchema);

module.exports = Record;
