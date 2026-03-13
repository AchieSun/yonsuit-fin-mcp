/**
 * 币种工具模块
 * @module tools/currency
 *
 * 提供币种档案相关的MCP工具，包括币种查询、本位币获取等功能
 */

import { z } from 'zod';
import { BaseClient } from '../client';
import { MCPTool, MCPToolResult, MCPContent } from '../types';
import { Currency } from '../types/yonyou.types';
import { logger } from '../utils';

/**
 * 币种查询参数Schema
 */
const CurrencyQuerySchema = z.object({
  /** 币种编码 */
  code: z.string().optional().describe('币种编码，支持模糊查询'),
  /** 币种名称 */
  name: z.string().optional().describe('币种名称，支持模糊查询'),
  /** 是否本位币 */
  isBase: z.boolean().optional().describe('是否本位币'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 币种详情查询参数Schema
 */
const CurrencyDetailSchema = z.object({
  /** 币种编码 */
  code: z.string().describe('币种编码（必填）'),
});

/**
 * 币种创建参数Schema
 */
const CurrencyCreateSchema = z.object({
  /** 币种编码 */
  code: z.string().describe('币种编码（必填）'),
  /** 币种名称 */
  name: z.string().describe('币种名称（必填）'),
  /** 币种符号 */
  symbol: z.string().describe('币种符号（必填）'),
  /** 是否本位币 */
  isBase: z.boolean().optional().default(false).describe('是否本位币，默认false'),
  /** 汇率 */
  exchangeRate: z.number().positive().optional().default(1).describe('汇率，默认1'),
  /** 是否启用 */
  enabled: z.boolean().optional().default(true).describe('是否启用，默认true'),
});

/**
 * 币种更新参数Schema
 */
const CurrencyUpdateSchema = z.object({
  /** 币种编码 */
  code: z.string().describe('币种编码（必填）'),
  /** 币种名称 */
  name: z.string().optional().describe('币种名称'),
  /** 币种符号 */
  symbol: z.string().optional().describe('币种符号'),
  /** 是否本位币 */
  isBase: z.boolean().optional().describe('是否本位币'),
  /** 汇率 */
  exchangeRate: z.number().positive().optional().describe('汇率'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
});

/**
 * 汇率查询参数Schema
 */
const ExchangeRateQuerySchema = z.object({
  /** 源币种编码 */
  fromCurrency: z.string().describe('源币种编码（必填）'),
  /** 目标币种编码 */
  toCurrency: z.string().describe('目标币种编码（必填）'),
  /** 日期 */
  date: z.string().optional().describe('日期，格式：YYYY-MM-DD，默认当天'),
});

/**
 * 币种工具类
 */
export class CurrencyTools {
  private client: BaseClient;
  private cache: Map<string, { data: Currency[]; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1小时缓存

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * 查询币种列表
   */
  async queryCurrencies(params: z.infer<typeof CurrencyQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询币种列表', { params });

      const requestBody: Record<string, unknown> = {
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
      };

      if (params.code) {
        requestBody.code = params.code;
      }

      if (params.name) {
        requestBody.name = params.name;
      }

      if (params.enabled !== undefined) {
        requestBody.enable = params.enabled ? 1 : 0;
      }

      const response = await this.client.post<{ code: string; message: string; data: { recordList: Currency[]; recordCount: number } }>(
        '/yonbip/digitalModel/currencytenant/batchQueryDetail',
        requestBody as Record<string, unknown>
      );

      let currencies = response.data?.recordList || [];

      if (params.isBase !== undefined) {
        currencies = currencies.filter((c) => c.isBase === params.isBase);
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询币种列表成功',
              data: {
                list: currencies,
                total: currencies.length,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询币种列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询币种列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询币种详情
   */
  async getCurrencyDetail(params: z.infer<typeof CurrencyDetailSchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询币种详情', { params });

      const response = await this.client.post<Currency[]>(
        '/yonbip/digitalModel/currencytenant/batchQueryDetail',
        params as Record<string, unknown>
      );

      if (!response || response.length === 0) {
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `未找到币种: ${params.code}`,
              }),
            },
          ],
          error: `未找到币种: ${params.code}`,
        };
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询币种详情成功',
              data: response[0],
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询币种详情失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询币种详情失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取本位币
   */
  async getBaseCurrency(): Promise<MCPToolResult> {
    try {
      logger.info('获取本位币');

      // 尝试从缓存获取
      const cacheKey = 'base_currency';
      const cached = this.cache.get(cacheKey);
      let baseCurrency: Currency | undefined;

      if (cached && Date.now() < cached.expiresAt) {
        baseCurrency = cached.data.find((c) => c.isBase);
        logger.debug('使用缓存的本位币数据');
      }

      if (!baseCurrency) {
        const response = await this.client.post<Currency[]>(
          '/yonbip/digitalModel/currencytenant/batchQueryDetail',
          { isBase: true } as Record<string, unknown>
        );

        if (!response || response.length === 0) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '未找到本位币设置',
                }),
              },
            ],
            error: '未找到本位币设置',
          };
        }

        baseCurrency = response[0];

        // 更新缓存
        this.cache.set(cacheKey, {
          data: response,
          expiresAt: Date.now() + this.CACHE_TTL,
        });
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '获取本位币成功',
              data: baseCurrency,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('获取本位币失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '获取本位币失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 创建币种
   */
  async createCurrency(params: z.infer<typeof CurrencyCreateSchema>): Promise<MCPToolResult> {
    try {
      logger.info('创建币种', { params });

      // 检查是否已存在
      const existing = await this.client.post<Currency[]>(
        '/yonbip/digitalModel/currencytenant/batchQueryDetail',
        { code: params.code } as Record<string, unknown>
      );

      if (existing && existing.length > 0) {
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `币种编码已存在: ${params.code}`,
              }),
            },
          ],
          error: `币种编码已存在: ${params.code}`,
        };
      }

      const response = await this.client.post<Currency>(
        '/yonbip/digitalModel/currencytenant/create',
        params as Record<string, unknown>
      );

      // 清除缓存
      this.cache.clear();

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '创建币种成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('创建币种失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '创建币种失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 更新币种
   */
  async updateCurrency(params: z.infer<typeof CurrencyUpdateSchema>): Promise<MCPToolResult> {
    try {
      logger.info('更新币种', { params });

      const response = await this.client.put<Currency>(
        '/yonbip/digitalModel/currencytenant/update',
        params as Record<string, unknown>
      );

      // 清除缓存
      this.cache.clear();

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '更新币种成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('更新币种失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '更新币种失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询汇率
   */
  async queryExchangeRate(params: z.infer<typeof ExchangeRateQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询汇率', { params });

      const response = await this.client.get<{ rate: number; date: string }>(
        '/yonbip/digitalModel/exchangerate/query',
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询汇率成功',
              data: {
                fromCurrency: params.fromCurrency,
                toCurrency: params.toCurrency,
                rate: response.rate,
                date: response.date,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询汇率失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询汇率失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 批量查询币种
   */
  async batchQueryCurrencies(codes: string[]): Promise<MCPToolResult> {
    try {
      logger.info('批量查询币种', { count: codes.length });

      const response = await this.client.post<Currency[]>(
        '/yonbip/digitalModel/currencytenant/batchQueryDetail',
        { codes } as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '批量查询币种成功',
              data: {
                list: response,
                total: response.length,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('批量查询币种失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '批量查询币种失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }
}

/**
 * 创建币种查询工具
 */
export function createCurrencyQueryTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'currency_query',
    description: '查询币种列表，支持按编码、名称、是否本位币等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '币种编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '币种名称，支持模糊查询',
        },
        isBase: {
          type: 'boolean',
          description: '是否本位币',
        },
        enabled: {
          type: 'boolean',
          description: '是否启用',
        },
        pageNum: {
          type: 'number',
          description: '页码，从1开始，默认1',
          default: 1,
        },
        pageSize: {
          type: 'number',
          description: '每页数量，最大100，默认20',
          default: 20,
        },
      },
    },
    handler: async (params) => {
      const validated = CurrencyQuerySchema.parse(params);
      return tools.queryCurrencies(validated);
    },
  };
}

/**
 * 创建币种详情查询工具
 */
export function createCurrencyDetailTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'currency_detail',
    description: '根据币种编码查询币种详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '币种编码（必填）',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      const validated = CurrencyDetailSchema.parse(params);
      return tools.getCurrencyDetail(validated);
    },
  };
}

/**
 * 创建本位币获取工具
 */
export function createBaseCurrencyTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'currency_base',
    description: '获取系统设置的本位币信息',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return tools.getBaseCurrency();
    },
  };
}

