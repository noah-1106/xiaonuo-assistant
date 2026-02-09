const mongoose = require('mongoose');

// 聊天消息模型
const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  sessionId: {
    type: String,
    required: [true, '会话ID不能为空']
  },
  content: {
    type: String,
    required: [true, '消息内容不能为空'],
    trim: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot', 'tool'],
    required: [true, '发送者类型不能为空']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'link', 'error', 'function_call', 'function_result'],
    default: 'text'
  },
  toolCallId: {
    type: String,
    default: null
  },
  contextId: {
    type: String,
    default: null,
    description: '豆包AI上下文ID，用于多轮对话'
  },
  files: [{
    name: String,
    type: String,
    url: String
  }],
  timestamp: {
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

// 添加自动更新更新时间的钩子
ChatMessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
ChatMessageSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加索引
ChatMessageSchema.index({ userId: 1, sessionId: 1 });
ChatMessageSchema.index({ timestamp: -1 });

const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

module.exports = ChatMessage;