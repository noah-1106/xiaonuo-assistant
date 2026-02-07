#!/bin/bash

# 生产服务器检查服务状态脚本
echo "📦 准备检查生产服务器服务状态..."

# 配置信息（从deploy.sh获取）
PROJECT_ROOT="$(dirname "$0")"
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"
FRONTEND_DIR="/var/www/xiaonuo"

# 检查后端服务
echo "🔍 检查后端服务状态..."

# 检查后端服务进程
BACKEND_PROCESS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ps aux | grep 'node src/index.js' | grep -v grep")
if [ -n "$BACKEND_PROCESS" ]; then
  echo "✅ 后端服务进程正在运行"
  echo "📋 后端进程信息:"
  echo "$BACKEND_PROCESS"
else
  echo "❌ 后端服务进程未运行"
fi

# 检查后端服务健康状态
echo "🔍 检查后端服务健康状态..."
HEALTH_STATUS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health 2>/dev/null")
if [ "$HEALTH_STATUS" -eq 200 ]; then
  echo "✅ 后端服务健康检查通过，状态码: $HEALTH_STATUS"
else
  echo "❌ 后端服务健康检查失败，状态码: $HEALTH_STATUS"
  # 检查后端服务日志
  echo "📋 后端服务日志:"
  ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && tail -n 20 server.log 2>/dev/null || echo '无日志文件'"
fi

# 检查前端服务
echo "🔍 检查前端服务状态..."

# 检查Nginx服务
NGINX_STATUS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "systemctl is-active nginx 2>/dev/null")
if [ "$NGINX_STATUS" == "active" ]; then
  echo "✅ Nginx服务正在运行"
else
  echo "❌ Nginx服务未运行，状态: $NGINX_STATUS"
fi

# 检查前端页面
FRONTEND_STATUS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "curl -s -o /dev/null -w '%{http_code}' http://localhost 2>/dev/null")
if [ "$FRONTEND_STATUS" -eq 200 ]; then
  echo "✅ 前端页面访问正常，状态码: $FRONTEND_STATUS"
else
  echo "❌ 前端页面访问失败，状态码: $FRONTEND_STATUS"
  # 检查前端文件
  echo "📋 前端文件状态:"
  ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ls -la $FRONTEND_DIR 2>/dev/null || echo '前端目录不存在'"
fi

# 检查前端文件是否存在
echo "🔍 检查前端文件是否存在..."
FRONTEND_FILES=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ls -la $FRONTEND_DIR/index.html 2>/dev/null")
if [ -n "$FRONTEND_FILES" ]; then
  echo "✅ 前端文件存在"
  echo "📋 前端文件信息:"
  echo "$FRONTEND_FILES"
else
  echo "❌ 前端文件不存在"
fi

# 总结
echo "\n📊 服务状态检查总结:"
if [ -n "$BACKEND_PROCESS" ] && [ "$HEALTH_STATUS" -eq 200 ] && [ "$NGINX_STATUS" == "active" ] && [ "$FRONTEND_STATUS" -eq 200 ]; then
  echo "🎉 所有服务运行正常！"
  echo "✅ 后端服务: 运行中"
  echo "✅ 前端服务: 运行中"
  echo "📌 访问地址: https://$SERVER_IP"
else
  echo "⚠️  部分服务可能存在问题"
  echo "📋 后端服务状态: $(if [ -n "$BACKEND_PROCESS" ] && [ "$HEALTH_STATUS" -eq 200 ]; then echo '✅ 正常'; else echo '❌ 异常'; fi)"
  echo "📋 前端服务状态: $(if [ "$NGINX_STATUS" == "active" ] && [ "$FRONTEND_STATUS" -eq 200 ]; then echo '✅ 正常'; else echo '❌ 异常'; fi)"
fi
