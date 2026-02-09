# ============================================
# Stage 1: Builder
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

# Копирование package files и установка зависимостей
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts

# Копирование исходного кода
COPY . .

# Сборка production bundle
RUN npm run build

# ============================================
# Stage 2: Runtime (Nginx)
# ============================================
FROM nginx:stable-alpine

# Копирование build артефактов
COPY --from=build /app/dist /usr/share/nginx/html

# Копирование конфигурации Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создание non-root пользователя и настройка прав
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf || true

# Переключение на non-root пользователя
USER nginx

# Изменен порт на 8080 (non-root)
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]