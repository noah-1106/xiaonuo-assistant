# 环境变量配置指南

本文档提供了小诺智能助理项目的环境变量配置指南，包括前端、后端和部署脚本的环境变量管理方法和最佳实践。

## 一、环境变量管理架构

### 1. 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端环境变量  │    │   后端环境变量  │    │  部署脚本配置   │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • env.types.ts  │    │ • .env.example  │    │ • deploy.sh     │
│ • env.ts        │    │ • .env          │    │ • 多环境支持    │
│ • .env.production│    │ • 配置验证      │    │ • 自动化配置    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2. 环境分类

| 环境 | 描述 | 用途 |
|------|------|------|
| `development` | 开发环境 | 本地开发和测试 |
| `staging` | 测试环境 | 预发布测试 |
| `production` | 生产环境 | 线上正式环境 |

## 二、前端环境变量配置

### 1. 配置文件

#### `frontend/src/utils/env.types.ts`
- 定义环境变量类型
- 提供类型安全的环境变量访问

#### `frontend/src/utils/env.ts`
- 统一的环境变量管理系统
- 支持多环境配置和验证
- 自动计算相关配置（如WebSocket URL）

#### `frontend/.env.production`
- 生产环境构建配置
- 由部署脚本自动生成

### 2. 前端环境变量列表

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | string | `http://localhost:3001/api` | API基础URL |
| `VITE_NODE_ENV` | string | `development` | 运行环境 |
| `VITE_APP_NAME` | string | `小诺智能助理` | 应用名称 |
| `VITE_APP_VERSION` | string | `1.0.0` | 应用版本 |
| `VITE_DEBUG` | boolean | `false` | 调试模式 |
| `VITE_ENABLE_ANALYTICS` | boolean | `false` | 启用分析 |
| `VITE_ENABLE_ERROR_REPORTING` | boolean | `false` | 启用错误报告 |

### 3. 使用示例

```typescript
// 导入环境变量
import { API_BASE_URL, WS_BASE_URL, env } from '@/utils/env';

// 使用环境变量
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// 使用WebSocket URL
const socket = new WebSocket(WS_BASE_URL);

// 检查环境
if (env.isProduction()) {
  // 生产环境逻辑
} else if (env.isDevelopment()) {
  // 开发环境逻辑
}

// 调试信息
if (env.get('DEBUG')) {
  env.debug();
}
```

## 三、后端环境变量配置

### 1. 配置文件

#### `backend/.env.example`
- 环境变量示例文件
- 包含所有必要的环境变量和默认值

#### `backend/.env`
- 实际环境变量配置文件
- 本地开发和部署时使用

#### `backend/src/config/index.js`
- 配置管理中心
- 提供配置加载、验证和访问功能

### 2. 后端环境变量列表

#### 数据库配置

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `DB_HOST` | string | `localhost` | 数据库主机 |
| `DB_PORT` | number | `27017` | 数据库端口 |
| `DB_NAME` | string | `xiaonuo` | 数据库名称 |
| `DB_USER` | string | `` | 数据库用户名 |
| `DB_PASSWORD` | string | `` | 数据库密码 |

#### 服务器配置

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `PORT` | number | `3001` | 服务器端口 |
| `HOST` | string | `0.0.0.0` | 服务器主机 |
| `NODE_ENV` | string | `development` | 运行环境 |
| `JWT_SECRET` | string | 必填 | JWT密钥 |
| `JWT_EXPIRES_IN` | string | `7d` | JWT过期时间 |

#### AI服务配置

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `ARK_API_KEY` | string | 必填 | 火山引擎API密钥 |
| `AI_MODEL` | string | `doubao-seed-1-8-251228` | AI模型名称 |
| `AI_MODEL_ID` | string | `doubao-seed-1-8-251228` | AI模型ID |
| `AI_ENDPOINT_ID` | string | `ep-m-20260128215950-dcxfh` | AI端点ID |
| `AI_TEMPERATURE` | number | `0.8` | AI温度参数 |
| `AI_TOP_P` | number | `0.95` | AI Top-P参数 |
| `AI_USE_CONTEXT_CACHE` | boolean | `true` | 启用上下文缓存 |

#### TOS配置

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `TOS_ENDPOINT` | string | `https://tos-cn-beijing.volces.com` | TOS端点 |
| `TOS_ACCESS_KEY_ID` | string | `test_access_key` | TOS访问密钥ID |
| `TOS_ACCESS_KEY_SECRET` | string | `test_secret_key` | TOS访问密钥密钥 |
| `TOS_BUCKET` | string | `test-bucket` | TOS存储桶 |
| `TOS_REGION` | string | `cn-beijing` | TOS区域 |
| `TOS_FILE_PREFIX` | string | `xiaonuo/` | TOS文件前缀 |

#### CORS配置

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `CORS_ORIGIN` | string | `http://localhost:5173` | CORS允许的来源 |

#### 微信支付配置

| 变量名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `WECHAT_APPID` | string | `wx539922c487ccc916` | 微信APPID |
| `WECHAT_MCHID` | string | `1698261141` | 微信商户ID |
| `WECHAT_API_KEY` | string | `15987idnjejgityjviuehjnmhkoce54d` | 微信API密钥 |
| `WECHAT_SERIAL_NO` | string | `362341A7EA990CCCA5DFF9724E7068A0835E8FFF` | 微信证书序列号 |
| `WECHAT_NOTIFY_URL` | string | `http://localhost:3001/api/wechat/notify` | 微信支付通知URL |
| `WECHAT_SANDBOX` | boolean | `false` | 启用沙箱模式 |

