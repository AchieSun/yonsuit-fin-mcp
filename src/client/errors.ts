/**
 * API客户端错误类
 * @module client/errors
 */

/**
 * API错误基类
 */
export class ApiError extends Error {
  /** 错误码 */
  public readonly code: string;
  /** HTTP状态码 */
  public readonly statusCode?: number;
  /** 响应数据 */
  public readonly responseData?: unknown;
  /** 请求配置 */
  public readonly requestConfig?: unknown;
  /** 是否可重试 */
  public readonly retryable: boolean;
  /** 时间戳 */
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = options?.statusCode;
    this.responseData = options?.responseData;
    this.requestConfig = options?.requestConfig;
    this.retryable = options?.retryable ?? false;
    this.timestamp = Date.now();

    // 保持正确的原型链
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      responseData: this.responseData,
      retryable: this.retryable,
      timestamp: this.timestamp,
    };
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends ApiError {
  constructor(
    message: string = '认证失败',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'AUTH_ERROR', {
      ...options,
      retryable: false,
    });
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Token过期错误
 */
export class TokenExpiredError extends ApiError {
  constructor(
    message: string = 'Token已过期',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'TOKEN_EXPIRED', {
      ...options,
      retryable: true,
    });
    this.name = 'TokenExpiredError';
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * Token无效错误
 */
export class TokenInvalidError extends ApiError {
  constructor(
    message: string = 'Token无效',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'TOKEN_INVALID', {
      ...options,
      retryable: false,
    });
    this.name = 'TokenInvalidError';
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}

/**
 * 签名错误
 */
export class SignatureError extends ApiError {
  constructor(
    message: string = '签名验证失败',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'SIGNATURE_ERROR', {
      ...options,
      retryable: false,
    });
    this.name = 'SignatureError';
    Object.setPrototypeOf(this, SignatureError.prototype);
  }
}

/**
 * 参数错误
 */
export class ParameterError extends ApiError {
  /** 错误字段列表 */
  public readonly fields?: Array<{ field: string; message: string }>;

  constructor(
    message: string = '参数错误',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      fields?: Array<{ field: string; message: string }>;
      cause?: Error;
    }
  ) {
    super(message, 'PARAM_ERROR', {
      ...options,
      retryable: false,
    });
    this.name = 'ParameterError';
    this.fields = options?.fields;
    Object.setPrototypeOf(this, ParameterError.prototype);
  }
}

/**
 * 业务错误
 */
export class BusinessError extends ApiError {
  /** 业务错误码 */
  public readonly businessCode?: string;
  /** 业务错误详情 */
  public readonly details?: unknown;

  constructor(
    message: string,
    businessCode?: string,
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      details?: unknown;
      retryable?: boolean;
      cause?: Error;
    }
  ) {
    super(message, 'BUSINESS_ERROR', {
      ...options,
      retryable: options?.retryable ?? false,
    });
    this.name = 'BusinessError';
    this.businessCode = businessCode;
    this.details = options?.details;
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

/**
 * 网络错误
 */
export class NetworkError extends ApiError {
  constructor(
    message: string = '网络请求失败',
    options?: {
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'NETWORK_ERROR', {
      ...options,
      retryable: true,
    });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends ApiError {
  constructor(
    message: string = '请求超时',
    options?: {
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'TIMEOUT_ERROR', {
      ...options,
      retryable: true,
    });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * 速率限制错误
 */
export class RateLimitError extends ApiError {
  /** 重试等待时间（秒） */
  public readonly retryAfter?: number;

  constructor(
    message: string = '请求频率超限',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      retryAfter?: number;
      cause?: Error;
    }
  ) {
    super(message, 'RATE_LIMIT_ERROR', {
      ...options,
      retryable: true,
    });
    this.name = 'RateLimitError';
    this.retryAfter = options?.retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * 服务不可用错误
 */
export class ServiceUnavailableError extends ApiError {
  constructor(
    message: string = '服务暂时不可用',
    options?: {
      statusCode?: number;
      responseData?: unknown;
      requestConfig?: unknown;
      cause?: Error;
    }
  ) {
    super(message, 'SERVICE_UNAVAILABLE', {
      ...options,
      retryable: true,
    });
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * 根据错误响应创建对应的错误实例
 * @param statusCode HTTP状态码
 * @param responseData 响应数据
 * @param requestConfig 请求配置
 * @returns 错误实例
 */
export function createErrorFromResponse(
  statusCode: number,
  responseData: Record<string, unknown>,
  requestConfig?: unknown
): ApiError {
  const code = String(responseData.code || '');
  const message = String(responseData.message || '未知错误');

  // Token相关错误
  if (code === '10001' || code === 'TOKEN_INVALID') {
    return new TokenInvalidError(message, { statusCode, responseData, requestConfig });
  }
  if (code === '10002' || code === 'TOKEN_EXPIRED') {
    return new TokenExpiredError(message, { statusCode, responseData, requestConfig });
  }

  // 签名错误
  if (code === '10003' || code === 'SIGNATURE_ERROR') {
    return new SignatureError(message, { statusCode, responseData, requestConfig });
  }

  // 参数错误
  if (code === '20001' || code === 'PARAM_ERROR') {
    return new ParameterError(message, {
      statusCode,
      responseData,
      requestConfig,
      fields: Array.isArray(responseData.details)
        ? responseData.details
        : undefined,
    });
  }

  // 业务错误
  if (code === '30001' || code === 'BUSINESS_ERROR') {
    return new BusinessError(message, code, {
      statusCode,
      responseData,
      requestConfig,
      details: responseData.details,
    });
  }

  // 根据HTTP状态码判断
  if (statusCode === 401) {
    return new AuthenticationError(message, { statusCode, responseData, requestConfig });
  }
  if (statusCode === 429) {
    const retryAfter = responseData.retryAfter
      ? Number(responseData.retryAfter)
      : undefined;
    return new RateLimitError(message, {
      statusCode,
      responseData,
      requestConfig,
      retryAfter,
    });
  }
  if (statusCode === 503) {
    return new ServiceUnavailableError(message, { statusCode, responseData, requestConfig });
  }

  // 默认返回API错误
  return new ApiError(message, code, {
    statusCode,
    responseData,
    requestConfig,
    retryable: statusCode >= 500 && statusCode !== 501,
  });
}

/**
 * 判断错误是否可重试
 * @param error 错误对象
 * @returns 是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }
  // 网络错误和超时错误默认可重试
  if (error instanceof NetworkError || error instanceof TimeoutError) {
    return true;
  }
  return false;
}
