const paymentService = require('./src/services/paymentService');

// 订单号
const ORDER_ID = 'ORDER_1770235797541_KUIMOU9E3';

async function testPaymentStatus() {
  console.log('🔍 开始测试支付状态查询...');
  console.log('订单号:', ORDER_ID);
  
  try {
    const paymentStatus = await paymentService.queryPaymentStatus(ORDER_ID);
    console.log('✅ 支付状态查询成功');
    console.log('支付状态:', paymentStatus);
  } catch (error) {
    console.error('❌ 支付状态查询失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 执行测试
testPaymentStatus();