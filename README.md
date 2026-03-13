# 用友做账MCP服务器

基于 Model Context Protocol (MCP) 的用友财务系统对接服务，为AI助手提供用友做账能力。

## 项目简介

本项目是一个MCP（Model Context Protocol）服务器实现，旨在为AI助手（如Claude、ChatGPT等）提供与用友财务系统交互的能力。通过标准化的MCP协议，AI助手可以调用各种财务操作工具，实现凭证管理、科目查询、账簿查询等功能。

### 核心特性

- **完整的MCP协议支持** - 完全兼容MCP SDK，支持工具、资源、提示词管理
- **全面的用友API对接** - 支持凭证、科目、账簿、币种、档案等多种业务操作
- **自动签名和认证** - 内置用友API签名机制，自动处理Token管理
- **类型安全** - 使用TypeScript开发，提供完整的类型定义
- **完善的错误处理** - 详细的错误信息和日志记录
- **缓存优化** - 内置缓存机制，减少API调用次数

## 系统要求

- Node.js >= 20.0.0
- npm >= 9.0.0

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入实际的用友API配置：

```env
# 用友API配置（必填）
YONYOU_APP_KEY=your_app_key_here
YONYOU_APP_SECRET=your_app_secret_here
YONYOU_TENANT_ID=your_tenant_id_here

# 用户ID（可选）
YONYOU_USER_ID=your_user_id_here
```

### 3. 构建项目

```bash
npm run build
```

### 4. 运行服务

**开发模式：**
```bash
npm run dev
```

**生产模式：**
```bash
npm start
```

## 在AI助手中配置

### Claude Desktop配置

