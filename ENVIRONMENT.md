# 环境变量说明

本文档详细说明小诺智能助理项目所需的所有环境变量。

## 目录

- [后端环境变量](#后端环境变量)
- [前端环境变量](#前端环境变量)
- [获取API密钥](#获取api密钥)

---

## 后端环境变量

### 服务器配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | 否 | 3001 | 服务器监听端口 |
| `HOST` | 否 | 0.0.0.0 | 服务器监听地址 |
| `NODE_ENV` | 否 | development | 运行环境 (development/production) |

### 数据库配置

**方式一：使用 MongoDB URI（推荐）**

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `MONGO_URI` | 是 | - | MongoDB 连接字符串 |

示例：
```env
MONGO_URI=mongodb://username:password@localhost:27017/xiaonuo
```

**方式二：使用分散配置**

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DB_HOST` | 是 | localhost | 数据库主机地址 |
| `DB_PORT` | 否 | 27017 | 数据库端口 |
| `DB_NAME` | 是 | xiaonuo | 数据库名称 |
| `DB_USER` | 否 | - | 数据库用户名 |
| `DB_PASSWORD` | 否 | - | 数据库密码 |

### JWT 配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `JWT_SECRET` | 是 | - | JWT 签名密钥（建议使用强随机字符串） |
| `JWT_EXPIRES_IN` | 否 | 7d | JWT 过期时间 |

### CORS 配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `CORS_ORIGIN` | 否 | * | 允许的跨域来源 |

示例：
```env
# 开发环境
CORS_ORIGIN=http://localhost:5173

# 生产环境
CORS_ORIGIN=https://your-domain.com
```

### 火山方舟 AI 配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `ARK_API_KEY` | 是 | - | 火山方舟 API 密钥 |
| `AI_MODEL` | 否 | doubao-seed-1-8-251228 | AI 模型名称 |
| `AI_MODEL_ID` | 否 | - | AI 模型 ID |
| `AI_ENDPOINT_ID` | 是 | - | 火山方舟 Endpoint ID |
| `AI_TEMPERATURE` | 否 | 0.8 | 采样温度 (0-1) |
| `AI_TOP_P` | 否 | 0.95 | 核采样参数 |
| `AI_USE_CONTEXT_CACHE` | 否 | true | 是否启用上下文缓存 |

### 火山方舟 TOS 配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `TOS_ENDPOINT` | 是 | - | TOS 服务端点 |
| `TOS_ACCESS_KEY_ID` | 是 | - | Access Key ID |
| `TOS_ACCESS_KEY_SECRET` | 是 | - | Access Key Secret |
| `TOS_BUCKET` | 是 | - | 存储桶名称 |
| `TOS_REGION` | 是 | - | 区域代码 |
| `TOS_FILE_PREFIX` | 否 | xiaonuo/ | 文件前缀 |

### 微信支付配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `WECHAT_APPID` | 是 | - | 微信支付 AppID |
| `WECHAT_MCHID` | 是 | - | 微信支付商户号 |
| `WECHAT_API_KEY` | 是 | - | 微信支付 API 密钥 |
| `WECHAT_SERIAL_NO` | 是 | - | 证书序列号 |
| `WECHAT_NOTIFY_URL` | 是 | - | 支付结果通知 URL |
| `WECHAT_SANDBOX` | 否 | false | 是否使用沙箱环境 |
| `WECHAT_PRIVATE_KEY_PATH` | 是 | - | 商户私钥文件路径 |

### 日志配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `LOG_LEVEL` | 否 | info | 日志级别 (debug/info/warn/error) |
| `LOG_FORMAT` | 否 | json | 日志格式 (json/simple) |

---

## 前端环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 是 | /api | API 基础路径 |
| `VITE_NODE_ENV` | 否 | development | 运行环境 |
| `VITE_APP_NAME` | 否 | 小诺智能助理 | 应用名称 |
| `VITE_APP_VERSION` | 否 | 1.0.0 | 应用版本 |

---

## 获取 API 密钥

### 火山方舟 API 密钥

1. 访问 [火山方舟控制台](https://console.volcengine.com/ark/)
2. 注册/登录账号
3. 进入「API Key 管理」页面
4. 创建新的 API Key
5. 复制 Key 到环境变量

### 火山引擎 TOS 密钥

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 进入「对象存储 TOS」服务
3. 创建存储桶
4. 进入「访问控制」->「密钥管理」
5. 创建 Access Key
6. 复制 Access Key ID 和 Secret 到环境变量

### 微信支付密钥

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 登录商户账号
3. 进入「账户中心」->「API 安全」
4. 设置 API 密钥
5. 下载 API 证书
6. 将证书文件放到 `backend/cert/` 目录

---

## 环境变量示例

### 开发环境

**backend/.env**
```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/xiaonuo
JWT_SECRET=your-dev-secret-key
CORS_ORIGIN=http://localhost:5173
ARK_API_KEY=your-ark-api-key
AI_ENDPOINT_ID=your-endpoint-id
TOS_ENDPOINT=https://tos-cn-beijing.volces.com
TOS_ACCESS_KEY_ID=your-access-key
TOS_ACCESS_KEY_SECRET=your-secret-key
TOS_BUCKET=your-bucket
TOS_REGION=cn-beijing
WECHAT_APPID=your-appid
WECHAT_MCHID=your-mchid
WECHAT_API_KEY=your-api-key
WECHAT_NOTIFY_URL=http://localhost:3001/api/wechat/notify
WECHAT_SANDBOX=true
WECHAT_PRIVATE_KEY_PATH=./cert/apiclient_key.pem
```

**frontend/.env**
```env
VITE_API_BASE_URL=/api
VITE_NODE_ENV=development
```

### 生产环境

**backend/.env**
```env
PORT=3001
NODE_ENV=production
MONGO_URI=mongodb://user:pass@host:27017/xiaonuo
JWT_SECRET=your-strong-production-secret
CORS_ORIGIN=https://your-domain.com
ARK_API_KEY=your-production-ark-api-key
AI_ENDPOINT_ID=your-production-endpoint-id
TOS_ENDPOINT=https://tos-cn-beijing.volces.com
TOS_ACCESS_KEY_ID=your-production-access-key
TOS_ACCESS_KEY_SECRET=your-production-secret-key
TOS_BUCKET=your-production-bucket
TOS_REGION=cn-beijing
WECHAT_APPID=your-production-appid
WECHAT_MCHID=your-production-mchid
WECHAT_API_KEY=your-production-api-key
WECHAT_NOTIFY_URL=https://your-domain.com/api/wechat/notify
WECHAT_SANDBOX=false
WECHAT_PRIVATE_KEY_PATH=./cert/apiclient_key.pem
```

**frontend/.env**
```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_NODE_ENV=production
```

---

## 安全提示

1. **永远不要提交 .env 文件到版本控制**
   - 已添加到 .gitignore
   - 使用 .env.example 作为模板

2. **使用强密码和密钥**
   - JWT_SECRET 至少 32 位随机字符串
   - 定期更换 API 密钥

3. **生产环境配置**
   - 使用 HTTPS
   - 配置防火墙
   - 限制数据库访问

4. **证书文件保护**
   - 设置适当的文件权限 (600)
   - 定期更换证书
   - 妥善保管私钥

---

如有问题，请提交 [Issue](https://github.com/noah-1106/xiaonuo-assistant/issues)。
