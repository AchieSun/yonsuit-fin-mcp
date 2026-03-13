# 用友做账MCP服务层

## 概述

服务层（Service Layer）是用友做账MCP项目的业务逻辑封装层，提供了对用友API的高层次封装，简化了业务代码的编写。

## 目录结构

```
src/services/
├── index.ts                 # 服务模块入口
├── voucher-service.ts       # 凭证服务
├── archive-service.ts       # 档案服务
└── voucher.service.ts       # 凭证服务（旧版，保留兼容）
```

## 凭证服务（VoucherService）

### 功能列表

凭证服务封装了凭证相关的所有API操作：

| 方法 | API路径 | 说明 |
|------|---------|------|
| `list` | POST /yonbip/fi/ficloud/voucher/list | 凭证列表查询 |
| `detail` | POST /yonbip/fi/ficloud/voucher/detail | 凭证详情查询 |
| `save` | POST /yonbip/fi/ficloud/voucher/save | 凭证保存（创建/更新） |
| `create` | POST /yonbip/fi/ficloud/voucher/save | 创建凭证 |
| `update` | POST /yonbip/fi/ficloud/voucher/save | 更新凭证 |
| `delete` | POST /yonbip/fi/ficloud/voucher/delete | 删除凭证 |
| `audit` | POST /yonbip/fi/ficloud/voucher/audit | 凭证审核 |
| `unaudit` | POST /yonbip/fi/ficloud/voucher/unaudit | 凭证反审核 |
| `post` | POST /yonbip/fi/ficloud/voucher/post | 凭证记账 |
| `unpost` | POST /yonbip/fi/ficloud/voucher/unpost | 凭证反记账 |
| `void` | POST /yonbip/fi/ficloud/voucher/void | 凭证作废 |
| `checkBalance` | POST /yonbip/fi/ficloud/voucher/balance-check | 凭证试算平衡检查 |
| `import` | POST /yonbip/fi/ficloud/voucher/import | 凭证导入 |
| `export` | POST /yonbip/fi/ficloud/voucher/export | 凭证导出 |
| `copy` | POST /yonbip/fi/ficloud/voucher/copy | 凭证复制 |
| `summary` | POST /yonbip/fi/ficloud/voucher/summary | 凭证汇总查询 |
| `rearrange` | POST /yonbip/fi/ficloud/voucher/rearrange | 凭证整理 |

### 使用示例

```typescript
import { voucherService } from './services';

// 查询凭证列表
const vouchers = await voucherService.list({
  accountingPeriod: '2024-01',
  voucherTypeCode: '记',
}, {
  pageNum: 1,
  pageSize: 20,
});

// 查询凭证详情
const voucher = await voucherService.detail('voucher-id-123');

// 创建凭证
const newVoucher = await voucherService.create({
  voucherTypeCode: '记',
  voucherDate: '2024-01-15',
  accountingPeriod: '2024-01',
  entries: [
    {
      accountCode: '1001',
      summary: '提现',
      debitAmount: 1000,
    },
    {
      accountCode: '1002',
      summary: '提现',
      creditAmount: 1000,
    },
  ],
});

// 删除凭证
await voucherService.delete(['id1', 'id2'], '删除原因');

// 凭证审核
await voucherService.audit({
  ids: ['id1', 'id2'],
  auditor: '张三',
  auditOpinion: '审核通过',
});
```

## 档案服务（ArchiveService）

### 功能列表

档案服务封装了各类档案的查询操作：

