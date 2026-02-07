# 生产环境部署要求

## 1. 环境准备

### 1.1 服务器配置

| 项目 | 要求 |
|------|------|
| 操作系统 | CentOS 7+ 或 Ubuntu 18.04+ |
| CPU | 2核及以上 |
| 内存 | 4GB及以上 |
| 磁盘 | 40GB及以上 |
| 网络 | 公网IP，开放80/443端口 |
| Node.js | v18.x 或 v20.x |
| MongoDB | 4.4+ |
| Nginx | 1.18+ |

### 1.2 依赖安装

```bash
# CentOS 安装依赖
yum install -y gcc-c++ make curl wget git nginx

# Ubuntu 安装依赖
apt update && apt install -y build-essential curl wget git nginx

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
yum install -y nodejs  # CentOS
apt install -y nodejs  # Ubuntu

# 安装 MongoDB
# 参考：https://docs.mongodb.com/manual/installation/
```

## 2. 环境变量配置

### 2.1 后端环境变量

创建 `/root/xiaonuo/backend/.env` 文件，配置以下变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=27017
DB_NAME=xiaonuo
DB_USER=
DB_PASSWORD=

# 服务器配置
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# AI 服务配置
AI_MODEL=doubao-seed-1-6-lite-251015
ARK_API_KEY=your_ark_api_key
AI_TEMPERATURE=0.8
AI_TOP_P=0.95
AI_CHAT_BASE_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
AI_RESPONSES_BASE_URL=https://ark.cn-beijing.volces.com/api/v3/responses

# TOS 配置
TOS_ENDPOINT=https://tos-cn-beijing.volces.com
TOS_ACCESS_KEY_ID=your_tos_access_key_id
TOS_ACCESS_KEY_SECRET=your_tos_access_key_secret
TOS_BUCKET=your_tos_bucket
TOS_REGION=cn-beijing
TOS_FILE_PREFIX=xiaonuo/

# CORS 配置
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com

# 微信支付配置
WECHAT_APPID=wx539922c487ccc916
WECHAT_MCHID=1698261141
WECHAT_API_KEY=15987idnjejgityjviuehjnmhkoce54d
WECHAT_PRIVATE_KEY_PATH=./cert/apiclient_key.pem
WECHAT_SERIAL_NO=362341A7EA990CCCA5DFF9724E7068A0835E8FFF
WECHAT_NOTIFY_URL=https://your-domain.com/api/wechat/notify
WECHAT_SANDBOX=false
```

### 2.2 前端环境变量

创建 `/root/xiaonuo/frontend/.env.production` 文件：

```env
VITE_API_BASE_URL=https://your-domain.com/api
```

## 3. 证书文件配置

### 3.1 微信支付证书

将微信支付证书文件上传到服务器：

```bash
# 创建证书目录
mkdir -p /root/xiaonuo/backend/cert

