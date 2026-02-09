#!/bin/bash

# 自动化部署脚本 - 完整的生产服务器部署流程
# 使用方法：bash deploy-automated.sh [--env=production|staging|development]

# 配置
PROJECT_ROOT="$(dirname "$0")"
DEPLOY_ENV="production"

# 解析参数
for arg in "$@"
do
    case $arg in
        --env=*)
            DEPLOY_ENV="${arg#*=}"
            ;;
        *)
            echo "未知参数: $arg"
            echo "使用方法: bash deploy-automated.sh [--env=production|staging|development]"
            exit 1
            ;;
    esac
done

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

# 执行命令并检查结果
exec_command() {
    local command="$1"
    local description="$2"
    local continue_on_error="$3"
    
    log_info "$description"
    log_info "执行命令: $command"
    
    # 执行命令
    eval "$command"
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
    log_info "开始小诺智能助理生产服务器部署"
    log_info "部署环境: $DEPLOY_ENV"
    log_info "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "===================================="
    
    # 1. 检查环境状态
    log_info "\n1. 检查环境状态"
    exec_command "docker --version" "检查 Docker 版本"
    exec_command "docker-compose --version" "检查 Docker Compose 版本"
    exec_command "ls -la" "检查项目结构"
    
    # 2. 构建项目
    log_info "\n2. 构建项目"
    exec_command "bash build.sh --env=$DEPLOY_ENV" "运行构建脚本"
    
    # 查看构建报告
    local build_report=$(ls -la build-report-*.txt 2>/dev/null | tail -n 1 | awk '{print $9}')
    if [ -f "$build_report" ]; then
        log_info "查看构建报告摘要"
        exec_command "cat $build_report | head -30" "查看构建报告"
    else
        log_warning "未找到构建报告"
    fi
    
    # 3. 安全扫描
    log_info "\n3. 安全扫描"
    exec_command "bash security-scan.sh" "运行安全扫描"
    
    # 查看安全报告
    local security_report=$(ls -la security-scan-*.txt 2>/dev/null | tail -n 1 | awk '{print $9}')
    if [ -f "$security_report" ]; then
        log_info "查看安全报告摘要"
        exec_command "cat $security_report | grep -E '(告警|问题|错误|扫描总结)'" "查看安全问题" "true"
    else
        log_warning "未找到安全报告"
    fi
    
    # 4. 部署到生产服务器
    log_info "\n4. 部署到生产服务器"
    exec_command "bash deploy.sh --full --env=$DEPLOY_ENV" "执行部署脚本"
    
    # 5. 验证部署结果
    log_info "\n5. 验证部署结果"
    
    # 检查前端服务
    log_info "检查前端服务"
    exec_command "curl -I -m 10 https://xiaonuo.top" "检查前端服务响应" "true"
    
    # 检查后端服务
    log_info "检查后端服务"
    exec_command "curl -m 10 https://xiaonuo.top/api/health" "检查后端服务健康状态" "true"
    
    # 6. 检查服务器状态
    log_info "\n6. 检查服务器状态"
    exec_command "ssh -i backend/xiaonuoSev1.pem root@115.191.33.228 'ps aux | grep node | grep -v grep'" "检查后端进程状态" "true"
    
    # 查看服务器日志
    log_info "查看服务器日志"
    exec_command "ssh -i backend/xiaonuoSev1.pem root@115.191.33.228 'tail -n 30 /root/xiaonuo/backend/server.log'" "查看后端日志" "true"
    
    # 7. 完成部署
    log_info "\n7. 部署完成"
    log_success "===================================="
    log_success "小诺智能助理生产服务器部署完成"
    log_success "部署环境: $DEPLOY_ENV"
    log_success "部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_success "===================================="
    log_success "前端服务: https://xiaonuo.top"
    log_success "后端服务: https://xiaonuo.top/api"
    log_success "健康检查: https://xiaonuo.top/api/health"
    log_success "===================================="
}

# 执行主流程
main
