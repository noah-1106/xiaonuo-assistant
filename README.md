# 小诺智能助理

小诺智能助理是一款基于火山方舟AI服务的智能聊天应用，结合多标签页浏览器功能，支持在聊天过程中直接通过链接访问外部资源。

## 核心功能

- 🤖 **智能聊天**：基于火山方舟AI API，提供流畅的AI对话体验
- 🌐 **多标签页浏览器**：右侧集成多标签页浏览器，支持直接访问外部资源
- 💰 **套餐与支付功能**：简化版套餐管理与支付功能
- 📱 **移动端适配**：支持移动端访问，提供良好的移动端体验
- 🔒 **安全认证**：基于JWT的用户认证系统
- 💾 **文件存储**：基于火山方舟TOS的文件存储服务

## 技术栈

### 前端
- **框架**: React 19
- **构建工具**: Vite
- **UI组件**: Ant Design
- **状态管理**: React Context API
- **路由**: React Router
- **语言**: TypeScript

### 后端
- **运行时**: Node.js 20+
- **框架**: Express 4.x
- **数据库**: MongoDB 7.x
- **ORM**: Mongoose 8.x
- **认证**: JWT (jsonwebtoken)
- **AI服务**: 火山方舟AI API

### 基础设施
- **Web服务器**: Nginx
- **存储**: 火山方舟TOS
- **部署**: 阿里云ECS

## 快速开始

### 开发环境

#### 前端
```bash
cd frontend
pnpm install
pnpm run dev
```

#### 后端
```bash
cd backend
pnpm install
pnpm run dev
```

### 生产部署

1. **配置环境变量**
   - 前端：修改 `frontend/.env.production`
   - 后端：修改 `backend/.env.production`

2. **构建前端项目**
```bash
cd frontend
pnpm run build
```

3. **启动后端服务**
```bash
cd backend
pnpm start
```

4. **配置Nginx**
   - 参考 `nginx.conf` 文件进行配置
   - 部署前端构建文件到指定目录

## 项目结构

```
xiaonuo/
├── frontend/           # 前端代码
│   ├── src/           # 源代码
│   ├── dist/          # 构建输出
│   └── package.json   # 前端依赖
├── backend/           # 后端代码
│   ├── src/           # 源代码
│   ├── package.json   # 后端依赖
│   └── .env           # 环境变量
├── nginx.conf         # Nginx配置文件
└── README.md          # 项目说明
```

## API文档

### 健康检查
- **URL**: `/api/health`
- **Method**: `GET`
- **Response**: `{ "status": "ok", "message": "小诺智能助理后端服务运行正常", "timestamp": "2026-01-24T14:47:09.959Z" }`

### 验证码
- **URL**: `/api/captcha`
- **Method**: `GET`
- **Response**: SVG验证码图片，包含 `X-Captcha-Id` 响应头

### 验证码验证
- **URL**: `/api/captcha/verify`
- **Method**: `POST`
- **Request Body**: `{ "captchaId": "xxx", "captchaText": "xxx" }`
- **Response**: `{ "status": "ok", "message": "验证码验证成功" }`

### 登录
- **URL**: `/api/auth/login-with-code`
- **Method**: `POST`
- **Request Body**: `{ "phone": "13800138000", "code": "123456" }`
- **Response**: `{ "status": "ok", "message": "登录成功", "data": { "token": "xxx", "user": { ... } } }`

### 发送聊天消息
- **URL**: `/api/chat/send`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer xxx`
- **Request Body**: `{ "message": "你好", "sessionId": "test-session" }`
- **Response**: `{ "status": "ok", "message": "发送消息成功", "data": { "reply": "xxx", "type": "text", "sessionId": "xxx" } }`

## 环境变量配置

### 前端
```
# 开发环境
VITE_API_BASE_URL=http://localhost:3001/api

# 生产环境
VITE_API_BASE_URL=https://your-domain/api
```

### 后端
```
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=27017
DB_NAME=xiaonuo
DB_USER=root
DB_PASSWORD=your-password

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://your-domain,https://another-domain

# 火山方舟AI配置
ARK_API_KEY=your-ark-api-key
AI_MODEL=doubao-seed-1-6-lite-251015
AI_TEMPERATURE=0.8
AI_TOP_P=0.95

# 火山方舟TOS配置
TOS_ENDPOINT=https://tos-cn-beijing.volces.com
TOS_ACCESS_KEY_ID=your-access-key
TOS_ACCESS_KEY_SECRET=your-secret-key
TOS_BUCKET=your-bucket-name
TOS_REGION=cn-beijing
```

## 许可证

MIT

## 联系方式

如有问题或建议，请通过以下方式联系我们：

- 邮箱：contact@xiaonuo.top
- 官网：https://xiaonuo.top
