/**
 * 日志工具配置
 * 使用 winston 实现结构化日志记录
 */
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { server: serverConfig, logger: loggerConfig } = require('../config');

// 日志级别配置
const logLevel = loggerConfig.level || 'info';

// 控制台日志格式（更易读）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 
      ? ` ${JSON.stringify(meta, null, 2)}` 
      : '';
    if (stack) {
      return `${timestamp} ${level}: ${message}\n${stack}${metaString}`;
    }
    return `${timestamp} ${level}: ${message}${metaString}`;
  })
);

// 文件日志格式（结构化JSON）
const fileFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({
    stack: true
  }),
  winston.format.splat(),
  winston.format.json()
);

// 创建日志目录路径
const logsDir = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 配置日志轮转选项
const transportOptions = {
  maxsize: 20 * 1024 * 1024, // 单个日志文件最大20MB
  maxFiles: 14, // 保留14个日志文件
  tailable: true, // 始终写入最新的日志文件
  zippedArchive: true, // 压缩旧日志文件
  format: fileFormat
};

// 创建日志实例
const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'xiaonuo-backend',
    environment: serverConfig.env,
    version: '1.0.0'
  },
  transports: [
    // 控制台日志
    new winston.transports.Console({
      format: consoleFormat
    }),
    // 所有日志文件
    new winston.transports.File({
      ...transportOptions,
      filename: path.join(logsDir, 'all.log'),
      level: 'info'
    }),
    // 错误日志文件
    new winston.transports.File({
      ...transportOptions,
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    }),
    // 警告日志文件
    new winston.transports.File({
      ...transportOptions,
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn'
    }),
    // 调试日志文件
    new winston.transports.File({
      ...transportOptions,
      filename: path.join(logsDir, 'debug.log'),
      level: 'debug'
    })
  ]
});

/**
 * 请求日志记录中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
logger.requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip, headers } = req;
  
  // 记录请求开始
  logger.info('Request started', {
    request: {
      method,
      url,
      ip,
      userAgent: headers['user-agent'],
      referer: headers.referer || headers.referrer,
      correlationId: req.id || Math.random().toString(36).substring(2, 15)
    }
  });
  
  // 监听响应完成事件
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode, statusMessage } = res;
    
    // 根据状态码选择日志级别
    const logLevel = statusCode >= 500 ? 'error' : 
                    statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('Request completed', {
      request: {
        method,
        url,
        ip,
        userAgent: headers['user-agent']
      },
      response: {
        statusCode,
        statusMessage,
        duration: `${duration}ms`
      }
    });
  });
  
  next();
};

/**
 * 错误日志记录中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
logger.errorLogger = (err, req, res, next) => {
  const { method, url, ip, headers } = req;
  const { statusCode = 500 } = res;
  
  logger.error('Request error', {
    request: {
      method,
      url,
      ip,
      userAgent: headers['user-agent']
    },
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode
    }
  });
  
  next(err);
};

// 导出日志实例
module.exports = logger;
