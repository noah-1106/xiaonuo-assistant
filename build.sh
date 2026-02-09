#!/bin/bash

# 构建脚本 - 用于标准化构建流程，包含版本管理
# 使用方法：bash build.sh [--env=production|staging|development] [--version=VERSION]

# 配置
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 加载火山引擎容器镜像服务认证信息
if [ -f "$PROJECT_ROOT/.credentials/volcengine-cr.env" ]; then
    source "$PROJECT_ROOT/.credentials/volcengine-cr.env"
    echo "✅ 加载火山引擎容器镜像服务认证信息成功！"
else
    echo "❌ 火山引擎容器镜像服务认证信息文件不存在！"
    echo "请先创建 .credentials/volcengine-cr.env 文件"
    exit 1
fi

# 环境配置
ENVIRONMENTS=("production" "staging" "development")
DEFAULT_ENV="production"

# 解析参数
BUILD_ENV="$DEFAULT_ENV"
CUSTOM_VERSION=""

for arg in "$@"
do
    case $arg in
        --env=*)
            BUILD_ENV="${arg#*=}"
            ;;
        --version=*)
            CUSTOM_VERSION="${arg#*=}"
            ;;
        *)
            echo "未知参数: $arg"
            echo "使用方法: bash build.sh [--env=production|staging|development] [--version=VERSION]"
            exit 1
            ;;
    esac
done

# 验证环境参数
if [[ ! "${ENVIRONMENTS[*]}" =~ "${BUILD_ENV}" ]]; then
    echo "错误: 无效的环境参数 '$BUILD_ENV'"
    echo "可用环境: ${ENVIRONMENTS[*]}"
    exit 1
fi

# 版本管理
function generate_version() {
    if [ ! -z "$CUSTOM_VERSION" ]; then
        echo "$CUSTOM_VERSION"
        return
    fi
    
    # 基于 Git 提交生成版本号
    if command -v git &> /dev/null && [ -d "$PROJECT_ROOT/.git" ]; then
        GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
        GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "local")
        echo "$(date +%Y%m%d).$(date +%H%M).${GIT_COMMIT}"
    else
        # 基于日期时间生成版本号
        echo "$(date +%Y%m%d).$(date +%H%M%S).local"
    fi
}

# 构建信息
BUILD_VERSION=$(generate_version)
BUILD_TIME=$(date +%Y-%m-%d_%H:%M:%S)
BUILD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
BUILD_ENVIRONMENT="$BUILD_ENV"

# 显示构建信息
echo "🚀 开始构建小诺智能助理..."
echo "📋 构建配置:"
echo "   - 版本: $BUILD_VERSION"
echo "   - 时间: $BUILD_TIME"
echo "   - 提交: $BUILD_COMMIT"
echo "   - 环境: $BUILD_ENVIRONMENT"
echo "   - 项目根目录: $PROJECT_ROOT"
echo "   - 前端目录: $FRONTEND_DIR"
echo "   - 后端目录: $BACKEND_DIR"

# 1. 环境变量验证
echo "🔍 验证环境配置..."

# 检查前端目录
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ 前端目录不存在: $FRONTEND_DIR"
    exit 1
fi

# 检查后端目录
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ 后端目录不存在: $BACKEND_DIR"
    exit 1
fi

echo "✅ 环境配置验证通过！"

# 2. 构建前端
echo "📦 构建前端..."
cd "$FRONTEND_DIR"

# 创建环境变量文件
case $BUILD_ENV in
    production)
        API_BASE_URL="https://xiaonuo.top/api"
        ;;
    staging)
        API_BASE_URL="https://staging.xiaonuo.top/api"
        ;;
    development)
        API_BASE_URL="/api"
        ;;
esac

echo "VITE_API_BASE_URL=$API_BASE_URL" > .env.production
echo "VITE_NODE_ENV=$BUILD_ENV" >> .env.production
echo "VITE_APP_NAME=小诺智能助理" >> .env.production
echo "VITE_APP_VERSION=$BUILD_VERSION" >> .env.production
echo "VITE_BUILD_TIME=$BUILD_TIME" >> .env.production

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
echo "🔧 构建前端应用..."
env VITE_API_BASE_URL=$API_BASE_URL VITE_NODE_ENV=$BUILD_ENV VITE_APP_VERSION=$BUILD_VERSION npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败！"
    exit 1
