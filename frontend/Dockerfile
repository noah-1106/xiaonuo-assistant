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