| 方法 | API路径 | 说明 |
|------|---------|------|
| `queryAccountBooks` | POST /yonbip/fi/fipub/basedoc/querybd/accbook | 账簿查询 |
| `getAccountBookDetail` | POST /yonbip/fi/fipub/basedoc/querybd/accbook | 账簿详情 |
| `queryAccounts` | POST /yonbip/fi/fipub/basedoc/querybd | 科目查询 |
| `getAccountDetail` | POST /yonbip/fi/fipub/basedoc/querybd | 科目详情 |
| `getAccountTree` | POST /yonbip/fi/fipub/basedoc/querybd | 科目树查询 |
| `queryVoucherTypes` | POST /yonbip/AMP/yonbip-fi-epub/vouchertype/bill/list | 凭证类型查询 |
| `getVoucherTypeDetail` | POST /yonbip/AMP/yonbip-fi-epub/vouchertype/bill/list | 凭证类型详情 |
| `queryCustomArchives` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 自定义档案查询 |
| `queryDepartments` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 部门档案查询 |
| `querySuppliers` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 供应商档案查询 |
| `queryCustomers` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 客户档案查询 |
| `queryProjects` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 项目档案查询 |
| `queryPersonnel` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 人员档案查询 |
| `querySettlementMethods` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 结算方式查询 |
| `queryCurrencies` | POST /yonbip/digitalModel/currencytenant/batchQueryDetail | 币种查询 |
| `getCurrencyDetail` | POST /yonbip/digitalModel/currencytenant/batchQueryDetail | 币种详情 |
| `getBaseCurrency` | POST /yonbip/digitalModel/currencytenant/batchQueryDetail | 本位币查询 |
| `batchQueryArchives` | POST /yonbip/digitalModel/customerdoc/batchQueryDetail | 批量查询档案 |
| `batchQueryAccounts` | POST /yonbip/fi/fipub/basedoc/querybd | 批量查询科目 |
| `batchQueryCurrencies` | POST /yonbip/digitalModel/currencytenant/batchQueryDetail | 批量查询币种 |

### 使用示例

```typescript
import { archiveService } from './services';

// 查询账簿列表
const accountBooks = await archiveService.queryAccountBooks({
  fiscalYear: 2024,
  enabled: true,
});

// 查询科目列表
const accounts = await archiveService.queryAccounts({
  code: '1001',
  enabled: true,
});

// 查询凭证类型
const voucherTypes = await archiveService.queryVoucherTypes();

// 查询币种
const currencies = await archiveService.queryCurrencies();

// 查询部门档案
const departments = await archiveService.queryDepartments({
  name: '财务',
});

// 批量查询科目
const accountList = await archiveService.batchQueryAccounts(['1001', '1002', '1003']);

// 获取本位币
const baseCurrency = await archiveService.getBaseCurrency();
```

## 统一服务实例

服务层提供了统一的服务实例集合，方便使用：

```typescript
import { services } from './services';

// 使用凭证服务
const vouchers = await services.voucher.list({ accountingPeriod: '2024-01' });

// 使用档案服务
const accounts = await services.archive.queryAccounts();
```

## 错误处理

所有服务方法都会抛出异常，建议使用 try-catch 进行错误处理：

```typescript
import { voucherService } from './services';
import { logger } from './utils';

try {
  const voucher = await voucherService.create({
    voucherTypeCode: '记',
    voucherDate: '2024-01-15',
    accountingPeriod: '2024-01',
    entries: [
      // ... 分录数据
    ],
  });
  logger.info('凭证创建成功', { voucherNo: voucher.voucherNo });
} catch (error) {
  logger.error('凭证创建失败', error);
  // 处理错误
}
```

## 类型定义

服务层使用了完整的TypeScript类型定义，所有请求和响应类型都在 `src/types` 目录下定义：

- `VoucherCreateRequest` - 凭证创建请求
- `VoucherUpdateRequest` - 凭证更新请求
- `VoucherQueryParams` - 凭证查询参数
- `VoucherDetailResponse` - 凭证详情响应
- `VoucherListResponse` - 凭证列表响应
- `AccountBookQueryParams` - 账簿查询参数
- `AccountQueryParams` - 科目查询参数
- `VoucherTypeQueryParams` - 凭证类型查询参数
- `CustomArchiveQueryParams` - 自定义档案查询参数
- `CurrencyQueryParams` - 币种查询参数

## 测试

服务层包含完整的单元测试，位于 `tests/services` 目录：

```bash
# 运行所有测试
npm test

# 运行服务层测试
npm test -- services
```

## 最佳实践

1. **使用服务实例**：推荐使用导出的服务实例而不是创建新实例
2. **错误处理**：所有API调用都应该进行错误处理
3. **类型安全**：充分利用TypeScript的类型检查
4. **日志记录**：服务层已内置日志记录，无需额外添加
5. **批量操作**：对于批量操作，使用批量查询方法提高效率

## 注意事项

1. 所有API调用都需要认证，服务层会自动处理Token刷新
2. 服务层会自动添加租户信息和签名
3. 凭证保存前会自动进行借贷平衡检查
4. 档案查询结果会根据API返回格式自动处理
