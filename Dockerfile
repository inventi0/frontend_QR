# ============================================
# Runtime (Nginx)
# ============================================
FROM nginx:stable-alpine

# Копирование готового билда из локальной папки dist
COPY dist /usr/share/nginx/html

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
