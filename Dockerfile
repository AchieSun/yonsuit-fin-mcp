# 用友做账MCP服务器 Dockerfile
# 多阶段构建，优化镜像大小

# ============================================
# 阶段1: 构建阶段
# ============================================
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
# Python和make/gcc用于编译原生模块
RUN apk add --no-cache python3 make g++

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括devDependencies，用于构建）
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建TypeScript代码
RUN npm run build

# 清理devDependencies，只保留生产依赖
RUN npm prune --production

# ============================================
# 阶段2: 生产阶段
# ============================================
FROM node:20-alpine AS production

# 设置工作目录
WORKDIR /app

# 安装tini作为PID 1进程，正确处理信号
RUN apk add --no-cache tini

# 创建非root用户
RUN addgroup -g 1001 -S nodejs \
    && adduser -S mcp -u 1001 -G nodejs

# 从构建阶段复制必要文件
COPY --from=builder --chown=mcp:nodejs /app/dist ./dist
COPY --from=builder --chown=mcp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mcp:nodejs /app/package*.json ./

# 创建日志目录
RUN mkdir -p logs && chown -R mcp:nodejs logs

# 设置环境变量
ENV NODE_ENV=production \
    LOG_LEVEL=info \
    LOG_FORMAT=json

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# 切换到非root用户
USER mcp

# 暴露端口（如果需要HTTP传输）
# EXPOSE 3000

# 设置入口点
ENTRYPOINT ["/sbin/tini", "--"]

# 默认命令
CMD ["node", "dist/index.js"]

# ============================================
# 元数据标签
# ============================================
LABEL maintainer="yonyou-mcp" \
      version="1.0.0" \
      description="用友做账MCP服务器 - 基于Model Context Protocol的用友财务系统对接服务" \
      org.opencontainers.image.source="https://github.com/your-org/yonyou-mcp" \
      org.opencontainers.image.description="用友做账MCP服务器" \
      org.opencontainers.image.licenses="MIT"
