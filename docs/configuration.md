# 用友做账MCP服务器配置文档

本文档详细说明用友做账MCP服务器的所有配置项，包括环境变量配置、业务配置和高级配置。

## 目录

- [配置方式](#配置方式)
- [环境变量配置](#环境变量配置)
- [配置文件详解](#配置文件详解)
- [配置示例](#配置示例)
- [配置验证](#配置验证)
- [常见配置场景](#常见配置场景)

---

## 配置方式

用友做账MCP服务器支持以下配置方式：

### 1. 环境变量（推荐）

通过 `.env` 文件或系统环境变量配置：

```bash
# 复制示例配置
cp .env.example .env

# 编辑配置文件
vim .env
```

### 2. Docker环境变量

在 `docker-compose.yml` 中配置：

```yaml
services:
  yonyou-mcp:
    environment:
      - YONYOU_APP_KEY=your_key
      - YONYOU_APP_SECRET=your_secret
```

### 3. 命令行参数

启动时传入环境变量：

```bash
YONYOU_APP_KEY=your_key npm start
```

---

## 环境变量配置

### 用友API配置（必填）

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `YONYOU_API_BASE_URL` | 是 | - | 用友API基础地址 |
| `YONYOU_APP_KEY` | 是 | - | 用友应用Key |
| `YONYOU_APP_SECRET` | 是 | - | 用友应用Secret |
| `YONYOU_TENANT_ID` | 是 | - | 租户ID |
| `YONYOU_USER_ID` | 否 | - | 用户ID |
| `YONYOU_DATA_CENTER_DOMAIN` | 是 | - | 数据中心域名 |

#### 配置示例

```env
# 用友API配置
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=abc123def456
YONYOU_APP_SECRET=secret_key_here
YONYOU_TENANT_ID=tenant_001
YONYOU_USER_ID=user_001
YONYOU_DATA_CENTER_DOMAIN=dc01.yonyoucloud.com
```

### 认证配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `YONYOU_AUTH_TYPE` | 否 | `app_auth` | 认证类型 |
| `YONYOU_TOKEN_CACHE_TTL` | 否 | `7200` | Token缓存时间（秒） |

#### 认证类型说明

- `app_auth`: 应用认证（推荐）
- `user_auth`: 用户认证

#### 配置示例

```env
# 认证配置
YONYOU_AUTH_TYPE=app_auth
YONYOU_TOKEN_CACHE_TTL=7200
```

### 签名配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `YONYOU_SIGNATURE_ALGORITHM` | 否 | `SHA256` | 签名算法 |
| `YONYOU_SIGNATURE_VERSION` | 否 | `v1` | 签名版本 |

#### 配置示例

```env
# 签名配置
YONYOU_SIGNATURE_ALGORITHM=SHA256
YONYOU_SIGNATURE_VERSION=v1
```

### 日志配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `LOG_LEVEL` | 否 | `info` | 日志级别 |
| `LOG_FORMAT` | 否 | `json` | 日志格式 |
| `LOG_FILE_PATH` | 否 | `./logs/yonyou-mcp.log` | 日志文件路径 |

#### 日志级别说明

- `error`: 仅错误日志
- `warn`: 警告和错误日志
- `info`: 信息、警告和错误日志（推荐）
- `debug`: 调试、信息、警告和错误日志
- `trace`: 所有日志

#### 日志格式说明

- `json`: JSON格式（推荐生产环境）
- `text`: 文本格式（推荐开发环境）

#### 配置示例

```env
# 日志配置 - 生产环境
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=/app/logs/yonyou-mcp.log

# 日志配置 - 开发环境
LOG_LEVEL=debug
LOG_FORMAT=text
LOG_FILE_PATH=./logs/yonyou-mcp.log
```

### MCP服务器配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `MCP_SERVER_NAME` | 否 | `yonyou-mcp` | 服务器名称 |
| `MCP_SERVER_VERSION` | 否 | `1.0.0` | 服务器版本 |
| `MCP_TRANSPORT_TYPE` | 否 | `stdio` | 传输类型 |

#### 传输类型说明

- `stdio`: 标准输入输出（推荐）
- `http`: HTTP传输（实验性）

#### 配置示例

```env
# MCP服务器配置
MCP_SERVER_NAME=yonyou-mcp
MCP_SERVER_VERSION=1.0.0
MCP_TRANSPORT_TYPE=stdio
```

### 网络配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `HTTP_TIMEOUT` | 否 | `30000` | HTTP请求超时（毫秒） |
| `HTTP_MAX_RETRIES` | 否 | `3` | 最大重试次数 |
| `HTTP_RETRY_DELAY` | 否 | `1000` | 重试延迟（毫秒） |

#### 配置示例

```env
# 网络配置
HTTP_TIMEOUT=30000
HTTP_MAX_RETRIES=3
HTTP_RETRY_DELAY=1000
```

### 业务配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DEFAULT_ACCOUNT_BOOK` | 否 | - | 默认账簿代码 |
| `DEFAULT_CURRENCY` | 否 | `CNY` | 默认币种 |
| `DEFAULT_VOUCHER_TYPE` | 否 | `记-1` | 默认凭证类型 |

#### 配置示例

```env
# 业务配置
DEFAULT_ACCOUNT_BOOK=default_book
DEFAULT_CURRENCY=CNY
DEFAULT_VOUCHER_TYPE=记-1
```

### 缓存配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `CACHE_ENABLED` | 否 | `true` | 是否启用缓存 |
| `CACHE_TTL` | 否 | `3600` | 缓存时间（秒） |
| `CACHE_MAX_SIZE` | 否 | `1000` | 最大缓存数量 |

#### 配置示例

```env
# 缓存配置
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
```

### 安全配置

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_REQUEST_SIGNATURE` | 否 | `true` | 是否启用请求签名 |
| `ENABLE_RESPONSE_VALIDATION` | 否 | `true` | 是否启用响应验证 |

#### 配置示例

```env
# 安全配置
ENABLE_REQUEST_SIGNATURE=true
ENABLE_RESPONSE_VALIDATION=true
```

---

## 配置文件详解

### 完整配置示例

```env
# ============================================
# 用友做账MCP服务器配置文件
# ============================================

# --------------------------------------------
# 用友API配置（必填）
# --------------------------------------------
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=your_app_key_here
YONYOU_APP_SECRET=your_app_secret_here
YONYOU_TENANT_ID=your_tenant_id_here
YONYOU_USER_ID=your_user_id_here
YONYOU_DATA_CENTER_DOMAIN=your_data_center_domain_here

# --------------------------------------------
# 认证配置
# --------------------------------------------
YONYOU_AUTH_TYPE=app_auth
YONYOU_TOKEN_CACHE_TTL=7200

# --------------------------------------------
# 签名配置
# --------------------------------------------
YONYOU_SIGNATURE_ALGORITHM=SHA256
YONYOU_SIGNATURE_VERSION=v1

# --------------------------------------------
# 日志配置
# --------------------------------------------
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE_PATH=./logs/yonyou-mcp.log

# --------------------------------------------
# MCP服务器配置
# --------------------------------------------
MCP_SERVER_NAME=yonyou-mcp
MCP_SERVER_VERSION=1.0.0
MCP_TRANSPORT_TYPE=stdio

# --------------------------------------------
# 网络配置
# --------------------------------------------
HTTP_TIMEOUT=30000
HTTP_MAX_RETRIES=3
HTTP_RETRY_DELAY=1000

# --------------------------------------------
# 业务配置
# --------------------------------------------
DEFAULT_ACCOUNT_BOOK=default_book_code
DEFAULT_CURRENCY=CNY
DEFAULT_VOUCHER_TYPE=记-1

# --------------------------------------------
# 缓存配置
# --------------------------------------------
CACHE_ENABLED=true
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# --------------------------------------------
# 安全配置
# --------------------------------------------
ENABLE_REQUEST_SIGNATURE=true
ENABLE_RESPONSE_VALIDATION=true
```

---

## 配置示例

### 开发环境配置

```env
# 开发环境配置

# 用友API配置
YONYOU_API_BASE_URL=https://api-test.yonyoucloud.com
YONYOU_APP_KEY=dev_app_key
YONYOU_APP_SECRET=dev_app_secret
YONYOU_TENANT_ID=dev_tenant
YONYOU_DATA_CENTER_DOMAIN=dev.yonyoucloud.com

# 日志配置 - 开发环境使用debug级别
LOG_LEVEL=debug
LOG_FORMAT=text

# 缓存配置 - 开发环境可关闭缓存
CACHE_ENABLED=false
```

### 测试环境配置

```env
# 测试环境配置

# 用友API配置
YONYOU_API_BASE_URL=https://api-test.yonyoucloud.com
YONYOU_APP_KEY=test_app_key
YONYOU_APP_SECRET=test_app_secret
YONYOU_TENANT_ID=test_tenant
YONYOU_DATA_CENTER_DOMAIN=test.yonyoucloud.com

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json

# 缓存配置
CACHE_ENABLED=true
CACHE_TTL=1800
```

### 生产环境配置

```env
# 生产环境配置

# 用友API配置
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=prod_app_key
YONYOU_APP_SECRET=prod_app_secret
YONYOU_TENANT_ID=prod_tenant
YONYOU_DATA_CENTER_DOMAIN=prod.yonyoucloud.com

# 日志配置 - 生产环境使用info级别
LOG_LEVEL=info
LOG_FORMAT=json

# 网络配置 - 生产环境增加超时时间
HTTP_TIMEOUT=60000
HTTP_MAX_RETRIES=5
HTTP_RETRY_DELAY=2000

# 缓存配置 - 生产环境启用缓存
CACHE_ENABLED=true
CACHE_TTL=7200
CACHE_MAX_SIZE=2000

# 安全配置
ENABLE_REQUEST_SIGNATURE=true
ENABLE_RESPONSE_VALIDATION=true
```

---

## 配置验证

### 自动验证

服务器启动时会自动验证配置：

```bash
npm start
```

如果配置有误，会看到错误提示：

```
[ERROR] 配置验证失败: 缺少必要的环境变量 YONYOU_APP_KEY
```

### 手动验证

创建验证脚本 `scripts/validate-config.js`：

```javascript
const requiredVars = [
  'YONYOU_API_BASE_URL',
  'YONYOU_APP_KEY',
  'YONYOU_APP_SECRET',
  'YONYOU_TENANT_ID',
  'YONYOU_DATA_CENTER_DOMAIN',
];

console.log('验证配置...\n');

let hasError = false;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ ${varName}: 未设置`);
    hasError = true;
  } else {
    console.log(`✓ ${varName}: 已设置`);
  }
});

if (hasError) {
  console.error('\n配置验证失败！');
  process.exit(1);
} else {
  console.log('\n配置验证通过！');
  process.exit(0);
}
```

运行验证：

```bash
node scripts/validate-config.js
```

---

## 常见配置场景

### 场景1: 基础部署

最简单的配置，只需要必填项：

```env
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=your_key
YONYOU_APP_SECRET=your_secret
YONYOU_TENANT_ID=your_tenant
YONYOU_DATA_CENTER_DOMAIN=your_domain
```

### 场景2: 高性能部署

优化性能的配置：

```env
# 基础配置
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=your_key
YONYOU_APP_SECRET=your_secret
YONYOU_TENANT_ID=your_tenant
YONYOU_DATA_CENTER_DOMAIN=your_domain

# 性能优化
CACHE_ENABLED=true
CACHE_TTL=7200
CACHE_MAX_SIZE=5000
HTTP_TIMEOUT=60000
HTTP_MAX_RETRIES=5

# 日志优化
LOG_LEVEL=warn
LOG_FORMAT=json
```

### 场景3: 调试模式

用于问题排查：

```env
# 基础配置
YONYOU_API_BASE_URL=https://api.yonyoucloud.com
YONYOU_APP_KEY=your_key
YONYOU_APP_SECRET=your_secret
YONYOU_TENANT_ID=your_tenant
YONYOU_DATA_CENTER_DOMAIN=your_domain

# 调试配置
LOG_LEVEL=debug
LOG_FORMAT=text
CACHE_ENABLED=false
ENABLE_REQUEST_SIGNATURE=true
ENABLE_RESPONSE_VALIDATION=true
```

### 场景4: 多租户部署

为不同租户创建不同的配置文件：

```bash
# 租户A配置
.env.tenant-a

# 租户B配置
.env.tenant-b
```

启动时指定配置：

```bash
# 启动租户A服务
cp .env.tenant-a .env
docker-compose up -d

# 或使用不同的compose文件
docker-compose -f docker-compose.tenant-a.yml up -d
```

### 场景5: Docker Swarm部署

使用Docker secrets管理敏感配置：

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  yonyou-mcp:
    image: yonyou-mcp:latest
    secrets:
      - yonyou_app_key
      - yonyou_app_secret
    environment:
      - YONYOU_APP_KEY_FILE=/run/secrets/yonyou_app_key
      - YONYOU_APP_SECRET_FILE=/run/secrets/yonyou_app_secret

secrets:
  yonyou_app_key:
    external: true
  yonyou_app_secret:
    external: true
```

创建secrets：

```bash
echo "your_app_key" | docker secret create yonyou_app_key -
echo "your_app_secret" | docker secret create yonyou_app_secret -
```

---

## 配置最佳实践

### 1. 敏感信息管理

- 不要将 `.env` 文件提交到版本控制
- 使用 `.env.example` 作为模板
- 生产环境使用密钥管理服务

### 2. 环境隔离

- 为不同环境创建不同的配置文件
- 使用 `NODE_ENV` 区分环境

### 3. 配置验证

- 启动前验证配置
- 使用配置模式验证

### 4. 文档维护

- 保持配置文档更新
- 记录配置变更历史

### 5. 安全建议

- 定期轮换密钥
- 限制配置文件访问权限
- 审计配置变更

---

## 配置问题排查

### 问题1: 配置未生效

**症状**: 修改配置后未生效

**解决方案**:

```bash
# 重启服务
docker-compose restart

# 或重新构建
docker-compose down
docker-compose up -d
```

### 问题2: 环境变量优先级

**症状**: 多个配置源冲突

**优先级**（从高到低）:

1. 命令行环境变量
2. docker-compose.yml中的environment
3. .env文件
4. 默认值

### 问题3: 特殊字符处理

**症状**: 密钥包含特殊字符导致错误

**解决方案**:

```env
# 使用引号包裹
YONYOU_APP_SECRET="secret#with#special#chars"
```

---

## 附录

### 配置项完整列表

| 类别 | 变量名 | 必填 | 默认值 |
|------|--------|------|--------|
| API | YONYOU_API_BASE_URL | 是 | - |
| API | YONYOU_APP_KEY | 是 | - |
| API | YONYOU_APP_SECRET | 是 | - |
| API | YONYOU_TENANT_ID | 是 | - |
| API | YONYOU_USER_ID | 否 | - |
| API | YONYOU_DATA_CENTER_DOMAIN | 是 | - |
| 认证 | YONYOU_AUTH_TYPE | 否 | app_auth |
| 认证 | YONYOU_TOKEN_CACHE_TTL | 否 | 7200 |
| 签名 | YONYOU_SIGNATURE_ALGORITHM | 否 | SHA256 |
| 签名 | YONYOU_SIGNATURE_VERSION | 否 | v1 |
| 日志 | LOG_LEVEL | 否 | info |
| 日志 | LOG_FORMAT | 否 | json |
| 日志 | LOG_FILE_PATH | 否 | ./logs/yonyou-mcp.log |
| MCP | MCP_SERVER_NAME | 否 | yonyou-mcp |
| MCP | MCP_SERVER_VERSION | 否 | 1.0.0 |
| MCP | MCP_TRANSPORT_TYPE | 否 | stdio |
| 网络 | HTTP_TIMEOUT | 否 | 30000 |
| 网络 | HTTP_MAX_RETRIES | 否 | 3 |
| 网络 | HTTP_RETRY_DELAY | 否 | 1000 |
| 业务 | DEFAULT_ACCOUNT_BOOK | 否 | - |
| 业务 | DEFAULT_CURRENCY | 否 | CNY |
| 业务 | DEFAULT_VOUCHER_TYPE | 否 | 记-1 |
| 缓存 | CACHE_ENABLED | 否 | true |
| 缓存 | CACHE_TTL | 否 | 3600 |
| 缓存 | CACHE_MAX_SIZE | 否 | 1000 |
| 安全 | ENABLE_REQUEST_SIGNATURE | 否 | true |
| 安全 | ENABLE_RESPONSE_VALIDATION | 否 | true |

### 配置变更日志

| 版本 | 变更内容 |
|------|---------|
| 1.0.0 | 初始版本 |
