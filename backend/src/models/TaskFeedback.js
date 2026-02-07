const mongoose = require('mongoose');

const TaskFeedbackSchema = new mongoose.Schema({
  // 任务ID
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  // 用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 反馈类型：satisfied（满意）, neutral（一般）, dissatisfied（不满意）
  feedbackType: {
    type: String,
    enum: ['satisfied', 'neutral', 'dissatisfied'],
    required: true
  },
  // 评分：1-5星
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  // 具体反馈内容
  content: {
    type: String,
    trim: true
  },
  // 改进建议
  improvementSuggestions: {
    type: String,
    trim: true
  },
  // 是否解决了问题
  problemSolved: {
    type: Boolean
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

// 自动更新updatedAt字段
TaskFeedbackSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TaskFeedback = mongoose.model('TaskFeedback', TaskFeedbackSchema);

module.exports = TaskFeedback;
