/**
 * 签名模块
 * @module signature
 * 
 * 用友API签名规范：
 * 1. 参数按名称排序
 * 2. 参数名称与参数值依次拼接（signature字段除外）
 * 3. 使用HmacSHA256计算签名，key为appSecret
 * 4. Base64编码
 * 5. URL编码
 */

import { logger } from '../utils';
import { SignatureBuilder, YonyouSignature } from '../utils/crypto';
import { appConfig } from '../config';

/**
 * 签名生成器
 * 使用新的加密工具实现签名生成
 */
export class SignatureGenerator {
  private builder: SignatureBuilder;
  private yonyouSigner: YonyouSignature;

  constructor() {
    this.builder = new SignatureBuilder(appConfig.yonyou.appSecret);
    this.yonyouSigner = new YonyouSignature(
      appConfig.yonyou.appKey,
      appConfig.yonyou.appSecret
    );
  }

  /**
   * 生成签名
   * @param params 待签名参数
   * @returns 签名字符串
   */
  generate(params: Record<string, unknown>): string {
    try {
      const signature = this.builder.generate(
        params,
        appConfig.signature.algorithm === 'SHA256' ? 'SHA256' : 'MD5'
      );

      logger.debug('签名生成成功', { signature });

      return signature;
    } catch (error) {
      logger.error('签名生成失败', error);
      throw new Error('签名生成失败');
    }
  }

  /**
   * 生成HmacSHA256签名
   * @param params 待签名参数
   * @returns 签名字符串
   */
  generateHmac(params: Record<string, unknown>): string {
    try {
      const signature = this.builder.generateWithHmac(params);

      logger.debug('HmacSHA256签名生成成功', { signature });

      return signature;
    } catch (error) {
      logger.error('HmacSHA256签名生成失败', error);
      throw new Error('HmacSHA256签名生成失败');
    }
  }

  /**
   * 生成用友API请求签名
   * @param method HTTP方法
   * @param path API路径
   * @param params 请求参数
   * @param timestamp 时间戳（可选）
   * @returns 签名对象
   */
  generateRequestSignature(
    method: string,
    path: string,
    params: Record<string, unknown>,
    timestamp?: number
  ): { signature: string; timestamp: number; nonce: string } {
    return this.yonyouSigner.generateRequestSignature(method, path, params, timestamp);
  }

  /**
   * 生成Token签名
   * @param timestamp 时间戳
   * @returns 签名字符串
   */
  generateTokenSignature(timestamp: number): string {
    return this.yonyouSigner.generateTokenSignature(timestamp);
  }

  /**
   * 生成用友API参数签名（符合用友API规范）
   * 按照用友API规范：参数排序 -> 拼接 -> HmacSHA256 -> Base64 -> URL编码
   * @param params 待签名参数（signature字段会被自动排除）
   * @returns 签名字符串
   */
  generateParamsSignature(params: Record<string, unknown>): string {
    try {
      const signature = this.yonyouSigner.generateParamsSignature(params);

      logger.debug('用友API参数签名生成成功', { 
        params: Object.keys(params),
        signature 
      });

      return signature;
    } catch (error) {
      logger.error('用友API参数签名生成失败', error);
      throw new Error('用友API参数签名生成失败');
    }
  }

  /**
   * 验证签名
   * @param params 参数
   * @param signature 待验证的签名
   * @returns 是否验证通过
   */
  verify(params: Record<string, unknown>, signature: string): boolean {
    try {
      const isValid = this.builder.verify(
        params,
        signature,
        appConfig.signature.algorithm === 'SHA256' ? 'SHA256' : 'MD5'
      );

      logger.debug('签名验证结果', { isValid });

      return isValid;
    } catch (error) {
      logger.error('签名验证失败', error);
      return false;
    }
  }

  /**
   * 验证用友API签名
   * @param params 参数对象
   * @param signature 待验证的签名
   * @returns 是否验证通过
   */
  verifyYonyouSignature(params: Record<string, unknown>, signature: string): boolean {
    try {
      const isValid = this.yonyouSigner.verifySignature(params, signature);

      logger.debug('用友API签名验证结果', { isValid });

      return isValid;
    } catch (error) {
      logger.error('用友API签名验证失败', error);
      return false;
    }
  }
}

/**
 * 签名生成器实例
 */
export const signatureGenerator = new SignatureGenerator();

// 导出签名构建器和用友签名工具
export { SignatureBuilder, YonyouSignature } from '../utils/crypto';

export default signatureGenerator;
