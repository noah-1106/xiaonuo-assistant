const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const paymentService = require('./src/services/paymentService');
const config = require('./src/config');

// 订单号
const ORDER_ID = 'ORDER_1770235797541_KUIMOU9E3';

async function checkOrderStatus() {
  console.log('🔍 开始检查订单状态...');
  console.log('订单号:', ORDER_ID);
  
  try {
    // 连接数据库
    console.log('📦 连接数据库...');
    await mongoose.connect(config.db.url, config.db.options);
    console.log('✅ 数据库连接成功');
    
    // 查询订单信息
    console.log('📋 查询订单信息...');
    const order = await Order.findOne({ orderId: ORDER_ID });
    
    if (order) {
      console.log('✅ 订单存在');
      console.log('订单ID:', order._id);
      console.log('订单状态:', order.status);
      console.log('支付方式:', order.paymentMethod);
      console.log('订单金额:', order.amount);
      console.log('创建时间:', order.createdAt);
      console.log('支付时间:', order.paymentTime);
      console.log('套餐信息:', order.planId);
      console.log('使用的商户订单号:', order.outTradeNo || order.orderId);
      
      // 测试支付状态查询
      console.log('💳 测试支付状态查询...');
      try {
        const paymentStatus = await paymentService.queryPaymentStatus(order.outTradeNo || order.orderId);
        console.log('✅ 支付状态查询成功');
        console.log('支付状态:', paymentStatus);
      } catch (error) {
        console.error('❌ 支付状态查询失败:', error.message);
      }
      
    } else {
      console.error('❌ 订单不存在');
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    // 断开数据库连接
    await mongoose.disconnect();
    console.log('🔌 数据库连接已断开');
  }
}

// 执行检查
checkOrderStatus();