FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]