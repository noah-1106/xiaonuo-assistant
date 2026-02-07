/**
 * 配置管理中心
 * 统一管理所有配置项，提供配置加载、验证和访问功能
 */
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

/**
 * 配置验证函数
 * @param {string} name - 配置项名称
 * @param {any} value - 配置值
 * @param {boolean} required - 是否必填
 * @param {any} defaultValue - 默认值
 * @param {function} validator - 自定义验证函数
 * @returns {any} 验证后的配置值
 */
const validateConfig = (name, value, required = false, defaultValue = null, validator = null) => {
  // 如果值不存在且必填，抛出错误
  if (required && value === undefined) {
    throw new Error(`配置项 ${name} 是必填项`);
  }
  
  // 如果值不存在且有默认值，使用默认值
  if (value === undefined) {
    return defaultValue;
  }
  
  // 如果有自定义验证函数，执行验证
  if (validator && !validator(value)) {
    throw new Error(`配置项 ${name} 值无效: ${value}`);
  }
  
  return value;
};

/**
 * 数据库配置
 */
const dbConfig = {
  host: validateConfig('DB_HOST', process.env.DB_HOST, false, 'localhost'),
  port: validateConfig('DB_PORT', process.env.DB_PORT, false, 27017, (value) => !isNaN(value)),
  name: validateConfig('DB_NAME', process.env.DB_NAME, false, 'xiaonuo'),
  user: validateConfig('DB_USER', process.env.DB_USER, false, ''),
  password: validateConfig('DB_PASSWORD', process.env.DB_PASSWORD, false, ''),
  mongoUri: validateConfig('MONGO_URI', process.env.MONGO_URI, false, ''),
  
  // 构建数据库连接URL
  get url() {
    // 优先使用完整的MONGO_URI
    if (this.mongoUri) {
      console.log('🔍 使用完整的MONGO_URI连接字符串');
      return this.mongoUri;
    }
    
    console.log('🔍 构建数据库连接URL:');
    console.log(`   - host: ${this.host}`);
    console.log(`   - port: ${this.port}`);
    console.log(`   - name: ${this.name}`);
    console.log(`   - user: ${this.user}`);
    console.log(`   - password: ${this.password ? '******' : ''}`);
    
    // 处理多个主机地址的情况
    const hosts = this.host.split(',').map(host => host.trim()).map(host => `${host}:${this.port}`).join(',');
    
    // 对密码进行URL编码，处理包含@等特殊字符的情况
    const encodedPassword = encodeURIComponent(this.password);
    
    let url = `mongodb://${hosts}/${this.name}?authSource=admin&replicaSet=rs-mongo-replica-b95890613e56&retryWrites=true`;
    if (this.user && this.password) {
      url = `mongodb://${this.user}:${encodedPassword}@${hosts}/${this.name}?authSource=admin&replicaSet=rs-mongo-replica-b95890613e56&retryWrites=true`;
    }
    
    console.log(`   - 最终连接URL: ${url.replace(this.password, '******')}`);
    return url;
  }
};

/**
 * TOS配置
 */
const tosConfig = {
  endpoint: validateConfig('TOS_ENDPOINT', process.env.TOS_ENDPOINT, false, 'https://tos-cn-beijing.volces.com'),
  accessKeyId: validateConfig('TOS_ACCESS_KEY_ID', process.env.TOS_ACCESS_KEY_ID, false, 'test_access_key'),
  accessKeySecret: validateConfig('TOS_ACCESS_KEY_SECRET', process.env.TOS_ACCESS_KEY_SECRET, false, 'test_secret_key'),
  bucket: validateConfig('TOS_BUCKET', process.env.TOS_BUCKET, false, 'test-bucket'),
  region: validateConfig('TOS_REGION', process.env.TOS_REGION, false, 'cn-beijing'),
  filePrefix: validateConfig('TOS_FILE_PREFIX', process.env.TOS_FILE_PREFIX, false, 'xiaonuo/')
};

/**
 * AI服务配置
 */
