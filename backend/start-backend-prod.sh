#!/bin/bash

# 生产服务器启动后端服务脚本
echo "🚀 准备启动生产服务器后端服务..."

# 配置信息
PROJECT_ROOT="$(dirname "$0")/.."
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo/backend"

# 停止现有进程
echo "🔄 停止现有后端进程..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "pkill -f 'node src/index.js' 2>/dev/null || true"

# 清理日志文件
echo "🧹 清理日志文件..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && echo '' > server.log"

# 检查Node.js版本
echo "🔍 检查Node.js版本..."
NODE_VERSION=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "node -v 2>/dev/null || echo 'Node.js未安装'")
echo "Node.js版本: $NODE_VERSION"

# 检查npm版本
echo "🔍 检查npm版本..."
NPM_VERSION=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "npm -v 2>/dev/null || echo 'npm未安装'")
echo "npm版本: $NPM_VERSION"

# 启动后端服务
echo "🚀 启动后端服务..."
echo "📋 启动命令: node src/index.js"

# 启动服务并捕获输出
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && nohup node src/index.js > server.log 2>&1 &"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查进程状态
echo "🔍 检查后端进程状态..."
BACKEND_PROCESS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ps aux | grep 'node src/index.js' | grep -v grep")
if [ -n "$BACKEND_PROCESS" ]; then
  echo "✅ 后端服务进程正在运行"
  echo "📋 后端进程信息:"
  echo "$BACKEND_PROCESS"
else
  echo "❌ 后端服务进程未运行"
  echo "📋 错误日志:"
  ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR && cat server.log"
fi

# 检查服务是否响应
echo "🔍 检查后端服务响应..."
RESPONSE=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "curl -s http://localhost:3001/api/health 2>/dev/null || echo '无响应'")
if [ -n "$RESPONSE" ]; then
  echo "✅ 后端服务响应:"
  echo "$RESPONSE"
else
  echo "❌ 后端服务无响应"
fi

# 检查端口占用
echo "🔍 检查端口3001占用情况..."
PORT_STATUS=$(ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "lsof -i :3001 2>/dev/null || echo '端口未被占用'")
echo "$PORT_STATUS"