### 3. 后端配置验证

后端配置管理中心会自动验证环境变量的有效性：

- 必填项验证
- 格式验证
- 类型验证
- 默认值处理

## 四、部署脚本配置

### 1. 部署脚本功能

- 多环境支持（development、staging、production）
- 环境变量自动配置
- 前端构建配置生成
- 后端环境变量更新
- 环境变量验证

### 2. 使用方法

```bash
# 基本部署（生产环境）
bash deploy.sh

# 全量部署（生产环境）
bash deploy.sh --full

# 指定环境部署
bash deploy.sh --env=staging

# 全量部署指定环境
bash deploy.sh --full --env=development
```

### 3. 环境特定配置

| 环境 | API地址 | CORS来源 | 微信通知URL |
|------|---------|----------|------------|
| `production` | `https://xiaonuo.top/api` | `https://xiaonuo.top,http://localhost:5173` | `https://xiaonuo.top/api/wechat/notify` |
| `staging` | `https://staging.xiaonuo.top/api` | `https://staging.xiaonuo.top,http://localhost:5173` | `https://staging.xiaonuo.top/api/wechat/notify` |
| `development` | `http://localhost:3001/api` | `http://localhost:5173` | `http://localhost:3001/api/wechat/notify` |

## 五、环境变量最佳实践

### 1. 安全性最佳实践

- **敏感信息保护**：不要将敏感信息（如API密钥、密码）提交到版本控制系统
- **环境隔离**：不同环境使用不同的配置文件
- **权限控制**：限制环境变量文件的访问权限
- **密钥管理**：使用密钥管理服务存储敏感信息

### 2. 配置管理最佳实践

- **统一管理**：使用统一的环境变量管理系统
- **类型安全**：使用TypeScript类型定义确保类型安全
- **验证机制**：添加环境变量验证机制
- **默认值处理**：为非必填项提供合理的默认值
- **文档化**：详细记录所有环境变量的用途和配置方法

### 3. 部署最佳实践

- **自动化配置**：使用部署脚本自动配置环境变量
- **环境一致性**：确保不同环境的配置结构一致
- **配置验证**：部署前验证环境变量配置
- **变更管理**：记录环境变量的变更历史
- **回滚机制**：支持环境变量配置的回滚

## 六、环境变量故障排查

### 1. 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| API调用失败 | API_BASE_URL配置错误 | 检查前端和后端的API地址配置 |
| CORS错误 | CORS_ORIGIN配置错误 | 确保CORS配置包含正确的域名 |
| 微信支付失败 | WECHAT_NOTIFY_URL配置错误 | 检查微信支付通知URL配置 |
| 服务启动失败 | 缺少必填环境变量 | 检查.env文件是否包含所有必填项 |
| 部署失败 | 环境变量验证失败 | 检查部署脚本的环境参数和配置 |

### 2. 排查工具

- **前端调试**：在浏览器控制台查看环境变量配置
  ```javascript
  // 在控制台执行
  console.log(window.__env__); // 或查看网络请求中的API地址
  ```

- **后端调试**：查看后端服务日志
  ```bash
  # 查看后端日志
  cd backend && cat server.log
  ```

- **部署调试**：使用详细模式运行部署脚本
  ```bash
  # 启用详细输出
  bash -x deploy.sh
  ```

## 七、环境变量变更流程

### 1. 添加新环境变量

1. **前端**：在`env.types.ts`中添加类型定义，在`env.ts`中添加默认值和验证
2. **后端**：在`config/index.js`中添加配置项，在`.env.example`中添加示例
3. **部署脚本**：在`deploy.sh`中添加环境特定配置
4. **文档**：更新本指南中的环境变量列表

### 2. 修改现有环境变量

1. **更新配置文件**：修改相关配置文件
2. **验证配置**：运行配置验证确保变更有效
3. **部署测试**：在测试环境验证变更
4. **生产部署**：在生产环境应用变更

### 3. 环境变量版本控制

- 使用Git分支管理不同环境的配置
- 定期备份环境变量配置文件
- 记录环境变量变更历史

## 八、自动化测试和验证

### 1. 环境变量验证脚本

```bash
# 验证后端环境变量
cd backend && node -e "require('./src/config').validateAllConfigs()"

# 验证前端环境变量
cd frontend && npm run build
```

### 2. CI/CD集成

在CI/CD流程中添加环境变量验证步骤：

- 检查环境变量文件是否存在
- 验证必填环境变量是否配置
- 检查环境变量格式是否正确
- 测试配置变更是否影响应用运行

## 九、总结

通过本文档的配置指南，您可以：

1. **统一管理**：使用统一的环境变量管理系统
2. **类型安全**：享受TypeScript带来的类型安全
3. **自动化配置**：通过部署脚本自动配置环境变量
4. **环境隔离**：支持多个环境的配置隔离
5. **故障排查**：快速定位和解决环境变量问题

遵循本文档的最佳实践，可以显著减少环境变量相关的部署问题，提高系统的稳定性和可维护性。

---

**文档版本**：v1.0.0
**更新时间**：$(date '+%Y-%m-%d')
**维护者**：Trae AI