在Claude Desktop的配置文件中添加：

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "yonsuit-fin-mcp": {
      "command": "npx",
      "args": ["-y", "@archiesun/yonsuit-fin-mcp"],
      "env": {
        "YONYOU_APP_KEY": "your_app_key",
        "YONYOU_APP_SECRET": "your_app_secret",
        "YONYOU_TENANT_ID": "your_tenant_id"
      }
    }
  }
}
```

### 使用npx直接运行

```bash
npx -y @archiesun/yonsuit-fin-mcp
```

### 全局安装

```bash
npm install -g @archiesun/yonsuit-fin-mcp
yonsuit-fin-mcp
```

### 其他MCP客户端

本项目遵循标准MCP协议，可以在任何支持MCP的客户端中使用。请参考各客户端的文档进行配置。

## 项目结构

```
yonyou-mcp/
├── src/
│   ├── config/          # 配置管理
│   │   ├── constants.ts # 常量定义
│   │   ├── env.ts       # 环境变量处理
│   │   └── index.ts     # 配置导出
│   ├── auth/            # 认证模块
│   │   ├── index.ts     # 认证管理
│   │   └── token-manager.ts # Token缓存管理
│   ├── signature/       # 签名模块
│   │   └── index.ts     # API签名实现
│   ├── client/          # API客户端
│   │   ├── base-client.ts # 基础HTTP客户端
│   │   ├── errors.ts    # 错误定义
│   │   └── types.ts     # 客户端类型
│   ├── tools/           # MCP工具定义
│   │   ├── voucher.ts   # 凭证工具
│   │   ├── subject.ts   # 科目工具
│   │   ├── account.ts   # 账簿工具
│   │   ├── currency.ts  # 币种工具
│   │   ├── vouchertype.ts # 凭证类型工具
│   │   ├── custom-doc.ts # 自定义档案工具
│   │   └── index.ts     # 工具导出
│   ├── services/        # 业务服务
│   │   ├── voucher-service.ts # 凭证服务
│   │   └── archive-service.ts # 档案服务
│   ├── utils/           # 工具函数
│   │   ├── crypto.ts    # 加密工具
│   │   ├── logger.ts    # 日志工具
│   │   └── url.ts       # URL处理
│   ├── types/           # 类型定义
│   │   ├── auth.ts      # 认证类型
│   │   ├── voucher.ts   # 凭证类型
│   │   ├── yonyou.types.ts # 用友API类型
│   │   └── mcp.types.ts # MCP类型
│   ├── server/          # MCP服务器
│   │   └── mcp-server.ts # 服务器实现
│   └── index.ts         # 入口文件
├── dist/                # 编译输出
├── tests/               # 测试文件
├── docs/                # 文档目录
│   ├── api.md           # API文档
│   ├── usage.md         # 使用指南
│   └── troubleshooting.md # 故障排除
├── logs/                # 日志目录
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── .env.example
```

## MCP工具列表

### 凭证管理

| 工具名称 | 描述 |
|---------|------|
| `query_voucher_list` | 查询凭证列表，支持多条件筛选和分页 |
| `query_voucher_detail` | 查询凭证详情，包含所有分录明细 |
| `save_voucher` | 创建或更新凭证 |
| `delete_voucher` | 删除凭证（支持批量） |

### 科目管理

| 工具名称 | 描述 |
|---------|------|
| `account_query` | 查询科目列表 |
| `account_detail` | 查询科目详情 |
| `account_create` | 创建科目 |
| `account_update` | 更新科目 |
| `account_tree` | 查询科目树形结构 |

### 账簿查询

| 工具名称 | 描述 |
|---------|------|
| `accountbook_query` | 查询账簿列表 |
| `accountbook_detail` | 查询账簿详情 |
| `ledger_general` | 查询总账 |
| `ledger_detail` | 查询明细账 |
| `ledger_balance` | 查询余额表 |

### 凭证类型

| 工具名称 | 描述 |
|---------|------|
| `vouchertype_query` | 查询凭证类型列表 |
| `vouchertype_detail` | 查询凭证类型详情 |
| `vouchertype_create` | 创建凭证类型 |
| `vouchertype_update` | 更新凭证类型 |
| `vouchertype_default` | 获取默认凭证类型 |

### 币种管理

| 工具名称 | 描述 |
|---------|------|
| `currency_query` | 查询币种列表 |
| `currency_detail` | 查询币种详情 |
| `currency_base` | 获取本位币 |
| `currency_create` | 创建币种 |
| `currency_update` | 更新币种 |
| `exchange_rate_query` | 查询汇率 |
| `currency_batch_query` | 批量查询币种 |

### 自定义档案

| 工具名称 | 描述 |
|---------|------|
| `customdoc_query` | 查询自定义档案列表 |
| `customdoc_detail` | 查询自定义档案详情 |
| `department_query` | 查询部门档案 |
| `supplier_query` | 查询供应商档案 |
| `customer_query` | 查询客户档案 |
| `project_query` | 查询项目档案 |
| `personnel_query` | 查询人员档案 |
| `settlement_method_query` | 查询结算方式档案 |

## 开发指南

### 代码规范

```bash
npm run lint      # 代码检查
npm run format    # 代码格式化
npm run typecheck # 类型检查
```

### 测试

```bash
npm test              # 运行测试
npm run test:watch    # 监听模式
npm run test:coverage # 测试覆盖率
```

### 构建

```bash
npm run build    # 构建项目
npm run clean    # 清理构建产物
```

## 环境变量说明

### 必填配置

| 变量名 | 描述 | 示例 |
|-------|------|------|
| `YONYOU_APP_KEY` | 用友应用Key | `your_app_key` |
| `YONYOU_APP_SECRET` | 用友应用Secret | `your_app_secret` |
| `YONYOU_TENANT_ID` | 租户ID | `your_tenant_id` |

### 可选配置

| 变量名 | 描述 | 默认值 |
|-------|------|--------|
| `YONYOU_USER_ID` | 用户ID | - |
| `YONYOU_AUTH_TYPE` | 认证类型 | `app_auth` |
| `YONYOU_TOKEN_CACHE_TTL` | Token缓存时间(秒) | `7200` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `LOG_FORMAT` | 日志格式 | `json` |
| `HTTP_TIMEOUT` | HTTP超时时间(ms) | `30000` |
| `HTTP_MAX_RETRIES` | 最大重试次数 | `3` |

### 域名自动获取机制

系统会根据 `YONYOU_TENANT_ID` 自动获取用友数据中心的域名信息（包括 `gatewayUrl` 和 `tokenUrl`），无需手动配置。

**域名缓存机制：**
- 缓存文件路径：`~/.yonyou-mcp/cache/datacenter-{tenantId}.json`
- 缓存有效期：7天
- 缓存过期后会自动重新获取域名信息

## 初始化流程

每次调用MCP工具时，系统会自动执行以下验证流程：

```
域名存在性验证 -> Token过期验证 -> 业务请求
```

1. **域名存在性验证**：检查本地缓存中是否存在有效的域名信息，若不存在或已过期则自动从用友数据中心获取
2. **Token过期验证**：检查Token是否有效，若过期则自动刷新
3. **业务请求**：完成验证后执行实际的业务操作

## 文档

- [API文档](./docs/api.md) - 所有工具的详细API说明
- [使用指南](./docs/usage.md) - 详细的使用示例和最佳实践
- [故障排除](./docs/troubleshooting.md) - 常见问题和解决方案

## 安全说明

- 所有API请求均需签名验证
- 敏感信息通过环境变量管理，不会记录到日志
- Token自动缓存和刷新，避免频繁认证
- 支持请求和响应验证

## 许可证

MIT

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 贡献指南

欢迎提交Issue和Pull Request。在提交代码前，请确保：

1. 代码通过所有测试
2. 代码符合项目的代码规范
3. 添加必要的文档和注释

## 技术支持

如有问题，请提交Issue或联系项目维护者。
