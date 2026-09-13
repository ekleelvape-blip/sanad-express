# منصة سند SANAD - بيئة الإنتاج السحابية
FROM node:20-alpine
WORKDIR /app

# 1. تثبيت اعتماديات السيرفر الخفيفة
COPY server/package*.json ./server/
RUN cd server && npm install --production

# 2. نسخ كود السيرفر
COPY server ./server

# 3. نسخ واجهة العميل المترجمة والجاهزة مسبقاً مع كامل دعم الكاميرا والباركود
COPY client/dist ./client/dist
COPY client/public ./client/public

ENV PORT=5000
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "server/server.js"]
