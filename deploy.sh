#!/bin/bash

# 部署脚本 - 用于将应用部署到不同环境
# 使用方法：bash deploy.sh [--full] [--env=production|staging|development]
# --full: 全量部署，删除旧文件后重新部署
# --env: 指定部署环境，默认为 production

# 配置
PROJECT_ROOT="$(dirname "$0")"
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_KEY="$PROJECT_ROOT/backend/xiaonuoSev1.pem"
SERVER_DIR="/root/xiaonuo"
FRONTEND_DIR="/var/www/xiaonuo"

# 环境配置
ENVIRONMENTS=("production" "staging" "development")
DEFAULT_ENV="production"

# 设置全局SSH配置
SSH_TIMEOUT=10
# 直接使用绝对路径
SSH_KEY_ABS="$(pwd)/backend/xiaonuoSev1.pem"
# 使用简单的格式
SSH_OPTS="-i $SSH_KEY_ABS -o ConnectTimeout=$SSH_TIMEOUT -o BatchMode=yes -o StrictHostKeyChecking=no"

# 解析参数
FULL_DEPLOY=false
DEPLOY_ENV="$DEFAULT_ENV"
REGISTRY="$VOLCENGINE_CR_REGISTRY"
NAMESPACE="$VOLCENGINE_CR_NAMESPACE"

for arg in "$@"
do
    case $arg in
        --full)
            FULL_DEPLOY=true
            ;;
        --env=*)
            DEPLOY_ENV="${arg#*=}"
            ;;
        --registry=*)
            REGISTRY="${arg#*=}"
            ;;
        --namespace=*)
            NAMESPACE="${arg#*=}"
            ;;
        *)
            echo "未知参数: $arg"
            echo "使用方法: bash deploy.sh [--full] [--env=production|staging|development] [--registry=REGISTRY] [--namespace=NAMESPACE]"
            exit 1
            ;;
    esac
done

# 验证环境参数
if [[ ! "${ENVIRONMENTS[*]}" =~ "${DEPLOY_ENV}" ]]; then
    echo "错误: 无效的环境参数 '$DEPLOY_ENV'"
    echo "可用环境: ${ENVIRONMENTS[*]}"
    exit 1
fi

# 环境特定配置
case $DEPLOY_ENV in
    production)
        API_BASE_URL="https://xiaonuo.top/api"
        CORS_ORIGIN="https://xiaonuo.top,http://localhost:5173"
        WECHAT_NOTIFY_URL="https://xiaonuo.top/api/wechat/notify"
        NODE_ENV="production"
        ;;
    staging)
        API_BASE_URL="https://staging.xiaonuo.top/api"
        CORS_ORIGIN="https://staging.xiaonuo.top,http://localhost:5173"
        WECHAT_NOTIFY_URL="https://staging.xiaonuo.top/api/wechat/notify"
        NODE_ENV="staging"
        ;;
    development)
        API_BASE_URL="http://localhost:3001/api"
        CORS_ORIGIN="http://localhost:5173"
        WECHAT_NOTIFY_URL="http://localhost:3001/api/wechat/notify"
        NODE_ENV="development"
        ;;
esac

# 显示开始信息
echo "🚀 开始部署小诺智能助理..."
echo "📋 部署配置:"
echo "   - 环境: $DEPLOY_ENV"
if [ "$FULL_DEPLOY" = true ]; then
    echo "   - 模式: 全量部署"
else
    echo "   - 模式: 增量部署"
fi
echo "   - API地址: $API_BASE_URL"
echo "   - 服务器: $SERVER_USER@$SERVER_IP"
echo "   - 部署目录: $SERVER_DIR"

# 1. 环境变量验证
echo "🔍 验证环境配置..."

# 检查必要的配置文件
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo "⚠️  后端 .env 文件不存在，将使用默认配置"
    cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env" 2>/dev/null || true
fi

