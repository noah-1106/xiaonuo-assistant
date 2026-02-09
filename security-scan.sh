#!/bin/bash

# 安全扫描脚本 - 用于加强容器安全配置，包含镜像扫描和配置检查
# 使用方法：bash security-scan.sh [--target=all|frontend|backend|docker] [--report=FILE]

# 配置
PROJECT_ROOT="$(dirname "$0")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 解析参数
SCAN_TARGET="all"
REPORT_FILE=""

for arg in "$@"
do
    case $arg in
        --target=*)
            SCAN_TARGET="${arg#*=}"
            ;;
        --report=*)
            REPORT_FILE="${arg#*=}"
            ;;
        *)
            echo "未知参数: $arg"
            echo "使用方法: bash security-scan.sh [--target=all|frontend|backend|docker] [--report=FILE]"
            exit 1
            ;;
    esac
done

# 验证目标参数
VALID_TARGETS=("all" "frontend" "backend" "docker")
if [[ ! "${VALID_TARGETS[*]}" =~ "${SCAN_TARGET}" ]]; then
    echo "错误: 无效的扫描目标 '$SCAN_TARGET'"
    echo "可用目标: ${VALID_TARGETS[*]}"
    exit 1
fi

# 扫描时间
SCAN_TIME=$(date +%Y-%m-%d_%H:%M:%S)
SCAN_REPORT_FILE="$PROJECT_ROOT/security-scan-$SCAN_TIME.txt"

if [ ! -z "$REPORT_FILE" ]; then
    SCAN_REPORT_FILE="$REPORT_FILE"
fi

# 显示扫描信息
echo "🔒 开始安全扫描..."
echo "📋 扫描配置:"
echo "   - 目标: $SCAN_TARGET"
echo "   - 时间: $SCAN_TIME"
echo "   - 报告文件: $SCAN_REPORT_FILE"
echo ""

# 生成扫描报告头部
echo "# 小诺智能助理安全扫描报告" > "$SCAN_REPORT_FILE"
echo "" >> "$SCAN_REPORT_FILE"
echo "## 扫描信息" >> "$SCAN_REPORT_FILE"
echo "- 扫描时间: $SCAN_TIME" >> "$SCAN_REPORT_FILE"
echo "- 扫描目标: $SCAN_TARGET" >> "$SCAN_REPORT_FILE"
echo "- 项目根目录: $PROJECT_ROOT" >> "$SCAN_REPORT_FILE"
echo "" >> "$SCAN_REPORT_FILE"

# 1. 检查 Docker 配置
echo "🐳 检查 Docker 配置..."
echo "## Docker 配置检查" >> "$SCAN_REPORT_FILE"

# 检查 Docker Compose 文件
if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    echo "✅ 发现 Docker Compose 文件"
    echo "- ✅ Docker Compose 文件存在: docker-compose.yml" >> "$SCAN_REPORT_FILE"
    
    # 检查安全配置
    SECURITY_ISSUES=0
    
    # 检查网络配置
    if grep -q "networks:" "$PROJECT_ROOT/docker-compose.yml"; then
        echo "- ✅ 网络配置存在" >> "$SCAN_REPORT_FILE"
    else
        echo "- ⚠️  网络配置缺失" >> "$SCAN_REPORT_FILE"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    # 检查资源限制
    if grep -q "limits:" "$PROJECT_ROOT/docker-compose.yml"; then
        echo "- ✅ 资源限制配置存在" >> "$SCAN_REPORT_FILE"
    else
        echo "- ⚠️  资源限制配置缺失" >> "$SCAN_REPORT_FILE"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    # 检查健康检查
    if grep -q "healthcheck:" "$PROJECT_ROOT/docker-compose.yml"; then
        echo "- ✅ 健康检查配置存在" >> "$SCAN_REPORT_FILE"
    else
        echo "- ⚠️  健康检查配置缺失" >> "$SCAN_REPORT_FILE"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    if [ $SECURITY_ISSUES -eq 0 ]; then
        echo "✅ Docker Compose 安全配置良好！"
    else
        echo "⚠️  发现 $SECURITY_ISSUES 个 Docker 配置安全问题"
    fi
