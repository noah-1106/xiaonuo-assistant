# 小诺项目版本管理与容器化部署指南

## 1. 项目概述

### 1.1 技术栈
- **前端**：React 19.2.0 + TypeScript + Vite + Ant Design
- **后端**：Node.js + Express + MongoDB + Socket.io
- **依赖管理**：pnpm
- **版本管理**：Git

### 1.2 项目结构
```
xiaonuo/
├── frontend/         # 前端代码
├── backend/          # 后端代码
├── scripts/          # 脚本文件
└── xiaonuo.top_nginx/ # SSL证书
```

## 2. 版本管理方案

### 2.1 Git工作流

采用**GitFlow**工作流，包含以下分支：

| 分支类型 | 命名格式 | 用途 |
|---------|---------|------|
| 主分支 | `main` | 生产环境发布分支，保持稳定 |
| 开发分支 | `develop` | 集成所有特性的开发分支 |
| 特性分支 | `feature/{feature-name}` | 开发新功能 |
| 发布分支 | `release/{version}` | 准备发布版本 |
| 修复分支 | `hotfix/{version}` | 紧急修复生产问题 |

### 2.2 分支管理流程

1. **初始化**：
   ```bash
   # 从main创建develop分支
   git checkout -b develop
   ```

2. **开发新功能**：
   ```bash
   # 从develop创建特性分支
   git checkout -b feature/user-authentication
   
   # 开发完成后合并回develop
   git checkout develop
   git merge --no-ff feature/user-authentication
   git branch -d feature/user-authentication
   ```

3. **准备发布**：
   ```bash
   # 从develop创建发布分支
   git checkout -b release/1.0.0
   
   # 执行测试、构建和文档更新
   # 合并到main并打标签
   git checkout main
   git merge --no-ff release/1.0.0
   git tag -a v1.0.0 -m "Release version 1.0.0"
   
   # 合并回develop
   git checkout develop
   git merge --no-ff release/1.0.0
   git branch -d release/1.0.0
   ```

4. **紧急修复**：
   ```bash
   # 从main创建修复分支
   git checkout -b hotfix/1.0.1
   
   # 修复完成后合并到main并打标签
   git checkout main
   git merge --no-ff hotfix/1.0.1
   git tag -a v1.0.1 -m "Hotfix version 1.0.1"
   
   # 合并回develop
   git checkout develop
   git merge --no-ff hotfix/1.0.1
   git branch -d hotfix/1.0.1
   ```

### 2.3 提交规范

使用**Conventional Commits**规范，格式如下：

```
<type>(<scope>): <description>

<body>

<footer>
```

**类型说明**：
- `feat`：新功能
- `fix`：bug修复
- `docs`：文档更新
- `style`：代码风格修改
- `refactor`：代码重构
- `test`：测试相关
- `chore`：构建/依赖更新

**示例**：
```
feat(frontend): 添加用户登录功能

- 实现登录表单组件
- 集成后端认证API
- 添加登录状态管理

Closes #123
```

### 2.4 版本号管理

采用**Semantic Versioning**（语义化版本）：

```
MAJOR.MINOR.PATCH
```

- **MAJOR**：不兼容的API变更
- **MINOR**：向下兼容的功能添加
- **PATCH**：向下兼容的bug修复

### 2.5 代码质量保证

- **代码检查**：使用ESLint进行代码质量检查
- **代码格式化**：使用Prettier保持代码风格一致
- **提交前检查**：使用husky进行提交前钩子检查

```bash
# 安装依赖
pnpm install

# 运行lint检查
pnpm lint

# 运行测试
pnpm test

# 格式化代码
pnpm format
```

## 3. 容器化部署方案

### 3.1 环境准备

- **Docker**：版本 20.10.0+
- **Docker Compose**：版本 1.29.0+
- **Kubernetes**（生产环境）：版本 1.20.0+

### 3.2 Docker配置

#### 3.2.1 前端Dockerfile

创建 `frontend/Dockerfile`：

```dockerfile
# 多阶段构建
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm run build

# 生产环境
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3.2.2 前端nginx.conf

创建 `frontend/nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

#### 3.2.3 后端Dockerfile

创建 `backend/Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
```

### 3.3 Docker Compose配置

#### 3.3.1 开发环境

创建 `docker-compose.dev.yml`：

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_BASE_URL=/api
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DB_HOST=mongo
      - DB_PORT=27017
      - DB_NAME=xiaonuo
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

#### 3.3.2 生产环境

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    restart: always
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=mongo
      - DB_PORT=27017
      - DB_NAME=xiaonuo
      # 其他环境变量通过.env文件或环境变量设置
    restart: always
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    volumes:
      - mongo-data:/data/db
    restart: always

volumes:
  mongo-data:
