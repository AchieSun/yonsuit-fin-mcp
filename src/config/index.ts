/**
 * 配置管理模块
 * @module config
 *
 * 统一管理应用配置，包括环境变量配置和常量配置
 */

// 导出环境变量配置
export {
  envConfig,
  ENV_KEYS,
  getEnv,
  getRequiredEnv,
  getBooleanEnv,
  getNumberEnv,
  getEnumEnv,
  validateEnv,
  isDevelopment,
  isProduction,
  isTest,
  type EnvKey,
} from './env';

// 导出常量配置
export {
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
} from './constants';

// 导入配置模块
import { config } from 'dotenv';
import { envConfig, validateEnv } from './env';
import { TOKEN_CONFIG, HTTP_CONFIG, CACHE_CONFIG, BUSINESS_CONSTANTS } from './constants';
import { Config } from '../types';

// 加载环境变量
config();

/**
 * 应用配置对象
 * 整合环境变量配置和常量配置
 */
export const appConfig: Config = {
  // 应用配置
  name: envConfig.mcp.name,
  version: envConfig.mcp.version,
  env: envConfig.nodeEnv,

  // 用友配置
  yonyou: {
    baseUrl: envConfig.yonyou.baseUrl,
    appKey: envConfig.yonyou.appKey,
    appSecret: envConfig.yonyou.appSecret,
    tenantId: envConfig.yonyou.tenantId,
    userId: envConfig.yonyou.userId,
    dataCenterDomain: envConfig.yonyou.dataCenterDomain,
    authType: envConfig.yonyou.authType,
    tokenCacheTtl: envConfig.yonyou.tokenCacheTtl,
  },

  // 签名配置
  signature: {
    algorithm: envConfig.signature.algorithm,
    version: envConfig.signature.version,
  },

  // 日志配置
  log: {
    level: envConfig.log.level,
    format: envConfig.log.format,
    filePath: envConfig.log.filePath,
  },

  // MCP配置
  mcp: {
    name: envConfig.mcp.name,
    version: envConfig.mcp.version,
    transportType: envConfig.mcp.transportType,
  },

  // 网络配置
  network: {
    timeout: envConfig.network.timeout,
    maxRetries: envConfig.network.maxRetries,
    retryDelay: envConfig.network.retryDelay,
  },

  // 业务配置
  business: {
    defaultAccountBook: envConfig.business.defaultAccountBook,
    defaultCurrency: envConfig.business.defaultCurrency,
    defaultVoucherType: envConfig.business.defaultVoucherType,
  },

  // 缓存配置
  cache: {
    enabled: envConfig.cache.enabled,
    ttl: envConfig.cache.ttl,
    maxSize: envConfig.cache.maxSize,
  },

  // 安全配置
  security: {
    enableRequestSignature: envConfig.security.enableRequestSignature,
    enableResponseValidation: envConfig.security.enableResponseValidation,
  },
};

/**
 * 验证配置完整性
 * @throws Error 如果配置不完整
 */
export function validateConfig(): void {
  validateEnv();

  // 验证业务配置
  if (!appConfig.yonyou.appKey) {
    throw new Error('缺少必要的配置项: YONYOU_APP_KEY');
  }
  if (!appConfig.yonyou.appSecret) {
    throw new Error('缺少必要的配置项: YONYOU_APP_SECRET');
  }
  if (!appConfig.yonyou.tenantId) {
    throw new Error('缺少必要的配置项: YONYOU_TENANT_ID');
  }
  if (!appConfig.yonyou.dataCenterDomain) {
    throw new Error('缺少必要的配置项: YONYOU_DATA_CENTER_DOMAIN');
  }
}

/**
 * 获取Token配置
 */
export function getTokenConfig() {
  return {
    expiresIn: TOKEN_CONFIG.EXPIRES_IN,
    refreshAhead: TOKEN_CONFIG.REFRESH_AHEAD,
    minValidity: TOKEN_CONFIG.MIN_VALIDITY,
    cacheKeyPrefix: TOKEN_CONFIG.CACHE_KEY_PREFIX,
  };
}

/**
 * 获取HTTP配置
 */
export function getHttpConfig() {
  return {
    timeout: HTTP_CONFIG.DEFAULT_TIMEOUT,
    maxRetries: HTTP_CONFIG.MAX_RETRIES,
    retryDelay: HTTP_CONFIG.RETRY_DELAY,
    connectTimeout: HTTP_CONFIG.CONNECT_TIMEOUT,
    responseTimeout: HTTP_CONFIG.RESPONSE_TIMEOUT,
  };
}

/**
 * 获取缓存配置
 */
export function getCacheConfig() {
  return {
    enabled: appConfig.cache.enabled,
    ttl: appConfig.cache.ttl,
    maxSize: appConfig.cache.maxSize,
    archiveTtl: CACHE_CONFIG.ARCHIVE_TTL,
    tokenTtl: CACHE_CONFIG.TOKEN_TTL,
  };
}

/**
 * 获取业务常量配置
 */
export function getBusinessConstants() {
  return BUSINESS_CONSTANTS;
}

/**
 * 打印配置信息（隐藏敏感信息）
 */
export function printConfig(): void {
  console.log('========== 应用配置 ==========');
  console.log(`环境: ${appConfig.env}`);
  console.log(`应用名称: ${appConfig.name}`);
  console.log(`应用版本: ${appConfig.version}`);
  console.log('---------- 用友配置 ----------');
  console.log(`API地址: ${appConfig.yonyou.baseUrl}`);
  console.log(`App Key: ${appConfig.yonyou.appKey ? '******' + appConfig.yonyou.appKey.slice(-4) : '(未设置)'}`);
  console.log(`App Secret: ${appConfig.yonyou.appSecret ? '******' : '(未设置)'}`);
  console.log(`租户ID: ${appConfig.yonyou.tenantId || '(未设置)'}`);
  console.log(`数据中心: ${appConfig.yonyou.dataCenterDomain || '(未设置)'}`);
  console.log(`认证类型: ${appConfig.yonyou.authType}`);
  console.log(`Token缓存时间: ${appConfig.yonyou.tokenCacheTtl}秒`);
  console.log('---------- 网络配置 ----------');
  console.log(`超时时间: ${appConfig.network.timeout}ms`);
  console.log(`最大重试: ${appConfig.network.maxRetries}次`);
  console.log(`重试延迟: ${appConfig.network.retryDelay}ms`);
  console.log('---------- 缓存配置 ----------');
  console.log(`缓存启用: ${appConfig.cache.enabled}`);
  console.log(`缓存时间: ${appConfig.cache.ttl}秒`);
  console.log(`最大缓存: ${appConfig.cache.maxSize}条`);
  console.log('==============================');
}

export default appConfig;
