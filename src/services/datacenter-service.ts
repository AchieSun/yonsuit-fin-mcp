/**
 * 数据中心服务
 * @module services/datacenter-service
 *
 * 提供数据中心域名相关的业务逻辑封装，包括：
 * - 获取网关地址：GET https://apigateway.yonyoucloud.com/open-auth/dataCenter/getGatewayAddress
 * - 域名缓存持久化到本地文件
 * - 缓存有效期管理（7天）
 * - 域名有效性验证
 */

import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { logger, delay } from '../utils';

// ==================== 类型定义 ====================

/**
 * 数据中心缓存数据
 */
export interface DataCenterCache {
  /** 网关地址 */
  gatewayUrl: string;
  /** Token地址 */
  tokenUrl: string;
  /** 缓存时间戳 */
  cachedAt: number;
  /** 过期时间戳 */
  expiresAt: number;
}

/**
 * 数据中心API响应
 */
export interface DataCenterApiResponse {
  /** 结果码 */
  code: string;
  /** 结果信息 */
  message: string;
  /** 数据 */
  data?: {
    /** 网关地址 */
    gatewayUrl: string;
    /** Token地址 */
    tokenUrl: string;
  };
}

/**
 * 数据中心配置
 */
export interface DataCenterConfig {
  /** 缓存有效期（毫秒），默认7天 */
  cacheTTL?: number;
  /** 最大重试次数，默认3次 */
  maxRetries?: number;
  /** 重试延迟（毫秒），默认1000ms */
  retryDelay?: number;
}

