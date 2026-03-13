/**
 * 用友API响应基础接口
 */
export interface YonyouBaseResponse<T = unknown> {
  /** 状态码 */
  code: string;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: T;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 分页请求参数
 */
export interface PageRequest {
  /** 页码 */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 分页响应数据
 */
export interface PageResponse<T> {
  /** 数据列表 */
  list: T[];
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
 * 凭证接口
 */
export interface Voucher {
  /** 凭证ID */
  id: string;
  /** 凭证号 */
  voucherNo: string;
  /** 凭证类型 */
  voucherType: string;
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
  /** 凭证分录 */
  entries: VoucherEntry[];
  /** 创建时间 */
  createTime: string;
  /** 修改时间 */
  modifyTime?: string;
}

/**
 * 凭证分录接口
 */
export interface VoucherEntry {
  /** 分录ID */
  id: string;
  /** 科目编码 */
  accountCode: string;
  /** 科目名称 */
  accountName: string;
  /** 摘要 */
  summary: string;
  /** 借方金额 */
  debitAmount: number;
  /** 贷方金额 */
  creditAmount: number;
  /** 币种 */
  currency: string;
  /** 汇率 */
  exchangeRate?: number;
  /** 原币金额 */
  originalAmount?: number;
  /** 辅助核算 */
  auxiliary?: Record<string, unknown>;
}

/**
 * 科目接口
 */
export interface Account {
  /** 科目编码 */
  code: string;
  /** 科目名称 */
  name: string;
  /** 科目类别 */
  category: string;
  /** 科目类型 */
  type: string;
  /** 上级科目 */
  parentCode?: string;
  /** 科目级次 */
  level: number;
  /** 是否末级 */
  isLeaf: boolean;
  /** 币种 */
  currency: string;
  /** 余额方向 */
  balanceDirection: 'debit' | 'credit';
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 币种接口
 */
export interface Currency {
  /** 币种编码 */
  code: string;
  /** 币种名称 */
  name: string;
  /** 币种符号 */
  symbol: string;
  /** 是否本位币 */
  isBase: boolean;
  /** 汇率 */
  exchangeRate: number;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 凭证类型接口
 */
export interface VoucherType {
  /** 凭证类型ID */
  id?: string;
  /** 凭证类型编码 */
  code: string;
  /** 凭证类型名称 */
  name: string;
  /** 凭证类型简称 */
  shortName?: string;
  /** 凭证字 */
  voucherstr?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 停用状态 */
  stopstatus?: boolean;
  /** 是否总账 */
  bisgl?: boolean;
  /** 排序 */
  sort?: number;
  /** 创建时间 */
  createTime?: string;
  /** 修改时间 */
  modifyTime?: string;
}

/**
 * 账簿接口
 */
export interface AccountBook {
  /** 账簿编码 */
  code: string;
  /** 账簿名称 */
  name: string;
  /** 账簿类型 */
  type: string;
  /** 会计年度 */
  fiscalYear: number;
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 结账状态接口
 */
export interface PeriodStatus {
  /** 会计年度 */
  fiscalYear: number;
  /** 会计期间 */
  period: number;
  /** 是否已结账 */
  isClosed: boolean;
  /** 结账时间 */
  closeTime?: string;
  /** 结账人 */
  closer?: string;
}

/**
 * 自定义档案接口
 */
export interface CustomArchive {
  /** 档案编码 */
  code: string;
  /** 档案名称 */
  name: string;
  /** 档案类型 */
  type: string;
  /** 档案值 */
  value: string;
  /** 是否启用 */
  enabled: boolean;
}
