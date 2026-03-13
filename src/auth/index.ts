/**
 * 认证模块
 * @module auth
 *
 * 提供用友API的认证管理功能，包括Token获取、缓存、刷新等
 */

// 导出Token管理器
export { TokenManager, tokenManager } from './token-manager';

// 导出类型
export type { TokenInfo, TokenResponse } from '../types';

// 导入Token管理器
import { TokenManager, tokenManager } from './token-manager';
import { logger } from '../utils';
import { appConfig } from '../config';
import { TokenInfo, AuthStatus, AuthConfig } from '../types';

/**
 * 认证管理器
 * 提供高级认证功能和便捷方法
 */
export class AuthManager {
  /** Token管理器实例 */
  private tokenManager: TokenManager;

  /** 认证配置 */
  private config: AuthConfig;

  /**
   * 构造函数
   * @param tokenManager Token管理器实例
   */
  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
    this.config = {
      appKey: appConfig.yonyou.appKey,
      appSecret: appConfig.yonyou.appSecret,
      tenantId: appConfig.yonyou.tenantId,
      userId: appConfig.yonyou.userId,
      dataCenterDomain: appConfig.yonyou.dataCenterDomain,
      authType: appConfig.yonyou.authType,
      tokenCacheTtl: appConfig.yonyou.tokenCacheTtl,
    };
  }

  /**
   * 获取访问令牌
   * @returns 访问令牌
   */
  async getAccessToken(): Promise<string> {
    return this.tokenManager.getAccessToken();
  }

  /**
   * 强制刷新访问令牌
   * @returns 新的访问令牌
   */
  async refreshAccessToken(): Promise<string> {
    logger.info('强制刷新访问令牌');
    return this.tokenManager.refreshToken();
  }

  /**
   * 获取当前Token信息
   * @returns Token信息或undefined
   */
  getTokenInfo(): TokenInfo | undefined {
    return this.tokenManager.getTokenInfo();
  }

  /**
   * 获取认证状态
   * @returns 认证状态
   */
  getAuthStatus(): AuthStatus {
    const tokenInfo = this.getTokenInfo();

    return {
      isAuthenticated: !!tokenInfo && this.isTokenValid(tokenInfo),
      authType: this.config.authType,
      authenticatedAt: tokenInfo?.createdAt,
      expiresAt: tokenInfo ? tokenInfo.createdAt + tokenInfo.expiresIn * 1000 : undefined,
      app: {
        appId: this.config.appKey,
        appName: 'Yonyou MCP App',
        appType: 'api',
        tenantId: this.config.tenantId,
      },
    };
  }

  /**
   * 检查Token是否有效
   * @param tokenInfo Token信息
   * @returns 是否有效
   */
  private isTokenValid(tokenInfo: TokenInfo): boolean {
    const now = Date.now();
    const expiresAt = tokenInfo.createdAt + tokenInfo.expiresIn * 1000;
    // 提前60秒认为过期
    return now < expiresAt - 60000;
  }

  /**
   * 检查Token是否即将过期
   * @param threshold 阈值（秒），默认300秒（5分钟）
   * @returns 是否即将过期
   */
  isTokenExpiringSoon(threshold: number = 300): boolean {
    return this.tokenManager.isTokenExpiringSoon(threshold);
  }

  /**
   * 清除Token缓存
   */
  clearTokenCache(): void {
    this.tokenManager.clearCache();
    logger.info('Token缓存已清除');
  }

  /**
   * 获取认证配置（隐藏敏感信息）
   * @returns 认证配置
   */
  getAuthConfig(): Partial<AuthConfig> {
    return {
      appKey: this.config.appKey ? `******${this.config.appKey.slice(-4)}` : '',
      tenantId: this.config.tenantId,
      userId: this.config.userId,
      dataCenterDomain: this.config.dataCenterDomain,
      authType: this.config.authType,
      tokenCacheTtl: this.config.tokenCacheTtl,
    };
  }

  /**
   * 验证认证配置
   * @returns 是否有效
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.appKey) {
      errors.push('缺少 appKey 配置');
    }

    if (!this.config.appSecret) {
      errors.push('缺少 appSecret 配置');
    }

    if (!this.config.tenantId) {
      errors.push('缺少 tenantId 配置');
    }

    if (!this.config.dataCenterDomain) {
      errors.push('缺少 dataCenterDomain 配置');
    }

    if (this.config.authType === 'user_auth' && !this.config.userId) {
      errors.push('用户认证模式下缺少 userId 配置');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    this.tokenManager.stopAutoRefresh();
  }
}

/**
 * 认证管理器实例
 */
export const authManager = new AuthManager(tokenManager);

export default authManager;
