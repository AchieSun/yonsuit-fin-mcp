/**
 * 初始化模块
 * @module init
 *
 * 提供统一的初始化入口，按顺序执行验证流程：
 * 1. 域名存在性验证
 * 2. Token 验证
 * 3. 返回初始化状态
 */

import { dataCenterService } from './services';
import { tokenManager } from './auth';
import { appConfig } from './config';
import { logger } from './utils';

// ==================== 类型定义 ====================

/**
 * 初始化状态
 */
export interface InitStatus {
  /** 是否已初始化 */
  initialized: boolean;
  /** 网关地址 */
  gatewayUrl: string | null;
  /** Token地址 */
  tokenUrl: string | null;
  /** 是否有有效的Token */
  hasValidToken: boolean;
  /** 错误信息 */
  error?: string;
}

// ==================== 模块变量 ====================

/**
 * 初始化状态
 */
let initStatus: InitStatus = {
  initialized: false,
  gatewayUrl: null,
  tokenUrl: null,
  hasValidToken: false,
};

/**
 * 初始化Promise，用于防止并发初始化
 */
let initPromise: Promise<void> | null = null;

// ==================== 公共方法 ====================

/**
 * 初始化函数
 * 按顺序执行验证流程，确保系统处于可用状态
 *
 * @returns 初始化状态
 *
 * @example
 * ```typescript
 * import { initialize, getInitStatus } from './init';
 *
 * // 执行初始化
 * const status = await initialize();
 *
 * if (status.initialized) {
 *   console.log('初始化成功');
 *   console.log('Gateway URL:', status.gatewayUrl);
 *   console.log('Token URL:', status.tokenUrl);
 * } else {
 *   console.error('初始化失败:', status.error);
 * }
 * ```
 */
export async function initialize(): Promise<InitStatus> {
  // 如果已经初始化完成，直接返回状态
  if (initStatus.initialized) {
    logger.debug('系统已初始化，返回当前状态');
    return initStatus;
  }

  // 如果正在初始化，等待初始化完成
  if (initPromise) {
    logger.debug('系统正在初始化，等待完成...');
    await initPromise;
    return initStatus;
  }

  // 开始初始化
  initPromise = doInitialize();

  try {
    await initPromise;
    return initStatus;
  } catch (error) {
    // 初始化失败，清除Promise以便重试
    initPromise = null;
    throw error;
  }
}

/**
 * 获取初始化状态
 * @returns 初始化状态的副本
 */
export function getInitStatus(): InitStatus {
  return { ...initStatus };
}

/**
 * 重置初始化状态
 * 用于测试或重新初始化
 */
export function resetInitStatus(): void {
  initStatus = {
    initialized: false,
    gatewayUrl: null,
    tokenUrl: null,
    hasValidToken: false,
  };
  initPromise = null;
  logger.info('初始化状态已重置');
}

// ==================== 私有方法 ====================

/**
 * 执行初始化流程
 */
async function doInitialize(): Promise<void> {
  try {
    logger.info('========== 开始初始化 ==========');

    // 1. 验证配置
    logger.info('步骤0: 验证配置...');
    const tenantId = appConfig.yonyou.tenantId;
    if (!tenantId) {
      throw new Error('缺少必要配置: YONYOU_TENANT_ID');
    }

    const appKey = appConfig.yonyou.appKey;
    if (!appKey) {
      throw new Error('缺少必要配置: YONYOU_APP_KEY');
    }

    const appSecret = appConfig.yonyou.appSecret;
    if (!appSecret) {
      throw new Error('缺少必要配置: YONYOU_APP_SECRET');
    }

    const dataCenterDomain = appConfig.yonyou.dataCenterDomain;
    if (!dataCenterDomain) {
      throw new Error('缺少必要配置: YONYOU_DATA_CENTER_DOMAIN');
    }

    logger.info('配置验证通过', {
      tenantId,
      appKey: `******${appKey.slice(-4)}`,
      dataCenterDomain,
    });

    // 2. 获取域名并验证
    logger.info('步骤1: 验证域名有效性...');
    const domainResult = await dataCenterService.ensureDomainValid(tenantId);
    initStatus.gatewayUrl = domainResult.gatewayUrl;
    initStatus.tokenUrl = domainResult.tokenUrl;
    logger.info('域名验证通过', {
      gatewayUrl: domainResult.gatewayUrl,
      tokenUrl: domainResult.tokenUrl,
    });

    // 3. 验证 Token
    logger.info('步骤2: 验证 Token 有效性...');
    const token = await tokenManager.getAccessToken();
    initStatus.hasValidToken = !!token;

    if (!initStatus.hasValidToken) {
      throw new Error('Token 获取失败');
    }

    logger.info('Token 验证通过');

    // 4. 标记初始化完成
    initStatus.initialized = true;
    logger.info('========== 初始化完成 ==========');

  } catch (error) {
    const errorMessage = (error as Error).message;
    initStatus.error = errorMessage;
    logger.error('========== 初始化失败 ==========', {
      error: errorMessage,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

// ==================== 导出默认 ====================

export default {
  initialize,
  getInitStatus,
  resetInitStatus,
};
