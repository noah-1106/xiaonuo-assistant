/**
 * 微信支付服务
 * 处理微信支付相关的逻辑，包括生成支付二维码、查询支付状态等
 */
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// 尝试初始化微信支付SDK（使用wechatpay-axios-plugin）
let wechatPaySDK = null;
try {
  const { Wechatpay } = require('wechatpay-axios-plugin');
  const { wechatPay: wechatPayConfig } = config;
  
  // 1. 确认私钥文件存在
  const privateKeyPath = path.resolve(wechatPayConfig.privateKeyPath);
  console.log('私钥文件路径:', privateKeyPath);
  console.log('文件是否存在:', fs.existsSync(privateKeyPath));
  
  // 2. 读取私钥文件内容
  const privateKeyContent = fs.readFileSync(privateKeyPath, 'utf8');
  console.log('私钥读取成功，长度:', privateKeyContent.length);
  
  // 3. 读取平台证书
  const platformCertPath = path.resolve(__dirname, '../../cert/ca_certificate.pem');
  console.log('平台证书文件路径:', platformCertPath);
  console.log('平台证书是否存在:', fs.existsSync(platformCertPath));
  
  // 4. 初始化SDK
  // 注意：certs字段应该包含微信支付平台的证书，而不是商户证书
  // 由于我们没有平台证书，暂时使用简化配置
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
  wechatPaySDK = null;
}

// 微信支付 V3 API 基础 URL
const WECHAT_PAY_BASE_URL = config.wechatPay.sandboxMode ? 'https://api.mch.weixin.qq.com/sandbox/v3' : 'https://api.mch.weixin.qq.com/v3';

/**
 * 生成随机字符串
 * @param {number} length - 随机字符串长度
 * @returns {string} 随机字符串
 */
const generateNonceStr = (length = 16) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * 生成微信支付签名
 * @param {string} method - HTTP请求方法
 * @param {string} url - 请求URL路径
 * @param {string} timestamp - 时间戳
 * @param {string} nonceStr - 随机字符串
 * @param {string} body - 请求体
 * @returns {string} 签名结果
 */
