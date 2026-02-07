#!/bin/bash

# 简单版生产服务器重启后端服务脚本
echo "🚀 准备重启生产服务器后端服务..."

# 配置信息
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$(dirname "$0")/xiaonuoSev1.pem"

# 重启后端服务
echo "🔄 重启后端服务..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "pkill -f 'node src/index.js' 2>/dev/null || true && cd /root/xiaonuo/backend && nohup node src/index.js > server.log 2>&1 &"

if [ $? -eq 0 ]; then
  echo "✅ 后端服务重启命令执行成功！"
  echo "⏳ 服务正在启动..."
  echo "📌 请等待3-5秒后尝试创建套餐"
  echo "✅ 现在可以使用admin_new2账号创建套餐了"
  echo "📌 用户名: admin_new2"
  echo "📌 密码: admin123"
else
  echo "❌ 重启后端服务失败！"
fi
