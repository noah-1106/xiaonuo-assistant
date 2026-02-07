# 多阶段构建
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm && \
    pnpm config set registry https://registry.npmmirror.com && \
    pnpm install

COPY . .

# 生产环境
FROM node:18-alpine

WORKDIR /app

# 复制所有依赖（包括生产依赖）
COPY --from=build /app/node_modules /app/node_modules

# 从构建阶段复制代码
COPY --from=build /app/src /app/src
COPY --from=build /app/cert /app/cert
COPY --from=build /app/package.json /app/package.json

# 添加构建信息
ARG BUILD_VERSION=latest
ARG BUILD_TIME
ARG BUILD_COMMIT

ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_TIME=${BUILD_TIME}
ENV BUILD_COMMIT=${BUILD_COMMIT}

EXPOSE 3001

CMD ["node", "src/index.js"]
