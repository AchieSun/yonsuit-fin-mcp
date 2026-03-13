/**
 * 基础API客户端
 * @module client/base-client
 *
 * 提供axios封装、请求/响应拦截器、重试机制、缓存等功能
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils';
import { appConfig } from '../config';
import { HTTP_CONFIG, ERROR_CODES, RETRY_STATUS_CODES } from '../config/constants';
import { YonyouBaseResponse } from '../types';
import {
  ApiError,
  TokenExpiredError,
  NetworkError,
  TimeoutError,
  createErrorFromResponse,
  isRetryableError,
} from './errors';
import type {
  RequestConfig,
  ResponseWrapper,
  RetryConfig,
  InterceptorContext,
  CacheItem,
  ClientState,
  ClientEvents,
} from './types';

/**
 * 扩展的Axios请求配置（包含metadata）
 */
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    context?: InterceptorContext;
    retryCount?: number;
    startTime?: number;
  };
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: HTTP_CONFIG.MAX_RETRIES,
  initialDelay: HTTP_CONFIG.RETRY_DELAY,
  maxDelay: HTTP_CONFIG.MAX_RETRY_DELAY,
  multiplier: HTTP_CONFIG.RETRY_DELAY_MULTIPLIER,
  jitter: true,
  retryStatusCodes: [...RETRY_STATUS_CODES],
  retryErrorCodes: [ERROR_CODES.TOKEN_EXPIRED, ERROR_CODES.TIMEOUT],
};

/**
 * 基础API客户端类
 */
export class BaseClient {
  /** Axios实例 */
  protected axiosInstance: AxiosInstance;
  /** 重试配置 */
  protected retryConfig: RetryConfig;
  /** 客户端状态 */
  protected state: ClientState;
  /** 缓存存储 */
  protected cache: Map<string, CacheItem> = new Map();
  /** 事件回调 */
  protected events: ClientEvents = {};
  /** Token刷新回调 */
  protected tokenRefreshCallback?: () => Promise<string>;
  /** 正在刷新Token的Promise */
  protected refreshPromise?: Promise<string>;
  /** 请求队列（等待Token刷新） */
  protected requestQueue: Array<{
    config: RequestConfig;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];
  /** 缓存清理定时器 */
  protected cacheCleanupTimer?: NodeJS.Timeout;

  /**
   * 构造函数
   * @param config 客户端配置
   */
  constructor(config?: Partial<{
    baseUrl: string;
    timeout: number;
    retry: Partial<RetryConfig>;
    headers: Record<string, string>;
    enableCache: boolean;
  }>) {
    // 初始化状态
    this.state = {
      initialized: false,
      refreshingToken: false,
      activeRequests: 0,
      stats: {
        total: 0,
        success: 0,
        failed: 0,
        retried: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        cacheHits: 0,
        cacheMisses: 0,
      },
    };

    // 合并重试配置
    this.retryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config?.retry,
    };

    // 创建axios实例
    this.axiosInstance = axios.create({
      baseURL: config?.baseUrl || appConfig.yonyou.baseUrl,
      timeout: config?.timeout || appConfig.network.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
    });

    // 设置拦截器
    this.setupInterceptors();

    // 启动缓存清理定时器
    if (config?.enableCache ?? appConfig.cache.enabled) {
      this.startCacheCleanup();
    }