# 检查部署密钥
if [ ! -f "$SERVER_KEY" ]; then
    echo "❌ 部署密钥文件不存在: $SERVER_KEY"
    exit 1
fi

# 检查前端目录
if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo "❌ 前端目录不存在: $PROJECT_ROOT/frontend"
    exit 1
fi

# 检查后端目录
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo "❌ 后端目录不存在: $PROJECT_ROOT/backend"
    exit 1
fi

echo "✅ 环境配置验证通过！"

# 2. 如果是全量部署，删除服务器上的旧文件
if [ "$FULL_DEPLOY" == "true" ]; then
    echo "🗑️  删除服务器上的旧文件..."
    ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "rm -rf $SERVER_DIR/backend $SERVER_DIR/frontend $FRONTEND_DIR" 2>/dev/null || true
    if [ $? -ne 0 ]; then
        echo "⚠️  删除旧文件时出现错误，继续执行部署"
    else
        echo "✅ 旧文件删除成功！"
    fi
fi

# 3. 构建前端生产版本
echo "📦 构建前端生产版本..."
# 保存当前目录
ORIGINAL_DIR="$(pwd)"
cd "$PROJECT_ROOT/frontend"

# 创建环境变量文件
echo "VITE_API_BASE_URL=$API_BASE_URL" > .env.production
echo "VITE_NODE_ENV=$NODE_ENV" >> .env.production
echo "VITE_APP_NAME=小诺智能助理"

# 安装前端依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败！"
        exit 1
    fi
    echo "✅ 前端依赖安装成功！"
fi

# 构建前端
env VITE_API_BASE_URL=$API_BASE_URL VITE_NODE_ENV=$NODE_ENV npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败！"
    exit 1
fi
# 回到原始目录
cd "$ORIGINAL_DIR"
echo "✅ 前端构建成功！"

# 4. 上传前端构建文件
echo "📤 上传前端构建文件到服务器..."
# 确保目标目录存在，使用Nginx默认的web目录
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "mkdir -p $FRONTEND_DIR"
# 使用rsync上传前端文件，直接上传构建文件，不创建dist子目录
rsync -avz -e "ssh -i '$PROJECT_ROOT/backend/xiaonuoSev1.pem' -o ConnectTimeout=$SSH_TIMEOUT" "$PROJECT_ROOT/frontend/dist/" "$SERVER_USER@$SERVER_IP:$FRONTEND_DIR/"
if [ $? -ne 0 ]; then
    echo "❌ 前端文件上传失败！"
    exit 1
fi
echo "✅ 前端文件上传成功！"

# 5. 上传后端代码（排除node_modules）
echo "📤 上传后端代码到服务器..."
# 确保后端目录存在
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "mkdir -p $SERVER_DIR/backend"

# 准备后端环境变量文件
BACKEND_ENV_FILE="$PROJECT_ROOT/backend/.env.$DEPLOY_ENV"
if [ -f "$BACKEND_ENV_FILE" ]; then
    echo "📄 使用环境特定的后端配置文件: $BACKEND_ENV_FILE"
    rsync -avz -e "ssh -i '$PROJECT_ROOT/backend/xiaonuoSev1.pem' -o ConnectTimeout=$SSH_TIMEOUT" "$BACKEND_ENV_FILE" "$SERVER_USER@$SERVER_IP:$SERVER_DIR/backend/.env"
else
    echo "📄 使用默认后端配置文件"
    rsync -avz -e "ssh -i '$PROJECT_ROOT/backend/xiaonuoSev1.pem' -o ConnectTimeout=$SSH_TIMEOUT" "$PROJECT_ROOT/backend/.env" "$SERVER_USER@$SERVER_IP:$SERVER_DIR/backend/.env" 2>/dev/null || true
    
    # 上传示例配置文件作为备用
    rsync -avz -e "ssh -i '$PROJECT_ROOT/backend/xiaonuoSev1.pem' -o ConnectTimeout=$SSH_TIMEOUT" "$PROJECT_ROOT/backend/.env.example" "$SERVER_USER@$SERVER_IP:$SERVER_DIR/backend/.env.example" 2>/dev/null || true
