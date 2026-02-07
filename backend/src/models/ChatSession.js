const mongoose = require('mongoose');

// 聊天会话模型
const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID不能为空']
  },
  sessionId: {
    type: String,
    required: [true, '会话ID不能为空'],
    unique: true
  },
  title: {
    type: String,
    default: '新会话'
  },
  lastMessage: {
    type: String,
    default: ''
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // 角色挂载信息
  roles: {
    baseRole: {
      type: String,
      default: 'basic' // 固定为基础角色
    },
    enhancedRole: {
      type: String,
      default: null // 可选，最多一个增强角色
    }
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
ChatSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
ChatSessionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加索引
ChatSessionSchema.index({ userId: 1, sessionId: 1 });
ChatSessionSchema.index({ updatedAt: -1 });

const ChatSession = mongoose.model('ChatSession', ChatSessionSchema);

module.exports = ChatSession;