```

### 3.4 Kubernetes部署

#### 3.4.1 配置文件

创建 `k8s/` 目录，包含以下文件：

**k8s/configmap.yaml**：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: xiaonuo-config
data:
  NODE_ENV: "production"
  DB_HOST: "mongo-service"
  DB_PORT: "27017"
  DB_NAME: "xiaonuo"
  PORT: "3001"
```

**k8s/secrets.yaml**：
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: xiaonuo-secrets
type: Opaque
data:
  JWT_SECRET: "<base64-encoded-secret>"
  ARK_API_KEY: "<base64-encoded-api-key>"
  # 其他敏感信息
```

**k8s/frontend-deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xiaonuo-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: xiaonuo-frontend
  template:
    metadata:
      labels:
        app: xiaonuo-frontend
    spec:
      containers:
      - name: xiaonuo-frontend
        image: your-registry/xiaonuo-frontend:latest
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "0.5"
            memory: "256Mi"
```

**k8s/backend-deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xiaonuo-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: xiaonuo-backend
  template:
    metadata:
      labels:
        app: xiaonuo-backend
    spec:
      containers:
      - name: xiaonuo-backend
        image: your-registry/xiaonuo-backend:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: xiaonuo-config
        - secretRef:
            name: xiaonuo-secrets
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "0.5"
            memory: "512Mi"
```

**k8s/frontend-service.yaml**：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  selector:
    app: xiaonuo-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

**k8s/backend-service.yaml**：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: xiaonuo-backend
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

**k8s/mongo-deployment.yaml**：
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongo
spec:
  serviceName: "mongo-service"
  replicas: 1
  selector:
    matchLabels:
      app: mongo
  template:
    metadata:
      labels:
        app: mongo
    spec:
      containers:
      - name: mongo
        image: mongo:6.0
        ports:
        - containerPort: 27017
        volumeMounts:
        - name: mongo-data
          mountPath: /data/db
  volumeClaimTemplates:
  - metadata:
      name: mongo-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

**k8s/mongo-service.yaml**：
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mongo-service
spec:
  selector:
    app: mongo
  ports:
  - port: 27017
    targetPort: 27017
  clusterIP: None
```

### 3.5 CI/CD配置

#### 3.5.1 GitHub Actions

