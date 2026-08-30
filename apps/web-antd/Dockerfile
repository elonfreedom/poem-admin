FROM nginx:1.27-alpine

# 删除默认配置（避免 server block 冲突导致 SPA 回退失效）
RUN rm -f /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/poem-admin.conf

# 健康检查（使用 127.0.0.1 避免 IPv6 localhost 连接失败）
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
