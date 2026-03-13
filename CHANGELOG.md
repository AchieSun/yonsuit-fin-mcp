# 更新日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.3] - 2026-03-13

### 优化

- **移除crypto-js依赖**: 使用Node.js原生crypto模块替代crypto-js库
  - 减少约500KB包体积
  - 提高运行效率（原生模块更快）
  - 重构所有加密方法：HmacSHA256、SHA256、MD5、Base64编码/解码
- **统一错误处理**: 创建统一的错误处理工具函数
  - 新增 `handleToolError` 函数用于统一处理工具错误
  - 新增 `handleToolSuccess` 函数用于统一返回成功响应
  - 提高代码可维护性和一致性

### 移除

- 移除 `crypto-js` 依赖
- 移除 `@types/crypto-js` 依赖

## [1.0.2] - 2026-03-13

### 修复

- **npx兼容性修复**: 添加shebang (`#!/usr/bin/env node`) 到入口文件，确保npx命令可以正确执行
- **TypeScript编译配置**: 修改 `tsconfig.build.json` 中的 `removeComments` 为 `false`，保留shebang

## [1.0.1] - 2026-03-13

### 修复

- **MCP兼容性修复**: 将环境变量检查从模块加载时延迟到运行时，解决MCP客户端启动失败的问题
  - 将 `getRequiredEnv` 改为 `getEnv`，避免模块加载时立即检查环境变量
  - 环境变量验证现在在 `validateConfig` 函数中执行
- **包名更新**: 更新包名为 `@archiesun/yonsuit-fin-mcp`
- **API路径修正**: 根据实际用友API文档更新了凭证相关API路径
  - 凭证列表查询: `/yonbip/fi/ficloud/openapi/voucher/queryVouchers`
  - 凭证详情查询: `/yonbip/EFI/openapi/voucher/queryVoucherById`
  - 凭证保存: `/yonbip/fi/ficloud/openapi/voucher/addVoucher`
  - 凭证类型查询: `/yonbip/AMP/yonbip-fi-epub/vouchertype/bill/list`

### 改进

- **内存泄漏修复**: 修复了缓存定时器的内存泄漏问题
  - 添加了 `cacheCleanupTimer` 和 `destroy()` 方法
- **配置优化**: 改进了环境变量的加载和验证逻辑
- **错误处理**: 增强了错误处理和日志记录

### 文档

- 更新了 README.md 中的安装和使用说明
- 添加了 MCP 配置示例

## [1.0.0] - 2026-03-11

### 新增

- 项目基础架构搭建
- 完整的目录结构设计
  - src/config - 配置管理模块
  - src/auth - 认证授权模块
  - src/signature - 签名验证模块
  - src/client - API客户端模块
  - src/tools - MCP工具定义模块
  - src/services - 业务服务模块
  - src/utils - 工具函数模块
  - src/types - 类型定义模块
  - src/server - MCP服务器模块
- TypeScript项目配置
  - tsconfig.json - 开发环境配置
  - tsconfig.build.json - 生产构建配置
- 项目依赖配置
  - Node.js v20.x 支持
  - @modelcontextprotocol/sdk - MCP协议SDK
  - axios - HTTP客户端
  - crypto-js - 加密签名
  - winston - 日志管理
  - zod - 数据验证
  - dotenv - 环境变量管理
- 环境变量配置模板 (.env.example)
- 开发工具配置
  - ESLint代码检查
  - Prettier代码格式化
  - Jest测试框架
- 基础文档
  - README.md - 项目说明文档
  - CHANGELOG.md - 更新日志

### 技术栈

- 运行时: Node.js v20.x
- 语言: TypeScript 5.7.x
- 协议: Model Context Protocol (MCP)
- HTTP客户端: Axios
- 日志: Winston
- 验证: Zod

### 下一步计划

- [ ] 实现配置管理模块
- [ ] 实现认证模块
- [ ] 实现签名模块
- [ ] 实现API客户端
- [ ] 实现MCP工具
- [ ] 实现业务服务
- [ ] 编写单元测试
- [ ] 完善文档

## 版本说明

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正