const generateWechatPaySign = (method, url, timestamp, nonceStr, body) => {
  const { wechatPay: wechatPayConfig } = config;
  
  try {
    // 确保使用绝对路径读取私钥
    const absolutePrivateKeyPath = path.resolve(wechatPayConfig.privateKeyPath);
    
    // 构建签名字符串（与OpenSSL标准方式完全一致）
    // 注意：微信支付V3 API要求的格式是 ${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n
    // 确保body是字符串类型
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    
    // 构建标准签名字符串
    const signStr = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
    console.log('签名字符串:', signStr);
    
    // 使用OpenSSL命令生成签名（标准方式）
    const { execSync } = require('child_process');
    
    // 创建临时文件
    const signFile = '/tmp/sign.txt';
    const privateKeyFile = absolutePrivateKeyPath;
    const signSha256File = '/tmp/sign.sha256';
    
    // 写入签名字符串到文件（使用UTF-8编码，无BOM）
    fs.writeFileSync(signFile, signStr, 'utf8');
    
    // 使用OpenSSL标准命令生成SHA256签名
    // 这是OpenSSL生成RSA-SHA256签名的标准命令
    execSync(`openssl dgst -sha256 -sign "${privateKeyFile}" -out "${signSha256File}" "${signFile}"`);
    
    // Base64编码（不使用-n选项，而是在后续处理中移除换行符）
    const signature = execSync(`openssl base64 -in "${signSha256File}" -out /tmp/signature.b64 && cat /tmp/signature.b64`).toString().trim();
    
    // 确保移除所有换行符（包括可能的\n和\r\n）
    const cleanSignature = signature.replace(/[\r\n]/g, '');
    console.log('OpenSSL生成的签名:', cleanSignature);
    
    // 清理临时文件
    try {
      fs.unlinkSync(signFile);
      fs.unlinkSync(signSha256File);
      fs.unlinkSync('/tmp/signature.b64');
    } catch (cleanupError) {
      console.warn('清理临时文件失败:', cleanupError);
    }
    
    return cleanSignature;
  } catch (error) {
    console.error('生成签名失败:', error);
    
    // 回退到原有的crypto方法
    try {
      const absolutePrivateKeyPath = path.resolve(wechatPayConfig.privateKeyPath);
      const privateKey = fs.readFileSync(absolutePrivateKeyPath, 'utf8');
      
      // 确保body是字符串类型
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      
      const signStr = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${bodyStr}\n`;
      const signature = crypto.createSign('RSA-SHA256')
        .update(signStr)
        .sign(privateKey, 'base64');
      
      console.log('回退方法生成的签名:', signature);
      return signature;
    } catch (fallbackError) {
      console.error('回退方法也失败:', fallbackError);
      throw new Error(`生成签名失败: ${error.message}`);
    }
  }
};

/**
 * 发送微信支付 API 请求
 * @param {string} method - HTTP 请求方法
 * @param {string} urlPath - 请求 URL 路径（用于签名）
 * @param {Object} body - 请求体
 * @param {string} [fullPath] - 完整请求路径（用于实际请求，包含查询参数）
 * @returns {Promise<Object>} API 响应结果
 */
const sendWechatPayRequest = (method, urlPath, body, fullPath) => {
  const { wechatPay: wechatPayConfig } = config;
  
  return new Promise((resolve, reject) => {
    // 生成请求参数
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = generateNonceStr();
    // GET请求使用空字符串作为请求体，符合微信支付V3 API要求
    const bodyStr = method === 'GET' ? '' : JSON.stringify(body);
    
    // 生成签名 - 签名时使用原始的urlPath，不包含查询参数
    const signature = generateWechatPaySign(method, urlPath, timestamp, nonceStr, bodyStr);
    
    // 构建 Authorization 头
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${wechatPayConfig.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${wechatPayConfig.serialNo}",signature="${signature}"`;
    console.log('Authorization头:', authorization);
    
    // 输出sandboxMode的值，以便调试
    console.log('sandboxMode:', wechatPayConfig.sandboxMode);
    console.log('sandbox:', wechatPayConfig.sandbox);
    
    // 构建请求选项 - 实际请求时使用fullPath（如果提供），否则使用urlPath
    const requestPath = wechatPayConfig.sandboxMode 
      ? `/sandbox${fullPath || urlPath}` 
      : (fullPath || urlPath);
    
    const options = {
      hostname: 'api.mch.weixin.qq.com',
      path: requestPath,
      method,
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Xiaonuo/1.0.0'
      }
    };
    
    console.log('请求选项:', options);
    
    // 发送请求
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('API响应状态码:', res.statusCode);
          console.log('API响应内容:', result);
          
          if (res.statusCode === 200) {
            resolve(result);
          } else {
            console.error('微信支付 API 响应错误:', result);
            reject(new Error(`微信支付 API 调用失败: ${result.code || res.statusCode} - ${result.message || '未知错误'}`));
          }
        } catch (error) {
          console.error('解析微信支付 API 响应失败:', error);
          reject(new Error(`解析微信支付 API 响应失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('调用微信支付 API 失败:', error);
      reject(new Error(`调用微信支付 API 失败: ${error.message}`));
    });
    
    // 发送请求体
    req.write(bodyStr);
    req.end();
  });
};

/**
 * 生成微信Native支付二维码
 * @param {Object} params - 支付参数
 * @param {string} params.out_trade_no - 商户订单号
 * @param {number} params.total - 订单金额，单位：分
 * @param {string} params.description - 商品描述
 * @param {string} params.attach - 附加数据
 * @returns {Promise<Object>} 支付二维码信息
 */
const generateWechatNativeQR = async (params) => {
  // 验证输入参数
  if (!params || typeof params !== 'object') {
    throw new Error('支付参数不能为空');
  }
  
  const { out_trade_no, total, description, attach } = params;
  
  if (!out_trade_no || typeof out_trade_no !== 'string') {
    throw new Error('商户订单号不能为空且必须为字符串');
  }
  
  if (typeof total !== 'number' || total <= 0) {
    throw new Error('订单金额必须为大于0的数字');
  }
  
  if (!description || typeof description !== 'string') {
    throw new Error('商品描述不能为空且必须为字符串');
  }
  
  try {
    // 添加日志调试
    console.log('微信支付配置:', JSON.stringify(config.wechatPay, null, 2));
    console.log('appid:', config.wechatPay.appid);
    
    // 构建请求参数
    const nativeParams = {
      appid: config.wechatPay.appid,
      mchid: config.wechatPay.mchid,
      description,
      out_trade_no,
      notify_url: config.wechatPay.notifyUrl,
      attach,
      amount: {
        total,
        currency: 'CNY'
      }
    };
    
    // 打印请求体，便于调试
    console.log('请求体:', JSON.stringify(nativeParams, null, 2));
    
    // 调用微信Native支付API
    const result = await sendWechatPayRequest('POST', '/v3/pay/transactions/native', nativeParams);
    
    // 打印完整返回结果，便于调试
    console.log('微信支付API返回结果:', JSON.stringify(result, null, 2));
    
    // 验证微信API返回结果
    if (!result) {
      throw new Error('微信API返回结果为空');
    }
    
    // 检查返回结果中是否有code_url
    if (result.code_url) {
      return {
        code_url: result.code_url,
        out_trade_no: result.out_trade_no || out_trade_no,
        expire_time: new Date(Date.now() + 300000).toISOString() // 5分钟后过期
      };
    } else {
      throw new Error(`微信API返回结果无效，缺少code_url，完整结果: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error('生成微信支付二维码失败:', error);
    // 详细记录错误信息，便于调试
    console.error('错误详情:', JSON.stringify(error, null, 2));
    console.error('请求参数:', JSON.stringify(params, null, 2));
    
    throw new Error(`生成微信支付二维码失败: ${error.message}`);
  }
};

/**
 * 查询支付状态
 * @param {string} out_trade_no - 商户订单号
 * @returns {Promise<Object>} 支付状态信息
 */
const queryPaymentStatus = async (out_trade_no) => {
  try {
    // 使用微信支付SDK查询（只使用SDK方式，删除fallback）
    console.log('使用微信支付SDK查询支付状态:', {
      out_trade_no,
      mchid: config.wechatPay.mchid
    });
    
    // 使用SDK文档推荐的参数化路径语法
    // 注意：对于有大写字符的订单号，需要使用这种参数化传递方式
    console.log('SDK查询请求参数:', {
      out_trade_no,
      params: {
        mchid: config.wechatPay.mchid
      }
    });
    
    let result;
    try {
      // 使用参数化路径语法查询订单
      const response = await wechatPaySDK.v3.pay.transactions['out-trade-no']._out_trade_no_
        .get({
          params: {
            mchid: config.wechatPay.mchid
          },
          // 当商户订单号有大写字符时，只能这样参数化传递
          out_trade_no: out_trade_no
        });
      
      // 处理SDK响应，确保解析为JSON对象
      if (response.data) {
        result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } else {
        result = typeof response === 'string' ? JSON.parse(response) : response;
      }
    } catch (sdkError) {
      console.error('微信支付SDK查询错误:', {
        error: sdkError.message,
        response: sdkError.response ? {
          status: sdkError.response.status,
          data: sdkError.response.data
        } : null
      });
      
      // 即使有证书验证错误，如果响应存在且包含订单数据，仍然使用
      if (sdkError.response && sdkError.response.data) {
        console.log('使用SDK错误响应中的订单数据');
        // 确保解析JSON字符串为对象
        result = typeof sdkError.response.data === 'string' 
          ? JSON.parse(sdkError.response.data) 
          : sdkError.response.data;
      } else {
        throw sdkError;
      }
    }
    
    console.log('微信支付SDK查询成功，结果:', {
      trade_state: result.trade_state,
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      success_time: result.success_time
    });
    
    return {
      status: result.trade_state,
      transaction_id: result.transaction_id,
      out_trade_no: result.out_trade_no,
      amount: result.amount ? result.amount.total : null,
      paid_time: result.success_time || null
    };
  } catch (error) {
    console.error('查询支付状态失败:', error);
    // 直接抛出错误
    throw new Error(`查询支付状态失败: ${error.message}`);
  }
};

/**
 * 关闭订单
 * @param {string} out_trade_no - 商户订单号
 * @returns {Promise<boolean>} 是否关闭成功
 */
const closeOrder = async (out_trade_no) => {
  try {
    // 调用微信关闭订单API
    await sendWechatPayRequest('POST', `/v3/pay/transactions/out-trade-no/${out_trade_no}/close`, {
      mchid: config.wechatPay.mchid
    });
    
    return true;
  } catch (error) {
    console.error('关闭订单失败:', error);
    throw new Error(`关闭订单失败: ${error.message}`);
  }
};

/**
 * 生成商户订单号
 * @returns {string} 商户订单号
 */
const generateOutTradeNo = () => {
  return 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

module.exports = {
  generateWechatNativeQR,
  queryPaymentStatus,
  closeOrder,
  generateOutTradeNo
};