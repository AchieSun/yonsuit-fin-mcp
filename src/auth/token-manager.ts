/**
 * Token管理器模块
 * @module auth/token-manager
 *
 * 实现Token的获取、缓存、自动刷新和并发控制
 * 符合用友API规范（Token有效期7200秒）
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils';
import { appConfig, TOKEN_CONFIG } from '../config';
import { TokenInfo, YonyouApiResponse, TokenData } from '../types';
import { YonyouSignature } from '../utils/crypto';

/**
 * Token缓存数据结构
 */
interface TokenCacheData {
  /** Token信息 */
  token: TokenInfo;
  /** 缓存时间戳 */
  cachedAt: number;
  /** 缓存版本 */
  version: string;
}

/**
 * Token管理器配置
 */
interface TokenManagerConfig {
  /** Token有效期（秒），默认7200秒 */
  expiresIn: number;
  /** 提前刷新时间（秒），默认300秒（5分钟） */
  refreshAhead: number;
  /** 最小有效期（秒），默认60秒 */
  minValidity: number;
  /** 文件缓存目录 */
  cacheDir: string;
  /** 是否启用文件缓存 */
  enableFileCache: boolean;
}

/**
 * Token管理器
 * 负责Token的获取、缓存、刷新和并发控制
 */
export class TokenManager {
  /** 内存缓存 */
  private memoryCache: Map<string, TokenCacheData> = new Map();

  /** 刷新锁，防止并发刷新 */
  private refreshLocks: Map<string, Promise<string>> = new Map();

  /** HTTP客户端 */
  private httpClient: AxiosInstance;

  /** 签名工具 */
  private signature: YonyouSignature;

  /** 配置 */
  private config: TokenManagerConfig;

  /** 定时刷新定时器 */
  private refreshTimer: NodeJS.Timeout | null = null;

  /** 缓存键 */
  private readonly cacheKey: string;

