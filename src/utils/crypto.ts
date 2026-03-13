/**
 * 加密工具模块
 * @module utils/crypto
 * 
 * 使用Node.js原生crypto模块实现加密功能
 */

import * as crypto from 'crypto';
import { logger } from './logger';

/**
 * 加密工具类
 */
export class CryptoUtil {
  /**
   * HmacSHA256加密
   * @param message 待加密消息
   * @param secret 密钥
   * @returns 加密后的字符串（Hex格式）
   */
  static hmacSHA256(message: string, secret: string): string {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(message);
      return hmac.digest('hex');
    } catch (error) {
      logger.error('HmacSHA256加密失败', error);
      throw new Error('HmacSHA256加密失败');
    }
  }

  /**
   * Base64编码
   * @param content 待编码内容
   * @returns Base64编码后的字符串
   */
  static base64Encode(content: string): string {
    try {
      return Buffer.from(content, 'utf8').toString('base64');
    } catch (error) {
      logger.error('Base64编码失败', error);
      throw new Error('Base64编码失败');
    }
  }

  /**
   * Base64解码
   * @param encoded 已编码的Base64字符串
   * @returns 解码后的字符串
   */
  static base64Decode(encoded: string): string {
    try {
      return Buffer.from(encoded, 'base64').toString('utf8');
    } catch (error) {
      logger.error('Base64解码失败', error);
      throw new Error('Base64解码失败');
    }
  }

  /**
   * URL编码
   * @param content 待编码内容
   * @returns URL编码后的字符串
   */
  static urlEncode(content: string): string {
    try {
      return encodeURIComponent(content)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
    } catch (error) {
      logger.error('URL编码失败', error);
      throw new Error('URL编码失败');
    }
  }

  /**
   * URL解码
   * @param encoded 已编码的URL字符串
   * @returns 解码后的字符串
   */
  static urlDecode(encoded: string): string {
    try {
      return decodeURIComponent(encoded);
    } catch (error) {
      logger.error('URL解码失败', error);
      throw new Error('URL解码失败');
    }
  }

  /**
   * SHA256哈希
   * @param content 待哈希内容
   * @returns 哈希后的字符串（大写）
   */
  static sha256(content: string): string {
    try {
      return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
    } catch (error) {
      logger.error('SHA256哈希失败', error);
      throw new Error('SHA256哈希失败');
    }
  }

  /**
   * MD5哈希
   * @param content 待哈希内容
   * @returns 哈希后的字符串（大写）
   */
  static md5(content: string): string {
    try {
      return crypto.createHash('md5').update(content).digest('hex').toUpperCase();
    } catch (error) {
      logger.error('MD5哈希失败', error);
      throw new Error('MD5哈希失败');
    }
  }
}

/**
 * 签名生成器类
 * 用于生成符合用友API规范的签名
 */
export class SignatureBuilder {
  private appSecret: string;

  constructor(appSecret: string) {
    this.appSecret = appSecret;
  }

  /**
   * 生成签名
   * @param params 待签名参数对象
   * @param algorithm 签名算法，默认SHA256
   * @returns 签名字符串
   */
  generate(params: Record<string, unknown>, algorithm: 'SHA256' | 'MD5' = 'SHA256'): string {
    try {
      // 1. 过滤并排序参数
      const sortedParams = this.sortParams(params);

      // 2. 构建待签名字符串
      const stringToSign = this.buildSignString(sortedParams);

      // 3. 生成签名
      const signature = algorithm === 'SHA256'
        ? CryptoUtil.sha256(stringToSign)
        : CryptoUtil.md5(stringToSign);

      logger.debug('签名生成成功', { signature, algorithm });

      return signature;
    } catch (error) {
      logger.error('签名生成失败', error);
      throw new Error('签名生成失败');
    }
  }

