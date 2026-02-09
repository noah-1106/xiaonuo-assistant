#!/bin/bash

# 部署脚本 - 从火山引擎容器镜像服务直接部署
# 使用方法：bash deploy-volcegine.sh

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 服务器配置
SERVER_IP="115.191.33.228"
SERVER_USER="root"
SERVER_DIR="/root/xiaonuo"

# 镜像配置
REGISTRY="xiaonuo-cn-beijing.cr.volces.com"
FRONTEND_IMAGE="${REGISTRY}/xiaonuo/frontend:latest"
BACKEND_IMAGE="${REGISTRY}/xiaonuo/backend:latest"

# SSH配置
SSH_KEY="$(pwd)/backend/xiaonuoSev1.pem"
SSH_TIMEOUT=10
SSH_OPTS="-i $SSH_KEY -o ConnectTimeout=$SSH_TIMEOUT -o BatchMode=yes -o StrictHostKeyChecking=no"

# 执行命令并检查结果
exec_ssh() {
    local command="$1"
    local description="$2"
    local continue_on_error="$3"
    
    log_info "$description"
    
    # 执行SSH命令
    ssh $SSH_OPTS "$SERVER_USER@$SERVER_IP" "$command"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "$description 成功"
        return 0
    else
        log_error "$description 失败 (退出码: $exit_code)"
        if [ "$continue_on_error" != "true" ]; then
            log_error "部署流程终止"
            exit $exit_code
        fi
        log_warning "继续执行部署流程"
        return 1
    fi
}

# 主部署流程
main() {
    log_info "===================================="
    log_info "开始从火山引擎镜像仓库部署小诺智能助理"
    log_info "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "===================================="
    
    # 1. 检查服务器状态
    log_info "\n1. 检查服务器状态"
    exec_ssh "uname -a" "检查服务器系统信息"
    exec_ssh "docker --version" "检查Docker版本"
    exec_ssh "docker-compose --version" "检查Docker Compose版本"
    
    # 2. 准备部署目录
    log_info "\n2. 准备部署目录"
    exec_ssh "mkdir -p $SERVER_DIR" "创建部署目录"
    
    # 3. 创建Docker Compose配置文件
    log_info "\n3. 创建Docker Compose配置文件"
    
    # 生成docker-compose.yml文件
    cat > docker-compose.yml.tmp << 'EOF'
version: '3.8'

# 服务配置
services:
  # 前端服务
  frontend:
    image: xiaonuo-cn-beijing.cr.volces.com/xiaonuo/frontend:latest
    ports:
      - "80:80"
    restart: always
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # 后端服务
  backend:
    image: xiaonuo-cn-beijing.cr.volces.com/xiaonuo/backend:latest
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - HOST=0.0.0.0
      - NODE_ENV=production
      - DB_HOST=mongoreplicab95890613e560.mongodb.cn-beijing.ivolces.com,mongoreplicab95890613e561.mongodb.cn-beijing.ivolces.com,mongoreplicab95890613e562.mongodb.cn-beijing.ivolces.com
      - DB_PORT=3717
      - DB_NAME=xiaonuo-mongodb
      - DB_USER=root
      - DB_PASSWORD=Xn2026_MongoDB
      - MONGO_URI=mongodb://root:Xn2026_MongoDB@mongoreplicab95890613e560.mongodb.cn-beijing.ivolces.com:3717,mongoreplicab95890613e561.mongodb.cn-beijing.ivolces.com:3717/xiaonuo-mongodb?authSource=admin&replicaSet=rs-mongo-replica-b95890613e56&retryWrites=true
      - JWT_SECRET=xiaonuo_jwt_secret_key_2026
      - JWT_EXPIRES_IN=7d
      - CORS_ORIGIN=https://xiaonuo.top,http://localhost:5173
      - ARK_API_KEY=0a209a91-9cfe-46bc-a138-2090f3658523
      - AI_MODEL=doubao-seed-1-8-251228
      - TOS_ACCESS_KEY_ID=YOUR_TOS_ACCESS_KEY_ID
      - TOS_ACCESS_KEY_SECRET=TnpVMk5XTTVObVUyTmpOaE5HWmhNamxrWmpJeE9XSXpZakl5TXpnMU1UWQ==
      - TOS_BUCKET=xiaonuotos1
      - WECHAT_APPID=wx539922c487ccc916
      - WECHAT_MCHID=1698261141
      - WECHAT_API_KEY=15987idnjejgityjviuehjnmhkoce54d
      - WECHAT_NOTIFY_URL=https://xiaonuo.top/api/wechat/notify
      - WECHAT_SANDBOX=true
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
EOF
    
    # 上传docker-compose.yml文件
    scp -i "$SSH_KEY" docker-compose.yml.tmp "$SERVER_USER@$SERVER_IP:$SERVER_DIR/docker-compose.yml"
    if [ $? -eq 0 ]; then
        log_success "Docker Compose配置文件上传成功"
    else
        log_error "Docker Compose配置文件上传失败"
        exit 1
    fi
    
    # 清理临时文件
    rm -f docker-compose.yml.tmp
    
    # 4. 登录火山引擎容器镜像服务（如果需要）
    log_info "\n4. 登录火山引擎容器镜像服务"
    # 注意：如果服务器已经配置了访问权限，可以跳过这一步
    # 这里我们假设服务器已经配置了访问权限
    log_info "跳过登录步骤（假设服务器已配置访问权限）"
    
    # 5. 拉取最新镜像
    log_info "\n5. 拉取最新镜像"
    exec_ssh "cd $SERVER_DIR && docker pull $FRONTEND_IMAGE" "拉取前端镜像"
    exec_ssh "cd $SERVER_DIR && docker pull $BACKEND_IMAGE" "拉取后端镜像"
    
    # 6. 停止并移除旧容器
    log_info "\n6. 停止并移除旧容器"
    exec_ssh "cd $SERVER_DIR && docker-compose down" "停止并移除旧容器" "true"
    
    # 7. 启动新服务
    log_info "\n7. 启动新服务"
    exec_ssh "cd $SERVER_DIR && docker-compose up -d" "启动新服务"
    
    # 8. 验证服务状态
    log_info "\n8. 验证服务状态"
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查容器状态
    exec_ssh "docker ps" "检查容器状态"
    
    # 检查前端服务
    log_info "\n9. 检查前端服务"
    exec_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost" "检查前端服务响应" "true"
    
    # 检查后端服务
    log_info "\n10. 检查后端服务"
    exec_ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health" "检查后端服务健康状态" "true"
    
    # 11. 显示部署完成信息
    log_info "\n===================================="
    log_success "部署完成！"
    log_success "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_success "===================================="
    log_success "前端服务: http://$SERVER_IP"
    log_success "后端服务: http://$SERVER_IP:3001"
    log_success "健康检查: http://$SERVER_IP:3001/api/health"
    log_success "===================================="
    log_info "\n后续步骤建议:"
    log_info "1. 访问应用地址验证部署结果"
    log_info "2. 检查容器日志确保服务正常运行"
    log_info "3. 测试核心功能确保所有功能正常"
}

# 执行主流程
main