/**
 * 创建币种创建工具
 */
export function createCurrencyCreateTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'currency_create',
    description: '创建新的币种',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '币种编码（必填）',
        },
        name: {
          type: 'string',
          description: '币种名称（必填）',
        },
        symbol: {
          type: 'string',
          description: '币种符号（必填）',
        },
        isBase: {
          type: 'boolean',
          description: '是否本位币，默认false',
          default: false,
        },
        exchangeRate: {
          type: 'number',
          description: '汇率，默认1',
          default: 1,
        },
        enabled: {
          type: 'boolean',
          description: '是否启用，默认true',
          default: true,
        },
      },
      required: ['code', 'name', 'symbol'],
    },
    handler: async (params) => {
      const validated = CurrencyCreateSchema.parse(params);
      return tools.createCurrency(validated);
    },
  };
}

/**
 * 创建币种更新工具
 */
export function createCurrencyUpdateTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'currency_update',
    description: '更新币种信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '币种编码（必填）',
        },
        name: {
          type: 'string',
          description: '币种名称',
        },
        symbol: {
          type: 'string',
          description: '币种符号',
        },
        isBase: {
          type: 'boolean',
          description: '是否本位币',
        },
        exchangeRate: {
          type: 'number',
          description: '汇率',
        },
        enabled: {
          type: 'boolean',
          description: '是否启用',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      const validated = CurrencyUpdateSchema.parse(params);
      return tools.updateCurrency(validated);
    },
  };
}

