# 1. بيئة بناء الواجهة الأمامية React
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# 2. بيئة تشغيل السيرفر الخفيفة
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY server ./server
COPY --from=client-builder /app/client/dist ./client/dist
COPY client/public ./client/public

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/server.js"]
