# API文档

本文档详细说明了用友做账MCP服务器提供的所有工具接口。

## 目录

- [凭证管理](#凭证管理)
  - [query_voucher_list](#query_voucher_list)
  - [query_voucher_detail](#query_voucher_detail)
  - [save_voucher](#save_voucher)
  - [delete_voucher](#delete_voucher)
- [科目管理](#科目管理)
  - [account_query](#account_query)
  - [account_detail](#account_detail)
  - [account_create](#account_create)
  - [account_update](#account_update)
  - [account_tree](#account_tree)
- [账簿查询](#账簿查询)
  - [accountbook_query](#accountbook_query)
  - [accountbook_detail](#accountbook_detail)
  - [ledger_general](#ledger_general)
  - [ledger_detail](#ledger_detail)
  - [ledger_balance](#ledger_balance)
- [凭证类型](#凭证类型)
  - [vouchertype_query](#vouchertype_query)
  - [vouchertype_detail](#vouchertype_detail)
  - [vouchertype_create](#vouchertype_create)
  - [vouchertype_update](#vouchertype_update)
  - [vouchertype_default](#vouchertype_default)
- [币种管理](#币种管理)
  - [currency_query](#currency_query)
  - [currency_detail](#currency_detail)
  - [currency_base](#currency_base)
  - [currency_create](#currency_create)
  - [currency_update](#currency_update)
  - [exchange_rate_query](#exchange_rate_query)
  - [currency_batch_query](#currency_batch_query)
- [自定义档案](#自定义档案)
  - [customdoc_query](#customdoc_query)
  - [customdoc_detail](#customdoc_detail)
  - [department_query](#department_query)
  - [supplier_query](#supplier_query)
  - [customer_query](#customer_query)
  - [project_query](#project_query)
  - [personnel_query](#personnel_query)
  - [settlement_method_query](#settlement_method_query)

---

## 凭证管理

### query_voucher_list

查询用友凭证列表，支持多条件筛选和分页查询。

**功能说明：**
- 支持按凭证号、凭证类型、会计期间、日期范围等条件查询
- 支持按科目、制单人、审核人、记账人筛选
- 支持按审核状态、记账状态筛选
- 支持按金额范围筛选
- 支持关键字模糊查询（摘要）
- 支持分页查询

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| id | string | 否 | 凭证ID（精确查询） |
| voucherNo | string | 否 | 凭证号（精确查询，如：记-2024-01-001） |
| voucherTypeCode | string | 否 | 凭证类型编码（如：记-1、记-2、收-1、付-1等） |
| accountingPeriod | string | 否 | 会计期间，格式：YYYY-MM（如：2024-01） |
| voucherDateStart | string | 否 | 凭证日期开始，格式：YYYY-MM-DD |
| voucherDateEnd | string | 否 | 凭证日期结束，格式：YYYY-MM-DD |
| accountCode | string | 否 | 科目编码（支持模糊匹配） |
| maker | string | 否 | 制单人姓名 |
| auditor | string | 否 | 审核人姓名 |
| poster | string | 否 | 记账人姓名 |
| auditStatus | string | 否 | 审核状态：unaudited/audited/rejected |
| postStatus | string | 否 | 记账状态：unposted/posted |
| keyword | string | 否 | 关键字（用于摘要模糊查询） |
| amountMin | number | 否 | 金额最小值 |
| amountMax | number | 否 | 金额最大值 |
| accountBookCode | string | 否 | 账簿编码 |
| externalVoucherNo | string | 否 | 外部凭证号（用于对接外部系统） |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，默认20，最大100 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询成功，共找到 15 条凭证",
  "data": {
    "total": 15,
    "pageNum": 1,
    "pageSize": 20,
    "pages": 1,
    "list": [
      {
        "id": "voucher_001",
        "voucherNo": "记-2024-01-001",
        "voucherTypeCode": "记-1",
        "voucherDate": "2024-01-15",
        "accountingPeriod": "2024-01",
        "maker": "张三",
        "auditor": "李四",
        "poster": "王五",
        "auditStatus": "audited",
        "postStatus": "posted",
        "entryCount": 2,
        "totalAmount": 10000.00
      }
    ]
  }
}
```

---

### query_voucher_detail

查询用友凭证详细信息，包括凭证基本信息和所有分录明细。

**功能说明：**
- 通过凭证ID或凭证号查询凭证详情
- 返回凭证基本信息（凭证号、日期、期间、制单人等）
- 返回所有分录明细（科目、摘要、借贷金额、辅助核算等）
- 返回审核和记账状态信息

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| id | string | 否 | 凭证ID（与voucherNo二选一，优先使用id） |
| voucherNo | string | 否 | 凭证号（与id二选一，如：记-2024-01-001） |

**返回示例：**

```json
{
  "success": true,
  "message": "查询凭证详情成功",
  "data": {
    "id": "voucher_001",
    "voucherNo": "记-2024-01-001",
    "voucherTypeCode": "记-1",
    "voucherTypeName": "记账凭证",
    "voucherDate": "2024-01-15",
    "accountingPeriod": "2024-01",
    "maker": "张三",
    "auditor": "李四",
    "poster": "王五",
    "auditStatus": "audited",
    "postStatus": "posted",
    "attachmentCount": 2,
    "entries": [
      {
        "accountCode": "1001",
        "accountName": "库存现金",
        "summary": "提现",
        "debitAmount": 10000.00,
        "creditAmount": 0,
        "currencyCode": "CNY"
      },
      {
        "accountCode": "1002",
        "accountName": "银行存款",
        "summary": "提现",
        "debitAmount": 0,
        "creditAmount": 10000.00,
        "currencyCode": "CNY"
      }
    ]
  }
}
```

---

### save_voucher

保存用友凭证，支持创建新凭证或更新已有凭证。

**功能说明：**
- 创建凭证：不提供id，系统自动生成凭证号
- 更新凭证：提供id，修改已有凭证
- 自动验证凭证数据完整性和借贷平衡性
- 支持多币种、数量核算、辅助核算
- 支持现金流量项目指定

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| isUpdate | boolean | 否 | 是否为更新操作，true表示更新，false或不填表示创建 |
| id | string | 更新时必填 | 凭证ID |
| voucherNo | string | 否 | 凭证号（更新时可填，创建时系统自动生成） |
| voucherTypeCode | string | 是 | 凭证类型编码（如：记-1、收-1、付-1等） |
| voucherDate | string | 是 | 凭证日期，格式：YYYY-MM-DD |
| accountingPeriod | string | 是 | 会计期间，格式：YYYY-MM |
| accountBookCode | string | 否 | 账簿编码 |
| maker | string | 否 | 制单人 |
| attachmentCount | number | 否 | 附单据数 |
| remark | string | 否 | 备注 |
| externalVoucherNo | string | 否 | 外部凭证号 |
| modifyReason | string | 否 | 修改原因（更新时建议填写） |
| entries | array | 是 | 凭证分录列表（至少一条） |
| extFields | object | 否 | 扩展字段 |

**分录参数（entries数组元素）：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| accountCode | string | 是 | 科目编码 |
| summary | string | 是 | 摘要 |
| debitAmount | number | 否 | 借方金额（与creditAmount二选一） |
| creditAmount | number | 否 | 贷方金额（与debitAmount二选一） |
| currencyCode | string | 否 | 币种编码，默认CNY |
| exchangeRate | number | 否 | 汇率 |
| originalAmount | number | 否 | 原币金额 |
| quantity | number | 否 | 数量 |
| unitPrice | number | 否 | 单价 |
| settlementType | string | 否 | 结算方式 |
| settlementNo | string | 否 | 结算号 |
| settlementDate | string | 否 | 结算日期 |
| cashFlowCode | string | 否 | 现金流量项目编码 |
| auxiliaryItems | array | 否 | 辅助核算项 |

**返回示例：**

```json
{
  "success": true,
  "message": "创建凭证成功",
  "data": {
    "id": "voucher_002",
    "voucherNo": "记-2024-01-002",
    "voucherTypeCode": "记-1",
    "voucherDate": "2024-01-16",
    "accountingPeriod": "2024-01"
  }
}
```

---

### delete_voucher

删除用友凭证，支持批量删除。

**功能说明：**
- 支持批量删除多个凭证
- 只能删除未审核和未记账的凭证
- 删除操作不可恢复，请谨慎操作
- 建议填写删除原因以便审计

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| ids | array | 是 | 要删除的凭证ID列表 |
| reason | string | 否 | 删除原因（建议填写） |

**返回示例：**

```json
{
  "success": true,
  "message": "删除凭证成功，共删除 2 条凭证",
  "data": {
    "deletedCount": 2,
    "ids": ["voucher_001", "voucher_002"]
  }
}
```

---

## 科目管理

### account_query

查询科目列表，支持按编码、名称、类别、类型、级次等条件筛选。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 科目编码，支持模糊查询 |
| name | string | 否 | 科目名称，支持模糊查询 |
| category | string | 否 | 科目类别 |
| type | string | 否 | 科目类型 |
| parentCode | string | 否 | 上级科目编码 |
| level | number | 否 | 科目级次，1-5 |
| isLeaf | boolean | 否 | 是否末级科目 |
| currency | string | 否 | 币种编码 |
| balanceDirection | string | 否 | 余额方向：debit/credit |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询科目列表成功",
  "data": {
    "total": 100,
    "pageNum": 1,
    "pageSize": 20,
    "list": [
      {
        "code": "1001",
        "name": "库存现金",
        "category": "资产",
        "type": "流动资产",
        "level": 1,
        "isLeaf": true,
        "balanceDirection": "debit",
        "enabled": true
      }
    ]
  }
}
```

---

### account_detail

根据科目编码查询科目详细信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 科目编码 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询科目详情成功",
  "data": {
    "code": "1001",
    "name": "库存现金",
    "category": "资产",
    "type": "流动资产",
    "parentCode": "",
    "level": 1,
    "isLeaf": true,
    "balanceDirection": "debit",
    "currency": "CNY",
    "enabled": true,
    "auxiliaryItems": []
  }
}
```

---

### account_create

创建新的会计科目。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 科目编码 |
| name | string | 是 | 科目名称 |
| category | string | 是 | 科目类别 |
| type | string | 是 | 科目类型 |
| parentCode | string | 否 | 上级科目编码 |
| level | number | 否 | 科目级次，1-5 |
| currency | string | 否 | 币种编码，默认CNY |
| balanceDirection | string | 否 | 余额方向：debit/credit |
| enabled | boolean | 否 | 是否启用，默认true |

**返回示例：**

```json
{
  "success": true,
  "message": "创建科目成功",
  "data": {
    "code": "100101",
    "name": "现金-人民币",
    "category": "资产",
    "type": "流动资产"
  }
}
```

---

### account_update

更新会计科目信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 科目编码 |
| name | string | 否 | 科目名称 |
| category | string | 否 | 科目类别 |
| type | string | 否 | 科目类型 |
| currency | string | 否 | 币种编码 |
| balanceDirection | string | 否 | 余额方向：debit/credit |
| enabled | boolean | 否 | 是否启用 |

**返回示例：**

```json
{
  "success": true,
  "message": "更新科目成功",
  "data": {
    "code": "100101",
    "name": "现金-人民币",
    "enabled": true
  }
}
```

---

### account_tree

查询科目树形结构，支持指定根科目和最大深度。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| rootCode | string | 否 | 根科目编码，不传则查询完整科目树 |
| maxDepth | number | 否 | 最大深度，1-10 |
| includeDisabled | boolean | 否 | 是否包含未启用科目，默认false |

**返回示例：**

```json
{
  "success": true,
  "message": "查询科目树成功",
  "data": [
    {
      "code": "1001",
      "name": "库存现金",
      "level": 1,
      "children": [
        {
          "code": "100101",
          "name": "现金-人民币",
          "level": 2,
          "children": []
        }
      ]
    }
  ]
}
```

---

## 账簿查询

### accountbook_query

查询账簿列表，支持按编码、名称、类型、会计年度等条件筛选。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 账簿编码 |
| name | string | 否 | 账簿名称，支持模糊查询 |
| type | string | 否 | 账簿类型 |
| fiscalYear | number | 否 | 会计年度 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询账簿列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "code": "001",
        "name": "总账",
        "type": "general",
        "fiscalYear": 2024,
        "enabled": true
      }
    ]
  }
}
```

---

### accountbook_detail

根据账簿编码查询账簿详细信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 账簿编码 |

---

### ledger_general

查询总账，获取指定科目在指定期间内的汇总数据。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| accountCode | string | 是 | 科目编码 |
| startPeriod | string | 是 | 开始期间，格式：YYYY-MM |
| endPeriod | string | 是 | 结束期间，格式：YYYY-MM |
| currency | string | 否 | 币种编码，默认CNY |
| includeUnposted | boolean | 否 | 是否包含未记账凭证，默认false |

**返回示例：**

```json
{
  "success": true,
  "message": "查询总账成功",
  "data": {
    "accountCode": "1001",
    "accountName": "库存现金",
    "periods": [
      {
        "period": "2024-01",
        "openingBalance": 50000.00,
        "debitAmount": 10000.00,
        "creditAmount": 5000.00,
        "closingBalance": 55000.00
      }
    ]
  }
}
```

---

### ledger_detail

查询明细账，获取指定科目在指定期间内的明细数据。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| accountCode | string | 是 | 科目编码 |
| startPeriod | string | 是 | 开始期间，格式：YYYY-MM |
| endPeriod | string | 是 | 结束期间，格式：YYYY-MM |
| currency | string | 否 | 币种编码，默认CNY |
| includeUnposted | boolean | 否 | 是否包含未记账凭证，默认false |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认50 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询明细账成功",
  "data": {
    "accountCode": "1001",
    "accountName": "库存现金",
    "total": 10,
    "list": [
      {
        "voucherNo": "记-2024-01-001",
        "voucherDate": "2024-01-15",
        "summary": "提现",
        "debitAmount": 10000.00,
        "creditAmount": 0,
        "balance": 60000.00
      }
    ]
  }
}
```

---

### ledger_balance

查询余额表，获取指定期间内各科目的汇总数据。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| accountCode | string | 否 | 科目编码，不传则查询所有科目 |
| period | string | 是 | 会计期间，格式：YYYY-MM |
| level | number | 否 | 科目级次，1-5 |
| currency | string | 否 | 币种编码，默认CNY |
| includeUnposted | boolean | 否 | 是否包含未记账凭证，默认false |

**返回示例：**

```json
{
  "success": true,
  "message": "查询余额表成功",
  "data": [
    {
      "accountCode": "1001",
      "accountName": "库存现金",
      "openingDebit": 50000.00,
      "openingCredit": 0,
      "periodDebit": 10000.00,
      "periodCredit": 5000.00,
      "closingDebit": 55000.00,
      "closingCredit": 0
    }
  ]
}
```

---

## 凭证类型

### vouchertype_query

查询凭证类型列表，支持按编码、名称、简称等条件筛选。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 凭证类型编码 |
| name | string | 否 | 凭证类型名称，支持模糊查询 |
| shortName | string | 否 | 凭证类型简称 |
| enabled | boolean | 否 | 是否启用 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询凭证类型列表成功",
  "data": {
    "total": 3,
    "list": [
      {
        "code": "记-1",
        "name": "记账凭证",
        "shortName": "记",
        "enabled": true
      },
      {
        "code": "收-1",
        "name": "收款凭证",
        "shortName": "收",
        "enabled": true
      }
    ]
  }
}
```

---

### vouchertype_detail

根据凭证类型编码查询凭证类型详细信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 凭证类型编码 |

---

### vouchertype_create

创建新的凭证类型。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 凭证类型编码 |
| name | string | 是 | 凭证类型名称 |
| shortName | string | 是 | 凭证类型简称 |
| enabled | boolean | 否 | 是否启用，默认true |

---

### vouchertype_update

更新凭证类型信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 凭证类型编码 |
| name | string | 否 | 凭证类型名称 |
| shortName | string | 否 | 凭证类型简称 |
| enabled | boolean | 否 | 是否启用 |

---

### vouchertype_default

获取默认凭证类型，返回第一个启用的凭证类型。

**参数：** 无

**返回示例：**

```json
{
  "success": true,
  "message": "获取默认凭证类型成功",
  "data": {
    "code": "记-1",
    "name": "记账凭证",
    "shortName": "记",
    "enabled": true
  }
}
```

---

## 币种管理

### currency_query

查询币种列表，支持按编码、名称、是否本位币等条件筛选。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 币种编码，支持模糊查询 |
| name | string | 否 | 币种名称，支持模糊查询 |
| isBase | boolean | 否 | 是否本位币 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询币种列表成功",
  "data": {
    "total": 5,
    "list": [
      {
        "code": "CNY",
        "name": "人民币",
        "symbol": "¥",
        "isBase": true,
        "exchangeRate": 1,
        "enabled": true
      },
      {
        "code": "USD",
        "name": "美元",
        "symbol": "$",
        "isBase": false,
        "exchangeRate": 7.2,
        "enabled": true
      }
    ]
  }
}
```

---

### currency_detail

根据币种编码查询币种详细信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 币种编码 |

---

### currency_base

获取系统设置的本位币信息。

**参数：** 无

**返回示例：**

```json
{
  "success": true,
  "message": "获取本位币成功",
  "data": {
    "code": "CNY",
    "name": "人民币",
    "symbol": "¥",
    "isBase": true,
    "exchangeRate": 1
  }
}
```

---

### currency_create

创建新的币种。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 币种编码 |
| name | string | 是 | 币种名称 |
| symbol | string | 是 | 币种符号 |
| isBase | boolean | 否 | 是否本位币，默认false |
| exchangeRate | number | 否 | 汇率，默认1 |
| enabled | boolean | 否 | 是否启用，默认true |

---

### currency_update

更新币种信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 是 | 币种编码 |
| name | string | 否 | 币种名称 |
| symbol | string | 否 | 币种符号 |
| isBase | boolean | 否 | 是否本位币 |
| exchangeRate | number | 否 | 汇率 |
| enabled | boolean | 否 | 是否启用 |

---

### exchange_rate_query

查询两个币种之间的汇率。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| fromCurrency | string | 是 | 源币种编码 |
| toCurrency | string | 是 | 目标币种编码 |
| date | string | 否 | 日期，格式：YYYY-MM-DD，默认当天 |

**返回示例：**

```json
{
  "success": true,
  "message": "查询汇率成功",
  "data": {
    "fromCurrency": "USD",
    "toCurrency": "CNY",
    "rate": 7.2,
    "date": "2024-01-15"
  }
}
```

---

### currency_batch_query

批量查询多个币种信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| codes | array | 是 | 币种编码列表 |

---

## 自定义档案

### customdoc_query

查询自定义档案列表，支持按档案类型、编码、名称等条件筛选。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| docTypeCode | string | 是 | 档案类型编码 |
| code | string | 否 | 档案编码，支持模糊查询 |
| name | string | 否 | 档案名称，支持模糊查询 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

**档案类型编码：**
- `bd_deptdoc` - 部门
- `bd_supplier` - 供应商
- `bd_customer` - 客户
- `bd_project` - 项目
- `bd_psndoc` - 人员
- `bd_settlestyle` - 结算方式

**返回示例：**

```json
{
  "success": true,
  "message": "查询自定义档案列表成功",
  "data": {
    "total": 50,
    "list": [
      {
        "code": "DEPT001",
        "name": "财务部",
        "enabled": true
      }
    ]
  }
}
```

---

### customdoc_detail

根据档案类型和编码查询自定义档案详细信息。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| docTypeCode | string | 是 | 档案类型编码 |
| code | string | 是 | 档案编码 |

---

### department_query

查询部门档案列表。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 部门编码，支持模糊查询 |
| name | string | 否 | 部门名称，支持模糊查询 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

---

### supplier_query

查询供应商档案列表。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 供应商编码，支持模糊查询 |
| name | string | 否 | 供应商名称，支持模糊查询 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

---

### customer_query

查询客户档案列表。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 客户编码，支持模糊查询 |
| name | string | 否 | 客户名称，支持模糊查询 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

---

### project_query

查询项目档案列表。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 项目编码，支持模糊查询 |
| name | string | 否 | 项目名称，支持模糊查询 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

---

### personnel_query

查询人员档案列表。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 人员编码，支持模糊查询 |
| name | string | 否 | 人员姓名，支持模糊查询 |
| departmentCode | string | 否 | 部门编码 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

---

### settlement_method_query

查询结算方式档案列表。

**参数：**

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| code | string | 否 | 结算方式编码，支持模糊查询 |
| name | string | 否 | 结算方式名称，支持模糊查询 |
| enabled | boolean | 否 | 是否启用 |
| pageNum | number | 否 | 页码，从1开始，默认1 |
| pageSize | number | 否 | 每页数量，最大100，默认20 |

---

## 错误响应格式

所有工具在执行失败时都会返回统一的错误格式：

```json
{
  "success": false,
  "message": "错误描述信息",
  "error": {
    "code": "ERROR_CODE",
    "message": "详细错误信息"
  }
}
```

### 常见错误码

| 错误码 | 描述 |
|-------|------|
| `MISSING_REQUIRED_PARAM` | 缺少必填参数 |
| `INVALID_PARAM` | 参数格式不正确 |
| `QUERY_VOUCHER_LIST_ERROR` | 查询凭证列表失败 |
| `SAVE_VOUCHER_ERROR` | 保存凭证失败 |
| `DELETE_VOUCHER_ERROR` | 删除凭证失败 |
| `UNKNOWN_TOOL` | 未知的工具名称 |
| `TOOL_EXECUTION_ERROR` | 工具执行失败 |
| `AUTHENTICATION_ERROR` | 认证失败 |
| `API_ERROR` | API调用失败 |
