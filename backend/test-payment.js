// 测试脚本：测试微信支付二维码生成功能
const { generateWechatNativeQR } = require('./src/services/paymentService');

// 测试参数
const testParams = {
  out_trade_no: 'TEST_' + Date.now(),
  total: 1, // 1分
  description: '测试商品',
  attach: JSON.stringify({ test: 'test' })
};

// 测试生成微信支付二维码
console.log('开始测试微信支付二维码生成...');
console.log('测试参数:', testParams);

generateWechatNativeQR(testParams)
  .then(result => {
    console.log('✅ 生成微信支付二维码成功！');
    console.log('结果:', result);
  })
  .catch(error => {
    console.error('❌ 生成微信支付二维码失败！');
    console.error('错误:', error);
    console.error('错误堆栈:', error.stack);
  });