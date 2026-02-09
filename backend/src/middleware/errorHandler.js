const logger = require('../utils/logger');

// 错误类型配置
const errorConfig = {
  ValidationError: {
    statusCode: 400,
    message: '数据验证失败',
    recoverySuggestion: '请检查输入数据是否符合要求，确保所有必填字段都已填写正确',
    errorCode: 'VALIDATION_ERROR'
  },
  UnauthorizedError: {
    statusCode: 401,
    message: '未授权访问',
    recoverySuggestion: '请登录后再尝试访问，或检查您的认证信息是否正确',
    errorCode: 'UNAUTHORIZED'
  },
  ForbiddenError: {
    statusCode: 403,
    message: '禁止访问',
    recoverySuggestion: '您没有权限执行此操作，请联系管理员获取相应权限',
    errorCode: 'FORBIDDEN'
  },
  NotFoundError: {
    statusCode: 404,
    message: '资源不存在',
    recoverySuggestion: '请检查请求的URL是否正确，或确认资源是否已被删除',
    errorCode: 'NOT_FOUND'
  },
  ConflictError: {
    statusCode: 409,
    message: '资源冲突',
    recoverySuggestion: '该资源可能已被其他用户修改，请刷新页面后重试',
    errorCode: 'CONFLICT'
  },
  UnprocessableEntityError: {
    statusCode: 422,
    message: '无法处理的请求',
    recoverySuggestion: '请求数据格式正确但内容无法处理，请检查请求数据的有效性',
    errorCode: 'UNPROCESSABLE_ENTITY'
  },
  TooManyRequestsError: {
    statusCode: 429,
    message: '请求过于频繁',
    recoverySuggestion: '请稍后再试，系统暂时限制了请求频率',
    errorCode: 'TOO_MANY_REQUESTS'
  },
  InternalServerError: {
    statusCode: 500,
    message: '服务器内部错误',
    recoverySuggestion: '服务器暂时出现问题，请稍后重试',
    errorCode: 'INTERNAL_SERVER_ERROR'
  },
  BadGatewayError: {
    statusCode: 502,
    message: '网关错误',
    recoverySuggestion: '系统之间的连接暂时出现问题，请稍后重试',
    errorCode: 'BAD_GATEWAY'
  },
  ServiceUnavailableError: {
    statusCode: 503,
    message: '服务暂时不可用',
    recoverySuggestion: '服务正在维护或暂时过载，请稍后重试',
    errorCode: 'SERVICE_UNAVAILABLE'
  },

};

const errorHandler = (err, req, res, next) => {
  // 生成错误ID，用于错误追踪
  const errorId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // 记录错误日志
  logger.error('请求处理错误', {
    errorId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: req.user ? { _id: req.user._id, username: req.user.username } : null
  });
  
  // 获取错误配置
  const config = errorConfig[err.name] || {
    statusCode: err.statusCode || 500,
    message: err.message || '服务器内部错误',
    recoverySuggestion: '服务器暂时出现问题，请稍后重试',
    errorCode: 'INTERNAL_ERROR'
  };
  
  // 处理不同类型的错误
  let statusCode = config.statusCode;
  let message = config.message;
  let recoverySuggestion = config.recoverySuggestion;
  let errorCode = config.errorCode;
  
  // 特殊处理验证错误
  if (err.name === 'ValidationError') {
    // 提取验证错误详情
    const validationErrors = {};
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message || '验证失败';
      });
    }
    err.validationErrors = validationErrors;
  }
  
  // 如果是404错误，且请求接受HTML响应，返回404页面
    if (statusCode === 404 && req.accepts('html')) {
      const html404 = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - 页面未找到</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      background-size: 400% 400%;
      animation: gradientBG 15s ease infinite;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #333;
      overflow-x: hidden;
    }
    
    @keyframes gradientBG {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .stars {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
    }
    
    .star {
      position: absolute;
      background: white;
      border-radius: 50%;
      animation: twinkle 3s infinite ease-in-out;
    }
    
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    
    .container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 4rem 2rem;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      max-width: 600px;
      margin: 2rem;
      animation: fadeInUp 1s ease-out;
      position: relative;
      overflow: hidden;
    }
    
    .container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    h1 {
      font-size: 12rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
      line-height: 1;
      animation: bounce 2s ease infinite;
      position: relative;
      z-index: 2;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-20px); }
      60% { transform: translateY(-10px); }
    }
    
    h2 {
      font-size: 2.5rem;
      color: #2d3748;
      margin-bottom: 1.5rem;
      font-weight: 700;
      position: relative;
      z-index: 2;
    }
    
    p {
      font-size: 1.2rem;
      color: #718096;
      margin-bottom: 2.5rem;
      line-height: 1.7;
      position: relative;
      z-index: 2;
    }
    
    .error-id {
      font-size: 0.8rem;
      color: #718096;
      margin-top: 1rem;
      font-family: monospace;
      position: relative;
      z-index: 2;
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 8rem;
      }
      
      h2 {
        font-size: 2rem;
      }
      
      .container {
        padding: 3rem 1.5rem;
      }
    }
    
    @media (max-width: 480px) {
      h1 {
        font-size: 6rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
      
      p {
        font-size: 1rem;
      }
      
      .container {
        padding: 2rem 1rem;
      }
    }
  </style>
</head>
<body>
  <!-- 动态星星背景 -->
  <div class="stars"></div>
  
  <div class="container">
    <h1>404</h1>
    <h2>Oops! 页面走丢了</h2>
    <p>抱歉，您访问的页面不存在、已被移除或暂时不可用。</p>
    
    <div class="error-id">错误ID: ${errorId}</div>
  </div>
  
  <script>
    // 生成动态星星
    const starsContainer = document.querySelector('.stars');
    const starCount = 50;
    
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      const size = Math.random() * 3 + 1;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = (Math.random() * 3 + 2) + 's';
      
      starsContainer.appendChild(star);
    }
  </script>
</body>
</html>`;
    return res.status(404).send(html404);
  }
  
  // 返回统一格式的错误响应
  const response = {
    status: 'error',
    message: message,
    errorCode: errorCode,
    recoverySuggestion: recoverySuggestion,
    errorId: errorId,
    timestamp: new Date().toISOString(),
    // 如果是验证错误，返回错误详情
    ...(err.validationErrors && { errors: err.validationErrors }),
    ...(err.errors && { errors: err.errors }),
    // 开发环境下返回详细错误信息，生产环境下不返回
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  res.status(statusCode).json(response);
};

module.exports = errorHandler;
