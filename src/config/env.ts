/**
 * 环境变量配置模块
 * @module config/env
 *
 * 负责从环境变量加载配置，支持 .env 文件和环境变量覆盖
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// 加载 .env 文件（如果存在）
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
}

/**
 * 环境变量键名定义
 */
export const ENV_KEYS = {
  // 用友API配置
  YONYOU_API_BASE_URL: 'YONYOU_API_BASE_URL',
  YONYOU_APP_KEY: 'YONYOU_APP_KEY',
  YONYOU_APP_SECRET: 'YONYOU_APP_SECRET',
  YONYOU_TENANT_ID: 'YONYOU_TENANT_ID',
  YONYOU_USER_ID: 'YONYOU_USER_ID',
  YONYOU_DATA_CENTER_DOMAIN: 'YONYOU_DATA_CENTER_DOMAIN',

  // 认证配置
  YONYOU_AUTH_TYPE: 'YONYOU_AUTH_TYPE',
  YONYOU_TOKEN_CACHE_TTL: 'YONYOU_TOKEN_CACHE_TTL',
  YONYOU_TOKEN_REFRESH_AHEAD: 'YONYOU_TOKEN_REFRESH_AHEAD',

  // 签名配置
  YONYOU_SIGNATURE_ALGORITHM: 'YONYOU_SIGNATURE_ALGORITHM',
  YONYOU_SIGNATURE_VERSION: 'YONYOU_SIGNATURE_VERSION',

  // 日志配置
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_FORMAT: 'LOG_FORMAT',
  LOG_FILE_PATH: 'LOG_FILE_PATH',

  // MCP服务器配置
  MCP_SERVER_NAME: 'MCP_SERVER_NAME',
  MCP_SERVER_VERSION: 'MCP_SERVER_VERSION',
  MCP_TRANSPORT_TYPE: 'MCP_TRANSPORT_TYPE',

  // 网络配置
  HTTP_TIMEOUT: 'HTTP_TIMEOUT',
  HTTP_MAX_RETRIES: 'HTTP_MAX_RETRIES',
  HTTP_RETRY_DELAY: 'HTTP_RETRY_DELAY',

  // 业务配置
  DEFAULT_ACCOUNT_BOOK: 'DEFAULT_ACCOUNT_BOOK',
  DEFAULT_CURRENCY: 'DEFAULT_CURRENCY',
  DEFAULT_VOUCHER_TYPE: 'DEFAULT_VOUCHER_TYPE',

  // 缓存配置
  CACHE_ENABLED: 'CACHE_ENABLED',
  CACHE_TTL: 'CACHE_TTL',
  CACHE_MAX_SIZE: 'CACHE_MAX_SIZE',

  // 安全配置
  ENABLE_REQUEST_SIGNATURE: 'ENABLE_REQUEST_SIGNATURE',
  ENABLE_RESPONSE_VALIDATION: 'ENABLE_RESPONSE_VALIDATION',

  // 运行环境
  NODE_ENV: 'NODE_ENV',
} as const;

/**
 * 环境变量类型
 */
export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

/**
 * 获取环境变量值
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] ?? defaultValue;
}

/**
 * 获取必填的环境变量值
 * @param key 环境变量键名
 * @returns 环境变量值
 * @throws Error 如果环境变量未设置
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`缺少必要的环境变量: ${key}`);
  }
  return value;
}

/**
 * 获取布尔类型环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 布尔值
 */
export function getBooleanEnv(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * 获取数字类型环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 数字值
 */
export function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    return defaultValue;
  }
  return parsed;
}

/**
 * 获取枚举类型环境变量
 * @param key 环境变量键名
 * @param allowedValues 允许的值列表
 * @param defaultValue 默认值
 * @returns 枚举值
 */
export function getEnumEnv<T extends string>(
  key: string,
  allowedValues: readonly T[],
  defaultValue: T
): T {
  const value = process.env[key] as T;
  if (!value) {
    return defaultValue;
  }
  if (!allowedValues.includes(value)) {
    return defaultValue;
  }
  return value;
}

/**
 * 环境变量配置对象类型
 */
