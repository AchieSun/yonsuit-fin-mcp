/**
 * 应用配置接口
 */
export interface AppConfig {
  /** 应用名称 */
  name: string;
  /** 应用版本 */
  version: string;
  /** 运行环境 */
  env: 'development' | 'production' | 'test';
}

/**
 * 用友API配置接口
 */
export interface YonyouConfig {
  /** API基础URL */
  baseUrl: string;
  /** 应用Key */
  appKey: string;
  /** 应用密钥 */
  appSecret: string;
  /** 租户ID */
  tenantId: string;
  /** 用户ID */
  userId: string;
  /** 数据中心域名 */
  dataCenterDomain: string;
  /** 认证类型 */
  authType: 'app_auth' | 'user_auth';
  /** Token缓存时间(秒) */
  tokenCacheTtl: number;
}

/**
 * 签名配置接口
 */
export interface SignatureConfig {
  /** 签名算法 */
  algorithm: 'SHA256' | 'MD5';
  /** 签名版本 */
  version: string;
}

/**
 * 日志配置接口
 */
export interface LogConfig {
  /** 日志级别 */
  level: 'error' | 'warn' | 'info' | 'debug';
  /** 日志格式 */
  format: 'json' | 'text';
  /** 日志文件路径 */
  filePath: string;
}

/**
 * MCP服务器配置接口
 */
export interface MCPServerConfig {
  /** 服务器名称 */
  name: string;
  /** 服务器版本 */
  version: string;
  /** 传输类型 */
  transportType: 'stdio' | 'http' | 'websocket';
}

/**
 * 网络配置接口
 */
export interface NetworkConfig {
  /** 请求超时时间(毫秒) */
  timeout: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟(毫秒) */
  retryDelay: number;
}

/**
 * 业务配置接口
 */
export interface BusinessConfig {
  /** 默认账簿 */
  defaultAccountBook: string;
  /** 默认币种 */
  defaultCurrency: string;
  /** 默认凭证类型 */
  defaultVoucherType: string;
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean;
  /** 缓存时间(秒) */
  ttl: number;
  /** 最大缓存数量 */
  maxSize: number;
}

/**
 * 安全配置接口
 */
export interface SecurityConfig {
  /** 是否启用请求签名 */
  enableRequestSignature: boolean;
  /** 是否启用响应验证 */
  enableResponseValidation: boolean;
}

/**
 * 完整配置接口
 */
export interface Config extends AppConfig {
  yonyou: YonyouConfig;
  signature: SignatureConfig;
  log: LogConfig;
  mcp: MCPServerConfig;
  network: NetworkConfig;
  business: BusinessConfig;
  cache: CacheConfig;
  security: SecurityConfig;
}
