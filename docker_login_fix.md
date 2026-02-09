# Docker Login 命令修复方案

## 问题分析

根据错误信息 `username is empty`，可以确定部署失败的原因是 Docker 登录时没有提供用户名。

## 正确的 Docker Login 命令格式

### 方法1：使用环境变量传递用户名和密码

```bash
# 登录镜像仓库
echo "${VOLCENGINE_CR_SECRET_KEY}" | docker login -u "${VOLCENGINE_CR_USERNAME}" --password-stdin "${VOLCENGINE_CR_REGISTRY}"

# 拉取最新镜像
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/frontend:latest"
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/backend:latest"

# 重启服务
cd /root/xiaonuo
# 这里需要根据你的实际情况添加重启服务的命令
```

### 方法2：直接使用 -u 和 -p 参数

```bash
# 登录镜像仓库
docker login -u "${VOLCENGINE_CR_USERNAME}" -p "${VOLCENGINE_CR_SECRET_KEY}" "${VOLCENGINE_CR_REGISTRY}"

# 拉取最新镜像
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/frontend:latest"
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/backend:latest"

# 重启服务
cd /root/xiaonuo
# 这里需要根据你的实际情况添加重启服务的命令
```

## 变量检查

请确保你已经在火山持续交付的变量管理中正确设置了以下变量：

- `VOLCENGINE_CR_USERNAME` - 镜像仓库用户名
- `VOLCENGINE_CR_SECRET_KEY` - 镜像仓库密码或密钥
- `VOLCENGINE_CR_REGISTRY` - 镜像仓库地址（如 `cr-cn-beijing.volces.com`）

## 额外建议

1. **添加错误处理**：在脚本中添加错误处理，确保命令失败时能够及时发现

2. **验证变量值**：在流水线执行前，可以添加一个步骤来打印变量值（注意不要在生产环境中打印密码）

3. **检查网络连接**：确保 ECS 服务器能够正常访问火山的镜像仓库

4. **添加镜像标签**：建议在构建时添加版本标签，而不是使用 `latest`，这样可以更好地控制部署版本

## 完整的部署脚本示例

```bash
#!/bin/bash

# 打印执行信息
set -x

# 检查变量是否存在
if [ -z "${VOLCENGINE_CR_USERNAME}" ] || [ -z "${VOLCENGINE_CR_SECRET_KEY}" ] || [ -z "${VOLCENGINE_CR_REGISTRY}" ]; then
  echo "错误：镜像仓库变量未设置"
  exit 1
fi

# 登录镜像仓库
echo "${VOLCENGINE_CR_SECRET_KEY}" | docker login -u "${VOLCENGINE_CR_USERNAME}" --password-stdin "${VOLCENGINE_CR_REGISTRY}"
if [ $? -ne 0 ]; then
  echo "错误：Docker 登录失败"
  exit 1
fi

# 拉取最新镜像
docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/frontend:latest"
if [ $? -ne 0 ]; then
  echo "错误：拉取前端镜像失败"
  exit 1
fi

docker pull "${VOLCENGINE_CR_REGISTRY}/xiaonuo/backend:latest"
if [ $? -ne 0 ]; then
  echo "错误：拉取后端镜像失败"
  exit 1
fi

# 重启服务
cd /root/xiaonuo
# 这里添加你的重启服务命令，例如：
# docker-compose down && docker-compose up -d

echo "部署完成！"
```