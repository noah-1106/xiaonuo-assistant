const mongoose = require('mongoose');

const NotificationConfigSchema = new mongoose.Schema({
  // SMS配置
  sms: {
    provider: {
      type: String,
      default: 'tencent',
      enum: ['tencent', 'aliyun', 'huawei']
    },
    secretId: {
      type: String,
      default: ''
    },
    secretKey: {
      type: String,
      default: ''
    },
    appId: {
      type: String,
      default: ''
    },
    signName: {
      type: String,
      default: ''
    },
    templateId: {
      type: String,
      default: ''
    },
    enabled: {
      type: Boolean,
      default: false
    }
  },
  
  // 邮箱配置
  email: {
    provider: {
      type: String,
      default: 'smtp',
      enum: ['smtp', 'sendgrid', 'mailgun']
    },
    host: {
      type: String,
      default: ''
    },
    port: {
      type: Number,
      default: 587
    },
    secure: {
      type: Boolean,
      default: false
    },
    user: {
      type: String,
      default: ''
    },
    pass: {
      type: String,
      default: ''
    },
    from: {
      type: String,
      default: ''
    },
    template: {
      type: String,
      default: '您的验证码是: {{code}}，有效期5分钟，请勿泄露给他人。'
    },
    enabled: {
      type: Boolean,
      default: false
    }
  },
  
  // 验证码配置
  verification: {
    codeLength: {
      type: Number,
      default: 6
    },
    expiryMinutes: {
      type: Number,
      default: 5
    },
    resendInterval: {
      type: Number,
      default: 60
    },
    maxAttempts: {
      type: Number,
      default: 5
    }
  },
  
  // 系统状态
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
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

// 自动更新updatedAt字段
NotificationConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：获取当前配置
NotificationConfigSchema.statics.getCurrentConfig = async function() {
  let config = await this.findOne({ status: 'active' });
  if (!config) {
    // 如果没有配置，创建默认配置
    config = await this.create({
      status: 'active'
    });
  }
  return config;
};

const NotificationConfig = mongoose.model('NotificationConfig', NotificationConfigSchema);

module.exports = NotificationConfig;