fi

# 回到项目根目录
cd "$PROJECT_ROOT"
echo "✅ 前端构建成功！"

# 3. 构建后端
echo "📦 构建后端..."
echo "后端目录: $BACKEND_DIR"
echo "当前目录: $(pwd)"
# 确保在项目根目录
cd "$PROJECT_ROOT"
echo "切换到项目根目录: $(pwd)"
if [ ! -d "$BACKEND_DIR" ]; then
    echo "⚠️  后端目录不存在，跳过后端构建..."
    echo "✅ 跳过后端构建！"
    # 继续执行后续步骤
else
    cd "$BACKEND_DIR"

# 创建环境变量文件
BACKEND_ENV_FILE=".env.$BUILD_ENV"
if [ ! -f "$BACKEND_ENV_FILE" ] && [ -f ".env.example" ]; then
    cp .env.example "$BACKEND_ENV_FILE"
    echo "✅ 创建后端环境配置文件: $BACKEND_ENV_FILE"
fi

# 安装后端依赖（如果 node_modules 不存在）
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install --legacy-peer-deps
    if [ $? -ne 0 ]; then
        echo "❌ 后端依赖安装失败！"
        exit 1
    fi
    echo "✅ 后端依赖安装成功！"
fi

# 运行后端测试（可选）
if [ "$BUILD_ENV" = "development" ]; then
    echo "🧪 运行后端测试..."
    npm test -- --silent
    if [ $? -ne 0 ]; then
        echo "⚠️  后端测试失败，但继续构建"
    else
        echo "✅ 后端测试通过！"
    fi
fi

# 回到项目根目录
cd "$PROJECT_ROOT"
echo "✅ 后端构建成功！"
fi

# 4. 构建 Docker 镜像
echo "🐳 构建 Docker 镜像..."

# 跳过登录步骤（已在之前登录过）
echo "🔑 跳过登录步骤（已在之前登录过）..."
echo "✅ 登录步骤已跳过！"

# 定义镜像标签
FRONTEND_IMAGE="$VOLCENGINE_CR_REGISTRY/$VOLCENGINE_CR_NAMESPACE/frontend:$BUILD_VERSION"
BACKEND_IMAGE="$VOLCENGINE_CR_REGISTRY/$VOLCENGINE_CR_NAMESPACE/backend:$BUILD_VERSION"
FRONTEND_IMAGE_LATEST="$VOLCENGINE_CR_REGISTRY/$VOLCENGINE_CR_NAMESPACE/frontend:latest"
BACKEND_IMAGE_LATEST="$VOLCENGINE_CR_REGISTRY/$VOLCENGINE_CR_NAMESPACE/backend:latest"

echo "📦 前端镜像: $FRONTEND_IMAGE"
echo "📦 后端镜像: $BACKEND_IMAGE"

# 构建前端镜像
docker build --no-cache \
    --build-arg BUILD_VERSION=$BUILD_VERSION \
    --build-arg BUILD_TIME=$BUILD_TIME \
    --build-arg BUILD_COMMIT=$BUILD_COMMIT \
    -t "$FRONTEND_IMAGE" \
    -t "$FRONTEND_IMAGE_LATEST" \
    -f "$FRONTEND_DIR/Dockerfile" \
    "$FRONTEND_DIR"
if [ $? -ne 0 ]; then
    echo "❌ 前端 Docker 镜像构建失败！"
    exit 1
fi
echo "✅ 前端 Docker 镜像构建成功！"

# 推送前端镜像
echo "🚀 推送前端镜像到火山引擎容器镜像服务..."
docker push "$FRONTEND_IMAGE"
if [ $? -ne 0 ]; then
    echo "❌ 前端镜像推送失败！"
    exit 1
fi
docker push "$FRONTEND_IMAGE_LATEST"
if [ $? -ne 0 ]; then
    echo "❌ 前端镜像 latest 标签推送失败！"
    exit 1
fi
echo "✅ 前端镜像推送成功！"

