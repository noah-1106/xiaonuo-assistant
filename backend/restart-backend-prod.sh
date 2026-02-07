#!/bin/bash

# 生产服务器重启后端服务脚本
echo "🚀 准备在生产服务器重启后端服务..."

# 配置信息（从deploy.sh获取）
PROJECT_ROOT="$(dirname "$0")/.."
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"

# 登录生产服务器并重启后端服务
echo "🔄 在生产服务器重启后端服务..."

# 终止现有进程
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "pkill -f 'node src/index.js' 2>/dev/null || true"
echo "✅ 已终止现有进程"

# 启动新进程
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && nohup node src/index.js > server.log 2>&1 &"
echo "✅ 已启动新进程"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 验证服务是否正在运行
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ps aux | grep 'node src/index.js' | grep -v grep > /dev/null 2>&1"
if [ $? -eq 0 ]; then
  echo "✅ 后端服务重启成功！"
else
  echo "❌ 后端服务未成功启动！"
  # 检查日志文件
  ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && cat server.log 2>/dev/null || echo '无日志文件'"
  exit 1
fi

# 检查服务状态
echo "🔍 检查后端服务状态..."
HEALTH_STATUS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health 2>/dev/null")
if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "✅ 后端服务运行正常！"
  echo "✅ 可以创建套餐了！"
else
  echo "❌ 后端服务健康检查失败！状态码: $HEALTH_STATUS"
  # 检查日志文件
  ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && tail -n 20 server.log 2>/dev/null || echo '无日志文件'"
  exit 1
fi

echo "🎉 后端服务重启完成！"
echo "📌 现在可以使用admin_new2账号创建套餐了"
echo "📌 用户名: admin_new2"
echo "📌 密码: admin123"