创建 `.github/workflows/ci-cd.yml`：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run lint
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test

  build-and-deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Registry
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: your-registry/xiaonuo-frontend:latest, your-registry/xiaonuo-frontend:${{ github.sha }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: your-registry/xiaonuo-backend:latest, your-registry/xiaonuo-backend:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
          manifests: |
            k8s/frontend-deployment.yaml
            k8s/backend-deployment.yaml
            k8s/frontend-service.yaml
            k8s/backend-service.yaml
          images: |
            your-registry/xiaonuo-frontend:${{ github.sha }}
            your-registry/xiaonuo-backend:${{ github.sha }}
```

## 4. 部署流程

### 4.1 开发环境

1. **启动开发环境**：
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. **访问应用**：
   - 前端：http://localhost:5173
   - 后端API：http://localhost:3001/api
   - 健康检查：http://localhost:3001/api/health

### 4.2 生产环境

#### 4.2.1 使用Docker Compose

1. **配置环境变量**：
   ```bash
   # 复制环境变量示例文件
   cp backend/.env.example backend/.env
   # 编辑.env文件，填写实际配置
   ```

2. **启动生产环境**：
   ```bash
   docker-compose up --build -d
   ```

3. **查看日志**：
   ```bash
   docker-compose logs -f
   ```

4. **停止服务**：
   ```bash
   docker-compose down
   ```

#### 4.2.2 使用Kubernetes

1. **设置Kubernetes上下文**：
   ```bash
   kubectl config use-context your-cluster
   ```

2. **创建配置和密钥**：
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   ```

3. **部署MongoDB**：
   ```bash
   kubectl apply -f k8s/mongo-deployment.yaml
   kubectl apply -f k8s/mongo-service.yaml
   ```

4. **部署应用**：
   ```bash
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-service.yaml
   kubectl apply -f k8s/backend-service.yaml
   ```

5. **查看部署状态**：
   ```bash
   kubectl get pods
   kubectl get services
   ```

6. **更新部署**：
   ```bash
   kubectl rollout restart deployment xiaonuo-frontend
   kubectl rollout restart deployment xiaonuo-backend
   ```

## 5. 最佳实践与注意事项

### 5.1 安全性

- **敏感信息**：使用环境变量或Kubernetes Secrets管理
- **依赖更新**：定期更新依赖和基础镜像
- **镜像扫描**：使用工具扫描容器镜像漏洞
- **网络安全**：配置适当的网络策略和防火墙规则

### 5.2 性能优化

- **镜像优化**：使用Alpine基础镜像减小体积
- **构建优化**：前端使用Vite构建，后端启用Gzip压缩
- **资源配置**：根据实际需求配置容器资源限制
- **缓存策略**：合理配置浏览器缓存和API缓存

### 5.3 监控与日志

- **日志收集**：集成ELK Stack或Graylog收集日志
- **监控系统**：使用Prometheus + Grafana监控应用状态
- **健康检查**：实现应用健康检查端点
- **告警机制**：配置适当的告警规则

### 5.4 扩展性

- **自动扩缩容**：使用Kubernetes Horizontal Pod Autoscaler
- **数据库高可用**：配置MongoDB副本集
- **服务发现**：使用Kubernetes Service实现服务发现
- **负载均衡**：前端使用Ingress或LoadBalancer

### 5.5 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|-----|---------|--------|
| 前端无法访问后端API | 网络配置问题 | 检查Docker网络或Kubernetes Service配置 |
| 数据库连接失败 | 数据库服务未启动或配置错误 | 检查MongoDB状态和连接字符串 |
| 应用启动失败 | 环境变量缺失或错误 | 检查.env文件和环境变量配置 |
| 容器重启频繁 | 资源不足或应用崩溃 | 检查容器日志和资源配置 |

## 6. 发布流程

### 6.1 版本发布步骤

1. **准备发布**：
   - 从`develop`创建`release/{version}`分支
   - 更新版本号和发布日志
   - 执行全面测试

2. **发布版本**：
   - 合并`release/{version}`到`main`
   - 打标签`v{version}`
   - 合并回`develop`
   - 删除`release/{version}`分支

3. **部署上线**：
   - CI/CD自动构建和部署
   - 执行冒烟测试
   - 监控系统状态

4. **发布后处理**：
   - 更新文档和API文档
   - 通知相关团队
   - 记录发布信息

### 6.2 回滚流程

1. **识别问题**：
   - 监控系统告警
   - 用户反馈
   - 日志分析

2. **执行回滚**：
   - Docker Compose：使用之前的镜像版本重启
   - Kubernetes：回滚到之前的部署版本
   ```bash
   kubectl rollout undo deployment xiaonuo-backend
   kubectl rollout undo deployment xiaonuo-frontend
   ```

3. **问题修复**：
   - 从`main`创建`hotfix/{version}`分支
   - 修复问题并测试
   - 合并到`main`并打标签
   - 合并回`develop`
   - 重新部署

## 7. 附录

### 7.1 环境变量参考

**前端环境变量**（.env）：
- `VITE_API_BASE_URL`：API基础URL

**后端环境变量**（.env）：
- `NODE_ENV`：运行环境
- `PORT`：服务端口
- `DB_HOST`：数据库主机
- `DB_PORT`：数据库端口
- `DB_NAME`：数据库名称
- `JWT_SECRET`：JWT密钥
- `ARK_API_KEY`：AI服务API密钥
- `TOS_ACCESS_KEY_ID`：对象存储访问密钥
- `TOS_ACCESS_KEY_SECRET`：对象存储访问密钥密码
- `WECHAT_APPID`：微信支付APPID
- `WECHAT_MCHID`：微信支付商户ID

### 7.2 常用命令

**Docker命令**：
```bash
# 构建镜像
docker build -t xiaonuo-frontend ./frontend

# 运行容器
docker run -p 80:80 --name frontend xiaonuo-frontend

# 查看容器状态
docker ps

# 进入容器
docker exec -it frontend /bin/sh
```

**Kubernetes命令**：
```bash
# 查看所有资源
kubectl get all

# 查看Pod详情
kubectl describe pod <pod-name>

# 查看Pod日志
kubectl logs <pod-name>

# 端口转发
kubectl port-forward <pod-name> 3001:3001
```

**Git命令**：
```bash
# 查看分支
git branch -a

# 切换分支
git checkout <branch-name>

# 查看提交历史
git log --oneline

# 查看状态
git status
```

### 7.3 故障排除

**数据库连接问题**：
- 检查MongoDB服务是否运行
- 验证数据库连接字符串
- 检查网络连接和防火墙规则

**API调用失败**：
- 检查后端服务是否运行
- 验证API路径和参数
- 查看后端日志

**前端构建失败**：
- 检查依赖是否安装正确
- 验证TypeScript类型
- 查看构建日志

**容器启动失败**：
- 检查Dockerfile语法
- 验证环境变量配置
- 查看容器日志

## 8. 结论

通过实施本指南中的版本管理和容器化部署方案，小诺项目将获得：

- **标准化的开发流程**：规范的Git工作流和提交规范
- **一致的部署环境**：容器化确保开发、测试和生产环境一致
- **自动化的CI/CD**：减少手动操作，提高部署可靠性
- **可扩展的架构**：Kubernetes支持自动扩缩容
- **完善的监控体系**：及时发现和解决问题

本指南将随着项目的发展和技术的进步不断更新和完善。
