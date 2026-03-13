/**
 * 通用类型定义
 * @module types/common
 */

/**
 * API通用响应接口
 */
export interface ApiResponse<T = unknown> {
  /** 状态码 */
  code: string;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: T;
  /** 时间戳 */
  timestamp?: number;
  /** 请求ID */
  requestId?: string;
  /** 是否成功 */
  success?: boolean;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码（从1开始） */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
  /** 排序字段 */
  sortField?: string;
  /** 排序方式 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T> {
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
  /** 是否有下一页 */
  hasNext?: boolean;
  /** 是否有上一页 */
  hasPrev?: boolean;
}

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: ErrorDetail[];
  /** 时间戳 */
  timestamp: number;
  /** 请求ID */
  requestId?: string;
  /** 堆栈信息（仅开发环境） */
  stack?: string;
}

/**
 * 错误详情
 */
export interface ErrorDetail {
  /** 错误字段 */
  field: string;
  /** 错误值 */
  value?: unknown;
  /** 错误消息 */
  message: string;
  /** 错误码 */
  code?: string;
}

/**
 * 批量操作结果
 */
export interface BatchResult<T = unknown> {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failCount: number;
  /** 成功列表 */
  successList: T[];
  /** 失败列表 */
  failList: BatchFailItem[];
}

/**
 * 批量操作失败项
 */
export interface BatchFailItem {
  /** 索引 */
  index: number;
  /** 数据标识 */
  id?: string;
  /** 错误信息 */
  errorMessage: string;
  /** 错误码 */
  errorCode?: string;
}

/**
 * 操作结果
 */
export interface OperationResult<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: T;
  /** 错误码 */
  errorCode?: string;
}

/**
 * ID请求参数
 */
export interface IdRequest {
  /** ID */
  id: string;
}

/**
 * 批量ID请求参数
 */
export interface IdsRequest {
  /** ID列表 */
  ids: string[];
}

/**
 * 代码请求参数
 */
export interface CodeRequest {
  /** 编码 */
  code: string;
}

/**
 * 批量代码请求参数
 */
export interface CodesRequest {
  /** 编码列表 */
  codes: string[];
}

/**
 * 名称请求参数
 */
export interface NameRequest {
  /** 名称 */
  name: string;
}

/**
 * 日期范围
 */
export interface DateRange {
  /** 开始日期 */
  startDate: string;
  /** 结束日期 */
  endDate: string;
}

/**
 * 时间范围
 */
export interface TimeRange {
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
}

/**
 * 数值范围
 */
export interface NumberRange {
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
}

/**
 * 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  field: string;
  /** 排序方式 */
  order: 'asc' | 'desc';
}

/**
 * 多字段排序参数
 */
export interface MultiSortParams {
  /** 排序字段列表 */
  sorts: SortParams[];
}

/**
 * 查询过滤条件
 */
export interface FilterCondition {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: FilterOperator;
  /** 值 */
  value: unknown;
  /** 逻辑连接符 */
  logic?: 'and' | 'or';
}

/**
 * 过滤操作符
 */
export type FilterOperator =
  | 'eq' // 等于
  | 'ne' // 不等于
  | 'gt' // 大于
  | 'gte' // 大于等于
  | 'lt' // 小于
  | 'lte' // 小于等于
  | 'like' // 模糊匹配
  | 'startsWith' // 以...开头
  | 'endsWith' // 以...结尾
  | 'in' // 包含于
  | 'notIn' // 不包含于
  | 'between' // 区间
  | 'isNull' // 为空
  | 'isNotNull'; // 不为空

/**
 * 查询选项
 */
export interface QueryOptions {
  /** 是否分页 */
  pagination?: boolean;
  /** 分页参数 */
  pageParams?: PaginationParams;
  /** 过滤条件 */
  filters?: FilterCondition[];
  /** 排序参数 */
  sorts?: SortParams[];
  /** 返回字段 */
  fields?: string[];
  /** 是否包含删除的记录 */
  includeDeleted?: boolean;
}

/**
 * 基础实体接口
 */
export interface BaseEntity {
  /** ID */
  id: string;
  /** 创建时间 */
  createTime: string;
  /** 创建人 */
  createBy?: string;
  /** 修改时间 */
  modifyTime?: string;
  /** 修改人 */
  modifyBy?: string;
  /** 是否删除 */
  isDeleted?: boolean;
  /** 版本号 */
  version?: number;
}

/**
 * 启用状态接口
 */
export interface EnableStatus {
  /** 是否启用 */
  enabled: boolean;
  /** 启用时间 */
  enabledTime?: string;
  /** 启用人 */
  enabledBy?: string;
}

/**
 * 审核状态信息接口
 */
export interface AuditStatusInfo {
  /** 审核状态 */
  auditStatus: 'unaudited' | 'audited' | 'rejected';
  /** 审核人 */
  auditor?: string;
  /** 审核时间 */
  auditTime?: string;
  /** 审核意见 */
  auditOpinion?: string;
}