    this.state.initialized = true;
    logger.debug('BaseClient初始化完成', { config: this.retryConfig });
  }

  /**
   * 设置Token刷新回调
   */
  setTokenRefreshCallback(callback: () => Promise<string>): void {
    this.tokenRefreshCallback = callback;
  }

  /**
   * 设置事件回调
   */
  setEvents(events: ClientEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * 设置拦截器
   */
  protected setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const extendedConfig = config as ExtendedAxiosRequestConfig;
        const context = this.getRequestContext(extendedConfig as unknown as RequestConfig);
        this.handleRequest(extendedConfig as unknown as RequestConfig, context);
        // 将context存储到metadata
        extendedConfig.metadata = {
          context,
          retryCount: context.retryCount,
          startTime: context.startTime,
        };
        return extendedConfig;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleRequestError(error));
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const extendedConfig = response.config as ExtendedAxiosRequestConfig;
        const context = extendedConfig?.metadata?.context || {
          requestId: 'unknown',
          startTime: Date.now(),
          retryCount: 0,
          isRetry: false,
          originalConfig: {} as RequestConfig,
        };
        return this.handleResponse(response, context) as AxiosResponse;
      },
      (error: AxiosError) => {
        const extendedConfig = error.config as ExtendedAxiosRequestConfig;
        const context = extendedConfig?.metadata?.context || {
          requestId: 'unknown',
          startTime: Date.now(),
          retryCount: 0,
          isRetry: false,
          originalConfig: {} as RequestConfig,
        };
        return this.handleResponseError(error, context);
      }
    );
  }

  /**
   * 获取请求上下文
   */
  protected getRequestContext(config: RequestConfig): InterceptorContext {
    const retryCount = (config.metadata as { retryCount?: number } | undefined)?.retryCount || 0;
    return {
      requestId: (config.headers?.['X-Request-Id'] as string) || uuidv4(),
      startTime: Date.now(),
      retryCount,
      isRetry: retryCount > 0,
      originalConfig: config,
    };
  }

  /**
   * 处理请求
   */
  protected async handleRequest(
    config: RequestConfig,
    context: InterceptorContext
  ): Promise<RequestConfig> {
    // 添加请求ID
    if (!config.headers) {
      config.headers = {};
    }
    config.headers['X-Request-Id'] = context.requestId;

    // 添加时间戳
    config.headers['X-Timestamp'] = Date.now().toString();

    // 存储上下文到配置中（使用类型断言）
    if (!config.metadata) {
      config.metadata = {};
    }
    (config.metadata as { context?: InterceptorContext }).context = context;

    // 更新统计
    this.state.activeRequests++;
    this.state.stats.total++;

    logger.debug('API请求', {
      requestId: context.requestId,
      method: config.method,
      url: config.url,
      retryCount: context.retryCount,
    });

    return config;
  }

  /**
   * 处理请求错误
   */
  protected handleRequestError(error: AxiosError): ApiError {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new TimeoutError('请求超时', { cause: error });
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return new NetworkError('网络请求失败', { cause: error });
    }
    return new ApiError(error.message, 'REQUEST_ERROR', { cause: error });
  }

  /**
   * 处理响应
   */
  protected handleResponse(
    response: unknown,
    context: InterceptorContext
  ): unknown {
    const axiosResponse = response as { status: number; data: YonyouBaseResponse; headers: Record<string, string>; config: { metadata?: { startTime?: number } } };
    const duration = Date.now() - context.startTime;

    // 更新统计
    this.state.activeRequests--;
    this.state.stats.success++;
    this.updateResponseTimeStats(duration);

    logger.debug('API响应', {
      requestId: context.requestId,
      status: axiosResponse.status,
      duration: `${duration}ms`,
    });

    // 检查业务状态码
    const data = axiosResponse.data;
    if (data && data.code && data.code !== '00000' && data.code !== '0') {
      const error = createErrorFromResponse(
        axiosResponse.status,
        data as unknown as Record<string, unknown>,
        axiosResponse.config
      );
      logger.warn('业务错误', {
        requestId: context.requestId,
        code: data.code,
        message: data.message,
      });
      return Promise.reject(error);
    }

    // 触发成功回调
    if (this.events.onRequestSuccess) {
      const wrapper: ResponseWrapper = {
        data: data?.data,
        status: axiosResponse.status,
        headers: axiosResponse.headers,
        duration,
      };
      this.events.onRequestSuccess(wrapper, context);
    }

    return response;
  }

  /**
   * 处理响应错误
   */
  protected async handleResponseError(
    error: AxiosError,
    context: InterceptorContext
  ): Promise<unknown> {
    this.state.activeRequests--;
    this.state.stats.failed++;

    const duration = Date.now() - context.startTime;
    const statusCode = error.response?.status;
    const responseData = error.response?.data as Record<string, unknown> | undefined;

    logger.error('API响应错误', {
      requestId: context.requestId,
      statusCode,
      message: error.message,
      duration: `${duration}ms`,
    });

    // 创建错误对象
    let apiError: ApiError;
    if (statusCode && responseData) {
      apiError = createErrorFromResponse(statusCode, responseData, error.config);
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      apiError = new TimeoutError('请求超时', {
        requestConfig: error.config,
        cause: error,
      });
    } else {
      apiError = new NetworkError('网络请求失败', {
        requestConfig: error.config,
        cause: error,
      });
    }

    // 触发错误回调
    if (this.events.onError) {
      this.events.onError(apiError, context);
    }

    // 检查是否需要重试
    if (this.shouldRetry(apiError, context)) {
      return this.retryRequest(context.originalConfig, context);
    }

    // 检查是否是Token过期错误，需要刷新Token
    if (apiError instanceof TokenExpiredError && this.tokenRefreshCallback) {
      return this.handleTokenExpired(context.originalConfig, context);
    }

    return Promise.reject(apiError);
  }

  /**
   * 判断是否应该重试
   */
  protected shouldRetry(error: ApiError, context: InterceptorContext): boolean {
    // 检查是否跳过重试
    if (context.originalConfig.skipRetry) {
      return false;
    }

    // 检查重试次数
    if (context.retryCount >= this.retryConfig.maxRetries) {
      return false;
    }

    // 检查错误是否可重试
    if (!isRetryableError(error)) {
      return false;
    }

    // 检查HTTP状态码
    if (error.statusCode && this.retryConfig.retryStatusCodes.includes(error.statusCode)) {
      return true;
    }

    // 检查错误码
    if (this.retryConfig.retryErrorCodes.includes(error.code)) {
      return true;
    }

    return false;
  }

  /**
   * 重试请求
   */
  protected async retryRequest(
    config: RequestConfig,
    context: InterceptorContext
  ): Promise<unknown> {
    const retryCount = context.retryCount + 1;
    const delay = this.calculateRetryDelay(retryCount);

    this.state.stats.retried++;

    logger.info('准备重试请求', {
      requestId: context.requestId,
      retryCount,
      delay: `${delay}ms`,
    });

    // 触发重试回调
    if (this.events.onRetry) {
      const error = new ApiError('请求重试', 'RETRY', { retryable: true });
      this.events.onRetry(context, error);
    }

    // 等待延迟
    await this.sleep(delay);

    // 更新配置
    const retryConfig = { ...config };
    if (!retryConfig.metadata) {
      retryConfig.metadata = {};
    }
    retryConfig.metadata.retryCount = retryCount;

    // 重新发起请求
    return this.request(retryConfig);
  }

  /**
   * 计算重试延迟（指数退避）
   */
  protected calculateRetryDelay(retryCount: number): number {
    let delay = this.retryConfig.initialDelay * Math.pow(this.retryConfig.multiplier, retryCount - 1);
    delay = Math.min(delay, this.retryConfig.maxDelay);

    // 添加抖动
    if (this.retryConfig.jitter) {
      const jitter = delay * 0.2 * Math.random();
      delay = delay + jitter;
    }

    return Math.floor(delay);
  }

  /**
   * 处理Token过期
   */
  protected async handleTokenExpired(
    config: RequestConfig,
    context: InterceptorContext
  ): Promise<unknown> {
    logger.info('Token过期，准备刷新', { requestId: context.requestId });

    // 如果正在刷新Token，将请求加入队列
    if (this.state.refreshingToken && this.refreshPromise) {
      return new Promise((resolve, reject) => {
        this.requestQueue.push({
          config,
          resolve,
          reject,
        });
      });
    }

    // 开始刷新Token
    this.state.refreshingToken = true;

    try {
      this.refreshPromise = this.tokenRefreshCallback!();
      const newToken = await this.refreshPromise;

      logger.info('Token刷新成功', { requestId: context.requestId });

      // 更新请求头中的Token
      if (config.headers) {
        config.headers['Authorization'] = `Bearer ${newToken}`;
      }

      // 重试原始请求
      const result = await this.request(config);

      // 处理队列中的请求
      this.processRequestQueue(newToken);

      return result;
    } catch (error) {
      logger.error('Token刷新失败', error);

      // 拒绝队列中的所有请求
      this.rejectRequestQueue(error as Error);

      return Promise.reject(error);
    } finally {
      this.state.refreshingToken = false;
      this.refreshPromise = undefined;
    }
  }

  /**
   * 处理请求队列
   */
  protected processRequestQueue(token: string): void {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const item of queue) {
      if (item.config.headers) {
        item.config.headers['Authorization'] = `Bearer ${token}`;
      }
      this.request(item.config)
        .then(item.resolve)
        .catch(item.reject);
    }
  }

  /**
   * 拒绝请求队列
   */
  protected rejectRequestQueue(error: Error): void {
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    for (const item of queue) {
      item.reject(error);
    }
  }

  /**
   * 更新响应时间统计
   */
  protected updateResponseTimeStats(duration: number): void {
    const stats = this.state.stats;
    const total = stats.success + stats.failed;
    stats.avgResponseTime = (stats.avgResponseTime * (total - 1) + duration) / total;
    stats.maxResponseTime = Math.max(stats.maxResponseTime, duration);
    stats.minResponseTime = Math.min(stats.minResponseTime, duration);
  }

  /**
   * 发起请求
   */
  async request<T = unknown>(config: RequestConfig): Promise<T> {
    // 检查缓存
    if (config.enableCache || (config.method === 'GET' && appConfig.cache.enabled)) {
      const cacheKey = this.getCacheKey(config);
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        this.state.stats.cacheHits++;
        if (this.events.onCacheHit) {
          this.events.onCacheHit(cacheKey, cached);
        }
        return cached;
      }
      this.state.stats.cacheMisses++;
    }

    const response = await this.axiosInstance.request<YonyouBaseResponse<T>>(config);
    const data = response.data?.data as T;

    // 缓存响应
    if (config.enableCache || (config.method === 'GET' && appConfig.cache.enabled)) {
      const cacheKey = this.getCacheKey(config);
      this.setCache(cacheKey, data, config.cacheTtl);
    }

    return data;
  }

  /**
   * GET请求
   */
  async get<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
      params,
    });
  }

  /**
   * POST请求
   */
  async post<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }

  /**
   * PUT请求
   */
  async put<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'PUT',
      url,
      data,
    });
  }

  /**
   * DELETE请求
   */
  async delete<T = unknown>(
    url: string,
    params?: Record<string, unknown>,
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'DELETE',
      url,
      params,
    });
  }

  /**
   * PATCH请求
   */
  async patch<T = unknown>(
    url: string,
    data?: Record<string, unknown>,
    config?: Partial<RequestConfig>
  ): Promise<T> {
    return this.request<T>({
      ...config,
      method: 'PATCH',
      url,
      data,
    });
  }

  /**
   * 获取缓存键
   */
  protected getCacheKey(config: RequestConfig): string {
    const method = config.method || 'GET';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    return `${method}:${url}:${params}:${data}`;
  }

  /**
   * 从缓存获取数据
   */
  protected getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 设置缓存
   */
  protected setCache<T>(key: string, data: T, ttl?: number): void {
    const cacheTtl = ttl || appConfig.cache.ttl;
    const item: CacheItem<T> = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + cacheTtl * 1000,
      key,
    };
    this.cache.set(key, item);

    // 检查缓存大小
    if (this.cache.size > appConfig.cache.maxSize) {
      this.cleanupCache();
    }
  }

  /**
   * 清理过期缓存
   */
  protected cleanupCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 启动缓存清理定时器
   */
  protected startCacheCleanup(): void {
    this.cacheCleanupTimer = setInterval(() => {
      this.cleanupCache();
    }, 60000);
  }

  /**
   * 停止缓存清理定时器
   */
  stopCacheCleanup(): void {
    if (this.cacheCleanupTimer) {
      clearInterval(this.cacheCleanupTimer);
      this.cacheCleanupTimer = undefined;
    }
  }

  /**
   * 销毁客户端，释放资源
   */
  destroy(): void {
    this.stopCacheCleanup();
    this.clearCache();
    this.requestQueue = [];
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('缓存已清除');
  }

  /**
   * 获取客户端状态
   */
  getState(): Readonly<ClientState> {
    return { ...this.state };
  }

  /**
   * 获取统计信息
   */
  getStats(): Readonly<ClientState['stats']> {
    return { ...this.state.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.state.stats = {
      total: 0,
      success: 0,
      failed: 0,
      retried: 0,
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  /**
   * 休眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default BaseClient;
