# 域名切换指南

当正式域名 `xiaonuo.top` 备案完成后，按照以下步骤从临时域名 `xiaonuo.ntsite.net` 切换到正式域名。

## 切换步骤

### 1. 修改前端配置

编辑前端环境配置文件，将API地址从临时域名切换到正式域名：

```bash
# 编辑前端环境配置
cd frontend
vi .env
```

修改以下内容：

```
# 开发环境配置
VITE_API_BASE_URL=http://localhost:3001/api

# 生产环境配置（部署时使用）
VITE_API_BASE_URL=https://xiaonuo.top/api  # 切换到正式域名
```

### 2. 修改部署脚本

编辑部署脚本，将临时域名替换为正式域名：

```bash
vi deploy.sh
```

修改以下内容：

```bash
# 临时切换到生产环境配置（使用实际临时域名）
TEMP_DOMAIN="https://xiaonuo.top/api"  # 切换到正式域名
```

### 3. 更新Nginx配置

确保Nginx配置中优先使用正式域名：

```bash
ssh -i backend/xiaonuoSev1.pem root@115.191.33.228 'cat > /etc/nginx/conf.d/xiaonuo.conf <<EOF
server {
    listen 443 ssl;
    server_name xiaonuo.top www.xiaonuo.top xiaonuo.ntsite.net;
    
    ssl_certificate /etc/nginx/ssl/xiaonuo.top.pem;
    ssl_certificate_key /etc/nginx/ssl/xiaonuo.top.key;
    
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name xiaonuo.top www.xiaonuo.top xiaonuo.ntsite.net;
    return 301 https://$server_name$request_uri;
}
EOF

nginx -t && systemctl restart nginx'
```

### 4. 运行部署脚本

执行部署脚本，将更新后的代码部署到生产服务器：

```bash
./deploy.sh
```

### 5. 验证切换结果

访问以下地址验证切换是否成功：

- 正式域名：`https://xiaonuo.top`
- 临时域名（应该仍然可以访问）：`https://xiaonuo.ntsite.net`

## 完全移除临时域名（可选）

如果需要完全移除临时域名支持，可以执行以下步骤：

### 1. 更新Nginx配置

移除临时域名：

```bash
ssh -i backend/xiaonuoSev1.pem root@115.191.33.228 'cat > /etc/nginx/conf.d/xiaonuo.conf <<EOF
server {
    listen 443 ssl;
    server_name xiaonuo.top www.xiaonuo.top;
    
    ssl_certificate /etc/nginx/ssl/xiaonuo.top.pem;
    ssl_certificate_key /etc/nginx/ssl/xiaonuo.top.key;
    
    ssl_session_timeout 5m;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name xiaonuo.top www.xiaonuo.top;
    return 301 https://$server_name$request_uri;
}
EOF

nginx -t && systemctl restart nginx'
```

### 2. 更新后端CORS配置

移除临时域名的CORS支持：

```bash
vi backend/.env
```

修改以下内容：

```
# CORS配置
# 生产环境：允许域名访问
CORS_ORIGIN=https://xiaonuo.top,https://www.xiaonuo.top
```

### 3. 重启后端服务

```bash
ssh -i backend/xiaonuoSev1.pem root@115.191.33.228 'pkill -f "node src/index.js" && cd /root/xiaonuo/backend && npm start > /dev/null 2>&1 &'
```

## 验证

完成切换后，通过以下方式验证：

1. 访问正式域名 `https://xiaonuo.top`，确认网站正常访问
2. 检查浏览器控制台，确认API请求使用的是正式域名
3. 验证各项功能（登录、聊天、记录等）是否正常

## 注意事项

- 切换过程中可能会有短暂的服务中断
- 建议在低峰时段进行切换
- 切换前确保正式域名已正确解析到服务器IP
- 切换后监控网站访问情况，确保一切正常

---

**切换完成！** 您的网站现在已使用正式域名 `xiaonuo.top` 提供服务。