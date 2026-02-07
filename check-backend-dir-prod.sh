#!/bin/bash

# 检查生产服务器后端目录脚本
echo "🔍 准备检查生产服务器后端目录..."

# 配置信息
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$(dirname "$0")/backend/xiaonuoSev1.pem"

# 检查后端目录
echo "📁 检查后端目录是否存在..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ls -la /root/xiaonuo/backend/ 2>/dev/null || echo '后端目录不存在'"

# 检查src目录
echo "📁 检查src目录是否存在..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ls -la /root/xiaonuo/backend/src/ 2>/dev/null || echo 'src目录不存在'"

# 检查index.js文件
echo "📄 检查index.js文件是否存在..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ls -la /root/xiaonuo/backend/src/index.js 2>/dev/null || echo 'index.js文件不存在'"

# 检查package.json文件
echo "📄 检查package.json文件是否存在..."
ssh -i "$SERVER_KEY" "$SERVER_USER@$SERVER_IP" "ls -la /root/xiaonuo/backend/package.json 2>/dev/null || echo 'package.json文件不存在'"