// ==================== 默认配置 ====================

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<DataCenterConfig> = {
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7天
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * 数据中心API地址
 */
const DATACENTER_API_URL = 'https://apigateway.yonyoucloud.com/open-auth/dataCenter/getGatewayAddress';

// ==================== 数据中心服务类 ====================

/**
 * 数据中心服务类
 * 提供数据中心域名获取、缓存管理等功能
 */
export class DataCenterService {
  /** 配置 */
  private config: Required<DataCenterConfig>;

  /** 缓存目录 */
  private cacheDir: string;

  /** 内存缓存 */
  private memoryCache: Map<string, DataCenterCache> = new Map();

  /**
   * 构造函数
   * @param config 配置选项
   */
  constructor(config?: DataCenterConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheDir = path.join(os.homedir(), '.yonyou-mcp', 'cache');
    this.ensureCacheDir();
  }

  // ==================== 公共方法 ====================

  /**
   * 获取网关地址
   * @param tenantId 租户ID
   * @returns 网关地址和Token地址
   */
  async getGatewayAddress(tenantId: string): Promise<DataCenterCache> {
    logger.info('获取网关地址', { tenantId });

    // 1. 先检查内存缓存
    const memoryCached = this.memoryCache.get(tenantId);
    if (memoryCached && this.isCacheValid(memoryCached)) {
      logger.info('使用内存缓存', { tenantId });
      return memoryCached;
    }

    // 2. 检查文件缓存
    const fileCached = await this.loadFromCache(tenantId);
    if (fileCached && this.isCacheValid(fileCached)) {
      logger.info('使用文件缓存', { tenantId });
      this.memoryCache.set(tenantId, fileCached);
      return fileCached;
    }

    // 3. 从API获取
    logger.info('从API获取网关地址', { tenantId });
    const result = await this.fetchFromApi(tenantId);

    // 4. 保存缓存
    await this.saveToCache(tenantId, result);
    this.memoryCache.set(tenantId, result);

    logger.info('网关地址获取成功', {
      tenantId,
      gatewayUrl: result.gatewayUrl,
      tokenUrl: result.tokenUrl,
    });

    return result;
  }

  /**
   * 确保域名有效
   * @param tenantId 租户ID
   * @returns 网关地址和Token地址
   */
  async ensureDomainValid(tenantId: string): Promise<DataCenterCache> {
    logger.info('验证域名有效性', { tenantId });

    // 检查缓存是否存在且有效
    const cached = await this.loadFromCache(tenantId);

    if (!cached) {
      logger.info('缓存不存在，重新获取', { tenantId });
      return this.getGatewayAddress(tenantId);
    }

    if (!this.isCacheValid(cached)) {
      logger.info('缓存已过期，重新获取', {
        tenantId,
        cachedAt: new Date(cached.cachedAt).toISOString(),
        expiresAt: new Date(cached.expiresAt).toISOString(),
      });
      return this.getGatewayAddress(tenantId);
    }

    // 验证域名是否可访问
    const isValid = await this.validateDomain(cached.gatewayUrl);
    if (!isValid) {
      logger.warn('域名不可访问，重新获取', { tenantId, gatewayUrl: cached.gatewayUrl });
      // 删除无效缓存
      await this.deleteCache(tenantId);
      return this.getGatewayAddress(tenantId);
    }

    logger.info('域名验证通过', { tenantId });
    this.memoryCache.set(tenantId, cached);
    return cached;
  }

  /**
   * 清除缓存
   * @param tenantId 租户ID，不传则清除所有缓存
   */
  async clearCache(tenantId?: string): Promise<void> {
    if (tenantId) {
      this.memoryCache.delete(tenantId);
      await this.deleteCache(tenantId);
      logger.info('已清除指定租户缓存', { tenantId });
    } else {
      this.memoryCache.clear();
      await this.clearAllCache();
      logger.info('已清除所有缓存');
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 确保缓存目录存在
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      logger.info('创建缓存目录', { path: this.cacheDir });
    }
  }

  /**
   * 获取缓存文件路径
   * @param tenantId 租户ID
   * @returns 缓存文件路径
   */
  private getCacheFilePath(tenantId: string): string {
    return path.join(this.cacheDir, `datacenter-${tenantId}.json`);
  }

  /**
   * 从API获取网关地址
   * @param tenantId 租户ID
   * @returns 网关地址数据
   */
  private async fetchFromApi(tenantId: string): Promise<DataCenterCache> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        logger.info(`尝试获取网关地址 (第${attempt}次)`, { tenantId });

        const response = await axios.get<DataCenterApiResponse>(DATACENTER_API_URL, {
          params: { tenantId },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const { code, message, data } = response.data;

        if (code !== '00000') {
          throw new Error(`API返回错误: code=${code}, message=${message}`);
        }

        if (!data || !data.gatewayUrl || !data.tokenUrl) {
          throw new Error('API返回数据格式错误：缺少 gatewayUrl 或 tokenUrl');
        }

        const { gatewayUrl, tokenUrl } = data;

        const now = Date.now();
        const cache: DataCenterCache = {
          gatewayUrl,
          tokenUrl,
          cachedAt: now,
          expiresAt: now + this.config.cacheTTL,
        };

        return cache;
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        logger.error(`获取网关地址失败 (第${attempt}次)`, {
          tenantId,
          error: axiosError.message,
          statusCode: axiosError.response?.status,
        });

        if (attempt < this.config.maxRetries) {
          const waitTime = this.config.retryDelay * attempt;
          logger.info(`等待 ${waitTime}ms 后重试`, { tenantId });
          await delay(waitTime);
        }
      }
    }

    throw new Error(
      `获取网关地址失败，已重试 ${this.config.maxRetries} 次: ${lastError?.message || '未知错误'}`
    );
  }

  /**
   * 保存到缓存文件
   * @param tenantId 租户ID
   * @param data 缓存数据
   */
  private async saveToCache(tenantId: string, data: DataCenterCache): Promise<void> {
    const filePath = this.getCacheFilePath(tenantId);

    try {
      const content = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(filePath, content, 'utf-8');
      logger.info('缓存保存成功', { tenantId, path: filePath });
    } catch (error) {
      logger.error('缓存保存失败', { tenantId, error: (error as Error).message });
      // 缓存保存失败不影响主流程
    }
  }

  /**
   * 从缓存文件加载
   * @param tenantId 租户ID
   * @returns 缓存数据，如果不存在或损坏则返回null
   */
  private async loadFromCache(tenantId: string): Promise<DataCenterCache | null> {
    const filePath = this.getCacheFilePath(tenantId);

    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as DataCenterCache;

      // 验证数据完整性
      if (!data.gatewayUrl || !data.tokenUrl || !data.cachedAt || !data.expiresAt) {
        logger.warn('缓存数据不完整，将重新获取', { tenantId });
        await this.deleteCache(tenantId);
        return null;
      }

      return data;
    } catch (error) {
      logger.warn('缓存文件损坏，将重新获取', {
        tenantId,
        error: (error as Error).message,
      });
      await this.deleteCache(tenantId);
      return null;
    }
  }

  /**
   * 删除缓存文件
   * @param tenantId 租户ID
   */
  private async deleteCache(tenantId: string): Promise<void> {
    const filePath = this.getCacheFilePath(tenantId);

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info('缓存文件已删除', { tenantId });
      }
    } catch (error) {
      logger.error('删除缓存文件失败', { tenantId, error: (error as Error).message });
    }
  }

  /**
   * 清除所有缓存
   */
  private async clearAllCache(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.cacheDir);
      const cacheFiles = files.filter((f) => f.startsWith('datacenter-') && f.endsWith('.json'));

      await Promise.all(
        cacheFiles.map((file) => fs.promises.unlink(path.join(this.cacheDir, file)))
      );

      logger.info('所有缓存文件已清除', { count: cacheFiles.length });
    } catch (error) {
      logger.error('清除所有缓存失败', { error: (error as Error).message });
    }
  }

  /**
   * 检查缓存是否有效
   * @param cache 缓存数据
   * @returns 是否有效
   */
  private isCacheValid(cache: DataCenterCache): boolean {
    return Date.now() < cache.expiresAt;
  }

  /**
   * 验证域名是否可访问
   * @param url 网关地址
   * @returns 是否可访问
   */
  private async validateDomain(url: string): Promise<boolean> {
    try {
      // 发送HEAD请求验证域名可访问性
      await axios.head(url, {
        timeout: 5000,
        validateStatus: () => true, // 接受任何状态码
      });
      return true;
    } catch (error) {
      logger.warn('域名验证失败', { url, error: (error as Error).message });
      return false;
    }
  }
}

// ==================== 导出实例 ====================

/**
 * 数据中心服务实例
 */
export const dataCenterService = new DataCenterService();

export default dataCenterService;