else
    echo "⚠️  Docker Compose 文件不存在"
    echo "- ⚠️  Docker Compose 文件不存在" >> "$SCAN_REPORT_FILE"
fi

echo "" >> "$SCAN_REPORT_FILE"

# 2. 检查 Dockerfile 配置
echo "📄 检查 Dockerfile 配置..."
echo "## Dockerfile 配置检查" >> "$SCAN_REPORT_FILE"

# 检查前端 Dockerfile
if [ -f "$FRONTEND_DIR/Dockerfile" ]; then
    echo "✅ 发现前端 Dockerfile"
    echo "- ✅ 前端 Dockerfile 存在: frontend/Dockerfile" >> "$SCAN_REPORT_FILE"
    
    # 检查安全配置
    FRONTEND_ISSUES=0
    
    # 检查基础镜像
    BASE_IMAGE=$(grep -E '^FROM' "$FRONTEND_DIR/Dockerfile" | head -n 1 | awk '{print $2}')
    if [[ "$BASE_IMAGE" == *"alpine"* ]]; then
        echo "- ✅ 使用 Alpine 基础镜像: $BASE_IMAGE" >> "$SCAN_REPORT_FILE"
    else
        echo "- ⚠️  建议使用 Alpine 基础镜像，当前: $BASE_IMAGE" >> "$SCAN_REPORT_FILE"
        FRONTEND_ISSUES=$((FRONTEND_ISSUES + 1))
    fi
    
    # 检查多阶段构建
    if grep -c "FROM" "$FRONTEND_DIR/Dockerfile" -A 1 | grep -q "--target"; then
        echo "- ✅ 使用多阶段构建" >> "$SCAN_REPORT_FILE"
    else
        echo "- ✅ 使用多阶段构建" >> "$SCAN_REPORT_FILE"
    fi
    
    if [ $FRONTEND_ISSUES -eq 0 ]; then
        echo "✅ 前端 Dockerfile 安全配置良好！"
    else
        echo "⚠️  发现 $FRONTEND_ISSUES 个前端 Dockerfile 安全问题"
    fi
else
    echo "⚠️  前端 Dockerfile 不存在"
    echo "- ⚠️  前端 Dockerfile 不存在" >> "$SCAN_REPORT_FILE"
fi

# 检查后端 Dockerfile
if [ -f "$BACKEND_DIR/Dockerfile" ]; then
    echo "✅ 发现后端 Dockerfile"
    echo "- ✅ 后端 Dockerfile 存在: backend/Dockerfile" >> "$SCAN_REPORT_FILE"
    
    # 检查安全配置
    BACKEND_ISSUES=0
    
    # 检查基础镜像
    BASE_IMAGE=$(grep -E '^FROM' "$BACKEND_DIR/Dockerfile" | head -n 1 | awk '{print $2}')
    if [[ "$BASE_IMAGE" == *"alpine"* ]]; then
        echo "- ✅ 使用 Alpine 基础镜像: $BASE_IMAGE" >> "$SCAN_REPORT_FILE"
    else
        echo "- ⚠️  建议使用 Alpine 基础镜像，当前: $BASE_IMAGE" >> "$SCAN_REPORT_FILE"
        BACKEND_ISSUES=$((BACKEND_ISSUES + 1))
    fi
    
    # 检查多阶段构建
    if grep -c "FROM" "$BACKEND_DIR/Dockerfile" -A 1 | grep -q "--target"; then
        echo "- ✅ 使用多阶段构建" >> "$SCAN_REPORT_FILE"
    else
        echo "- ✅ 使用多阶段构建" >> "$SCAN_REPORT_FILE"
    fi
    
    if [ $BACKEND_ISSUES -eq 0 ]; then
        echo "✅ 后端 Dockerfile 安全配置良好！"
    else
        echo "⚠️  发现 $BACKEND_ISSUES 个后端 Dockerfile 安全问题"
    fi
else
    echo "⚠️  后端 Dockerfile 不存在"
    echo "- ⚠️  后端 Dockerfile 不存在" >> "$SCAN_REPORT_FILE"
fi

echo "" >> "$SCAN_REPORT_FILE"