const aiConfig = {
  model: validateConfig('AI_MODEL', process.env.AI_MODEL, false, 'doubao-seed-1-8-251228'),
  modelId: validateConfig('AI_MODEL_ID', process.env.AI_MODEL_ID, false, 'doubao-seed-1-8-251228'),
  endpointId: validateConfig('AI_ENDPOINT_ID', process.env.AI_ENDPOINT_ID, false, 'ep-m-20260128215950-dcxfh'),
  apiKey: validateConfig('ARK_API_KEY', process.env.ARK_API_KEY, true),
  apiBaseUrl: validateConfig('AI_API_BASE_URL', process.env.AI_API_BASE_URL, false, 'https://ark.cn-beijing.volces.com/api/v3'),
  temperature: validateConfig('AI_TEMPERATURE', process.env.AI_TEMPERATURE, false, 0.8, (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1;
  }),
  topP: validateConfig('AI_TOP_P', process.env.AI_TOP_P, false, 0.95, (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 1;
  }),
  chatBaseUrl: validateConfig('AI_CHAT_BASE_URL', process.env.AI_CHAT_BASE_URL, false, 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'),
  responsesBaseUrl: validateConfig('AI_RESPONSES_BASE_URL', process.env.AI_RESPONSES_BASE_URL, false, 'https://ark.cn-beijing.volces.com/api/v3/responses'),
  useContextCache: validateConfig('AI_USE_CONTEXT_CACHE', process.env.AI_USE_CONTEXT_CACHE, false, true, (value) => {
    return value === true || value === 'true' || value === false || value === 'false';
  })
};

/**
 * 服务器配置
 */
const serverConfig = {
  port: validateConfig('PORT', process.env.PORT, false, 3001, (value) => !isNaN(value)),
  host: validateConfig('HOST', process.env.HOST, false, '0.0.0.0'),
  env: validateConfig('NODE_ENV', process.env.NODE_ENV, false, 'development'),
  secret: validateConfig('JWT_SECRET', process.env.JWT_SECRET, true),
  expiresIn: validateConfig('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN, false, '7d')
};

/**
 * 日志配置
 */
const loggerConfig = {
  level: validateConfig('LOG_LEVEL', process.env.LOG_LEVEL, false, 'info'),
  format: validateConfig('LOG_FORMAT', process.env.LOG_FORMAT, false, 'json')
};

/**
 * CORS配置
 */
const corsConfig = {
  origin: validateConfig('CORS_ORIGIN', process.env.CORS_ORIGIN, false, 'http://localhost:5173', (value) => {
    return typeof value === 'string' && value.length > 0;
  }),
  get originArray() {
    return this.origin.split(',').map(origin => origin.trim());
  }
};

/**
 * 微信支付配置
 */
const wechatPayConfig = {
  appid: validateConfig('WECHAT_APPID', process.env.WECHAT_APPID, false, 'wx539922c487ccc916'),
  mchid: validateConfig('WECHAT_MCHID', process.env.WECHAT_MCHID, false, '1698261141'),
  apiKey: validateConfig('WECHAT_API_KEY', process.env.WECHAT_API_KEY, false, '15987idnjejgityjviuehjnmhkoce54d'),
  privateKeyPath: validateConfig('WECHAT_PRIVATE_KEY_PATH', process.env.WECHAT_PRIVATE_KEY_PATH, false, path.join(__dirname, '../../cert/apiclient_key.pem')),
  serialNo: validateConfig('WECHAT_SERIAL_NO', process.env.WECHAT_SERIAL_NO, false, '362341A7EA990CCCA5DFF9724E7068A0835E8FFF'),
  notifyUrl: validateConfig('WECHAT_NOTIFY_URL', process.env.WECHAT_NOTIFY_URL, false, 'http://localhost:3001/api/wechat/notify'),
  sandbox: validateConfig('WECHAT_SANDBOX', process.env.WECHAT_SANDBOX, false, false, (value) => {
    return typeof value === 'boolean' || value === 'true' || value === 'false';
  }),
  get sandboxMode() {
    return this.sandbox === true || this.sandbox === 'true';
  }
};

/**
 * 配置验证函数，在应用启动时调用
 */
const validateAllConfigs = () => {
  console.log('🔍 正在验证配置...');
  
  // 验证所有配置项
  const configs = [
    { name: 'JWT_SECRET', value: process.env.JWT_SECRET, required: true },
    { name: 'PORT', value: process.env.PORT, required: false, validator: (v) => !isNaN(v) },
    { name: 'DB_HOST', value: process.env.DB_HOST, required: false },
    { name: 'DB_PORT', value: process.env.DB_PORT, required: false, validator: (v) => !isNaN(v) },
    { name: 'DB_NAME', value: process.env.DB_NAME, required: false },
    { name: 'ARK_API_KEY', value: process.env.ARK_API_KEY, required: true },
    { name: 'CORS_ORIGIN', value: process.env.CORS_ORIGIN, required: false },
    // 微信支付配置验证（非必填，但是如果提供了则需要验证完整性）
    { name: 'WECHAT_APPID', value: process.env.WECHAT_APPID, required: false },
    { name: 'WECHAT_MCHID', value: process.env.WECHAT_MCHID, required: false },
    { name: 'WECHAT_API_KEY', value: process.env.WECHAT_API_KEY, required: false },
    { name: 'WECHAT_PRIVATE_KEY_PATH', value: process.env.WECHAT_PRIVATE_KEY_PATH, required: false },
    { name: 'WECHAT_NOTIFY_URL', value: process.env.WECHAT_NOTIFY_URL, required: false }
  ];
  
  configs.forEach(config => {
    validateConfig(config.name, config.value, config.required, null, config.validator);
  });
  
  console.log('✅ 所有配置验证通过！');
  
  // 输出关键配置信息（敏感信息隐藏）
  console.log('📋 关键配置信息：');
  console.log(`   - 环境：${process.env.NODE_ENV || 'development'}`);
  console.log(`   - 端口：${process.env.PORT || 3000}`);
  console.log(`   - 数据库：${process.env.DB_NAME || 'xiaonuo'}`);
  console.log(`   - AI模型：${process.env.AI_MODEL || 'doubao-seed-1-8-251228'}`);
  console.log(`   - CORS来源：${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  // 输出微信支付配置状态（隐藏敏感信息）
  const hasWechatPayConfig = process.env.WECHAT_APPID && process.env.WECHAT_MCHID;
  console.log(`   - 微信支付：${hasWechatPayConfig ? '已配置' : '未配置'}`);
};

// 导出所有配置和验证函数
module.exports = {
  db: dbConfig,
  tos: tosConfig,
  ai: aiConfig,
  server: serverConfig,
  logger: loggerConfig,
  cors: corsConfig,
  wechatPay: wechatPayConfig,
  validateAllConfigs
};