fi

# 上传后端代码
tar --exclude='node_modules' --exclude='.env' --exclude='.env.*' -czf - -C "$PROJECT_ROOT/backend" . | ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR/backend && tar -xzf -"
if [ $? -ne 0 ]; then
    echo "❌ 后端代码上传失败！"
    exit 1
fi
echo "✅ 后端代码上传成功！"

# 6. 更新后端环境变量
echo "🔧 更新后端环境变量..."
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" << EOF
# 更新环境变量文件
cd $SERVER_DIR/backend

# 确保环境变量文件存在
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

# 更新关键环境变量
sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$CORS_ORIGIN|g" .env
sed -i "s|^WECHAT_NOTIFY_URL=.*|WECHAT_NOTIFY_URL=$WECHAT_NOTIFY_URL|g" .env
sed -i "s|^NODE_ENV=.*|NODE_ENV=$NODE_ENV|g" .env
sed -i 's|^JWT_SECRET=.*|JWT_SECRET=xiaonuo_jwt_secret_key_2026|g' .env

# 数据库配置管理
# 检查是否存在MONGO_URI，如果存在则使用它，不再覆盖其他数据库配置
if grep -q "^MONGO_URI=" .env; then
    echo "✅ 检测到MONGO_URI，使用完整连接字符串配置"
else
    echo "📋 配置数据库连接参数"
    # 只有在MONGO_URI不存在时才设置分散的数据库配置
    sed -i 's|^DB_HOST=.*|DB_HOST=mongoreplicab95890613e560.mongodb.cn-beijing.ivolces.com,mongoreplicab95890613e561.mongodb.cn-beijing.ivolces.com,mongoreplicab95890613e562.mongodb.cn-beijing.ivolces.com|g' .env
    sed -i 's|^DB_PORT=.*|DB_PORT=3717|g' .env
    sed -i 's|^DB_NAME=.*|DB_NAME=xiaonuo-mongodb|g' .env
    sed -i 's|^DB_USER=.*|DB_USER=root|g' .env
    sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=Xn2026_MongoDB|g' .env
    
    # 添加MONGO_URI作为完整连接字符串
    echo "MONGO_URI=mongodb://root:Xn2026_MongoDB@mongoreplicab95890613e560.mongodb.cn-beijing.ivolces.com:3717,mongoreplicab95890613e561.mongodb.cn-beijing.ivolces.com:3717/xiaonuo-mongodb?authSource=admin&replicaSet=rs-mongo-replica-b95890613e56&retryWrites=true" >> .env
    echo "✅ MONGO_URI已配置"
fi

# 更新ARK_API_KEY
if ! grep -q "^ARK_API_KEY=" .env; then
    echo "ARK_API_KEY=0a209a91-9cfe-46bc-a138-2090f3658523" >> .env
    echo "✅ ARK_API_KEY已配置"
else
    sed -i 's|^ARK_API_KEY=.*|ARK_API_KEY=0a209a91-9cfe-46bc-a138-2090f3658523|g' .env
    echo "✅ ARK_API_KEY已更新"
fi

# 确保JWT_SECRET存在
if ! grep -q "^JWT_SECRET=" .env; then
    echo "JWT_SECRET=xiaonuo_jwt_secret_key_2026" >> .env
    echo "✅ JWT_SECRET已配置"
else
    echo "✅ JWT_SECRET已配置"
fi

# 更新TOS配置
if ! grep -q "^TOS_ACCESS_KEY_ID=" .env; then
    echo "TOS_ENDPOINT=https://tos-cn-beijing.volces.com" >> .env
    echo "TOS_ACCESS_KEY_ID=YOUR_TOS_ACCESS_KEY_ID" >> .env
    echo "TOS_ACCESS_KEY_SECRET=TnpVMk5XTTVObVUyTmpOaE5HWmhNamxrWmpJeE9XSXpZakl5TXpnMU1UWQ==" >> .env
    echo "TOS_BUCKET=xiaonuotos1" >> .env
    echo "TOS_REGION=cn-beijing" >> .env
    echo "✅ TOS配置已添加"
