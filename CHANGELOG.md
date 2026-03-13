# 更新日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
