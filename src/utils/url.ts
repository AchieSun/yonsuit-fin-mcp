/**
 * URL工具模块
 * @module utils/url
 */

import { logger } from './logger';

/**
 * URL构建器类
 */
export class UrlBuilder {
  private baseUrl: string;
  private paths: string[];
  private params: Map<string, string | number | boolean>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.paths = [];
    this.params = new Map();
  }

  /**
   * 设置基础URL
   */
  setBaseUrl(baseUrl: string): this {
    this.baseUrl = baseUrl;
    return this;
  }

  /**
   * 添加路径
   */
  addPath(path: string): this {
    // 移除首尾斜杠
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    if (normalizedPath) {
      this.paths.push(normalizedPath);
    }
    return this;
  }

  /**
   * 添加多个路径
   */
  addPaths(...paths: string[]): this {
    paths.forEach((path) => this.addPath(path));
    return this;
  }

  /**
   * 添加查询参数
   */
  addParam(key: string, value: string | number | boolean | undefined | null): this {
    if (value !== undefined && value !== null && value !== '') {
      this.params.set(key, value);
    }
    return this;
  }

  /**
   * 批量添加查询参数
   */
  addParams(params: Record<string, string | number | boolean | undefined | null>): this {
    Object.entries(params).forEach(([key, value]) => {
      this.addParam(key, value);
    });
    return this;
  }

  /**
   * 构建完整URL
   */
  build(): string {
    let url = this.baseUrl;

    // 添加路径
    if (this.paths.length > 0) {
      const pathString = this.paths.join('/');
      if (url.endsWith('/')) {
        url += pathString;
      } else if (url) {
        url += '/' + pathString;
      } else {
        url = pathString;
      }
    }

    // 添加查询参数
    if (this.params.size > 0) {
      const queryString = this.buildQueryString();
      url += '?' + queryString;
    }

    return url;
  }

  /**
   * 构建查询字符串
   */
  private buildQueryString(): string {
    const params: string[] = [];

    // 按key排序
    const sortedKeys = Array.from(this.params.keys()).sort();

    for (const key of sortedKeys) {
      const value = this.params.get(key);
      if (value !== undefined) {
        params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }

    return params.join('&');
  }

  /**
   * 重置构建器
   */
  reset(): this {
    this.baseUrl = '';
    this.paths = [];
    this.params.clear();
    return this;
  }
}

/**
 * URL工具类
 */
export class UrlUtil {
  /**
   * 拼接URL
   * @param baseUrl 基础URL
   * @param paths 路径片段
   * @returns 完整URL
   */
  static join(baseUrl: string, ...paths: string[]): string {
    let url = baseUrl.replace(/\/+$/, '');

    for (const path of paths) {
      const normalizedPath = path.replace(/^\/+|\/+$/g, '');
      if (normalizedPath) {
        url += '/' + normalizedPath;
      }
    }

    return url;
  }

  /**
   * 序列化参数为查询字符串
   * @param params 参数对象
   * @param options 序列化选项
   * @returns 查询字符串
   */
  static serializeParams(
    params: Record<string, unknown>,
    options: {
      /** 是否排序 */
      sort?: boolean;
      /** 是否编码 */
      encode?: boolean;
      /** 是否跳过空值 */
      skipEmpty?: boolean;
    } = {}
  ): string {
    const { sort = true, encode = true, skipEmpty = true } = options;

    try {
      let entries = Object.entries(params);

      // 过滤空值
      if (skipEmpty) {
        entries = entries.filter(([_, value]) => value !== undefined && value !== null && value !== '');
      }

      // 排序
      if (sort) {
        entries.sort(([a], [b]) => a.localeCompare(b));
      }

      // 构建查询字符串
      const queryString = entries
        .map(([key, value]) => {
          const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return encode
            ? `${encodeURIComponent(key)}=${encodeURIComponent(valueStr)}`
            : `${key}=${valueStr}`;
        })
        .join('&');

      return queryString;
    } catch (error) {
      logger.error('参数序列化失败', error);
      throw new Error('参数序列化失败');
    }
  }

  /**
   * 解析查询字符串为参数对象
   * @param queryString 查询字符串
   * @returns 参数对象
   */
  static parseParams(queryString: string): Record<string, string> {
    try {
      const params: Record<string, string> = {};

      if (!queryString) {
        return params;
      }

      // 移除开头的?
      const query = queryString.startsWith('?') ? queryString.slice(1) : queryString;

      const pairs = query.split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
      }

      return params;
    } catch (error) {
      logger.error('参数解析失败', error);
      throw new Error('参数解析失败');
    }
  }

  /**
   * 解析URL
   * @param url URL字符串
   * @returns URL组成部分
   */
  static parseUrl(url: string): {
    protocol: string;
    host: string;
    port?: string;
    path: string;
    query: Record<string, string>;
    hash?: string;
  } {
    try {
      const urlObj = new URL(url);

      return {
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.hostname,
        port: urlObj.port || undefined,
        path: urlObj.pathname,
        query: this.parseParams(urlObj.search),
        hash: urlObj.hash ? urlObj.hash.slice(1) : undefined,
      };
    } catch (error) {
      logger.error('URL解析失败', error);
      throw new Error('URL解析失败');
    }
  }

  /**
   * 构建完整URL
   * @param baseUrl 基础URL
   * @param path 路径
   * @param params 查询参数
   * @returns 完整URL
   */
  static buildUrl(
    baseUrl: string,
    path?: string,
    params?: Record<string, unknown>
  ): string {
    let url = baseUrl;

    if (path) {
      url = this.join(baseUrl, path);
    }

    if (params && Object.keys(params).length > 0) {
      const queryString = this.serializeParams(params);
      url += '?' + queryString;
    }

    return url;
  }

  /**
   * 检查URL是否有效
   * @param url URL字符串
   * @returns 是否有效
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取URL的路径部分
   * @param url URL字符串
   * @returns 路径
   */
  static getPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return '';
    }
  }

  /**
   * 获取URL的查询参数
   * @param url URL字符串
   * @returns 查询参数对象
   */
  static getQueryParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url);
      return this.parseParams(urlObj.search);
    } catch {
      return {};
    }
  }
}

// 导出便捷函数
export const buildUrl = (baseUrl: string, path?: string, params?: Record<string, unknown>) =>
  UrlUtil.buildUrl(baseUrl, path, params);

export const joinUrl = (baseUrl: string, ...paths: string[]) => UrlUtil.join(baseUrl, ...paths);

export const serializeParams = (params: Record<string, unknown>, options?: Parameters<typeof UrlUtil.serializeParams>[1]) =>
  UrlUtil.serializeParams(params, options);

export const parseParams = (queryString: string) => UrlUtil.parseParams(queryString);
