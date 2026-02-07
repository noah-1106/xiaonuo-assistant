const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 用户模型
const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    unique: true,
    trim: true,
    sparse: true
  },
  password: {
    type: String,
    trim: true
  },
  // 用户名
  username: {
    type: String,
    unique: true,
    trim: true,
    sparse: true
  },
  // 角色字段：admin 或 user
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    sparse: true,
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      '请输入有效的邮箱地址'
    ]
  },
  nickname: {
    type: String,
    default: '',
    trim: true,
    maxlength: [50, '昵称不能超过50个字符']
  },
  avatar: {
    type: String,
    default: ''
  },
  // 订阅信息
  subscription: {
    status: {
      type: String,
      enum: ['free', 'subscribed', 'expired'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: () => {
        // 免费试用7天
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      }
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan'
    }
  },
  // 记录数量，用于免费试用限制
  recordCount: {
    type: Number,
    default: 0
  },
  // 主题偏好
  theme: {
    type: String,
    default: 'morning-gold'
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
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 用户创建前关联默认Plan
UserSchema.pre('save', async function(next) {
  if (this.isNew && !this.subscription.plan) {
    try {
      const Plan = require('./Plan');
      // 查找默认的免费Plan
      let freePlan = await Plan.findOne({ name: '免费版' });
      if (freePlan) {
        this.subscription.plan = freePlan._id;
      }
    } catch (error) {
      console.error('关联Plan失败:', error.message);
    }
  }
  next();
});

// 密码加密（如果密码被修改）
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码比较方法
UserSchema.methods.comparePassword = async function(enteredPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// 添加索引
UserSchema.index({ role: 1 });
UserSchema.index({ subscription: 1 });
UserSchema.index({ createdAt: -1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
