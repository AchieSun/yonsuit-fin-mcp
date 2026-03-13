/**
 * 授权相关类型定义
 * @module types/auth
 */

/**
 * 用友API认证配置
 */
export interface AuthConfig {
  /** 应用Key */
  appKey: string;
  /** 应用密钥 */
  appSecret: string;
  /** 租户ID */
  tenantId: string;
  /** 用户ID */
  userId?: string;
  /** 数据中心域名 */
  dataCenterDomain: string;
  /** 认证类型 */
  authType: 'app_auth' | 'user_auth';
  /** Token缓存时间(秒) */
  tokenCacheTtl?: number;
}

/**
 * 用友API标准响应包装
 */
export interface YonyouApiResponse<T> {
  /** 结果码 */
  code: string;
  /** 结果信息 */
  message: string;
  /** 数据 */
  data: T;
}

/**
 * Token数据（API返回的data部分）
 */
export interface TokenData {
  /** 访问令牌 */
  access_token: string;
  /** 有效期(秒) */
  expire: number;
}

/**
 * Token响应接口（完整响应）
 */
export interface TokenResponse {
  /** 访问令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token?: string;
  /** 过期时间(秒) */
  expires_in: number;
  /** 令牌类型 */
  token_type: string;
  /** 作用域 */
  scope?: string;
  /** 创建时间戳 */
  created_at?: number;
}

/**
 * Token信息接口（内部使用）
 */
export interface TokenInfo {
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken?: string;
  /** 过期时间(秒) */
  expiresIn: number;
  /** 创建时间戳 */
  createdAt: number;
  /** 令牌类型 */
  tokenType: string;
}

/**
 * 刷新Token请求参数
 */
export interface RefreshTokenRequest {
  /** 刷新令牌 */
  refresh_token: string;
  /** 应用Key */
  app_key: string;
  /** 应用密钥 */
  app_secret: string;
}

/**
 * 认证请求参数
 */
export interface AuthRequest {
  /** 应用Key */
  app_key: string;
  /** 应用密钥 */
  app_secret: string;
  /** 租户ID */
  tenant_id: string;
  /** 用户ID（用户认证时需要） */
  user_id?: string;
  /** 时间戳 */
  timestamp: number;
  /** 签名 */
  sign: string;
  /** 签名版本 */
  sign_version?: string;
}

/**
 * 认证错误响应
 */
export interface AuthErrorResponse {
  /** 错误码 */
  error: string;
  /** 错误描述 */
  error_description: string;
  /** 错误详情 */
  error_details?: string;
}

/**
 * 用户认证信息
 */
export interface UserAuthInfo {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  userName: string;
  /** 用户类型 */
  userType: 'admin' | 'user' | 'system';
  /** 权限列表 */
  permissions?: string[];
  /** 角色列表 */
  roles?: string[];
  /** 账套ID */
  accountId?: string;
  /** 账套名称 */
  accountName?: string;
}

/**
 * 应用认证信息
 */
export interface AppAuthInfo {
  /** 应用ID */
  appId: string;
  /** 应用名称 */
  appName: string;
  /** 应用类型 */
  appType: 'web' | 'mobile' | 'desktop' | 'api';
  /** 权限范围 */
  scope?: string[];
  /** 租户ID */
  tenantId: string;
}

/**
 * 认证状态
 */
export interface AuthStatus {
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 认证类型 */
  authType: 'app_auth' | 'user_auth';
  /** 认证时间 */
  authenticatedAt?: number;
  /** 过期时间 */
  expiresAt?: number;
  /** 用户信息（用户认证时） */
  user?: UserAuthInfo;
  /** 应用信息（应用认证时） */
  app?: AppAuthInfo;
}

/**
 * 权限信息
 */
export interface Permission {
  /** 权限编码 */
  code: string;
  /** 权限名称 */
  name: string;
  /** 权限类型 */
  type: 'menu' | 'button' | 'api' | 'data';
  /** 资源路径 */
  resource?: string;
  /** 父权限编码 */
  parentCode?: string;
}

/**
 * 角色信息
 */
export interface Role {
  /** 角色编码 */
  code: string;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 权限列表 */
  permissions: Permission[];
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 租户ID */
  tenantId?: string;
  /** 验证码 */
  captcha?: string;
  /** 验证码Key */
  captchaKey?: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** Token信息 */
  token: TokenResponse;
  /** 用户信息 */
  user: UserAuthInfo;
  /** 认证状态 */
  status: AuthStatus;
}

/**
 * 登出请求参数
 */
export interface LogoutRequest {
  /** 访问令牌 */
  access_token?: string;
  /** 刷新令牌 */
  refresh_token?: string;
}

/**
 * 会话信息
 */
export interface SessionInfo {
  /** 会话ID */
  sessionId: string;
  /** 用户ID */
  userId: string;
  /** 创建时间 */
  createdAt: number;
  /** 最后活动时间 */
  lastActiveAt: number;
  /** 过期时间 */
  expiresAt: number;
  /** 客户端IP */
  clientIp?: string;
  /** 客户端信息 */
  userAgent?: string;
}