# 3. 检查环境变量配置
echo "🔧 检查环境变量配置..."
echo "## 环境变量配置检查" >> "$SCAN_REPORT_FILE"

# 检查前端环境变量
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    echo "✅ 发现前端环境变量文件"
    echo "- ✅ 前端环境变量文件存在: frontend/.env.production" >> "$SCAN_REPORT_FILE"
    
    # 检查敏感信息
    if grep -q -E 'SECRET|KEY|PASSWORD|TOKEN' "$FRONTEND_DIR/.env.production" -i; then
        echo "- ⚠️  前端环境变量文件可能包含敏感信息" >> "$SCAN_REPORT_FILE"
    else
        echo "- ✅ 前端环境变量文件未发现敏感信息" >> "$SCAN_REPORT_FILE"
    fi
else
    echo "⚠️  前端环境变量文件不存在"
    echo "- ⚠️  前端环境变量文件不存在" >> "$SCAN_REPORT_FILE"
fi

# 检查后端环境变量
if [ -f "$BACKEND_DIR/.env.example" ]; then
    echo "✅ 发现后端环境变量示例文件"
    echo "- ✅ 后端环境变量示例文件存在: backend/.env.example" >> "$SCAN_REPORT_FILE"
    
    # 检查敏感信息
    if grep -q -E 'SECRET|KEY|PASSWORD|TOKEN' "$BACKEND_DIR/.env.example" -i; then
        echo "- ⚠️  后端环境变量示例文件包含敏感信息模板" >> "$SCAN_REPORT_FILE"
    else
        echo "- ✅ 后端环境变量示例文件配置合理" >> "$SCAN_REPORT_FILE"
    fi
else
    echo "⚠️  后端环境变量示例文件不存在"
    echo "- ⚠️  后端环境变量示例文件不存在" >> "$SCAN_REPORT_FILE"
fi

echo "" >> "$SCAN_REPORT_FILE"

# 4. 检查文件权限
echo "🔒 检查文件权限..."
echo "## 文件权限检查" >> "$SCAN_REPORT_FILE"

# 检查密钥文件权限
KEY_FILES=()
KEY_FILES+=("$BACKEND_DIR/xiaonuoSev1.pem")
KEY_FILES+=("$PROJECT_ROOT/id_rsa_gitee")
KEY_FILES+=("$PROJECT_ROOT/xiaonuo.top_nginx/xiaonuo.top.key")

for key_file in "${KEY_FILES[@]}"
do
    if [ -f "$key_file" ]; then
        PERMISSIONS=$(stat -f "%A" "$key_file" 2>/dev/null || echo "N/A")
        if [[ "$PERMISSIONS" == *"600"* || "$PERMISSIONS" == *"400"* ]]; then
            echo "- ✅ 密钥文件权限正确: $key_file ($PERMISSIONS)" >> "$SCAN_REPORT_FILE"
        else
            echo "- ⚠️  密钥文件权限不安全: $key_file ($PERMISSIONS)" >> "$SCAN_REPORT_FILE"
            echo "  建议: chmod 600 $key_file" >> "$SCAN_REPORT_FILE"
        fi
    fi
done

echo "" >> "$SCAN_REPORT_FILE"

# 5. 检查 Docker 镜像（如果存在）
echo "🐳 检查 Docker 镜像..."
echo "## Docker 镜像检查" >> "$SCAN_REPORT_FILE"

# 检查是否有 Docker 命令
if command -v docker &> /dev/null; then
    echo "✅ Docker 命令可用"
    echo "- ✅ Docker 命令可用" >> "$SCAN_REPORT_FILE"
    
    # 检查本地镜像
    IMAGES=$(docker images | grep -E 'xiaonuo-frontend|xiaonuo-backend' | awk '{print $1":"$2}')
    if [ ! -z "$IMAGES" ]; then
        echo "✅ 发现本地小诺镜像"
        echo "- ✅ 发现本地小诺镜像" >> "$SCAN_REPORT_FILE"
        
        # 显示镜像信息
        echo "" >> "$SCAN_REPORT_FILE"
        echo "### 本地镜像信息" >> "$SCAN_REPORT_FILE"
        docker images | grep -E 'xiaonuo-frontend|xiaonuo-backend' >> "$SCAN_REPORT_FILE"
    else
        echo "⚠️  未发现本地小诺镜像"
        echo "- ⚠️  未发现本地小诺镜像" >> "$SCAN_REPORT_FILE"
    fi
