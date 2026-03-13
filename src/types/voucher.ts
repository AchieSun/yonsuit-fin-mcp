/**
 * 凭证相关类型定义
 * @module types/voucher
 */

import { VoucherEntry } from './yonyou.types';

/**
 * 凭证创建请求参数
 */
export interface VoucherCreateRequest {
  /** 凭证类型编码 */
  voucherTypeCode: string;
  /** 凭证日期 (格式: YYYY-MM-DD) */
  voucherDate: string;
  /** 会计期间 (格式: YYYY-MM) */
  accountingPeriod: string;
  /** 账簿编码 */
  accountBookCode?: string;
  /** 制单人 */
  maker?: string;
  /** 附单据数 */
  attachmentCount?: number;
  /** 凭证分录列表 */
  entries: VoucherEntryCreateRequest[];
  /** 备注 */
  remark?: string;
  /** 外部凭证号（用于对接外部系统） */
  externalVoucherNo?: string;
  /** 扩展字段 */
  extFields?: Record<string, unknown>;
}

/**
 * 凭证分录创建请求
 */
export interface VoucherEntryCreateRequest {
  /** 科目编码 */
  accountCode: string;
  /** 摘要 */
  summary: string;
  /** 借方金额 */
  debitAmount?: number;
  /** 贷方金额 */
  creditAmount?: number;
  /** 币种编码 */
  currencyCode?: string;
  /** 汇率 */
  exchangeRate?: number;
  /** 原币金额 */
  originalAmount?: number;
  /** 数量 */
  quantity?: number;
  /** 单价 */
  unitPrice?: number;
  /** 辅助核算项 */
  auxiliaryItems?: AuxiliaryItem[];
  /** 结算方式 */
  settlementType?: string;
  /** 结算号 */
  settlementNo?: string;
  /** 结算日期 */
  settlementDate?: string;
  /** 现金流量项目编码 */
  cashFlowCode?: string;
  /** 扩展字段 */
  extFields?: Record<string, unknown>;
}

/**
 * 辅助核算项
 */
export interface AuxiliaryItem {
  /** 辅助核算类型编码 */
  typeCode: string;
  /** 辅助核算类型名称 */
  typeName?: string;
  /** 辅助核算值编码 */
  valueCode: string;
  /** 辅助核算值名称 */
  valueName?: string;
}

/**
 * 凭证更新请求参数
 */
export interface VoucherUpdateRequest extends Partial<VoucherCreateRequest> {
  /** 凭证ID */
  id: string;
  /** 凭证号 */
  voucherNo?: string;
  /** 修改原因 */
  modifyReason?: string;
}

/**
 * 凭证查询参数
 */
export interface VoucherQueryParams {
  /** 凭证ID */
  id?: string;
  /** 凭证号 */
  voucherNo?: string;
  /** 凭证类型编码 */
  voucherTypeCode?: string;
  /** 会计期间 (格式: YYYY-MM) */
  accountingPeriod?: string;
  /** 凭证日期开始 */
  voucherDateStart?: string;
  /** 凭证日期结束 */
  voucherDateEnd?: string;
  /** 科目编码 */
  accountCode?: string;
  /** 制单人 */
  maker?: string;
  /** 审核人 */
  auditor?: string;
  /** 记账人 */
  poster?: string;
  /** 审核状态 */
  auditStatus?: AuditStatus;
  /** 记账状态 */
  postStatus?: PostStatus;
  /** 关键字（摘要模糊查询） */
  keyword?: string;
  /** 金额最小值 */
  amountMin?: number;
  /** 金额最大值 */
  amountMax?: number;
  /** 账簿编码 */
  accountBookCode?: string;
  /** 外部凭证号 */
  externalVoucherNo?: string;
}

/**
 * 审核状态枚举
 */
export type AuditStatus = 'unaudited' | 'audited' | 'rejected';

/**
 * 记账状态枚举
 */
export type PostStatus = 'unposted' | 'posted';

/**
 * 凭证详情响应
 */
