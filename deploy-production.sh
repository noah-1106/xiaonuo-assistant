#!/bin/bash

# 打印执行信息
set -x

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

# 设置默认值
VOLCENGINE_CR_REGISTRY=${VOLCENGINE_CR_REGISTRY:-"xiaonuo-cn-beijing.cr.volces.com"}
DATETIME=${DATETIME:-"latest"}

# 显示当前环境变量状态
log_info "当前环境变量状态："
log_info "VOLCENGINE_CR_REGISTRY: $VOLCENGINE_CR_REGISTRY"
log_info "DATETIME: $DATETIME"
log_info "VOLCENGINE_CR_ACCESS_KEY 设置: ${VOLCENGINE_CR_ACCESS_KEY:+是}${VOLCENGINE_CR_ACCESS_KEY:-否}"
log_info "VOLCENGINE_CR_SECRET_KEY 设置: ${VOLCENGINE_CR_SECRET_KEY:+是}${VOLCENGINE_CR_SECRET_KEY:-否}"

# 检查变量是否存在
if [ -z "${VOLCENGINE_CR_ACCESS_KEY}" ] || [ -z "${VOLCENGINE_CR_SECRET_KEY}" ]; then
  log_error "错误：必要变量未设置"
  log_error "请在持续交付配置中设置以下环境变量："
  log_error "- VOLCENGINE_CR_ACCESS_KEY: 容器镜像服务访问密钥"
  log_error "- VOLCENGINE_CR_SECRET_KEY: 容器镜像服务密钥密码"
  exit 1
fi

# 登录镜像仓库
log_info "登录镜像仓库: $VOLCENGINE_CR_REGISTRY"
echo "${VOLCENGINE_CR_SECRET_KEY}" | docker login "${VOLCENGINE_CR_REGISTRY}" -u "${VOLCENGINE_CR_ACCESS_KEY}" --password-stdin
if [ $? -ne 0 ]; then
  log_error "错误：Docker 登录失败"
  log_error "请检查访问密钥和密码是否正确"
  exit 1
fi
log_success "Docker 登录成功！"

# 拉取最新镜像
log_info "拉取前端镜像: ${VOLCENGINE_CR_REGISTRY}/xiaonuo/frontend:${DATETIME}"
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/frontend:${DATETIME}"
if [ $? -ne 0 ]; then
  log_error "错误：拉取前端镜像失败"
  exit 1
fi
log_success "前端镜像拉取成功！"

log_info "拉取后端镜像: ${VOLCENGINE_CR_REGISTRY}/xiaonuo/backend:${DATETIME}"
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/backend:${DATETIME}"
if [ $? -ne 0 ]; then
  log_error "错误：拉取后端镜像失败"
  exit 1
fi
log_success "后端镜像拉取成功！"

# 重启服务
log_info "重启服务..."
cd /root/xiaonuo || {
  log_error "错误：无法进入 /root/xiaonuo 目录"
  exit 1
}

# 检查 docker-compose 文件是否存在
if [ ! -f "docker-compose.yml" ]; then
  log_error "错误：docker-compose.yml 文件不存在"
  exit 1
fi
log_info "docker-compose.yml 文件存在"

# 停止并移除旧容器
log_info "停止并移除旧容器..."
docker-compose down
if [ $? -ne 0 ]; then
  log_warning "警告：停止服务失败，继续启动新服务"
fi

# 启动新服务
log_info "启动新服务..."
docker-compose up -d
if [ $? -ne 0 ]; then
  log_error "错误：启动服务失败"
  exit 1
fi
log_success "服务启动成功！"

# 验证服务状态
log_info "验证服务状态..."
sleep 5
docker ps
if [ $? -ne 0 ]; then
  log_warning "警告：无法获取服务状态"
else
  log_success "服务状态检查完成！"
fi

log_success "部署完成！"
log_info "===================================="
log_info "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "镜像版本: ${DATETIME}"
log_info "===================================="