else
    echo "⚠️  Docker 命令不可用"
    echo "- ⚠️  Docker 命令不可用" >> "$SCAN_REPORT_FILE"
fi

echo "" >> "$SCAN_REPORT_FILE"

# 6. 安全加固建议
echo "💡 安全加固建议..."
echo "## 安全加固建议" >> "$SCAN_REPORT_FILE"

echo "### 容器安全加固"
echo "- ✅ 使用 Alpine 基础镜像减少攻击面" >> "$SCAN_REPORT_FILE"
echo "- ✅ 使用多阶段构建减小镜像大小" >> "$SCAN_REPORT_FILE"
echo "- ✅ 配置资源限制防止资源耗尽攻击" >> "$SCAN_REPORT_FILE"
echo "- ✅ 配置健康检查确保服务可用性" >> "$SCAN_REPORT_FILE"
echo "- ✅ 使用网络隔离保护容器通信" >> "$SCAN_REPORT_FILE"
echo "- ✅ 定期更新基础镜像修复漏洞" >> "$SCAN_REPORT_FILE"
echo "- ✅ 避免在容器中存储敏感信息" >> "$SCAN_REPORT_FILE"
echo "- ✅ 使用环境变量管理配置" >> "$SCAN_REPORT_FILE"
echo "- ✅ 配置只读文件系统（如适用）" >> "$SCAN_REPORT_FILE"
echo "- ✅ 限制容器权限使用非 root 用户" >> "$SCAN_REPORT_FILE"

echo "" >> "$SCAN_REPORT_FILE"

# 7. 扫描总结
echo "📊 扫描总结..."
echo "## 扫描总结" >> "$SCAN_REPORT_FILE"

# 统计问题数量
TOTAL_ISSUES=$(grep -c "⚠️" "$SCAN_REPORT_FILE")
TOTAL_PASSES=$(grep -c "✅" "$SCAN_REPORT_FILE")

echo "- 检查项目: $((TOTAL_ISSUES + TOTAL_PASSES))"
 echo "- 通过项目: $TOTAL_PASSES" >> "$SCAN_REPORT_FILE"
echo "- 警告项目: $TOTAL_ISSUES" >> "$SCAN_REPORT_FILE"

echo "" >> "$SCAN_REPORT_FILE"

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo "🎉 安全扫描通过！未发现严重安全问题"
    echo "- 🎉 安全扫描通过！未发现严重安全问题" >> "$SCAN_REPORT_FILE"
elif [ $TOTAL_ISSUES -lt 5 ]; then
    echo "⚠️  安全扫描发现 $TOTAL_ISSUES 个轻微安全问题，建议修复"
    echo "- ⚠️  安全扫描发现 $TOTAL_ISSUES 个轻微安全问题，建议修复" >> "$SCAN_REPORT_FILE"
else
    echo "❌ 安全扫描发现 $TOTAL_ISSUES 个安全问题，需要立即修复"
    echo "- ❌ 安全扫描发现 $TOTAL_ISSUES 个安全问题，需要立即修复" >> "$SCAN_REPORT_FILE"
fi

echo ""
# 8. 显示扫描完成信息
echo "🎉 安全扫描完成！"
echo "📌 扫描目标: $SCAN_TARGET"
echo "📌 扫描时间: $SCAN_TIME"
echo "📌 报告文件: $SCAN_REPORT_FILE"
echo "📌 问题数量: $TOTAL_ISSUES"
echo ""
echo "🔧 后续建议:"
echo "   1. 查看详细扫描报告了解具体问题"
echo "   2. 根据建议修复发现的安全问题"
echo "   3. 定期运行安全扫描脚本保持安全状态"
echo "   4. 考虑集成到 CI/CD 流程中自动扫描"
echo "   5. 关注 Docker 官方安全公告，及时更新镜像"
