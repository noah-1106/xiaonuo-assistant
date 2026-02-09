const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const websocketService = require('./services/websocketService');

// WebSocket连接管理
const socketConnections = new Map();

// 加载环境变量
dotenv.config();

// 导入配置验证函数
const { validateAllConfigs } = require('./config');

// 验证所有配置
validateAllConfigs();

// 创建Express应用
const app = express();

// 连接数据库
connectDB().catch(error => {
  logger.warn('⚠️  数据库连接失败，服务将以有限功能运行:', { error: error.message });
});

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件 - 使用增强版日志记录
app.use(logger.requestLogger);

// CORS配置
const corsOptions = {
  origin: '*', // 允许所有来源访问，解决通过IP访问时的跨域问题
  credentials: true,
  exposedHeaders: ['X-Captcha-Id'], // 允许前端访问自定义响应头
};
app.use(cors(corsOptions));

// 健康检查路由
app.get('/api/health', (req, res) => {
  logger.info('健康检查请求');
  res.json({
    status: 'ok',
    message: '小诺智能助理后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 指标暴露路由 - 用于 Prometheus 监控
app.get('/api/metrics', (req, res) => {
  const metrics = `
# 小诺智能助理服务指标
# HELP xiaonuo_service_status 服务状态 (1=运行中, 0=停止)
# TYPE xiaonuo_service_status gauge
xiaonuo_service_status 1

# HELP xiaonuo_service_uptime 服务运行时间（秒）
# TYPE xiaonuo_service_uptime gauge
xiaonuo_service_uptime ${Math.floor(process.uptime())}

# HELP xiaonuo_memory_usage_bytes 内存使用量（字节）
# TYPE xiaonuo_memory_usage_bytes gauge
xiaonuo_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP xiaonuo_heap_total_bytes 堆内存总量（字节）
# TYPE xiaonuo_heap_total_bytes gauge
xiaonuo_heap_total_bytes ${process.memoryUsage().heapTotal}

# HELP xiaonuo_rss_bytes 常驻内存集（字节）
# TYPE xiaonuo_rss_bytes gauge
xiaonuo_rss_bytes ${process.memoryUsage().rss}

# HELP xiaonuo_node_version Node.js 版本
# TYPE xiaonuo_node_version gauge
xiaonuo_node_version ${parseFloat(process.version.replace('v', ''))}

# HELP xiaonuo_service_start_time 服务启动时间戳
# TYPE xiaonuo_service_start_time gauge
xiaonuo_service_start_time ${Math.floor(Date.now() / 1000) - Math.floor(process.uptime())}
`;
  
  res.set('Content-Type', 'text/plain');
  res.status(200).send(metrics.trim());
});

// 导入路由
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const browserRoutes = require('./routes/browser');
const planRoutes = require('./routes/plan');
const orderRoutes = require('./routes/order');
const recordRoutes = require('./routes/records');
const aiSettingsRoutes = require('./routes/aiSettings');
const captchaRoutes = require('./routes/captcha');
const fileRoutes = require('./routes/files');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notification');
const cacheRoutes = require('./routes/cache');
const wechatRoutes = require('./routes/wechat');

// 静态文件服务配置
const path = require('path');
const staticPath = path.join(__dirname, '../public');
app.use(express.static(staticPath));

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/ai-settings', aiSettingsRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/logs', require('./routes/logs'));
app.use('/api/wechat', wechatRoutes);

// 导入错误处理中间件
const errorHandler = require('./middleware/errorHandler');
const { NotFoundError } = require('./utils/customErrors');

// 404处理 - 所有未匹配的请求都返回404错误
app.use((req, res, next) => {
  logger.warn(`未找到路由: ${req.method} ${req.url}`);
  next(new NotFoundError('资源不存在'));
});

// 错误日志记录中间件
app.use(logger.errorLogger);

// 错误处理中间件
app.use(errorHandler);

// 创建HTTP服务器
const server = http.createServer(app);

// 创建WebSocket服务器
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 初始化WebSocket服务
websocketService.initWebSocketService(io, socketConnections);
console.log('WebSocket服务已初始化');


// WebSocket连接处理
io.on('connection', (socket) => {
  logger.info('WebSocket客户端已连接:', { socketId: socket.id });
  
  // 处理用户认证
  socket.on('authenticate', (data) => {
    const { userId, token } = data;
    if (userId && token) {
      socketConnections.set(userId, socket.id);
      socket.userId = userId;
      logger.info('WebSocket客户端已认证:', { userId, socketId: socket.id });
      socket.emit('authenticated', { success: true, message: '认证成功' });
    } else {
      socket.emit('authentication_error', { message: '认证失败，缺少必要参数' });
    }
  });
  
  // 处理断开连接
  socket.on('disconnect', () => {
    if (socket.userId) {
      socketConnections.delete(socket.userId);
      logger.info('WebSocket客户端已断开连接:', { userId: socket.userId, socketId: socket.id });
    } else {
      logger.info('未认证的WebSocket客户端已断开连接:', { socketId: socket.id });
    }
  });
});

// 启动服务器
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  
  // 启动服务器
  server.listen(PORT, () => {
    logger.info(`🚀 小诺智能助理后端服务已启动`, {
      port: PORT,
      healthCheck: `http://localhost:${PORT}/api/health`,
      staticFiles: `http://localhost:${PORT}`,
      websocket: `ws://localhost:${PORT}`
    });
  });
}

// 导出app和io实例，供其他模块使用
module.exports = { app, io, socketConnections };
