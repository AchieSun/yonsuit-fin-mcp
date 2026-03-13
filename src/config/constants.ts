/**
 * 常量配置模块
 * @module config/constants
 *
 * 定义用友API相关的常量配置，包括API地址、Token配置等
 */

/**
 * 用友API基础地址
 */
export const API_BASE_URLS = {
  /** 用友云API地址 */
  YONYOU_CLOUD: 'https://api.yonyoucloud.com',
  /** 用友云测试环境API地址 */
  YONYOU_CLOUD_TEST: 'https://api-test.yonyoucloud.com',
  /** 用友U8 Cloud API地址 */
  U8_CLOUD: 'https://api.u8cloud.cn',
  /** 用友NC Cloud API地址 */
  NC_CLOUD: 'https://api.nccloud.com',
} as const;

/**
 * 用友API路径配置
 */
export const API_PATHS = {
  // ========== 认证相关 ==========
  /** 获取访问令牌 */
  AUTH_TOKEN: '/open-auth/developer/v1/token',
  /** 刷新访问令牌 */
  AUTH_REFRESH_TOKEN: '/open-auth/developer/v1/token/refresh',
  /** 获取授权码 */
  AUTH_CODE: '/open-auth/developer/v1/code',

  // ========== 凭证相关 ==========
  /** 凭证列表查询 */
  VOUCHER_LIST: '/yonbip/fi/ficloud/openapi/voucher/queryVouchers',
  /** 凭证详情查询 */
  VOUCHER_DETAIL: '/yonbip/EFI/openapi/voucher/queryVoucherById',
  /** 凭证保存（创建/更新） */
  VOUCHER_SAVE: '/yonbip/fi/ficloud/openapi/voucher/addVoucher',
  /** 凭证删除 */
  VOUCHER_DELETE: '/yonbip/fi/ficloud/voucher/delete',
  /** 凭证审核 */
  VOUCHER_AUDIT: '/yonbip/fi/ficloud/voucher/audit',
  /** 凭证反审核 */
  VOUCHER_UNAUDIT: '/yonbip/fi/ficloud/voucher/unaudit',
  /** 凭证记账 */
  VOUCHER_POST: '/yonbip/fi/ficloud/voucher/post',
  /** 凭证反记账 */
  VOUCHER_UNPOST: '/yonbip/fi/ficloud/voucher/unpost',
  /** 凭证作废 */
  VOUCHER_VOID: '/yonbip/fi/ficloud/voucher/void',
  /** 凭证试算平衡检查 */
  VOUCHER_BALANCE_CHECK: '/yonbip/fi/ficloud/voucher/balance-check',
  /** 凭证导入 */
  VOUCHER_IMPORT: '/yonbip/fi/ficloud/voucher/import',
  /** 凭证导出 */
  VOUCHER_EXPORT: '/yonbip/fi/ficloud/voucher/export',
  /** 凭证复制 */
  VOUCHER_COPY: '/yonbip/fi/ficloud/voucher/copy',
  /** 凭证汇总查询 */
  VOUCHER_SUMMARY: '/yonbip/fi/ficloud/voucher/summary',
  /** 凭证整理 */
  VOUCHER_REARRANGE: '/yonbip/fi/ficloud/voucher/rearrange',

  // ========== 档案相关 ==========
  /** 账簿查询 */
  ACCOUNT_BOOK_QUERY: '/yonbip/fi/fipub/basedoc/querybd/accbook',
  /** 科目查询（通用档案查询） */
  ACCOUNT_QUERY: '/yonbip/fi/fipub/basedoc/querybd',
  /** 凭证类型查询 */
  VOUCHER_TYPE_LIST: '/yonbip/AMP/yonbip-fi-epub/vouchertype/bill/list',
  /** 自定义档案查询 */
  CUSTOM_ARCHIVE_QUERY: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 币种查询 */
  CURRENCY_QUERY: '/yonbip/digitalModel/currencytenant/batchQueryDetail',

  // ========== 旧版API路径（兼容保留） ==========
  /** 科目档案列表 */
  ACCOUNT_LIST: '/yonbip/fi/fipub/basedoc/querybd',
  /** 科目档案详情 */
  ACCOUNT_DETAIL: '/yonbip/fi/fipub/basedoc/querybd',
  /** 科目档案创建 */
  ACCOUNT_CREATE: '/yonbip/fi/account/create',
  /** 科目档案更新 */
  ACCOUNT_UPDATE: '/yonbip/fi/account/update',

  /** 部门档案列表 */
  DEPARTMENT_LIST: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 部门档案详情 */
  DEPARTMENT_DETAIL: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 部门档案创建 */
  DEPARTMENT_CREATE: '/yonbip/fi/department/create',

  /** 供应商档案列表 */
  SUPPLIER_LIST: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 客户档案列表 */
  CUSTOMER_LIST: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 项目档案列表 */
  PROJECT_LIST: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 人员档案列表 */
  PERSONNEL_LIST: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 结算方式档案列表 */
  SETTLEMENT_LIST: '/yonbip/digitalModel/customerdoc/batchQueryDetail',
  /** 币种档案列表 */
  CURRENCY_LIST: '/yonbip/digitalModel/currencytenant/batchQueryDetail',

  // ========== 账簿相关 ==========
  /** 账簿列表 */
  ACCOUNT_BOOK_LIST: '/yonbip/fi/accountbook/list',
  /** 账簿详情 */
  ACCOUNT_BOOK_DETAIL: '/yonbip/fi/accountbook/detail',
  /** 总账查询 */
  GENERAL_LEDGER: '/yonbip/fi/ledger/general',
  /** 明细账查询 */
  DETAIL_LEDGER: '/yonbip/fi/ledger/detail',
  /** 余额表查询 */
  BALANCE_SHEET: '/yonbip/fi/ledger/balance',

  // ========== 报表相关 ==========
  /** 资产负债表 */
  BALANCE_REPORT: '/yonbip/fi/report/balance',
  /** 利润表 */
  INCOME_REPORT: '/yonbip/fi/report/income',
  /** 现金流量表 */
  CASHFLOW_REPORT: '/yonbip/fi/report/cashflow',

  // ========== 期末处理 ==========
  /** 期末结账 */
  PERIOD_CLOSE: '/yonbip/fi/period/close',
  /** 反结账 */
  PERIOD_REOPEN: '/yonbip/fi/period/reopen',
  /** 期末结转 */
  PERIOD_CARRYOVER: '/yonbip/fi/period/carryover',
  /** 汇兑损益结转 */
  EXCHANGE_GAIN_LOSS: '/yonbip/fi/period/exchange',

  // ========== 基础数据 ==========
  /** 获取当前会计期间 */
  CURRENT_PERIOD: '/yonbip/fi/period/current',
  /** 获取会计期间列表 */
  PERIOD_LIST: '/yonbip/fi/period/list',
  /** 获取启用日期 */
  ENABLE_DATE: '/yonbip/fi/enabledate',
} as const;