  /**
   * 生成带密钥的签名（HmacSHA256）
   * @param params 待签名参数对象
   * @returns 签名字符串
   */
  generateWithHmac(params: Record<string, unknown>): string {
    try {
      // 1. 过滤并排序参数
      const sortedParams = this.sortParams(params);

      // 2. 构建待签名字符串
      const stringToSign = this.buildSignString(sortedParams);

      // 3. 使用HmacSHA256生成签名
      const signature = CryptoUtil.hmacSHA256(stringToSign, this.appSecret).toUpperCase();

      logger.debug('HmacSHA256签名生成成功', { signature });

      return signature;
    } catch (error) {
      logger.error('HmacSHA256签名生成失败', error);
      throw new Error('HmacSHA256签名生成失败');
    }
  }

  /**
   * 过滤并排序参数
   * @param params 参数对象
   * @returns 排序后的参数对象
   */
  private sortParams(params: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(params).sort();

    for (const key of keys) {
      const value = params[key];
      // 过滤掉空值、null、undefined
      if (value !== undefined && value !== null && value !== '') {
        sorted[key] = value;
      }
    }

    return sorted;
  }

  /**
   * 构建待签名字符串
   * @param params 已排序的参数对象
   * @returns 待签名字符串
   */
  private buildSignString(params: Record<string, unknown>): string {
    const paramString = Object.entries(params)
      .map(([key, value]) => {
        // 将值转换为字符串
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return `${key}=${valueStr}`;
      })
      .join('&');

    // 添加密钥
    return `${paramString}&appSecret=${this.appSecret}`;
  }

  /**
   * 验证签名
   * @param params 参数对象
   * @param signature 待验证的签名
   * @param algorithm 签名算法
   * @returns 是否验证通过
   */
  verify(params: Record<string, unknown>, signature: string, algorithm: 'SHA256' | 'MD5' = 'SHA256'): boolean {
    try {
      const expectedSignature = this.generate(params, algorithm);
      const isValid = expectedSignature === signature;

      logger.debug('签名验证结果', { isValid });

      return isValid;
    } catch (error) {
      logger.error('签名验证失败', error);
      return false;
    }
  }
}

/**
 * 用友API签名工具
 * 按照用友API规范生成签名
 * 
 * 签名规则：
 * 1. 参数按名称排序
 * 2. 参数名称与参数值依次拼接（signature字段除外）
 * 3. 使用HmacSHA256计算签名，key为appSecret
 * 4. Base64编码
 * 5. URL编码
 */