export interface VoucherDetailResponse {
  /** 凭证ID */
  id: string;
  /** 凭证号 */
  voucherNo: string;
  /** 凭证类型编码 */
  voucherTypeCode: string;
  /** 凭证类型名称 */
  voucherTypeName: string;
  /** 会计期间 */
  accountingPeriod: string;
  /** 凭证日期 */
  voucherDate: string;
  /** 账簿编码 */
  accountBookCode: string;
  /** 账簿名称 */
  accountBookName: string;
  /** 制单人 */
  maker: string;
  /** 审核人 */
  auditor?: string;
  /** 审核日期 */
  auditDate?: string;
  /** 记账人 */
  poster?: string;
  /** 记账日期 */
  postDate?: string;
  /** 附单据数 */
  attachmentCount: number;
  /** 凭证分录 */
  entries: VoucherEntryDetail[];
  /** 借方合计 */
  totalDebit: number;
  /** 贷方合计 */
  totalCredit: number;
  /** 审核状态 */
  auditStatus: AuditStatus;
  /** 记账状态 */
  postStatus: PostStatus;
  /** 创建时间 */
  createTime: string;
  /** 修改时间 */
  modifyTime?: string;
  /** 备注 */
  remark?: string;
  /** 外部凭证号 */
  externalVoucherNo?: string;
  /** 扩展字段 */
  extFields?: Record<string, unknown>;
}

/**
 * 凭证分录详情
 */
export interface VoucherEntryDetail extends VoucherEntry {
  /** 分录序号 */
  sequenceNo: number;
  /** 科目全称 */
  accountFullName: string;
  /** 币种名称 */
  currencyName: string;
  /** 数量 */
  quantity?: number;
  /** 单价 */
  unitPrice?: number;
  /** 结算方式 */
  settlementType?: string;
  /** 结算号 */
  settlementNo?: string;
  /** 结算日期 */
  settlementDate?: string;
  /** 现金流量项目编码 */
  cashFlowCode?: string;
  /** 现金流量项目名称 */
  cashFlowName?: string;
  /** 辅助核算项 */
  auxiliaryItems?: AuxiliaryItem[];
}

/**
 * 凭证列表响应
 */
