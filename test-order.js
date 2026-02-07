const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const paymentService = require('./src/services/paymentService');
const config = require('./src/config');

// 连接数据库
mongoose.connect(config.db.url, config.db.options).then(async () => {
  console.log('数据库连接成功');
  
  try {
    // 查询订单
    const order = await Order.findOne({ orderId: 'ORDER_1770229565411_XIW12VKQT' });
    console.log('订单信息:', order);
    
    if (order) {
      console.log('查询支付状态...');
      console.log('使用的订单号:', order.outTradeNo || order.orderId);
      const paymentStatus = await paymentService.queryPaymentStatus(order.outTradeNo || order.orderId);
      console.log('支付状态:', paymentStatus);
    } else {
      console.log('订单不存在');
    }
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    mongoose.disconnect();
  }
}).catch(error => {
  console.error('数据库连接失败:', error);
});