else
    sed -i 's|^TOS_ACCESS_KEY_ID=.*|TOS_ACCESS_KEY_ID=YOUR_TOS_ACCESS_KEY_ID|g' .env
    sed -i 's|^TOS_ACCESS_KEY_SECRET=.*|TOS_ACCESS_KEY_SECRET=TnpVMk5XTTVObVUyTmpOaE5HWmhNamxrWmpJeE9XSXpZakl5TXpnMU1UWQ==|g' .env
    sed -i 's|^TOS_BUCKET=.*|TOS_BUCKET=xiaonuotos1|g' .env
    echo "✅ TOS配置已更新"
fi

# 显示更新后的配置
echo "📋 后端环境变量配置:"
grep -E 'CORS_ORIGIN|WECHAT_NOTIFY_URL|NODE_ENV|DB_HOST|DB_PORT|DB_NAME|DB_USER|ARK_API_KEY|TOS_ACCESS_KEY_ID' .env
EOF

if [ $? -ne 0 ]; then
    echo "⚠️  更新后端环境变量时出现错误，继续执行部署"
else
    echo "✅ 后端环境变量更新成功！"
fi

# 7. 安装后端依赖
echo "🔍 安装后端依赖..."
# 生产环境只安装生产依赖，忽略版本冲突和脚本执行
ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR/backend && npm install --omit=dev --legacy-peer-deps --ignore-scripts"
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败！"
    exit 1
fi
echo "✅ 后端依赖安装成功！"

# 8. 重启后端服务
echo "🔄 重启后端服务..."
# 使用更可靠的方式启动服务
echo "🚀 启动后端服务..."
# 直接在服务器上执行完整的启动脚本

# 使用单次SSH连接执行所有后端服务相关命令
echo "执行后端服务重启命令..."
# 直接使用硬编码的路径
ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'EOF'
# 终止现有进程
pkill -f 'node src/index.js' 2>/dev/null || true
# 清理旧日志
rm -f server.log 2>/dev/null || true
# 启动新服务
cd /root/xiaonuo/backend
nohup node src/index.js > server.log 2>&1 &
# 保存PID
echo $! > server.pid
# 等待服务启动
sleep 3
# 检查服务状态
ps aux | grep 'node src/index.js' | grep -v grep
# 检查日志输出
head -n 10 server.log
EOF

# 设置全局SSH超时变量
SSH_OPTS="-i '$SERVER_KEY' -o ConnectTimeout=$SSH_TIMEOUT -o BatchMode=yes -o StrictHostKeyChecking=no"

# 直接检查服务状态，不依赖PID文件
echo "🔍 验证服务是否正在运行..."
SERVICE_RUNNING=$(ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "ps aux | grep 'node src/index.js' | grep -v grep | wc -l" 2>/dev/null || echo 0)

if [ "$SERVICE_RUNNING" -gt 0 ]; then
    # 获取实际PID
    SERVER_PID=$(ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "ps aux | grep 'node src/index.js' | grep -v grep | head -n 1 | awk '{print \$2}'" 2>/dev/null || echo "未知")
    echo "✅ 后端服务重启成功！PID: $SERVER_PID"
    echo "✅ 后端服务运行正常！"
else
    echo "❌ 后端服务未成功启动！"
    # 检查服务日志
    ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR/backend && tail -n 30 server.log 2>/dev/null || echo '无日志文件'" 2>/dev/null || echo "无法获取日志"
    echo "⚠️  继续执行部署，跳过后端服务启动验证..."
fi