export interface VoucherListResponse {
  /** 数据列表 */
  list: VoucherListItem[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  pages: number;
}

/**
 * 凭证列表项
 */
export interface VoucherListItem {
  /** 凭证ID */
  id: string;
  /** 凭证号 */
  voucherNo: string;
  /** 凭证类型编码 */
  voucherTypeCode: string;
  /** 凭证类型名称 */
  voucherTypeName: string;
  /** 会计期间 */
  accountingPeriod: string;
  /** 凭证日期 */
  voucherDate: string;
  /** 制单人 */
  maker: string;
  /** 审核人 */
  auditor?: string;
  /** 记账人 */
  poster?: string;
  /** 借方合计 */
  totalDebit: number;
  /** 贷方合计 */
  totalCredit: number;
  /** 附单据数 */
  attachmentCount: number;
  /** 审核状态 */
  auditStatus: AuditStatus;
  /** 记账状态 */
  postStatus: PostStatus;
  /** 创建时间 */
  createTime: string;
}

/**
 * 凭证审核请求
 */
export interface VoucherAuditRequest {
  /** 凭证ID列表 */
  ids: string[];
  /** 审核人 */
  auditor?: string;
  /** 审核意见 */
  auditOpinion?: string;
}

/**
 * 凭证反审核请求
 */
export interface VoucherUnauditRequest {
  /** 凭证ID列表 */
  ids: string[];
  /** 操作人 */
  operator?: string;
  /** 反审核原因 */
  reason?: string;
}

/**
 * 凭证记账请求
 */
export interface VoucherPostRequest {
  /** 凭证ID列表 */
  ids: string[];
  /** 记账人 */
  poster?: string;
}

/**
 * 凭证反记账请求
 */
export interface VoucherUnpostRequest {
  /** 凭证ID列表 */
  ids: string[];
  /** 操作人 */
  operator?: string;
  /** 反记账原因 */
  reason?: string;
}

/**
 * 凭证删除请求
 */
export interface VoucherDeleteRequest {
  /** 凭证ID列表 */
  ids: string[];
  /** 删除原因 */
  reason?: string;
}

/**
 * 凭证作废请求
 */
export interface VoucherVoidRequest {
  /** 凭证ID */
  id: string;
  /** 作废原因 */
  reason: string;
  /** 操作人 */
  operator?: string;
}

/**
 * 凭证整理请求
 */
export interface VoucherRearrangeRequest {
  /** 会计期间 */
  accountingPeriod: string;
  /** 凭证类型编码 */
  voucherTypeCode?: string;
  /** 开始凭证号 */
  startNo?: number;
  /** 是否断号重排 */
  fillGaps?: boolean;
}

/**
 * 凭证整理结果
 */
export interface VoucherRearrangeResult {
  /** 是否成功 */
  success: boolean;
  /** 整理数量 */
  count: number;
  /** 整理详情 */
  details: VoucherRearrangeDetail[];
}

/**
 * 凭证整理详情
 */
export interface VoucherRearrangeDetail {
  /** 凭证ID */
  id: string;
  /** 原凭证号 */
  oldVoucherNo: string;
  /** 新凭证号 */
  newVoucherNo: string;
}

/**
 * 凭证试算平衡检查结果
 */
export interface VoucherBalanceCheck {
  /** 是否平衡 */
  isBalanced: boolean;
  /** 借方合计 */
  totalDebit: number;
  /** 贷方合计 */
  totalCredit: number;
  /** 差额 */
  difference: number;
  /** 错误信息 */
  errors?: VoucherBalanceError[];
}

/**
 * 凭证平衡错误
 */
export interface VoucherBalanceError {
  /** 错误类型 */
  type: 'debit_credit_not_equal' | 'entry_missing' | 'amount_invalid' | 'account_invalid';
  /** 错误描述 */
  message: string;
  /** 相关分录序号 */
  entrySequence?: number;
  /** 相关字段 */
  field?: string;
}

/**
 * 凭证导入请求
 */
export interface VoucherImportRequest {
  /** 导入数据 */
  data: VoucherCreateRequest[];
  /** 导入模式 */
  mode: 'create_only' | 'update_if_exists' | 'skip_if_exists';
  /** 是否自动审核 */
  autoAudit?: boolean;
  /** 是否自动记账 */
  autoPost?: boolean;
  /** 审核人 */
  auditor?: string;
  /** 记账人 */
  poster?: string;
}

/**
 * 凭证导入结果
 */
export interface VoucherImportResult {
  /** 导入总数 */
  total: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failCount: number;
  /** 跳过数量 */
  skipCount: number;
  /** 成功列表 */
  successList: VoucherImportSuccess[];
  /** 失败列表 */
  failList: VoucherImportFail[];
}

/**
 * 凭证导入成功项
 */
export interface VoucherImportSuccess {
  /** 行号 */
  rowNumber: number;
  /** 凭证ID */
  id: string;
  /** 凭证号 */
  voucherNo: string;
}

/**
 * 凭证导入失败项
 */
export interface VoucherImportFail {
  /** 行号 */
  rowNumber: number;
  /** 原凭证号 */
  voucherNo?: string;
  /** 错误信息 */
  errorMessage: string;
  /** 错误字段 */
  errorField?: string;
}

/**
 * 凭证导出请求
 */
export interface VoucherExportRequest {
  /** 查询条件 */
  query: VoucherQueryParams;
  /** 导出格式 */
  format: 'excel' | 'pdf' | 'xml' | 'json';
  /** 是否包含分录明细 */
  includeEntries?: boolean;
  /** 是否包含辅助核算 */
  includeAuxiliary?: boolean;
}

/**
 * 凭证导出结果
 */
export interface VoucherExportResult {
  /** 文件名 */
  fileName: string;
  /** 文件URL */
  fileUrl: string;
  /** 文件大小(字节) */
  fileSize: number;
  /** 导出时间 */
  exportTime: string;
}

/**
 * 凭证复制请求
 */
export interface VoucherCopyRequest {
  /** 源凭证ID */
  sourceId: string;
  /** 目标会计期间 */
  targetPeriod: string;
  /** 目标凭证日期 */
  targetDate: string;
  /** 是否复制辅助核算 */
  copyAuxiliary?: boolean;
  /** 是否复制现金流量 */
  copyCashFlow?: boolean;
}

/**
 * 凭证汇总查询参数
 */
export interface VoucherSummaryQuery {
  /** 会计期间开始 */
  periodStart: string;
  /** 会计期间结束 */
  periodEnd: string;
  /** 科目编码（支持模糊匹配） */
  accountCode?: string;
  /** 凭证类型编码 */
  voucherTypeCode?: string;
  /** 汇总维度 */
  groupBy: 'account' | 'period' | 'type' | 'maker';
}

/**
 * 凭证汇总结果
 */
export interface VoucherSummaryResult {
  /** 汇总维度值 */
  dimension: string;
  /** 凭证数量 */
  voucherCount: number;
  /** 分录数量 */
  entryCount: number;
  /** 借方合计 */
  totalDebit: number;
  /** 贷方合计 */
  totalCredit: number;
  /** 明细列表 */
  details?: VoucherSummaryDetail[];
}

/**
 * 凭证汇总明细
 */
export interface VoucherSummaryDetail {
  /** 科目编码 */
  accountCode: string;
  /** 科目名称 */
  accountName: string;
  /** 借方金额 */
  debitAmount: number;
  /** 贷方金额 */
  creditAmount: number;
  /** 凭证数量 */
  voucherCount: number;
}
