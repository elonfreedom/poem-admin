# 晓诗管理后台前端 - Docker 镜像
# 基于 Nginx Alpine 提供静态资源服务

FROM nginx:1.27-alpine

# 移除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 自定义 Nginx 配置（支持 SPA 路由回退）
COPY nginx.conf /etc/nginx/conf.d/poem-admin.conf

# 复制构建产物
COPY dist /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
