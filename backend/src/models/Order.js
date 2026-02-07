const mongoose = require('mongoose');

// 订单模型
const OrderSchema = new mongoose.Schema({
  // 关联的用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 关联的套餐ID
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  // 订单编号
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // 购买数量
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  // 订单金额（元）
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // 微信支付商户订单号
  outTradeNo: {
    type: String,
    trim: true
  },
  // 微信支付交易单号
  transactionId: {
    type: String,
    trim: true
  },
  // 订单状态（pending/paid/cancelled/refunded）
  status: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  // 支付方式（alipay/wechat）
  paymentMethod: {
    type: String,
    enum: ['alipay', 'wechat', 'manual'],
    default: 'manual'
  },
  // 支付时间
  paymentTime: {
    type: Date
  },
  // 套餐开始日期
  planStartDate: {
    type: Date
  },
  // 套餐结束日期
  planEndDate: {
    type: Date
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
OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 自动更新更新时间
OrderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 添加索引
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ orderId: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