interface EnvConfig {
  yonyou: {
    baseUrl: string;
    appKey: string;
    appSecret: string;
    tenantId: string;
    userId: string;
    dataCenterDomain: string;
    authType: 'app_auth' | 'user_auth';
    tokenCacheTtl: number;
    tokenRefreshAhead: number;
  };
  signature: {
    algorithm: 'SHA256' | 'MD5';
    version: string;
  };
  log: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
    filePath: string;
  };
  mcp: {
    name: string;
    version: string;
    transportType: 'stdio' | 'http' | 'websocket';
  };
  network: {
    timeout: number;
    maxRetries: number;
    retryDelay: number;
  };
  business: {
    defaultAccountBook: string;
    defaultCurrency: string;
    defaultVoucherType: string;
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  security: {
    enableRequestSignature: boolean;
    enableResponseValidation: boolean;
  };
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * 环境变量配置对象
 */
export const envConfig: EnvConfig = {
  // 用友API配置
  yonyou: {
    baseUrl: getEnv(ENV_KEYS.YONYOU_API_BASE_URL, 'https://c1.yonyoucloud.com'),
    appKey: getEnv(ENV_KEYS.YONYOU_APP_KEY, ''),
    appSecret: getEnv(ENV_KEYS.YONYOU_APP_SECRET, ''),
    tenantId: getEnv(ENV_KEYS.YONYOU_TENANT_ID, ''),
    userId: getEnv(ENV_KEYS.YONYOU_USER_ID, ''),
    dataCenterDomain: getEnv(ENV_KEYS.YONYOU_DATA_CENTER_DOMAIN, ''),
    authType: getEnumEnv(ENV_KEYS.YONYOU_AUTH_TYPE, ['app_auth', 'user_auth'] as const, 'app_auth'),
    tokenCacheTtl: getNumberEnv(ENV_KEYS.YONYOU_TOKEN_CACHE_TTL, 7200),
    tokenRefreshAhead: getNumberEnv(ENV_KEYS.YONYOU_TOKEN_REFRESH_AHEAD, 300),
  },

  // 签名配置
  signature: {
    algorithm: getEnumEnv(ENV_KEYS.YONYOU_SIGNATURE_ALGORITHM, ['SHA256', 'MD5'] as const, 'SHA256'),
    version: getEnv(ENV_KEYS.YONYOU_SIGNATURE_VERSION, 'v1'),
  },

  // 日志配置
  log: {
    level: getEnumEnv(ENV_KEYS.LOG_LEVEL, ['error', 'warn', 'info', 'debug'] as const, 'info'),
    format: getEnumEnv(ENV_KEYS.LOG_FORMAT, ['json', 'text'] as const, 'json'),
    filePath: getEnv(ENV_KEYS.LOG_FILE_PATH, './logs/yonyou-mcp.log'),
  },

  // MCP服务器配置
  mcp: {
    name: getEnv(ENV_KEYS.MCP_SERVER_NAME, 'yonyou-mcp'),
    version: getEnv(ENV_KEYS.MCP_SERVER_VERSION, '1.0.0'),
    transportType: getEnumEnv(ENV_KEYS.MCP_TRANSPORT_TYPE, ['stdio', 'http', 'websocket'] as const, 'stdio'),
  },

  // 网络配置
  network: {
    timeout: getNumberEnv(ENV_KEYS.HTTP_TIMEOUT, 30000),
    maxRetries: getNumberEnv(ENV_KEYS.HTTP_MAX_RETRIES, 3),
    retryDelay: getNumberEnv(ENV_KEYS.HTTP_RETRY_DELAY, 1000),
  },

  // 业务配置
  business: {
    defaultAccountBook: getEnv(ENV_KEYS.DEFAULT_ACCOUNT_BOOK, ''),
    defaultCurrency: getEnv(ENV_KEYS.DEFAULT_CURRENCY, 'CNY'),
    defaultVoucherType: getEnv(ENV_KEYS.DEFAULT_VOUCHER_TYPE, '记-1'),
  },

  // 缓存配置
  cache: {
    enabled: getBooleanEnv(ENV_KEYS.CACHE_ENABLED, true),
    ttl: getNumberEnv(ENV_KEYS.CACHE_TTL, 3600),
    maxSize: getNumberEnv(ENV_KEYS.CACHE_MAX_SIZE, 1000),
  },

  // 安全配置
  security: {
    enableRequestSignature: getBooleanEnv(ENV_KEYS.ENABLE_REQUEST_SIGNATURE, true),
    enableResponseValidation: getBooleanEnv(ENV_KEYS.ENABLE_RESPONSE_VALIDATION, true),
  },

  // 运行环境
  nodeEnv: getEnumEnv(ENV_KEYS.NODE_ENV, ['development', 'production', 'test'] as const, 'development'),
};

/**
 * 验证必要的环境变量
 * @throws Error 如果缺少必要的环境变量
 */
export function validateEnv(): void {
  const requiredKeys = [
    ENV_KEYS.YONYOU_APP_KEY,
    ENV_KEYS.YONYOU_APP_SECRET,
    ENV_KEYS.YONYOU_TENANT_ID,
  ];

  const missing: string[] = [];

  for (const key of requiredKeys) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`);
  }
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return envConfig.nodeEnv === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return envConfig.nodeEnv === 'production';
}

/**
 * 检查是否为测试环境
 */
export function isTest(): boolean {
  return envConfig.nodeEnv === 'test';
}

export default envConfig;