# 9. 确保Nginx用户有权访问前端文件
echo "🔄 确保Nginx用户有权访问前端文件..."
# 直接使用绝对路径
ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "chown -R nginx:nginx $FRONTEND_DIR"
if [ $? -ne 0 ]; then
    echo "❌ 设置文件权限失败！"
    exit 1
fi
echo "✅ 文件权限设置成功！"

# 10. 部署Nginx配置文件
echo "🔧 部署Nginx配置文件..."
# 检查Nginx配置文件是否存在
if [ ! -f "$PROJECT_ROOT/nginx_production.conf" ]; then
    echo "⚠️  Nginx配置文件不存在，将使用默认配置"
else
    # 备份当前Nginx配置
    ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak.$(date +%Y%m%d%H%M%S) 2>/dev/null || true"
    # 上传Nginx配置文件
    scp -i "$(pwd)/backend/xiaonuoSev1.pem" "$PROJECT_ROOT/nginx_production.conf" "$SERVER_USER@$SERVER_IP:/etc/nginx/nginx.conf"
    if [ $? -eq 0 ]; then
        echo "✅ Nginx配置文件上传成功！"
        # 验证Nginx配置语法
        ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "nginx -t"
        if [ $? -ne 0 ]; then
            echo "❌ Nginx配置语法错误！回滚到备份配置..."
            ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cp /etc/nginx/nginx.conf.bak.* /etc/nginx/nginx.conf 2>/dev/null || true"
        else
            echo "✅ Nginx配置语法验证通过！"
        fi
    else
        echo "⚠️  Nginx配置文件上传失败，使用现有配置"
    fi
fi

# 11. 重启Nginx服务
echo "🔄 重启Nginx服务..."
# 直接使用绝对路径
ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "systemctl restart nginx"
if [ $? -ne 0 ]; then
    echo "❌ Nginx服务重启失败！"
    # 尝试回滚配置并重启
    ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "cp /etc/nginx/nginx.conf.bak.* /etc/nginx/nginx.conf 2>/dev/null || true"
    ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "systemctl restart nginx 2>/dev/null || true"
    exit 1
fi
echo "✅ Nginx服务重启成功！"

# 12. 检查后端服务状态
echo "🔍 检查后端服务状态..."
# 增加等待时间，确保服务有足够时间启动
SLEEP_TIME=2
MAX_RETRIES=10  # 大约 60 秒超时
RETRY_COUNT=0
HEALTH_STATUS=000
TIMEOUT=60
START_TIME=$(date +%s)

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    CURRENT_TIME=$(date +%s)
    ELAPSED_TIME=$((CURRENT_TIME - START_TIME))
    
    if [ $ELAPSED_TIME -ge $TIMEOUT ]; then
        echo "⏰ 后端服务重启超时（${ELAPSED_TIME}秒），继续进行后续部署..."
        break
    fi
    
    sleep $SLEEP_TIME
    
    # 执行健康检查并获取详细输出
    HEALTH_RESPONSE=$(ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "curl -s -w '%{http_code}' http://localhost:3001/api/health 2>&1" 2>/dev/null || echo "连接失败000")
    HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n 1)
    # 修复head命令错误
    HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')
    
    if [ "$HEALTH_STATUS" = "200" ]; then
        echo "✅ 健康检查通过！状态码: $HEALTH_STATUS"
        echo "   响应: $HEALTH_BODY"
        break
    fi
    
    echo "⏳ 健康检查失败，状态码: $HEALTH_STATUS，正在重试... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
    echo "   响应: $HEALTH_BODY"
    RETRY_COUNT=$((RETRY_COUNT+1))
    SLEEP_TIME=$((SLEEP_TIME+1))  # 线性增加等待时间
    
    # 检查服务是否正在运行
    ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "ps aux | grep 'node src/index.js' | grep -v grep > /dev/null 2>&1" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ 后端服务进程未运行！"
        # 检查服务日志
        ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR/backend && tail -n 30 server.log 2>/dev/null || echo '无日志文件'" 2>/dev/null || echo "无法获取日志"
        echo "⚠️  服务进程未运行，但继续进行后续部署..."
        break
    fi
    
    # 每两次重试检查一次服务日志
    if [ $((RETRY_COUNT % 3)) -eq 0 ]; then
        echo "📋 检查服务日志..."
        ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "cd $SERVER_DIR/backend && tail -n 15 server.log 2>/dev/null || echo '无日志文件'" 2>/dev/null || echo "无法获取日志"
    fi