export class YonyouSignature {
  private appKey: string;
  private appSecret: string;

  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
  }

  /**
   * 生成请求签名
   * @param method HTTP方法
   * @param path API路径
   * @param params 请求参数
   * @param timestamp 时间戳（可选，默认当前时间）
   * @returns 签名对象
   */
  generateRequestSignature(
    method: string,
    path: string,
    params: Record<string, unknown>,
    timestamp?: number
  ): { signature: string; timestamp: number; nonce: string } {
    const ts = timestamp || Date.now();
    const nonce = this.generateNonce();

    // 构建签名字符串
    const stringToSign = this.buildRequestSignString(method, path, params, ts, nonce);

    // 使用HmacSHA256生成签名
    const signature = this.generateSignature(stringToSign);

    logger.debug('用友请求签名生成成功', {
      method,
      path,
      timestamp: ts,
      nonce,
      signature,
    });

    return {
      signature,
      timestamp: ts,
      nonce,
    };
  }

  /**
   * 生成签名（符合用友API规范）
   * @param content 待签名内容
   * @returns 签名字符串（URL编码后的Base64）
   */
  generateSignature(content: string): string {
    try {
      // 1. 使用HmacSHA256计算签名
      const hmac = crypto.createHmac('sha256', this.appSecret);
      hmac.update(content);
      const base64Signature = hmac.digest('base64');
      
      // 2. URL编码
      const urlEncodedSignature = encodeURIComponent(base64Signature);

      logger.debug('签名生成详情', {
        content,
        base64: base64Signature,
        urlEncoded: urlEncodedSignature,
      });

      return urlEncodedSignature;
    } catch (error) {
      logger.error('签名生成失败', error);
      throw new Error('签名生成失败');
    }
  }

  /**
   * 生成API参数签名
   * 按照用友API规范：参数排序 -> 拼接 -> HmacSHA256 -> Base64 -> URL编码
   * @param params 待签名参数（signature字段会被自动排除）
   * @returns 签名字符串
   */
  generateParamsSignature(params: Record<string, unknown>): string {
    try {
      // 1. 参数排序并拼接（排除signature字段）
      const stringToSign = this.buildParamsSignString(params);

      logger.debug('参数签名原文', { stringToSign });

      // 2. 生成签名
      return this.generateSignature(stringToSign);
    } catch (error) {
      logger.error('参数签名生成失败', error);
      throw new Error('参数签名生成失败');
    }
  }

  /**
   * 构建参数签名字符串
   * 参数按名称排序，参数名称与参数值依次拼接（signature字段除外）
   * @param params 参数对象
   * @returns 待签名字符串
   */
  private buildParamsSignString(params: Record<string, unknown>): string {
    // 获取所有键并排序
    const keys = Object.keys(params)
      .filter(key => key !== 'signature') // 排除signature字段
      .sort();

    // 参数名称与参数值依次拼接
    const paramString = keys
      .map(key => {
        const value = params[key];
        // 过滤空值
        if (value === undefined || value === null || value === '') {
          return '';
        }
        // 将值转换为字符串
        const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return key + valueStr;
      })
      .filter(str => str !== '')
      .join('');

    return paramString;
  }

  /**
   * 构建请求签名字符串
   */
  private buildRequestSignString(
    method: string,
    path: string,
    params: Record<string, unknown>,
    timestamp: number,
    nonce: string
  ): string {
    // 参数排序并拼接
    const sortedParams = this.sortAndStringifyParams(params);

    // 构建签名字符串：METHOD\nPATH\nTIMESTAMP\nNONCE\nPARAMS
    return `${method.toUpperCase()}\n${path}\n${timestamp}\n${nonce}\n${sortedParams}`;
  }

  /**
   * 参数排序并字符串化
   */
  private sortAndStringifyParams(params: Record<string, unknown>): string {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(params).sort();

    for (const key of keys) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        sorted[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }

    return Object.entries(sorted)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  /**
   * 生成随机数
   */
  private generateNonce(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 生成Token签名
   * 按照用友API规范：参数排序 -> 拼接 -> HmacSHA256 -> Base64
   * 注意：返回Base64签名，URL编码由axios自动处理
   * @param timestamp 时间戳
   * @returns Base64签名字符串（未URL编码）
   */
  generateTokenSignature(timestamp: number): string {
    // 参数按名称排序，参数名称与参数值依次拼接
    const stringToSign = `appKey${this.appKey}timestamp${timestamp}`;
    
    // 使用Node.js原生crypto模块进行HmacSHA256签名
    const hmac = crypto.createHmac('sha256', this.appSecret);
    hmac.update(stringToSign);
    const base64Signature = hmac.digest('base64');
    
    // 注意：不进行URL编码，让axios的params自动处理
    // 如果手动URL编码后再传给axios，会导致双重编码问题
    
    logger.debug('Token签名生成详情', {
      stringToSign,
      base64: base64Signature,
    });
    
    return base64Signature;
  }

  /**
   * 验证签名
   * @param params 参数对象
   * @param signature 待验证的签名
   * @returns 是否验证通过
   */
  verifySignature(params: Record<string, unknown>, signature: string): boolean {
    try {
      const expectedSignature = this.generateParamsSignature(params);
      const isValid = expectedSignature === signature;

      logger.debug('签名验证结果', { 
        expected: expectedSignature, 
        actual: signature, 
        isValid 
      });

      return isValid;
    } catch (error) {
      logger.error('签名验证失败', error);
      return false;
    }
  }
}
