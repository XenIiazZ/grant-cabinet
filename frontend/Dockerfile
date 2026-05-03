FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g vite          # <-- глобальная установка
COPY frontend/ .
RUN npm run build

FROM caddy:alpine
COPY --from=builder /app/build /usr/share/caddy
COPY frontend/Caddyfile /etc/caddy/Caddyfile
EXPOSE 3000
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]