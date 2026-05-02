# Стадия сборки
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

# Копируем исходный код и собираем
COPY frontend/ .
RUN npm run build

# Стадия сервера (Caddy)
FROM caddy:alpine

# Копируем собранные файлы из предыдущей стадии
COPY --from=builder /app/build /usr/share/caddy

# Копируем конфиг Caddy (опционально, можно использовать встроенный)
COPY frontend/Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]