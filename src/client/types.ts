/**
 * API客户端类型定义
 * @module client/types
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 请求配置扩展
 */
export interface RequestConfig extends AxiosRequestConfig {
  /** 是否跳过认证 */
  skipAuth?: boolean;
  /** 是否跳过签名 */
  skipSignature?: boolean;
  /** 是否跳过重试 */
  skipRetry?: boolean;
  /** 自定义重试次数 */
  retryCount?: number;
  /** 自定义重试延迟 */
  retryDelay?: number;
  /** 请求元数据 */
  metadata?: Record<string, unknown>;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存时间（秒） */
  cacheTtl?: number;
}

/**
 * 响应包装
 */
export interface ResponseWrapper<T = unknown> {
  /** 响应数据 */
  data: T;
  /** HTTP状态码 */
  status: number;
  /** 响应头 */
  headers: Record<string, string>;
  /** 请求耗时（毫秒） */
  duration: number;
  /** 是否来自缓存 */
  fromCache?: boolean;
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始重试延迟（毫秒） */
  initialDelay: number;
  /** 最大重试延迟（毫秒） */
  maxDelay: number;
  /** 延迟倍数（指数退避） */
  multiplier: number;
  /** 是否启用抖动 */
  jitter: boolean;
  /** 需要重试的HTTP状态码 */
  retryStatusCodes: number[];
  /** 需要重试的错误码 */
  retryErrorCodes: string[];
}

/**
 * 拦截器上下文
 */
export interface InterceptorContext {
  /** 请求ID */
  requestId: string;
  /** 请求开始时间 */
  startTime: number;
  /** 重试次数 */
  retryCount: number;
  /** 是否已重试 */
  isRetry: boolean;
  /** 原始请求配置 */
  originalConfig: RequestConfig;
}

/**
 * 请求拦截器函数
 */
export type RequestInterceptor = (
  config: RequestConfig,
  context: InterceptorContext
) => RequestConfig | Promise<RequestConfig>;

/**
 * 响应拦截器函数
 */
export type ResponseInterceptor<T = unknown> = (
  response: AxiosResponse<T>,
  context: InterceptorContext
) => AxiosResponse<T> | Promise<AxiosResponse<T>>;

/**
 * 错误拦截器函数
 */
export type ErrorInterceptor = (
  error: Error,
  context: InterceptorContext
) => unknown;

/**
 * 客户端配置
 */
export interface ClientConfig {
  /** 基础URL */
  baseUrl: string;
  /** 默认超时时间（毫秒） */
  timeout: number;
  /** 重试配置 */
  retry: RetryConfig;
  /** 默认请求头 */
  headers?: Record<string, string>;
  /** 是否启用请求签名 */
  enableSignature?: boolean;
  /** 是否启用响应验证 */
  enableResponseValidation?: boolean;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 默认缓存时间（秒） */
  defaultCacheTtl?: number;
}

/**
 * 缓存项
 */
export interface CacheItem<T = unknown> {
  /** 缓存数据 */
  data: T;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间 */
  expiresAt: number;
  /** 缓存键 */
  key: string;
}

/**
 * 请求队列项
 */
export interface RequestQueueItem {
  /** 请求ID */
  requestId: string;
  /** 请求配置 */
  config: RequestConfig;
  /** 解决函数 */
  resolve: (value: unknown) => void;
  /** 拒绝函数 */
  reject: (reason: unknown) => void;
  /** 重试次数 */
  retryCount: number;
}

/**
 * API方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * API端点配置
 */
export interface ApiEndpoint {
  /** 端点路径 */
  path: string;
  /** HTTP方法 */
  method: HttpMethod;
  /** 是否需要认证 */
  requireAuth?: boolean;
  /** 是否需要签名 */
  requireSignature?: boolean;
  /** 是否启用缓存 */
  cacheable?: boolean;
  /** 缓存时间（秒） */
  cacheTtl?: number;
  /** 描述 */
  description?: string;
}

/**
 * 批量请求项
 */
export interface BatchRequestItem<T = unknown> {
  /** 请求ID */
  id: string;
  /** 请求配置 */
  config: RequestConfig;
  /** 响应数据 */
  response?: T;
  /** 错误信息 */
  error?: Error;
}

/**
 * 批量请求结果
 */
export interface BatchRequestResult<T = unknown> {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failCount: number;
  /** 结果列表 */
  items: BatchRequestItem<T>[];
  /** 总耗时（毫秒） */
  duration: number;
}

/**
 * 请求统计
 */
export interface RequestStats {
  /** 总请求数 */
  total: number;
  /** 成功数 */
  success: number;
  /** 失败数 */
  failed: number;
  /** 重试数 */
  retried: number;
  /** 平均响应时间（毫秒） */
  avgResponseTime: number;
  /** 最大响应时间（毫秒） */
  maxResponseTime: number;
  /** 最小响应时间（毫秒） */
  minResponseTime: number;
  /** 缓存命中数 */
  cacheHits: number;
  /** 缓存未命中数 */
  cacheMisses: number;
}

/**
 * 客户端状态
 */
export interface ClientState {
  /** 是否已初始化 */
  initialized: boolean;
  /** 是否正在刷新Token */
  refreshingToken: boolean;
  /** 当前活跃请求数 */
  activeRequests: number;
  /** 最后一次请求时间 */
  lastRequestTime?: number;
  /** 请求统计 */
  stats: RequestStats;
}

/**
 * Token刷新回调
 */
export type TokenRefreshCallback = () => Promise<string>;

/**
 * 错误处理回调
 */
export type ErrorHandlerCallback = (error: Error, context: InterceptorContext) => void;

/**
 * 请求成功回调
 */
export type RequestSuccessCallback = (response: ResponseWrapper, context: InterceptorContext) => void;

/**
 * 客户端事件
 */
export interface ClientEvents {
  /** Token刷新事件 */
  onTokenRefresh?: TokenRefreshCallback;
  /** 错误处理事件 */
  onError?: ErrorHandlerCallback;
  /** 请求成功事件 */
  onRequestSuccess?: RequestSuccessCallback;
  /** 请求重试事件 */
  onRetry?: (context: InterceptorContext, error: Error) => void;
  /** 缓存命中事件 */
  onCacheHit?: (key: string, data: unknown) => void;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码（从1开始） */
  pageNum: number;
  /** 每页数量 */
  pageSize: number;
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
 * 查询选项
 */
export interface QueryOptions {
  /** 分页参数 */
  pagination?: PaginationParams;
  /** 排序参数 */
  sort?: SortParams;
  /** 过滤条件 */
  filter?: Record<string, unknown>;
  /** 返回字段 */
  fields?: string[];
}