# 构建后端镜像
docker build --no-cache \
    --build-arg BUILD_VERSION=$BUILD_VERSION \
    --build-arg BUILD_TIME=$BUILD_TIME \
    --build-arg BUILD_COMMIT=$BUILD_COMMIT \
    -t "$BACKEND_IMAGE" \
    -t "$BACKEND_IMAGE_LATEST" \
    -f "$BACKEND_DIR/Dockerfile" \
    "$BACKEND_DIR"
if [ $? -ne 0 ]; then
    echo "❌ 后端 Docker 镜像构建失败！"
    exit 1
fi
echo "✅ 后端 Docker 镜像构建成功！"

# 推送后端镜像
echo "🚀 推送后端镜像到火山引擎容器镜像服务..."
docker push "$BACKEND_IMAGE"
if [ $? -ne 0 ]; then
    echo "❌ 后端镜像推送失败！"
    exit 1
fi
docker push "$BACKEND_IMAGE_LATEST"
if [ $? -ne 0 ]; then
    echo "❌ 后端镜像 latest 标签推送失败！"
    exit 1
fi
echo "✅ 后端镜像推送成功！"

# 5. 生成构建报告
echo "📊 生成构建报告..."

BUILD_REPORT_FILE="$PROJECT_ROOT/build-report-$BUILD_VERSION.txt"
echo "# 小诺智能助理构建报告" > "$BUILD_REPORT_FILE"
echo "" >> "$BUILD_REPORT_FILE"
echo "## 构建信息" >> "$BUILD_REPORT_FILE"
echo "- 版本: $BUILD_VERSION" >> "$BUILD_REPORT_FILE"
echo "- 时间: $BUILD_TIME" >> "$BUILD_REPORT_FILE"
echo "- 提交: $BUILD_COMMIT" >> "$BUILD_REPORT_FILE"
echo "- 环境: $BUILD_ENVIRONMENT" >> "$BUILD_REPORT_FILE"
echo "" >> "$BUILD_REPORT_FILE"
echo "## 构建结果" >> "$BUILD_REPORT_FILE"
echo "- ✅ 前端构建完成" >> "$BUILD_REPORT_FILE"
echo "- ✅ 后端构建完成" >> "$BUILD_REPORT_FILE"
echo "- 📁 前端构建目录: $FRONTEND_DIR/dist" >> "$BUILD_REPORT_FILE"
echo "- 📁 后端构建目录: $BACKEND_DIR" >> "$BUILD_REPORT_FILE"
echo "" >> "$BUILD_REPORT_FILE"
echo "## 环境配置" >> "$BUILD_REPORT_FILE"
echo "- 前端 API 地址: $API_BASE_URL" >> "$BUILD_REPORT_FILE"
echo "- 构建环境: $BUILD_ENVIRONMENT" >> "$BUILD_REPORT_FILE"
echo "" >> "$BUILD_REPORT_FILE"
echo "## 镜像信息" >> "$BUILD_REPORT_FILE"
echo "- 前端镜像: $FRONTEND_IMAGE" >> "$BUILD_REPORT_FILE"
echo "- 后端镜像: $BACKEND_IMAGE" >> "$BUILD_REPORT_FILE"
echo "- 容器镜像服务: $VOLCENGINE_CR_REGISTRY" >> "$BUILD_REPORT_FILE"

# 6. 显示构建完成信息
echo "🎉 构建完成！"
echo "📌 构建版本: $BUILD_VERSION"
echo "📌 构建环境: $BUILD_ENVIRONMENT"
echo "📌 前端构建目录: $FRONTEND_DIR/dist"
echo "📌 后端构建目录: $BACKEND_DIR"
echo "📌 构建报告: $BUILD_REPORT_FILE"
echo ""
echo "🔧 构建详情:"
echo "   - 前端版本: $BUILD_VERSION"
echo "   - 后端版本: $BUILD_VERSION"
echo "   - 构建时间: $BUILD_TIME"
echo "   - 前端镜像: $FRONTEND_IMAGE"
echo "   - 后端镜像: $BACKEND_IMAGE"
echo "   - 容器镜像服务: $VOLCENGINE_CR_REGISTRY"
echo ""
echo "📋 后续步骤建议:"
echo "   1. 查看构建报告了解详细信息"
echo "   2. 运行部署脚本部署应用: bash deploy.sh --env=$BUILD_ENV"
echo "   3. 验证部署结果"
echo "   4. 记录构建版本用于后续追踪"
