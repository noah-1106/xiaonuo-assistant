/**
 * 测试微信支付SDK查询功能
 * 用于测试SDK是否能正常查询订单支付状态
 */
const path = require('path');
const fs = require('fs');

// 加载环境变量和配置
require('dotenv').config();
const config = require('./src/config');

// 初始化微信支付SDK
let wechatPaySDK = null;
let wechatPayConfig = null;
try {
  const { Wechatpay } = require('wechatpay-axios-plugin');
  const configData = require('./src/config');
  wechatPayConfig = configData.wechatPay;
  
  // 1. 确认私钥文件存在
  const privateKeyPath = path.resolve(wechatPayConfig.privateKeyPath);
  console.log('私钥文件路径:', privateKeyPath);
  console.log('文件是否存在:', fs.existsSync(privateKeyPath));
  
  // 2. 读取私钥文件内容
  const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
  console.log('私钥读取成功，长度:', privateKeyContent.length);
  
  // 3. 读取平台证书
  const platformCertPath = path.resolve(__dirname, './cert/ca_certificate.pem');
  console.log('平台证书文件路径:', platformCertPath);
  console.log('平台证书是否存在:', fs.existsSync(platformCertPath));
  
  // 4. 初始化SDK
  const sdkConfig = {
    mchid: wechatPayConfig.mchid,
    serial: wechatPayConfig.serialNo, // 商户API证书序列号
    privateKey: privateKeyContent, // 商户API私钥
    appid: wechatPayConfig.appid
  };
  
  // 如果存在平台证书，添加到配置中
  if (fs.existsSync(platformCertPath)) {
    const platformCertContent = fs.readFileSync(platformCertPath, 'utf8');
    console.log('平台证书读取成功，长度:', platformCertContent.length);
    sdkConfig.certs = {
      'WECHAT_PAY_PLATFORM_CERT': platformCertContent // 使用平台证书
    };
  }
  
  console.log('SDK初始化配置:', {
    mchid: sdkConfig.mchid,
    serial: sdkConfig.serial,
    hasPrivateKey: !!sdkConfig.privateKey,
    appid: sdkConfig.appid,
    hasCerts: !!sdkConfig.certs
  });
  
  // 初始化SDK
  wechatPaySDK = new Wechatpay(sdkConfig);
  
  console.log('微信支付SDK初始化成功（wechatpay-axios-plugin）');
} catch (error) {
  console.error('微信支付SDK初始化失败:', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
}

// 测试查询订单状态
async function testQueryOrder() {
  const orderId = 'ORDER_1770241707887_83GURPJVX';
  console.log('\n=== 测试查询订单状态 ===');
  console.log('查询订单号:', orderId);
  
  try {
    // 使用SDK的参数化路径语法（根据SDK文档）
    console.log('\n测试使用SDK的参数化路径语法...');
    console.log('请求参数:', {
      out_trade_no: orderId,
      params: {
        mchid: '1698261141'
      }
    });
    
    // 使用SDK文档推荐的参数化路径语法
    // 注意：对于有大写字符的订单号，需要使用这种参数化传递方式
    const result = await wechatPaySDK.v3.pay.transactions['out-trade-no']._out_trade_no_
      .get({
        params: {
          mchid: '1698261141'
        },
        // 当商户订单号有大写字符时，只能这样参数化传递
        out_trade_no: orderId
      });
    
    console.log('✅ SDK参数化路径查询成功！结果:');
    console.log('订单状态:', result.trade_state);
    console.log('交易单号:', result.transaction_id);
    console.log('商户订单号:', result.out_trade_no);
    console.log('支付时间:', result.success_time);
    console.log('订单金额:', result.amount ? result.amount.total : null);
    
    console.log('\n完整返回结果:', JSON.stringify(result, null, 2));
    
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
testQueryOrder()
  .then(() => {
    console.log('\n=== 测试完成 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n=== 测试异常 ===', error);
    process.exit(1);
  });
