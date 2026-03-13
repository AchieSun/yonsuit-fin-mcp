# 用友做账MCP服务器部署文档

本文档详细说明如何部署用友做账MCP服务器，包括Docker容器化部署和传统部署方式。

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [Docker部署](#docker部署)
- [Docker Compose部署](#docker-compose部署)
- [生产环境部署](#生产环境部署)
- [监控和日志](#监控和日志)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 系统要求

### 硬件要求

| 资源 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 1核 | 2核+ |
| 内存 | 512MB | 1GB+ |
| 磁盘 | 1GB | 5GB+ |

### 软件要求

| 软件 | 版本要求 |
|------|---------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| Node.js | 20.0+ (传统部署) |
| npm | 9.0+ (传统部署) |

---

## 快速开始

### 1. 准备配置文件

```bash
# 克隆项目（如果还没有）
git clone <repository-url>
cd yonyou-mcp

# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

### 2. 配置必要参数

编辑 `.env` 文件，填入以下必要配置：

```env
# 用友API配置（必填）
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=your_app_key
YONYOU_APP_SECRET=your_app_secret
YONYOU_TENANT_ID=your_tenant_id
YONYOU_DATA_CENTER_DOMAIN=your_domain
```

### 3. 启动服务

```bash
# 使用Docker Compose启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

## Docker部署

### 构建镜像

```bash
# 构建镜像
docker build -t yonyou-mcp:latest .

# 构建指定版本
docker build -t yonyou-mcp:1.0.0 .
```

### 运行容器

#### 基本运行

```bash
docker run -d \
  --name yonyou-mcp-server \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  yonyou-mcp:latest
```

#### 完整配置运行

```bash
docker run -d \
  --name yonyou-mcp-server \
  --restart unless-stopped \
  --env-file .env \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -v $(pwd)/logs:/app/logs \
  --memory=512m \
  --cpus=1.0 \
  --health-cmd="node -e 'process.exit(0)'" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  yonyou-mcp:latest
```

### 容器管理

```bash
# 查看容器状态
docker ps

# 查看容器日志
docker logs -f yonyou-mcp-server

# 进入容器
docker exec -it yonyou-mcp-server sh

# 停止容器
docker stop yonyou-mcp-server

# 启动容器
docker start yonyou-mcp-server

# 重启容器
docker restart yonyou-mcp-server

# 删除容器
docker rm -f yonyou-mcp-server
```

---

## Docker Compose部署

### 基本部署

```bash
# 启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 扩展配置

创建 `docker-compose.override.yml` 文件进行本地配置覆盖：

```yaml
version: '3.8'

services:
  yonyou-mcp:
    environment:
      - LOG_LEVEL=debug
    volumes:
      - ./logs:/app/logs
```

### 多环境部署

#### 开发环境

```bash
# 使用开发配置
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

#### 生产环境

```bash
# 使用生产配置
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 生产环境部署

### 1. 安全配置

#### 使用密钥管理

不要在 `.env` 文件中硬编码敏感信息，使用Docker secrets或环境变量：

```bash
# 创建Docker secret
echo "your_app_secret" | docker secret create yonyou_app_secret -

# 在docker-compose.yml中引用
secrets:
  - yonyou_app_secret
```

#### 网络隔离

```yaml
networks:
  yonyou-network:
    driver: bridge
    internal: true  # 内部网络，无法访问外网
```

### 2. 资源限制

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 128M
```

### 3. 健康检查

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "process.exit(0)"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### 4. 日志管理

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

### 5. 自动重启策略

```yaml
restart: unless-stopped
```

---

## 监控和日志

### 日志查看

#### Docker日志

```bash
# 实时查看日志
docker logs -f yonyou-mcp-server

# 查看最近100行日志
docker logs --tail 100 yonyou-mcp-server

# 查看指定时间段的日志
docker logs --since 2024-01-01T00:00:00 yonyou-mcp-server
```

#### 应用日志

```bash
# 日志文件位置
./logs/yonyou-mcp.log

# 实时查看
tail -f logs/yonyou-mcp.log

# 搜索日志
grep "ERROR" logs/yonyou-mcp.log
```

### 监控指标

#### 容器监控

```bash
# 查看容器资源使用
docker stats yonyou-mcp-server

# 查看容器详细信息
docker inspect yonyou-mcp-server
```

#### 应用监控

容器内提供健康检查端点：

```bash
# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' yonyou-mcp-server
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

**症状**: 容器启动后立即退出

**排查步骤**:

```bash
# 查看容器日志
docker logs yonyou-mcp-server

# 查看退出代码
docker inspect --format='{{.State.ExitCode}}' yonyou-mcp-server

# 常见原因：
# - 配置文件缺失或格式错误
# - 环境变量未设置
# - 依赖服务不可用
```

**解决方案**:

```bash
# 检查配置文件
cat .env

# 验证环境变量
docker exec yonyou-mcp-server env | grep YONYOU

# 重新构建镜像
docker-compose build --no-cache
```

#### 2. API连接失败

**症状**: 日志显示用友API连接错误

**排查步骤**:

```bash
# 检查网络连接
docker exec yonyou-mcp-server ping api.yonyoucloud.com

# 检查API配置
docker exec yonyou-mcp-server env | grep YONYOU_API

# 查看详细错误日志
docker logs yonyou-mcp-server | grep -i error
```

**解决方案**:

- 验证API地址是否正确
- 检查App Key和App Secret是否有效
- 确认网络是否可访问用友API

#### 3. 内存不足

**症状**: 容器被OOM Killed

**排查步骤**:

```bash
# 查看容器内存使用
docker stats yonyou-mcp-server

# 查看是否被OOM Killed
docker inspect --format='{{.State.OOMKilled}}' yonyou-mcp-server
```

**解决方案**:

```bash
# 增加内存限制
docker update --memory=1g yonyou-mcp-server

# 或在docker-compose.yml中调整
deploy:
  resources:
    limits:
      memory: 1G
```

#### 4. 日志文件过大

**症状**: 磁盘空间不足

**解决方案**:

```bash
# 清理Docker日志
docker-compose down
rm -rf logs/*
docker-compose up -d

# 配置日志轮转
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

### 调试模式

```bash
# 启用调试日志
docker-compose down
docker-compose up -e LOG_LEVEL=debug

# 进入容器调试
docker exec -it yonyou-mcp-server sh
```

---

## 安全建议

### 1. 镜像安全

```bash
# 扫描镜像漏洞
docker scout cves yonyou-mcp:latest

# 使用特定版本标签，避免使用latest
docker pull yonyou-mcp:1.0.0
```

### 2. 容器安全

```yaml
# 限制容器权限
security_opt:
  - no-new-privileges:true

# 只读文件系统（可选）
read_only: true

# 删除不必要的capabilities
cap_drop:
  - ALL
```

### 3. 网络安全

```yaml
# 使用内部网络
networks:
  yonyou-network:
    internal: true

# 限制端口暴露
# 只暴露必要的端口
```

### 4. 密钥管理

```bash
# 使用Docker secrets（Swarm模式）
secrets:
  yonyou_app_secret:
    external: true

# 或使用环境变量文件
env_file:
  - .env.production
```

### 5. 定期更新

```bash
# 更新基础镜像
docker pull node:20-alpine

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose up -d
```

---

## 备份和恢复

### 备份

```bash
# 备份配置文件
tar -czf yonyou-mcp-config-$(date +%Y%m%d).tar.gz .env docker-compose.yml

# 备份日志
tar -czf yonyou-mcp-logs-$(date +%Y%m%d).tar.gz logs/

# 导出镜像
docker save yonyou-mcp:latest | gzip > yonyou-mcp-image-$(date +%Y%m%d).tar.gz
```

### 恢复

```bash
# 恢复配置
tar -xzf yonyou-mcp-config-20240101.tar.gz

# 导入镜像
docker load < yonyou-mcp-image-20240101.tar.gz

# 启动服务
docker-compose up -d
```

---

## 性能优化

### 1. 镜像优化

- 使用多阶段构建减小镜像大小
- 使用Alpine基础镜像
- 清理不必要的依赖

### 2. 运行时优化

```yaml
environment:
  - NODE_ENV=production
  - UV_THREADPOOL_SIZE=4
```

### 3. 资源优化

- 合理设置内存和CPU限制
- 启用健康检查
- 配置日志轮转

---

## 升级指南

### 1. 准备升级

```bash
# 备份当前版本
docker tag yonyou-mcp:latest yonyou-mcp:backup

# 备份配置和数据
tar -czf backup-$(date +%Y%m%d).tar.gz .env logs/
```

### 2. 执行升级

```bash
# 拉取最新代码
git pull

# 重新构建镜像
docker-compose build

# 停止旧服务
docker-compose down

# 启动新服务
docker-compose up -d
```

### 3. 验证升级

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 测试功能
# ... 执行功能测试 ...
```

### 4. 回滚（如果需要）

```bash
# 恢复旧版本镜像
docker tag yonyou-mcp:backup yonyou-mcp:latest

# 重启服务
docker-compose down
docker-compose up -d
```

---

## 联系支持

如遇到部署问题，请：

1. 查看本文档的故障排查章节
2. 检查应用日志和Docker日志
3. 提交Issue到项目仓库
4. 联系技术支持团队

---

## 附录

### Docker命令速查

| 命令 | 说明 |
|------|------|
| `docker-compose up -d` | 后台启动服务 |
| `docker-compose down` | 停止并删除容器 |
| `docker-compose logs -f` | 查看实时日志 |
| `docker-compose ps` | 查看服务状态 |
| `docker-compose restart` | 重启服务 |
| `docker-compose build` | 构建镜像 |
| `docker-compose pull` | 拉取镜像 |
| `docker-compose exec <service> sh` | 进入容器 |

### 环境变量速查

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| YONYOU_API_BASE_URL | 是 | - | 用友API地址 |
| YONYOU_APP_KEY | 是 | - | 应用Key |
| YONYOU_APP_SECRET | 是 | - | 应用Secret |
| YONYOU_TENANT_ID | 是 | - | 租户ID |
| LOG_LEVEL | 否 | info | 日志级别 |
| NODE_ENV | 否 | production | 运行环境 |