/**
 * 树形节点接口
 */
export interface TreeNode<T = unknown> {
  /** 节点ID */
  id: string;
  /** 节点编码 */
  code: string;
  /** 节点名称 */
  name: string;
  /** 父节点ID */
  parentId?: string;
  /** 父节点编码 */
  parentCode?: string;
  /** 层级 */
  level: number;
  /** 是否叶子节点 */
  isLeaf: boolean;
  /** 排序号 */
  sortNo?: number;
  /** 子节点 */
  children?: T[];
}

/**
 * 键值对
 */
export interface KeyValuePair<K = string, V = unknown> {
  /** 键 */
  key: K;
  /** 值 */
  value: V;
}

/**
 * 标签值对（用于下拉选项等）
 */
export interface LabelValue {
  /** 标签 */
  label: string;
  /** 值 */
  value: string | number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子选项 */
  children?: LabelValue[];
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件名 */
  fileName: string;
  /** 文件路径 */
  filePath: string;
  /** 文件大小(字节) */
  fileSize: number;
  /** 文件类型 */
  fileType: string;
  /** MIME类型 */
  mimeType: string;
  /** 文件URL */
  url?: string;
  /** 上传时间 */
  uploadTime?: string;
  /** 上传人 */
  uploadBy?: string;
}

/**
 * 导入结果
 */
export interface ImportResult<T = unknown> {
  /** 导入总数 */
  total: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failCount: number;
  /** 跳过数量 */
  skipCount: number;
  /** 成功列表 */
  successList?: T[];
  /** 失败列表 */
  failList?: ImportFailItem[];
}

/**
 * 导入失败项
 */
export interface ImportFailItem {
  /** 行号 */
  rowNumber: number;
  /** 错误信息 */
  errorMessage: string;
  /** 错误字段 */
  errorField?: string;
  /** 错误值 */
  errorValue?: unknown;
}

/**
 * 导出参数
 */
export interface ExportParams {
  /** 导出格式 */
  format: 'excel' | 'csv' | 'pdf' | 'xml' | 'json';
  /** 文件名 */
  fileName?: string;
  /** 编码 */
  encoding?: string;
  /** 是否包含表头 */
  includeHeader?: boolean;
  /** 导出字段 */
  fields?: string[];
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 文件名 */
  fileName: string;
  /** 文件URL */
  fileUrl: string;
  /** 文件大小(字节) */
  fileSize: number;
  /** 导出时间 */
  exportTime: string;
  /** 过期时间 */
  expireTime?: string;
}

/**
 * 打印参数
 */
export interface PrintParams {
  /** 打印模板编码 */
  templateCode: string;
  /** 打印份数 */
  copies?: number;
  /** 打印方向 */
  orientation?: 'portrait' | 'landscape';
  /** 纸张大小 */
  paperSize?: string;
  /** 是否双面打印 */
  duplex?: boolean;
}

/**
 * 异步任务状态
 */
export interface AsyncTaskStatus {
  /** 任务ID */
  taskId: string;
  /** 任务类型 */
  taskType: string;
  /** 任务状态 */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** 进度(0-100) */
  progress: number;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 执行时长(毫秒) */
  duration?: number;
  /** 结果数据 */
  result?: unknown;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 缓存配置
 */
export interface CacheOptions {
  /** 缓存键 */
  key: string;
  /** 过期时间(秒) */
  ttl?: number;
  /** 是否启用缓存 */
  enabled?: boolean;
}

/**
 * 请求配置
 */
export interface RequestOptions {
  /** 请求超时(毫秒) */
  timeout?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟(毫秒) */
  retryDelay?: number;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否显示错误提示 */
  showError?: boolean;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

/**
 * 响应头信息
 */
export interface ResponseHeaders {
  /** 内容类型 */
  'Content-Type'?: string;
  /** 请求ID */
  'X-Request-Id'?: string;
  /** 速率限制剩余次数 */
  'X-RateLimit-Remaining'?: string;
  /** 速率限制重置时间 */
  'X-RateLimit-Reset'?: string;
  /** 总数 */
  'X-Total-Count'?: string;
}

/**
 * API版本信息
 */
export interface ApiVersion {
  /** 版本号 */
  version: string;
  /** 发布日期 */
  releaseDate: string;
  /** 是否最新版本 */
  isLatest: boolean;
  /** 是否已弃用 */
  isDeprecated: boolean;
  /** 弃用说明 */
  deprecationMessage?: string;
}

/**
 * 健康检查结果
 */
export interface HealthCheckResult {
  /** 服务名称 */
  service: string;
  /** 状态 */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** 检查时间 */
  checkedAt: string;
  /** 响应时间(毫秒) */
  responseTime: number;
  /** 详细信息 */
  details?: Record<string, unknown>;
  /** 错误信息 */
  error?: string;
}