  /**
   * 构造函数
   */
  constructor(config?: Partial<TokenManagerConfig>) {
    this.config = {
      expiresIn: TOKEN_CONFIG.EXPIRES_IN,
      refreshAhead: TOKEN_CONFIG.REFRESH_AHEAD,
      minValidity: TOKEN_CONFIG.MIN_VALIDITY,
      cacheDir: path.join(process.cwd(), '.cache'),
      enableFileCache: true,
      ...config,
    };

    this.cacheKey = `token_${appConfig.yonyou.tenantId}`;

    // 初始化HTTP客户端
    this.httpClient = axios.create({
      baseURL: appConfig.yonyou.baseUrl,
      timeout: appConfig.network.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 初始化签名工具
    this.signature = new YonyouSignature(
      appConfig.yonyou.appKey,
      appConfig.yonyou.appSecret
    );

    // 确保缓存目录存在
    this.ensureCacheDir();

    // 启动时从文件加载缓存
    this.loadFromFileCache();

    logger.info('Token管理器初始化完成', {
      expiresIn: this.config.expiresIn,
      refreshAhead: this.config.refreshAhead,
      enableFileCache: this.config.enableFileCache,
    });
  }

  /**
   * 获取访问令牌
   * 这是主要的外部调用方法
   * @returns 访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 1. 检查内存缓存
    const cachedToken = this.getFromMemoryCache();
    if (cachedToken && this.isTokenValid(cachedToken.token)) {
      logger.debug('使用内存缓存的Token');

      // 检查是否需要后台刷新
      if (this.shouldRefreshToken(cachedToken.token)) {
        this.backgroundRefresh().catch(err => {
          logger.warn('后台刷新Token失败', { error: err.message });
        });
      }

      return cachedToken.token.accessToken;
    }

    // 2. 检查文件缓存
    if (this.config.enableFileCache) {
      const fileCachedToken = this.getFromFileCache();
      if (fileCachedToken && this.isTokenValid(fileCachedToken.token)) {
        logger.debug('使用文件缓存的Token');
        // 同步到内存缓存
        this.memoryCache.set(this.cacheKey, fileCachedToken);

        // 检查是否需要后台刷新
        if (this.shouldRefreshToken(fileCachedToken.token)) {
          this.backgroundRefresh().catch(err => {
            logger.warn('后台刷新Token失败', { error: err.message });
          });
        }

        return fileCachedToken.token.accessToken;
      }
    }

    // 3. 获取新Token（带并发控制）
    return this.fetchTokenWithLock();
  }

  /**
   * 强制刷新Token
   * @returns 新的访问令牌
   */
  async refreshToken(): Promise<string> {
    logger.info('强制刷新Token');

    // 清除缓存
    this.clearCache();

    // 获取新Token
    return this.fetchTokenWithLock();
  }

  /**
   * 获取当前Token信息
   * @returns Token信息或undefined
   */
  getTokenInfo(): TokenInfo | undefined {
    const cached = this.getFromMemoryCache();
    return cached?.token;
  }

  /**
   * 检查Token是否即将过期
   * @param threshold 阈值（秒）
   * @returns 是否即将过期
   */
  isTokenExpiringSoon(threshold: number = this.config.refreshAhead): boolean {
    const tokenInfo = this.getTokenInfo();
    if (!tokenInfo) return true;

    const now = Date.now();
    const expiresAt = tokenInfo.createdAt + tokenInfo.expiresIn * 1000;
    const remaining = (expiresAt - now) / 1000;

    return remaining < threshold;
  }

  /**
   * 清除Token缓存
   */
  clearCache(): void {
    // 清除内存缓存
    this.memoryCache.delete(this.cacheKey);

    // 清除文件缓存
    if (this.config.enableFileCache) {
      const cacheFile = this.getCacheFilePath();
      try {
        if (fs.existsSync(cacheFile)) {
          fs.unlinkSync(cacheFile);
          logger.debug('文件缓存已清除');
        }
      } catch (error) {
        logger.warn('清除文件缓存失败', error);
      }
    }

    logger.info('Token缓存已清除');
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('自动刷新已停止');
    }
  }

  /**
   * 销毁Token管理器，释放资源
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.memoryCache.clear();
    this.refreshLocks.clear();
    logger.info('Token管理器已销毁');
  }

  /**
   * 带锁的Token获取
   * 防止并发请求重复获取Token
   */
  private async fetchTokenWithLock(): Promise<string> {
    // 检查是否有正在进行的刷新
    const existingLock = this.refreshLocks.get(this.cacheKey);
    if (existingLock) {
      logger.debug('等待正在进行的Token刷新');
      return existingLock;
    }

    // 创建新的刷新Promise
    const refreshPromise = this.doFetchToken();
    this.refreshLocks.set(this.cacheKey, refreshPromise);

    try {
      const token = await refreshPromise;
      return token;
    } finally {
      // 清除锁
      this.refreshLocks.delete(this.cacheKey);
    }
  }

  /**
   * 执行Token获取
   */
  private async doFetchToken(): Promise<string> {
    try {
      logger.info('开始获取新Token');

      const timestamp = Date.now();

      // 构建请求参数（根据用友API文档，只需要三个参数）
      // 参考：用友鉴权方法.md
      const params: Record<string, unknown> = {
        appKey: appConfig.yonyou.appKey,
        timestamp,
        signature: this.signature.generateTokenSignature(timestamp),
      };

      // 调用用友授权API（GET请求）
      // API路径：/iuap-api-auth/open-auth/selfAppAuth/base/v1/getAccessToken
      // 响应格式: {code: "00000", message: "成功！", data: {access_token: "xxx", expire: 7200}}
      const response = await this.httpClient.get<YonyouApiResponse<TokenData>>(
        '/iuap-api-auth/open-auth/selfAppAuth/base/v1/getAccessToken',
        { params }
      );

      // 检查响应状态
      if (response.data.code !== '00000') {
        throw new Error(`Token获取失败: ${response.data.message}`);
      }

      const { access_token, expire } = response.data.data;

      // 构建Token信息
      const tokenInfo: TokenInfo = {
        accessToken: access_token,
        expiresIn: expire || this.config.expiresIn,
        createdAt: Date.now(),
        refreshToken: undefined,
        tokenType: 'Bearer',
      };

      // 保存到缓存
      this.saveToCache(tokenInfo);

      logger.info('Token获取成功', {
        expiresIn: tokenInfo.expiresIn,
        expiresAt: new Date(tokenInfo.createdAt + tokenInfo.expiresIn * 1000).toISOString(),
      });

      return tokenInfo.accessToken;
    } catch (error) {
      logger.error('Token获取失败', error);

      // 如果有缓存的Token，即使过期也返回（降级策略）
      const cachedToken = this.getFromMemoryCache();
      if (cachedToken) {
        logger.warn('使用过期的缓存Token作为降级方案');
        return cachedToken.token.accessToken;
      }

      throw new Error('Token获取失败');
    }
  }

  /**
   * 后台刷新Token
   */
  private async backgroundRefresh(): Promise<void> {
    try {
      logger.debug('开始后台刷新Token');
      await this.fetchTokenWithLock();
    } catch (error) {
      logger.error('后台刷新Token失败', error);
    }
  }

  /**
   * 检查Token是否有效
   */
  private isTokenValid(tokenInfo: TokenInfo): boolean {
    const now = Date.now();
    const expiresAt = tokenInfo.createdAt + tokenInfo.expiresIn * 1000;
    const bufferTime = this.config.minValidity * 1000;

    // 提前一定时间认为过期，避免边界情况
    return now < expiresAt - bufferTime;
  }

  /**
   * 检查是否需要刷新Token
   */
  private shouldRefreshToken(tokenInfo: TokenInfo): boolean {
    const now = Date.now();
    const expiresAt = tokenInfo.createdAt + tokenInfo.expiresIn * 1000;
    const refreshAhead = this.config.refreshAhead * 1000;

    // 在过期前refreshAhead时间内开始刷新
    return now >= expiresAt - refreshAhead;
  }

  /**
   * 从内存缓存获取Token
   */
  private getFromMemoryCache(): TokenCacheData | undefined {
    return this.memoryCache.get(this.cacheKey);
  }

  /**
   * 从文件缓存获取Token
   */
  private getFromFileCache(): TokenCacheData | undefined {
    if (!this.config.enableFileCache) {
      return undefined;
    }

    try {
      const cacheFile = this.getCacheFilePath();
      if (!fs.existsSync(cacheFile)) {
        return undefined;
      }

      const content = fs.readFileSync(cacheFile, 'utf-8');
      const data: TokenCacheData = JSON.parse(content);

      // 验证缓存版本
      if (data.version !== this.getCacheVersion()) {
        logger.debug('缓存版本不匹配，忽略文件缓存');
        return undefined;
      }

      return data;
    } catch (error) {
      logger.warn('读取文件缓存失败', error);
      return undefined;
    }
  }

  /**
   * 保存Token到缓存（内存+文件）
   */
  private saveToCache(tokenInfo: TokenInfo): void {
    const cacheData: TokenCacheData = {
      token: tokenInfo,
      cachedAt: Date.now(),
      version: this.getCacheVersion(),
    };

    // 保存到内存缓存
    this.memoryCache.set(this.cacheKey, cacheData);

    // 保存到文件缓存
    if (this.config.enableFileCache) {
      this.saveToFileCache(cacheData);
    }
  }

  /**
   * 保存到文件缓存
   */
  private saveToFileCache(data: TokenCacheData): void {
    try {
      const cacheFile = this.getCacheFilePath();
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
      logger.debug('Token已保存到文件缓存');
    } catch (error) {
      logger.warn('保存文件缓存失败', error);
    }
  }

  /**
   * 确保缓存目录存在
   */
  private ensureCacheDir(): void {
    if (!this.config.enableFileCache) {
      return;
    }

    try {
      if (!fs.existsSync(this.config.cacheDir)) {
        fs.mkdirSync(this.config.cacheDir, { recursive: true });
        logger.debug('缓存目录已创建', { dir: this.config.cacheDir });
      }
    } catch (error) {
      logger.warn('创建缓存目录失败', error);
      this.config.enableFileCache = false;
    }
  }

  /**
   * 从文件加载缓存
   */
  private loadFromFileCache(): void {
    if (!this.config.enableFileCache) {
      return;
    }

    const cached = this.getFromFileCache();
    if (cached && this.isTokenValid(cached.token)) {
      this.memoryCache.set(this.cacheKey, cached);
      logger.debug('从文件加载Token缓存成功');
    }
  }

  /**
   * 获取缓存文件路径
   */
  private getCacheFilePath(): string {
    return path.join(this.config.cacheDir, `token_${appConfig.yonyou.tenantId}.json`);
  }

  /**
   * 获取缓存版本
   */
  private getCacheVersion(): string {
    // 使用配置的hash作为版本，配置变化时缓存失效
    return `v1_${appConfig.yonyou.appKey}_${appConfig.yonyou.tenantId}`;
  }
}

/**
 * Token管理器实例
 */
export const tokenManager = new TokenManager();

export default tokenManager;