/**
 * 创建汇率查询工具
 */
export function createExchangeRateQueryTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'exchange_rate_query',
    description: '查询两个币种之间的汇率',
    inputSchema: {
      type: 'object',
      properties: {
        fromCurrency: {
          type: 'string',
          description: '源币种编码（必填）',
        },
        toCurrency: {
          type: 'string',
          description: '目标币种编码（必填）',
        },
        date: {
          type: 'string',
          description: '日期，格式：YYYY-MM-DD，默认当天',
        },
      },
      required: ['fromCurrency', 'toCurrency'],
    },
    handler: async (params) => {
      const validated = ExchangeRateQuerySchema.parse(params);
      return tools.queryExchangeRate(validated);
    },
  };
}

/**
 * 创建批量查询币种工具
 */
export function createCurrencyBatchQueryTool(client: BaseClient): MCPTool {
  const tools = new CurrencyTools(client);

  return {
    name: 'currency_batch_query',
    description: '批量查询多个币种信息',
    inputSchema: {
      type: 'object',
      properties: {
        codes: {
          type: 'array',
          description: '币种编码列表（必填）',
          items: {
            type: 'string',
            description: '币种编码',
          },
        },
      },
      required: ['codes'],
    },
    handler: async (params) => {
      const codes = params.codes as string[];
      if (!Array.isArray(codes) || codes.length === 0) {
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: '请提供有效的币种编码列表',
              }),
            },
          ],
          error: '请提供有效的币种编码列表',
        };
      }
      return tools.batchQueryCurrencies(codes);
    },
  };
}

/**
 * 获取所有币种相关工具
 */
export function getCurrencyTools(client: BaseClient): MCPTool[] {
  return [
    createCurrencyQueryTool(client),
    createCurrencyDetailTool(client),
    createBaseCurrencyTool(client),
    createCurrencyCreateTool(client),
    createCurrencyUpdateTool(client),
    createExchangeRateQueryTool(client),
    createCurrencyBatchQueryTool(client),
  ];
}

export default CurrencyTools;
