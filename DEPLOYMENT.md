# 部署指南

本文档详细介绍了如何部署小诺智能助理应用到生产环境。

## 目录

- [环境要求](#环境要求)
- [部署方式](#部署方式)
  - [Docker部署（推荐）](#docker部署推荐)
  - [手动部署](#手动部署)
- [环境配置](#环境配置)
- [Nginx配置](#nginx配置)
- [SSL证书配置](#ssl证书配置)
- [微信支付配置](#微信支付配置)
- [监控与日志](#监控与日志)
- [故障排查](#故障排查)

## 环境要求

### 服务器要求

- **操作系统**: Ubuntu 20.04 LTS 或更高版本
- **CPU**: 2核及以上
- **内存**: 4GB及以上
- **磁盘**: 20GB及以上
- **网络**: 开放 80、443、3001 端口

### 软件要求

- **Node.js**: >= 20.0.0
- **MongoDB**: >= 7.0
- **Nginx**: >= 1.18
- **Docker**: >= 20.10（可选）
- **Docker Compose**: >= 1.29（可选）

## 部署方式

### Docker部署（推荐）

使用 Docker Compose 是最简单、最推荐的部署方式。

#### 1. 安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 克隆项目

```bash
git clone https://github.com/noah-1106/xiaonuo-assistant.git
cd xiaonuo
```

#### 3. 配置环境变量

```bash
# 后端配置
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，填入生产环境配置

# 前端配置
cp frontend/.env.example frontend/.env
# 编辑 frontend/.env 文件，填入生产环境配置
```

#### 4. 启动服务

```bash
# 使用生产环境配置启动
docker-compose -f docker-compose.production.yml up -d

# 查看日志
docker-compose -f docker-compose.production.yml logs -f
```

#### 5. 初始化数据

```bash
# 进入后端容器
docker-compose -f docker-compose.production.yml exec backend sh

# 创建管理员账户
node create-admin.js
```

### 手动部署

如果你不想使用Docker，可以手动部署。

#### 1. 安装Node.js

```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

#### 2. 安装MongoDB

```bash
# 导入MongoDB公钥
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# 添加MongoDB源
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 安装MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 3. 安装Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 4. 部署后端

```bash
# 进入后端目录
cd backend

# 安装依赖
pnpm install --production

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入生产环境配置

# 使用PM2启动服务
npm install -g pm2
pm2 start src/index.js --name xiaonuo-backend
pm2 save
pm2 startup
```

#### 5. 部署前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入生产环境配置

# 构建生产版本
pnpm run build

# 将构建文件复制到Nginx目录
sudo cp -r dist/* /var/www/xiaonuo/
sudo chown -R www-data:www-data /var/www/xiaonuo
```

## 环境配置

### 后端环境变量

创建 `backend/.env` 文件：

```env
# 服务器配置
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# 数据库配置
MONGO_URI=mongodb://username:password@localhost:27017/xiaonuo

# JWT配置
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d

# CORS配置
CORS_ORIGIN=https://your-domain.com

# 火山方舟AI配置
ARK_API_KEY=your-ark-api-key
AI_MODEL=doubao-seed-1-8-251228
AI_ENDPOINT_ID=your-endpoint-id

# 火山方舟TOS配置
TOS_ENDPOINT=https://tos-cn-beijing.volces.com
TOS_ACCESS_KEY_ID=your-access-key-id
TOS_ACCESS_KEY_SECRET=your-access-key-secret
TOS_BUCKET=your-bucket-name
TOS_REGION=cn-beijing

# 微信支付配置
WECHAT_APPID=your-wechat-appid
WECHAT_MCHID=your-wechat-mchid
WECHAT_API_KEY=your-wechat-api-key
WECHAT_NOTIFY_URL=https://your-domain.com/api/wechat/notify
WECHAT_SANDBOX=false
WECHAT_PRIVATE_KEY_PATH=./cert/apiclient_key.pem
```

### 前端环境变量

创建 `frontend/.env` 文件：

```env
VITE_API_BASE_URL=https://your-domain.com/api
VITE_NODE_ENV=production
```

## Nginx配置

创建 `/etc/nginx/sites-available/xiaonuo` 文件：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/your/certificate.pem;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 前端静态文件
    location / {
        root /var/www/xiaonuo;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket支持
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/xiaonuo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL证书配置

### 使用Let's Encrypt（免费）

```bash
# 安装Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 使用商业证书

将证书文件上传到服务器：

```bash
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl

# 上传证书文件
sudo cp your-certificate.pem /etc/nginx/ssl/
sudo cp your-private.key /etc/nginx/ssl/

# 设置权限
sudo chmod 600 /etc/nginx/ssl/*
```

## 微信支付配置

### 1. 申请微信支付商户号

访问 [微信支付商户平台](https://pay.weixin.qq.com/) 申请商户号。

### 2. 下载证书

在商户平台下载API证书：
- apiclient_cert.pem
- apiclient_key.pem

### 3. 配置证书

将证书文件上传到服务器：

```bash
# 创建证书目录
mkdir -p backend/cert

# 上传证书文件
cp apiclient_cert.pem backend/cert/
cp apiclient_key.pem backend/cert/

# 设置权限
chmod 600 backend/cert/*
```

### 4. 配置回调URL

在微信支付商户平台配置支付结果通知URL：
```
https://your-domain.com/api/wechat/notify
```

## 监控与日志

### 查看应用日志

```bash
# Docker部署
docker-compose -f docker-compose.production.yml logs -f backend

# 手动部署
pm2 logs xiaonuo-backend
tail -f backend/server.log
```

### 查看Nginx日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 查看MongoDB日志

```bash
sudo tail -f /var/log/mongodb/mongod.log
```

### 设置日志轮转

创建 `/etc/logrotate.d/xiaonuo`：

```
/var/www/xiaonuo/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        pm2 reload xiaonuo-backend
    endscript
}
```

## 故障排查

### 服务无法启动

1. 检查端口占用
```bash
sudo lsof -i :3001
sudo netstat -tulpn | grep 3001
```

2. 检查环境变量
```bash
cd backend
node -e "console.log(require('dotenv').config())"
```

3. 检查数据库连接
```bash
mongo "mongodb://username:password@localhost:27017/xiaonuo"
```

### API请求失败

1. 检查Nginx配置
```bash
sudo nginx -t
sudo systemctl status nginx
```

2. 检查后端服务状态
```bash
# Docker
docker-compose -f docker-compose.production.yml ps

# PM2
pm2 status
pm2 logs xiaonuo-backend
```

3. 检查防火墙设置
```bash
sudo ufw status
sudo iptables -L
```

### 微信支付失败

1. 检查证书文件
```bash
ls -la backend/cert/
openssl x509 -in backend/cert/apiclient_cert.pem -text -noout
```

2. 检查回调URL
```bash
curl -X POST https://your-domain.com/api/wechat/notify
```

3. 检查商户配置
- 确认商户号、API密钥正确
- 确认支付授权目录配置正确
- 确认JSAPI支付权限已开通

## 更新部署

### Docker部署更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build
```

### 手动部署更新

```bash
# 拉取最新代码
git pull origin main

# 更新后端
cd backend
git pull
pnpm install --production
pm2 reload xiaonuo-backend

# 更新前端
cd ../frontend
git pull
pnpm install
pnpm run build
sudo cp -r dist/* /var/www/xiaonuo/
```

## 安全建议

1. **定期更新依赖**
```bash
pnpm audit
pnpm update
```

2. **配置防火墙**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

3. **定期备份数据**
```bash
# MongoDB备份
mongodump --uri="mongodb://username:password@localhost:27017/xiaonuo" --out=/backup/$(date +%Y%m%d)

# 自动备份脚本
0 2 * * * /usr/bin/mongodump --uri="mongodb://username:password@localhost:27017/xiaonuo" --out=/backup/$(date +\%Y\%m\%d)
```

4. **使用Fail2ban防止暴力破解**
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

如有部署问题，请提交 [Issue](https://github.com/noah-1106/xiaonuo-assistant/issues) 或联系技术支持。