/**
 * Token配置
 */
export const TOKEN_CONFIG = {
  /** Token有效期（秒） */
  EXPIRES_IN: 7200,
  /** Token提前刷新时间（秒）- 在过期前5分钟刷新 */
  REFRESH_AHEAD: 300,
  /** Token缓存键名 */
  CACHE_KEY_PREFIX: 'yonyou_token_',
  /** Token最小有效期（秒）- 低于此值强制刷新 */
  MIN_VALIDITY: 60,
} as const;

/**
 * HTTP请求配置
 */
export const HTTP_CONFIG = {
  /** 默认超时时间（毫秒） */
  DEFAULT_TIMEOUT: 30000,
  /** 最大重试次数 */
  MAX_RETRIES: 3,
  /** 重试延迟（毫秒） */
  RETRY_DELAY: 1000,
  /** 重试延迟倍数（指数退避） */
  RETRY_DELAY_MULTIPLIER: 2,
  /** 最大重试延迟（毫秒） */
  MAX_RETRY_DELAY: 10000,
  /** 连接超时时间（毫秒） */
  CONNECT_TIMEOUT: 5000,
  /** 响应超时时间（毫秒） */
  RESPONSE_TIMEOUT: 25000,
} as const;

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  /** 默认缓存时间（秒） */
  DEFAULT_TTL: 3600,
  /** 档案缓存时间（秒） */
  ARCHIVE_TTL: 7200,
  /** Token缓存时间（秒） */
  TOKEN_TTL: 7200,
  /** 最大缓存条目数 */
  MAX_SIZE: 1000,
  /** 缓存清理间隔（毫秒） */
  CLEANUP_INTERVAL: 60000,
} as const;

/**
 * 签名配置
 */
export const SIGNATURE_CONFIG = {
  /** 默认签名算法 */
  DEFAULT_ALGORITHM: 'SHA256',
  /** 签名版本 */
  VERSION: 'v1',
  /** 签名有效期（毫秒） */
  VALIDITY_PERIOD: 300000, // 5分钟
  /** 签名时间戳格式 */
  TIMESTAMP_FORMAT: 'YYYYMMDDHHmmss',
} as const;

/**
 * 业务常量
 */
