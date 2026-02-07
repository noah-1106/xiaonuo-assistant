/**
 * 测试修改后的paymentService查询功能
 * 验证只使用SDK方式的查询是否正常工作
 */
const { queryPaymentStatus } = require('./src/services/paymentService');

// 测试查询订单状态
async function testUpdatedQuery() {
  const orderId = 'ORDER_1770241707887_83GURPJVX';
  console.log('\n=== 测试修改后的queryPaymentStatus函数 ===');
  console.log('查询订单号:', orderId);
  
  try {
    // 调用修改后的queryPaymentStatus函数
    const result = await queryPaymentStatus(orderId);
    
    console.log('\n✅ 查询成功！结果:');
    console.log('订单状态:', result.status);
    console.log('交易单号:', result.transaction_id);
    console.log('商户订单号:', result.out_trade_no);
    console.log('支付时间:', result.paid_time);
    console.log('订单金额:', result.amount);
    
    console.log('\n测试完成: 修改后的queryPaymentStatus函数工作正常');
    
  } catch (error) {
    console.error('\n❌ 查询失败:', error);
    console.error('错误堆栈:', error.stack);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 执行测试
testUpdatedQuery()
  .then(() => {
    console.log('\n=== 测试完成 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== 测试异常 ===', error);
    process.exit(1);
  });
