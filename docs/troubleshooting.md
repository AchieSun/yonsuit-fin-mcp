# 故障排除指南

本文档提供用友做账MCP服务器常见问题的诊断和解决方案。

## 目录

- [安装和配置问题](#安装和配置问题)
- [连接和认证问题](#连接和认证问题)
- [凭证操作问题](#凭证操作问题)
- [科目和档案问题](#科目和档案问题)
- [性能问题](#性能问题)
- [错误代码参考](#错误代码参考)
- [调试技巧](#调试技巧)
- [获取帮助](#获取帮助)

---

## 安装和配置问题

### 问题1：npm install失败

**症状：**
```
npm ERR! code ECONNREFUSED
npm ERR! errno ECONNREFUSED
npm ERR! syscall connect
```

**解决方案：**

1. **检查网络连接**
```bash
# 测试网络连接
ping registry.npmjs.org
```

2. **切换npm镜像源**
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用官方镜像
npm config set registry https://registry.npmjs.org
```

3. **清除缓存重试**
```bash
npm cache clean --force
npm install
```

### 问题2：TypeScript编译错误

**症状：**
```
error TS2307: Cannot find module '@modelcontextprotocol/sdk' or its corresponding declarations.
```

**解决方案：**

1. **检查依赖是否安装**
```bash
npm list @modelcontextprotocol/sdk
```

2. **重新安装依赖**
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

3. **检查TypeScript版本**
```bash
npm install typescript@^5.7.2 --save-dev
```

### 问题3：环境变量未加载

**症状：**
```
Error: YONYOU_APP_KEY is required
```

**解决方案：**

1. **检查.env文件是否存在**
```bash
ls -la .env
```

2. **检查.env文件内容**
```bash
cat .env
```

3. **确保格式正确**
```env
# 正确格式
YONYOU_APP_KEY=your_app_key
YONYOU_APP_SECRET=your_app_secret

# 错误格式（不要有引号）
YONYOU_APP_KEY="your_app_key"  # 错误
```

---

## 连接和认证问题

### 问题1：签名验证失败

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Signature verification failed"
  }
}
```

**解决方案：**

1. **检查AppKey和AppSecret**
   - 确认 `YONYOU_APP_KEY` 和 `YONYOU_APP_SECRET` 正确无误
   - 注意不要有多余的空格或换行符

2. **检查签名算法**
   - 确认使用的签名算法与用友要求一致
   - 默认使用SHA256

3. **检查时间同步**
```bash
# 检查系统时间
date

# 如果时间不准确，同步时间
# macOS
sudo sntp -sS time.apple.com

# Windows
w32tm /resync
```

### 问题2：Token获取失败

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_ERROR",
    "message": "Failed to get access token"
  }
}
```

**解决方案：**

1. **检查租户ID**
   - 确认 `YONYOU_TENANT_ID` 正确
   - 租户ID通常是一个UUID格式

2. **检查数据中心域名**
   - 确认 `YONYOU_DATA_CENTER_DOMAIN` 正确
   - 格式通常为：`xxx.yonyoucloud.com`

3. **检查网络连接**
```bash
# 测试API连接
curl https://api.yonyoucloud.com/health
```

### 问题3：请求超时

**症状：**
```
Error: timeout of 30000ms exceeded
```

**解决方案：**

1. **增加超时时间**
```env
HTTP_TIMEOUT=60000
```

2. **检查网络状况**
   - 确认网络连接稳定
   - 检查是否有防火墙限制

3. **使用代理（如需要）**
```env
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080
```

---

## 凭证操作问题

### 问题1：创建凭证失败 - 借贷不平衡

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "SAVE_VOUCHER_ERROR",
    "message": "借贷不平衡"
  }
}
```

**解决方案：**

1. **检查借贷金额**
   - 确保所有分录的借方金额合计等于贷方金额合计
   - 每条分录只能有借方或贷方金额，不能同时填写

```json
{
  "entries": [
    {
      "accountCode": "1001",
      "summary": "提现",
      "debitAmount": 10000
    },
    {
      "accountCode": "1002",
      "summary": "提现",
      "creditAmount": 10000
    }
  ]
}
```

2. **验证金额精度**
   - 金额最多保留2位小数
   - 避免浮点数计算误差

### 问题2：创建凭证失败 - 科目不存在

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "SAVE_VOUCHER_ERROR",
    "message": "科目编码不存在: 1001"
  }
}
```

**解决方案：**

1. **查询科目是否存在**
```
请帮我查询科目1001的详细信息
```

2. **检查科目编码格式**
   - 科目编码通常为数字
   - 注意大小写（如果有字母）

3. **检查科目是否启用**
   - 禁用的科目不能用于凭证

### 问题3：删除凭证失败 - 已审核

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "DELETE_VOUCHER_ERROR",
    "message": "凭证已审核，不能删除"
  }
}
```

**解决方案：**

1. **反审核凭证**
   - 在用友系统中先进行反审核操作
   - 然后再删除

2. **检查凭证状态**
```
请帮我查询凭证详情，确认审核状态
```

### 问题4：修改凭证失败 - 已记账

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "SAVE_VOUCHER_ERROR",
    "message": "凭证已记账，不能修改"
  }
}
```

**解决方案：**

1. **反记账凭证**
   - 在用友系统中先进行反记账操作
   - 然后再修改

2. **创建红冲凭证**
   - 如果不能反记账，创建红冲凭证冲销

---

## 科目和档案问题

### 问题1：查询科目返回空结果

**症状：**
```json
{
  "success": true,
  "data": {
    "total": 0,
    "list": []
  }
}
```

**解决方案：**

1. **检查查询条件**
   - 确认查询参数正确
   - 尝试放宽查询条件

2. **检查权限**
   - 确认API账号有科目查询权限

3. **检查账簿**
   - 确认账簿已初始化

### 问题2：辅助核算项不正确

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "SAVE_VOUCHER_ERROR",
    "message": "辅助核算项不正确"
  }
}
```

**解决方案：**

1. **查询科目辅助核算设置**
```
请帮我查询科目660201的详细信息
```

2. **确认辅助核算值**
   - 检查辅助核算类型编码
   - 检查辅助核算值编码

3. **查询档案值**
```
请帮我查询部门档案，确认部门编码
```

### 问题3：币种不存在

**症状：**
```json
{
  "success": false,
  "error": {
    "code": "CURRENCY_NOT_FOUND",
    "message": "币种编码不存在: USD"
  }
}
```

**解决方案：**

1. **查询可用币种**
```
请帮我查询所有币种
```

2. **创建新币种（如需要）**
```
请帮我创建币种：
- 编码：USD
- 名称：美元
- 符号：$
```

---

## 性能问题

### 问题1：查询响应慢

**症状：**
查询操作耗时超过10秒

**解决方案：**

1. **使用分页查询**
```json
{
  "pageNum": 1,
  "pageSize": 20
}
```

2. **使用精确查询条件**
```json
{
  "accountingPeriod": "2024-01",
  "auditStatus": "audited"
}
```

3. **启用缓存**
```env
CACHE_ENABLED=true
CACHE_TTL=3600
```

### 问题2：大量数据查询内存溢出

**症状：**
```
JavaScript heap out of memory
```

**解决方案：**

1. **减少每页数量**
```json
{
  "pageNum": 1,
  "pageSize": 50
}
```

2. **增加Node.js内存限制**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

3. **分批处理数据**
   - 不要一次性查询所有数据
   - 使用循环分页处理

### 问题3：频繁API调用

**症状：**
短时间内大量API调用导致限流

**解决方案：**

1. **使用缓存**
   - 凭证类型、币种等基础数据会自动缓存
   - 合理设置缓存时间

2. **批量操作**
   - 使用批量查询接口
   - 避免循环调用单个查询

3. **添加请求间隔**
```env
HTTP_RETRY_DELAY=2000
```

---

## 错误代码参考

### 认证相关错误

| 错误码 | 描述 | 解决方案 |
|-------|------|---------|
| `AUTHENTICATION_ERROR` | 认证失败 | 检查AppKey和AppSecret |
| `TOKEN_EXPIRED` | Token过期 | 等待自动刷新或重启服务 |
| `INVALID_SIGNATURE` | 签名无效 | 检查签名算法和密钥 |
| `PERMISSION_DENIED` | 权限不足 | 联系管理员添加权限 |

### 凭证相关错误

| 错误码 | 描述 | 解决方案 |
|-------|------|---------|
| `SAVE_VOUCHER_ERROR` | 保存凭证失败 | 检查凭证数据完整性 |
| `DELETE_VOUCHER_ERROR` | 删除凭证失败 | 检查凭证状态 |
| `VOUCHER_NOT_FOUND` | 凭证不存在 | 检查凭证ID或凭证号 |
| `INVALID_VOUCHER_STATUS` | 凭证状态无效 | 检查审核/记账状态 |
| `BALANCE_NOT_MATCHED` | 借贷不平衡 | 检查分录金额 |

### 科目相关错误

| 错误码 | 描述 | 解决方案 |
|-------|------|---------|
| `ACCOUNT_NOT_FOUND` | 科目不存在 | 检查科目编码 |
| `ACCOUNT_DISABLED` | 科目已禁用 | 启用科目或使用其他科目 |
| `AUXILIARY_ITEM_ERROR` | 辅助核算错误 | 检查辅助核算设置 |

### 网络相关错误

| 错误码 | 描述 | 解决方案 |
|-------|------|---------|
| `NETWORK_ERROR` | 网络错误 | 检查网络连接 |
| `TIMEOUT_ERROR` | 请求超时 | 增加超时时间 |
| `RATE_LIMIT_EXCEEDED` | 请求频率超限 | 降低请求频率 |

---

## 调试技巧

### 1. 启用调试日志

```env
LOG_LEVEL=debug
```

### 2. 查看详细错误

```bash
# 查看最新日志
tail -f logs/yonyou-mcp.log

# 搜索错误
grep "ERROR" logs/yonyou-mcp.log

# 搜索特定操作
grep "save_voucher" logs/yonyou-mcp.log
```

### 3. 测试API连接

```bash
# 测试基础连接
curl -X GET "https://api.yonyoucloud.com/health"

# 测试认证
curl -X POST "https://api.yonyoucloud.com/api/auth" \
  -H "Content-Type: application/json" \
  -d '{"appKey":"your_key","appSecret":"your_secret"}'
```

### 4. 检查工具调用

在AI助手中，可以要求查看工具调用详情：

```
请显示刚才调用的工具名称和参数
```

---

## 获取帮助

如果以上方案都无法解决问题，请：

1. **查看日志文件**
   - 位置：`logs/yonyou-mcp.log`
   - 包含详细的错误信息和堆栈跟踪

2. **提交Issue**
   - 包含错误信息
   - 包含复现步骤
   - 包含环境信息（Node版本、操作系统等）

3. **联系技术支持**
   - 提供租户ID（不要提供密钥）
   - 描述问题场景
   - 提供错误日志

---

## 预防措施

### 1. 定期检查日志

```bash
# 每天检查错误日志
grep "ERROR" logs/yonyou-mcp.log | tail -n 50
```

### 2. 监控Token状态

```bash
# 检查Token是否正常刷新
grep "Token" logs/yonyou-mcp.log | tail -n 20
```

### 3. 备份配置

定期备份 `.env` 文件和重要配置。

### 4. 测试环境验证

在生产环境操作前，先在测试环境验证。

---

## 更多资源

- [API文档](./api.md) - 详细的API参数说明
- [使用指南](./usage.md) - 详细的使用示例
- [项目README](../README.md) - 项目概述和安装指南
- [用友开放平台文档](https://open.yonyoucloud.com) - 用友API官方文档