export const BUSINESS_CONSTANTS = {
  /** 默认币种 */
  DEFAULT_CURRENCY: 'CNY',
  /** 默认凭证类型 */
  DEFAULT_VOUCHER_TYPE: '记-1',
  /** 凭证状态 */
  VOUCHER_STATUS: {
    /** 草稿 */
    DRAFT: '0',
    /** 待审核 */
    PENDING: '1',
    /** 已审核 */
    AUDITED: '2',
    /** 已记账 */
    POSTED: '3',
    /** 已作废 */
    CANCELLED: '4',
  },
  /** 借贷方向 */
  DIRECTION: {
    /** 借方 */
    DEBIT: 'D',
    /** 贷方 */
    CREDIT: 'C',
  },
  /** 会计年度格式 */
  FISCAL_YEAR_FORMAT: 'YYYY',
  /** 会计期间格式 */
  FISCAL_PERIOD_FORMAT: 'YYYY-MM',
} as const;

/**
 * 错误码配置
 */
export const ERROR_CODES = {
  /** 成功 */
  SUCCESS: '00000',
  /** 成功（部分接口） */
  SUCCESS_ALT: '0',
  /** Token无效 */
  INVALID_TOKEN: '10001',
  /** Token过期 */
  TOKEN_EXPIRED: '10002',
  /** 签名错误 */
  SIGNATURE_ERROR: '10003',
  /** 参数错误 */
  PARAM_ERROR: '20001',
  /** 业务错误 */
  BUSINESS_ERROR: '30001',
  /** 系统错误 */
  SYSTEM_ERROR: '50000',
  /** 网络超时 */
  TIMEOUT: 'ETIMEDOUT',
  /** 连接错误 */
  CONNECTION_ERROR: 'ECONNREFUSED',
} as const;

/**
 * 日志配置
 */
export const LOG_CONFIG = {
  /** 默认日志级别 */
  DEFAULT_LEVEL: 'info',
  /** 日志格式 */
  FORMAT: {
    JSON: 'json',
    TEXT: 'text',
  },
  /** 日志文件最大大小（字节） */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  /** 日志文件最大数量 */
  MAX_FILES: 5,
  /** 日志日期格式 */
  DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss',
} as const;

/**
 * 重试状态码（需要重试的HTTP状态码）
 */
export const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const;

/**
 * 内容类型
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  MULTIPART_FORM: 'multipart/form-data',
  TEXT: 'text/plain',
} as const;

/**
 * HTTP请求头
 */
export const HTTP_HEADERS = {
  /** 内容类型 */
  CONTENT_TYPE: 'Content-Type',
  /** 授权 */
  AUTHORIZATION: 'Authorization',
  /** 签名 */
  SIGNATURE: 'X-Signature',
  /** 时间戳 */
  TIMESTAMP: 'X-Timestamp',
  /** 请求ID */
  REQUEST_ID: 'X-Request-Id',
  /** 应用Key */
  APP_KEY: 'X-App-Key',
  /** 租户ID */
  TENANT_ID: 'X-Tenant-Id',
  /** 用户ID */
  USER_ID: 'X-User-Id',
  /** 数据中心域名 */
  DATA_CENTER: 'X-Data-Center',
} as const;

/**
 * 构建完整的API URL
 * @param baseUrl 基础URL
 * @param path API路径
 * @returns 完整URL
 */
export function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

/**
 * 获取Token缓存键
 * @param tenantId 租户ID
 * @returns 缓存键
 */
export function getTokenCacheKey(tenantId: string): string {
  return `${TOKEN_CONFIG.CACHE_KEY_PREFIX}${tenantId}`;
}

/**
 * 计算Token是否需要刷新
 * @param createdAt 创建时间戳
 * @param expiresIn 有效期（秒）
 * @returns 是否需要刷新
 */
export function shouldRefreshToken(createdAt: number, expiresIn: number): boolean {
  const now = Date.now();
  const expiresAt = createdAt + expiresIn * 1000;
  const refreshAhead = TOKEN_CONFIG.REFRESH_AHEAD * 1000;
  return now >= expiresAt - refreshAhead;
}

/**
 * 计算重试延迟
 * @param retryCount 当前重试次数
 * @returns 延迟时间（毫秒）
 */
export function calculateRetryDelay(retryCount: number): number {
  const delay = HTTP_CONFIG.RETRY_DELAY * Math.pow(HTTP_CONFIG.RETRY_DELAY_MULTIPLIER, retryCount);
  return Math.min(delay, HTTP_CONFIG.MAX_RETRY_DELAY);
}

export default {
  API_BASE_URLS,
  API_PATHS,
  TOKEN_CONFIG,
  HTTP_CONFIG,
  CACHE_CONFIG,
  SIGNATURE_CONFIG,
  BUSINESS_CONSTANTS,
  ERROR_CODES,
  LOG_CONFIG,
  RETRY_STATUS_CODES,
  CONTENT_TYPES,
  HTTP_HEADERS,
  buildApiUrl,
  getTokenCacheKey,
  shouldRefreshToken,
  calculateRetryDelay,
};