# 上传证书文件
scp -i your-key.pem ./cert/apiclient_key.pem root@your-server:/root/xiaonuo/backend/cert/
```

### 3.2 SSL 证书

配置 Nginx SSL 证书：

```bash
# 上传 SSL 证书到 Nginx 目录
mkdir -p /etc/nginx/ssl
scp -i your-key.pem ./ssl/your-domain.com.crt root@your-server:/etc/nginx/ssl/
scp -i your-key.pem ./ssl/your-domain.com.key root@your-server:/etc/nginx/ssl/
```

## 4. Nginx 配置

创建或修改 Nginx 配置文件：

```bash
# 编辑 Nginx 配置
vi /etc/nginx/conf.d/xiaonuo.conf
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL 配置
    ssl_certificate /etc/nginx/ssl/your-domain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/your-domain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 前端静态文件
    location / {
        root /var/www/xiaonuo;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端 API 代理
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间，适应微信支付回调
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## 5. 部署流程

### 5.1 使用部署脚本

项目根目录提供了自动部署脚本 `deploy.sh`，使用方法：

```bash
# 全量部署（删除旧文件）
bash deploy.sh --full

# 增量部署（保留旧文件）
bash deploy.sh
```

### 5.2 手动部署步骤

1. **构建前端**
   ```bash
   cd frontend
   npm run build
   ```

2. **上传前端文件**
   ```bash
   rsync -avz dist/ root@your-server:/var/www/xiaonuo/
   ```

3. **上传后端文件**
   ```bash
   cd backend
   tar --exclude='node_modules' -czf backend.tar.gz .
   scp backend.tar.gz root@your-server:/root/xiaonuo/backend/
   ```

4. **服务器部署**
   ```bash
   # 解压后端文件
   ssh root@your-server "cd /root/xiaonuo/backend && tar -xzf backend.tar.gz && rm backend.tar.gz"
   
   # 安装依赖
   ssh root@your-server "cd /root/xiaonuo/backend && npm install --omit=dev"
   
   # 启动服务
   ssh root@your-server "cd /root/xiaonuo/backend && pm2 start src/index.js --name xiaonuo-backend"
   ```

## 6. 服务管理

### 6.1 使用 PM2 管理后端服务

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start src/index.js --name xiaonuo-backend

# 查看服务状态
pm2 status

# 重启服务
pm2 restart xiaonuo-backend

# 查看日志
pm2 logs xiaonuo-backend

# 设置开机自启
pm2 startup
pm2 save
```

### 6.2 管理 Nginx 服务

```bash
# 启动 Nginx
systemctl start nginx

# 重启 Nginx
systemctl restart nginx

# 查看 Nginx 状态
systemctl status nginx

# 设置 Nginx 开机自启
systemctl enable nginx
```

### 6.3 管理 MongoDB 服务

```bash
# 启动 MongoDB
systemctl start mongod

# 重启 MongoDB
systemctl restart mongod

# 查看 MongoDB 状态
systemctl status mongod

# 设置 MongoDB 开机自启
systemctl enable mongod
```

## 7. 安全配置

### 7.1 防火墙配置

```bash
# 开放必要端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

### 7.2 SSH 安全配置

```bash
# 禁用 root 密码登录
vi /etc/ssh/sshd_config
# 设置：PasswordAuthentication no

# 重启 SSH 服务
systemctl restart sshd
```

### 7.3 定期备份

```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
mongodump --db xiaonuo --out $BACKUP_DIR/mongo_$DATE

# 备份配置文件
cp -r /root/xiaonuo/backend/.env* $BACKUP_DIR/config_$DATE

# 备份证书
cp -r /root/xiaonuo/backend/cert $BACKUP_DIR/cert_$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "*" -type d -mtime +7 -exec rm -rf {} \;
EOF

# 设置执行权限
chmod +x /root/backup.sh

# 添加到定时任务
crontab -e
# 添加：0 2 * * * /root/backup.sh  # 每天凌晨2点执行备份
```

## 8. 监控与维护

### 8.1 健康检查

- 后端健康检查：`https://your-domain.com/health`
- API 健康检查：`https://your-domain.com/api/health`

### 8.2 日志监控

```bash
# 查看后端日志
pm2 logs xiaonuo-backend

# 查看 Nginx 访问日志
cat /var/log/nginx/access.log

# 查看 Nginx 错误日志
cat /var/log/nginx/error.log
```

### 8.3 定期维护

1. **更新依赖**：每两周更新一次依赖
   ```bash
   cd backend && npm update
   ```

2. **检查安全漏洞**：每月运行一次安全扫描
   ```bash
   npm audit
   ```

3. **数据库优化**：每季度优化一次数据库索引
   ```bash
   mongosh xiaonuo --eval "db.runCommand({ reIndex: 'users' })"
   mongosh xiaonuo --eval "db.runCommand({ reIndex: 'records' })"
   mongosh xiaonuo --eval "db.runCommand({ reIndex: 'plans' })"
   mongosh xiaonuo --eval "db.runCommand({ reIndex: 'orders' })"
   ```

## 9. 常见问题处理

### 9.1 微信支付回调失败

- 检查 `WECHAT_NOTIFY_URL` 是否配置正确
- 确保服务器能被微信服务器访问
- 检查 Nginx 超时时间设置

### 9.2 前端访问后端 API 失败

- 检查 CORS 配置是否包含前端域名
- 检查 Nginx 代理配置
- 检查后端服务是否正常运行

### 9.3 服务启动失败

- 查看 PM2 日志：`pm2 logs xiaonuo-backend`
- 检查环境变量配置
- 检查端口是否被占用：`lsof -i :3001`

## 10. 版本更新

### 10.1 代码更新流程

1. 拉取最新代码：`git pull origin main`
2. 检查更新内容：`git diff HEAD^ HEAD`
3. 执行部署脚本：`bash deploy.sh`
4. 验证服务状态：`pm2 status`

### 10.2 数据库迁移

如果更新包含数据库结构变更，需要先执行数据库迁移：

```bash
# 查看迁移脚本
ls -la migrations/

# 执行迁移
node migrations/your-migration-script.js
```

## 11. 联系方式

- 技术支持：[your-email@example.com]
- 部署文档：`https://your-domain.com/docs/deployment`
- 健康检查：`https://your-domain.com/health`

---

**版本**：1.0.0  
**最后更新**：2026-01-26