done

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ 后端服务运行正常！健康检查通过！"
else
    echo "⚠️  后端服务健康检查未通过，但继续进行后续部署..."
    echo "   最终状态码: $HEALTH_STATUS"
fi

# 13. 检查Nginx服务状态
echo "🔍 检查Nginx服务状态..."
# 直接使用绝对路径
NGINX_STATUS=$(ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "systemctl is-active nginx 2>/dev/null || echo 'inactive'" 2>/dev/null || echo 'inactive')
if [ "$NGINX_STATUS" != "active" ]; then
    echo "❌ Nginx服务未运行！"
    # 尝试重启Nginx
    ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "systemctl restart nginx 2>/dev/null || true"
    sleep 2
    # 再次检查
    NGINX_STATUS=$(ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "systemctl is-active nginx 2>/dev/null || echo 'inactive'" 2>/dev/null || echo 'inactive')
    if [ "$NGINX_STATUS" != "active" ]; then
        echo "⚠️  Nginx服务仍未运行，但继续进行后续部署..."
    else
        echo "✅ Nginx服务重启成功！"
    fi
else
    echo "✅ Nginx服务运行正常！"
fi

# 14. 检查前端文件是否正确部署
echo "🔍 检查前端文件是否正确部署..."
# 直接使用绝对路径
ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "ls -la $FRONTEND_DIR > /dev/null 2>&1" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 前端文件部署失败！"
    exit 1
fi
echo "✅ 前端文件部署成功！"

# 15. 环境变量验证
echo "🔍 验证环境变量配置..."
# 直接使用绝对路径
ssh -i "$(pwd)/backend/xiaonuoSev1.pem" -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" << 'EOF'
# 验证后端环境变量
cd /root/xiaonuo/backend

echo "📋 后端环境变量验证:"
grep -E 'CORS_ORIGIN|WECHAT_NOTIFY_URL|NODE_ENV' .env 2>/dev/null || echo "无相关环境变量"

# 验证前端环境变量（通过检查构建文件）
echo "📋 前端环境变量验证:"
cd /var/www/xiaonuo
if [ -f index.html ]; then
    echo "✅ 前端构建文件存在"
    # 检查是否包含API地址配置
    grep -q "VITE_API_BASE_URL" index.html && echo "✅ 前端API地址配置正确" || echo "⚠️  前端API地址配置可能不正确"
fi
EOF

if [ $? -ne 0 ]; then
    echo "⚠️  环境变量验证时出现错误，继续执行部署"
else
    echo "✅ 环境变量配置验证完成！"
fi

# 15. 显示部署完成信息
echo "🎉 部署完成！"
echo "📌 部署环境: $DEPLOY_ENV"
echo "📌 访问地址: ${API_BASE_URL%/api}"
echo "📌 后端服务: http://localhost:3001"
echo "📌 API地址: $API_BASE_URL"
echo "📌 管理地址: ${API_BASE_URL%/api}"
echo ""
echo "🔧 部署详情:"
echo "   - 前端版本: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   - 后端版本: $(date '+%Y-%m-%d %H:%M:%S')"
echo "   - 环境配置: $DEPLOY_ENV"
echo ""
echo "📋 后续步骤建议:"
echo "   1. 访问应用地址验证部署结果"
echo "   2. 检查日志文件确保服务正常运行"
echo "   3. 测试核心功能确保所有功能正常"
echo "   4. 定期备份环境变量配置文件"
