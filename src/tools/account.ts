/**
 * 账簿工具模块
 * @module tools/account
 *
 * 提供账簿相关的MCP工具，包括账簿查询、总账、明细账、余额表等功能
 */

import { z } from 'zod';
import { BaseClient } from '../client';
import { MCPTool, MCPToolResult, MCPContent } from '../types';
import { API_PATHS } from '../config/constants';
import { AccountBook } from '../types/yonyou.types';
import { logger } from '../utils';

/**
 * 账簿查询参数Schema
 */
const AccountBookQuerySchema = z.object({
  /** 账簿编码 */
  code: z.string().optional().describe('账簿编码'),
  /** 账簿名称（模糊查询） */
  name: z.string().optional().describe('账簿名称，支持模糊查询'),
  /** 账簿类型 */
  type: z.string().optional().describe('账簿类型'),
  /** 会计年度 */
  fiscalYear: z.number().optional().describe('会计年度'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 总账查询参数Schema
 */
const GeneralLedgerQuerySchema = z.object({
  /** 科目编码 */
  accountCode: z.string().describe('科目编码'),
  /** 开始期间 */
  startPeriod: z.string().describe('开始期间，格式：YYYY-MM'),
  /** 结束期间 */
  endPeriod: z.string().describe('结束期间，格式：YYYY-MM'),
  /** 币种 */
  currency: z.string().optional().default('CNY').describe('币种编码，默认CNY'),
  /** 是否包含未记账凭证 */
  includeUnposted: z.boolean().optional().default(false).describe('是否包含未记账凭证'),
});

/**
 * 明细账查询参数Schema
 */
const DetailLedgerQuerySchema = z.object({
  /** 科目编码 */
  accountCode: z.string().describe('科目编码'),
  /** 开始期间 */
  startPeriod: z.string().describe('开始期间，格式：YYYY-MM'),
  /** 结束期间 */
  endPeriod: z.string().describe('结束期间，格式：YYYY-MM'),
  /** 币种 */
  currency: z.string().optional().default('CNY').describe('币种编码，默认CNY'),
  /** 是否包含未记账凭证 */
  includeUnposted: z.boolean().optional().default(false).describe('是否包含未记账凭证'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(50).describe('每页数量，最大100'),
});

/**
 * 余额表查询参数Schema
 */
const BalanceSheetQuerySchema = z.object({
  /** 科目编码（可选，不传则查询所有） */
  accountCode: z.string().optional().describe('科目编码，不传则查询所有科目'),
  /** 会计期间 */
  period: z.string().describe('会计期间，格式：YYYY-MM'),
  /** 科目级次 */
  level: z.number().min(1).max(5).optional().describe('科目级次，1-5'),
  /** 币种 */
  currency: z.string().optional().default('CNY').describe('币种编码，默认CNY'),
  /** 是否包含未记账凭证 */
  includeUnposted: z.boolean().optional().default(false).describe('是否包含未记账凭证'),
});

/**
 * 账簿工具类
 */
export class AccountBookTools {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * 查询账簿列表
   */
  async queryAccountBooks(params: z.infer<typeof AccountBookQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询账簿列表', { params });

      const requestBody = {
        fields: ['id', 'code', 'name', 'ts'],
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        conditions: [] as Array<{ field: string; operator: string; value: string | number | boolean }>,
      };

      if (params.code) {
        requestBody.conditions.push({
          field: 'code',
          operator: 'like',
          value: params.code,
        });
      }

      if (params.name) {
        requestBody.conditions.push({
          field: 'name',
          operator: 'like',
          value: params.name,
        });
      }

      if (params.type) {
        requestBody.conditions.push({
          field: 'type',
          operator: '=',
          value: params.type,
        });
      }

      if (params.fiscalYear) {
        requestBody.conditions.push({
          field: 'fiscalYear',
          operator: '=',
          value: params.fiscalYear,
        });
      }

      if (params.enabled !== undefined) {
        requestBody.conditions.push({
          field: 'enabled',
          operator: '=',
          value: params.enabled,
        });
      }

      const response = await this.client.post<{ success: boolean; code: number; total: number; data: AccountBook[] }>(
        API_PATHS.ACCOUNT_BOOK_QUERY,
        requestBody as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询账簿列表成功',
              data: {
                list: response.data || [],
                total: response.total || 0,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询账簿列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询账簿列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询账簿详情
   */
  async getAccountBookDetail(params: { code: string }): Promise<MCPToolResult> {
    try {
      logger.info('查询账簿详情', { params });

      const response = await this.client.get<AccountBook>(
        API_PATHS.ACCOUNT_BOOK_DETAIL,
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询账簿详情成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询账簿详情失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询账簿详情失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询总账
   */
  async queryGeneralLedger(params: z.infer<typeof GeneralLedgerQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询总账', { params });

      const response = await this.client.get(API_PATHS.GENERAL_LEDGER, params as Record<string, unknown>);

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询总账成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询总账失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询总账失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询明细账
   */
  async queryDetailLedger(params: z.infer<typeof DetailLedgerQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询明细账', { params });

      const response = await this.client.get(API_PATHS.DETAIL_LEDGER, params as Record<string, unknown>);

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询明细账成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询明细账失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询明细账失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询余额表
   */
  async queryBalanceSheet(params: z.infer<typeof BalanceSheetQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询余额表', { params });

      const response = await this.client.get(API_PATHS.BALANCE_SHEET, params as Record<string, unknown>);

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询余额表成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询余额表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询余额表失败',
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
 * 创建账簿查询工具
 */
export function createAccountBookQueryTool(client: BaseClient): MCPTool {
  const tools = new AccountBookTools(client);

  return {
    name: 'accountbook_query',
    description: '查询账簿列表，支持按编码、名称、类型、会计年度等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '账簿编码',
        },
        name: {
          type: 'string',
          description: '账簿名称，支持模糊查询',
        },
        type: {
          type: 'string',
          description: '账簿类型',
        },
        fiscalYear: {
          type: 'number',
          description: '会计年度',
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
      const validated = AccountBookQuerySchema.parse(params);
      return tools.queryAccountBooks(validated);
    },
  };
}

/**
 * 创建账簿详情查询工具
 */
export function createAccountBookDetailTool(client: BaseClient): MCPTool {
  const tools = new AccountBookTools(client);

  return {
    name: 'accountbook_detail',
    description: '根据账簿编码查询账簿详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '账簿编码（必填）',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      return tools.getAccountBookDetail(params as { code: string });
    },
  };
}

/**
 * 创建总账查询工具
 */
export function createGeneralLedgerTool(client: BaseClient): MCPTool {
  const tools = new AccountBookTools(client);

  return {
    name: 'ledger_general',
    description: '查询总账，获取指定科目在指定期间内的汇总数据，包括期初余额、本期借方、本期贷方、期末余额等',
    inputSchema: {
      type: 'object',
      properties: {
        accountCode: {
          type: 'string',
          description: '科目编码（必填）',
        },
        startPeriod: {
          type: 'string',
          description: '开始期间，格式：YYYY-MM（必填）',
        },
        endPeriod: {
          type: 'string',
          description: '结束期间，格式：YYYY-MM（必填）',
        },
        currency: {
          type: 'string',
          description: '币种编码，默认CNY',
          default: 'CNY',
        },
        includeUnposted: {
          type: 'boolean',
          description: '是否包含未记账凭证，默认false',
          default: false,
        },
      },
      required: ['accountCode', 'startPeriod', 'endPeriod'],
    },
    handler: async (params) => {
      const validated = GeneralLedgerQuerySchema.parse(params);
      return tools.queryGeneralLedger(validated);
    },
  };
}

/**
 * 创建明细账查询工具
 */
export function createDetailLedgerTool(client: BaseClient): MCPTool {
  const tools = new AccountBookTools(client);

  return {
    name: 'ledger_detail',
    description: '查询明细账，获取指定科目在指定期间内的明细数据，包括每笔凭证的详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        accountCode: {
          type: 'string',
          description: '科目编码（必填）',
        },
        startPeriod: {
          type: 'string',
          description: '开始期间，格式：YYYY-MM（必填）',
        },
        endPeriod: {
          type: 'string',
          description: '结束期间，格式：YYYY-MM（必填）',
        },
        currency: {
          type: 'string',
          description: '币种编码，默认CNY',
          default: 'CNY',
        },
        includeUnposted: {
          type: 'boolean',
          description: '是否包含未记账凭证，默认false',
          default: false,
        },
        pageNum: {
          type: 'number',
          description: '页码，从1开始，默认1',
          default: 1,
        },
        pageSize: {
          type: 'number',
          description: '每页数量，最大100，默认50',
          default: 50,
        },
      },
      required: ['accountCode', 'startPeriod', 'endPeriod'],
    },
    handler: async (params) => {
      const validated = DetailLedgerQuerySchema.parse(params);
      return tools.queryDetailLedger(validated);
    },
  };
}

/**
 * 创建余额表查询工具
 */
export function createBalanceSheetTool(client: BaseClient): MCPTool {
  const tools = new AccountBookTools(client);

  return {
    name: 'ledger_balance',
    description: '查询余额表，获取指定期间内各科目的期初余额、本期借方、本期贷方、期末余额等汇总数据',
    inputSchema: {
      type: 'object',
      properties: {
        accountCode: {
          type: 'string',
          description: '科目编码，不传则查询所有科目',
        },
        period: {
          type: 'string',
          description: '会计期间，格式：YYYY-MM（必填）',
        },
        level: {
          type: 'number',
          description: '科目级次，1-5',
        },
        currency: {
          type: 'string',
          description: '币种编码，默认CNY',
          default: 'CNY',
        },
        includeUnposted: {
          type: 'boolean',
          description: '是否包含未记账凭证，默认false',
          default: false,
        },
      },
      required: ['period'],
    },
    handler: async (params) => {
      const validated = BalanceSheetQuerySchema.parse(params);
      return tools.queryBalanceSheet(validated);
    },
  };
}

/**
 * 获取所有账簿相关工具
 */
export function getAccountBookTools(client: BaseClient): MCPTool[] {
  return [
    createAccountBookQueryTool(client),
    createAccountBookDetailTool(client),
    createGeneralLedgerTool(client),
    createDetailLedgerTool(client),
    createBalanceSheetTool(client),
  ];
}

export default AccountBookTools;
