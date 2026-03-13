/**
 * 科目工具模块
 * @module tools/subject
 *
 * 提供科目档案相关的MCP工具，包括科目查询、创建、更新等功能
 */

import { z } from 'zod';
import { BaseClient } from '../client';
import { MCPTool, MCPToolResult, MCPContent } from '../types';
import { API_PATHS } from '../config/constants';
import { Account, PageResponse } from '../types/yonyou.types';
import { logger } from '../utils';

/**
 * 科目查询参数Schema
 */
const AccountQuerySchema = z.object({
  /** 科目编码（支持模糊查询） */
  code: z.string().optional().describe('科目编码，支持模糊查询'),
  /** 科目名称（支持模糊查询） */
  name: z.string().optional().describe('科目名称，支持模糊查询'),
  /** 科目类别 */
  category: z.string().optional().describe('科目类别'),
  /** 科目类型 */
  type: z.string().optional().describe('科目类型'),
  /** 上级科目编码 */
  parentCode: z.string().optional().describe('上级科目编码'),
  /** 科目级次 */
  level: z.number().min(1).max(5).optional().describe('科目级次，1-5'),
  /** 是否末级 */
  isLeaf: z.boolean().optional().describe('是否末级科目'),
  /** 币种 */
  currency: z.string().optional().describe('币种编码'),
  /** 余额方向 */
  balanceDirection: z.enum(['debit', 'credit']).optional().describe('余额方向：debit借方/credit贷方'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 科目详情查询参数Schema
 */
const AccountDetailSchema = z.object({
  /** 科目编码 */
  code: z.string().describe('科目编码（必填）'),
});

/**
 * 科目创建参数Schema
 */
const AccountCreateSchema = z.object({
  /** 科目编码 */
  code: z.string().describe('科目编码（必填）'),
  /** 科目名称 */
  name: z.string().describe('科目名称（必填）'),
  /** 科目类别 */
  category: z.string().describe('科目类别（必填）'),
  /** 科目类型 */
  type: z.string().describe('科目类型（必填）'),
  /** 上级科目编码 */
  parentCode: z.string().optional().describe('上级科目编码'),
  /** 科目级次 */
  level: z.number().min(1).max(5).optional().describe('科目级次，1-5'),
  /** 币种 */
  currency: z.string().optional().default('CNY').describe('币种编码，默认CNY'),
  /** 余额方向 */
  balanceDirection: z.enum(['debit', 'credit']).optional().describe('余额方向：debit借方/credit贷方'),
  /** 是否启用 */
  enabled: z.boolean().optional().default(true).describe('是否启用，默认true'),
});

/**
 * 科目更新参数Schema
 */
const AccountUpdateSchema = z.object({
  /** 科目编码 */
  code: z.string().describe('科目编码（必填）'),
  /** 科目名称 */
  name: z.string().optional().describe('科目名称'),
  /** 科目类别 */
  category: z.string().optional().describe('科目类别'),
  /** 科目类型 */
  type: z.string().optional().describe('科目类型'),
  /** 币种 */
  currency: z.string().optional().describe('币种编码'),
  /** 余额方向 */
  balanceDirection: z.enum(['debit', 'credit']).optional().describe('余额方向：debit借方/credit贷方'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
});

/**
 * 科目树查询参数Schema
 */
const AccountTreeSchema = z.object({
  /** 根科目编码 */
  rootCode: z.string().optional().describe('根科目编码，不传则查询完整科目树'),
  /** 最大深度 */
  maxDepth: z.number().min(1).max(10).optional().describe('最大深度，1-10'),
  /** 是否包含未启用科目 */
  includeDisabled: z.boolean().optional().default(false).describe('是否包含未启用科目，默认false'),
});

/**
 * 科目工具类
 */
export class AccountTools {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * 查询科目列表
   */
  async queryAccounts(params: z.infer<typeof AccountQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询科目列表', { params });

      const response = await this.client.get<PageResponse<Account>>(
        API_PATHS.ACCOUNT_LIST,
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询科目列表成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询科目列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询科目列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询科目详情
   */
  async getAccountDetail(params: z.infer<typeof AccountDetailSchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询科目详情', { params });

      const response = await this.client.get<Account>(
        API_PATHS.ACCOUNT_DETAIL,
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询科目详情成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询科目详情失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询科目详情失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 创建科目
   */
  async createAccount(params: z.infer<typeof AccountCreateSchema>): Promise<MCPToolResult> {
    try {
      logger.info('创建科目', { params });

      const response = await this.client.post<Account>(
        API_PATHS.ACCOUNT_CREATE,
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '创建科目成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('创建科目失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '创建科目失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 更新科目
   */
  async updateAccount(params: z.infer<typeof AccountUpdateSchema>): Promise<MCPToolResult> {
    try {
      logger.info('更新科目', { params });

      const response = await this.client.put<Account>(
        API_PATHS.ACCOUNT_UPDATE,
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '更新科目成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('更新科目失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '更新科目失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询科目树
   */
  async queryAccountTree(params: z.infer<typeof AccountTreeSchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询科目树', { params });

      // 构建查询参数
      const queryParams: Record<string, unknown> = {};
      if (params.rootCode) {
        queryParams.rootCode = params.rootCode;
      }
      if (params.maxDepth) {
        queryParams.maxDepth = params.maxDepth;
      }
      if (params.includeDisabled) {
        queryParams.includeDisabled = params.includeDisabled;
      }

      const response = await this.client.get<Account[]>(API_PATHS.ACCOUNT_LIST, queryParams);

      // 构建树形结构
      const tree = this.buildAccountTree(response, params.rootCode, params.maxDepth);

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询科目树成功',
              data: tree,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询科目树失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询科目树失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 构建科目树
   */
  private buildAccountTree(
    accounts: Account[],
    rootCode?: string,
    maxDepth?: number
  ): AccountNode[] {
    // 创建科目映射
    const accountMap = new Map<string, AccountNode>();
    const rootNodes: AccountNode[] = [];

    // 初始化节点
    accounts.forEach((account) => {
      accountMap.set(account.code, { ...account, children: [] });
    });

    // 构建树形结构
    accounts.forEach((account) => {
      const node = accountMap.get(account.code)!;

      // 如果指定了根科目，只处理该科目及其子科目
      if (rootCode) {
        if (account.code === rootCode) {
          rootNodes.push(node);
        } else if (account.parentCode && accountMap.has(account.parentCode)) {
          const parent = accountMap.get(account.parentCode)!;
          // 检查是否在根科目树中
          let isInTree = false;
          let current: string | undefined = account.parentCode;
          while (current) {
            if (current === rootCode) {
              isInTree = true;
              break;
            }
            const parentAccount = accounts.find((a) => a.code === current);
            current = parentAccount?.parentCode;
          }
          if (isInTree) {
            parent.children.push(node);
          }
        }
      } else {
        // 没有父级科目的作为根节点
        if (!account.parentCode || !accountMap.has(account.parentCode)) {
          rootNodes.push(node);
        } else {
          const parent = accountMap.get(account.parentCode)!;
          parent.children.push(node);
        }
      }
    });

    // 限制深度
    if (maxDepth) {
      return this.limitTreeDepth(rootNodes, maxDepth, 1);
    }

    return rootNodes;
  }

  /**
   * 限制树深度
   */
  private limitTreeDepth(nodes: AccountNode[], maxDepth: number, currentDepth: number): AccountNode[] {
    if (currentDepth >= maxDepth) {
      return nodes.map((node) => ({ ...node, children: [] }));
    }

    return nodes.map((node) => ({
      ...node,
      children: this.limitTreeDepth(node.children, maxDepth, currentDepth + 1),
    }));
  }
}

/**
 * 科目树节点接口
 */
interface AccountNode extends Account {
  /** 子科目 */
  children: AccountNode[];
}

/**
 * 创建科目查询工具
 */
export function createAccountQueryTool(client: BaseClient): MCPTool {
  const tools = new AccountTools(client);

  return {
    name: 'account_query',
    description: '查询科目列表，支持按编码、名称、类别、类型、级次等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '科目编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '科目名称，支持模糊查询',
        },
        category: {
          type: 'string',
          description: '科目类别',
        },
        type: {
          type: 'string',
          description: '科目类型',
        },
        parentCode: {
          type: 'string',
          description: '上级科目编码',
        },
        level: {
          type: 'number',
          description: '科目级次，1-5',
        },
        isLeaf: {
          type: 'boolean',
          description: '是否末级科目',
        },
        currency: {
          type: 'string',
          description: '币种编码',
        },
        balanceDirection: {
          type: 'string',
          description: '余额方向：debit借方/credit贷方',
          enum: ['debit', 'credit'],
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
      const validated = AccountQuerySchema.parse(params);
      return tools.queryAccounts(validated);
    },
  };
}

/**
 * 创建科目详情查询工具
 */
export function createAccountDetailTool(client: BaseClient): MCPTool {
  const tools = new AccountTools(client);

  return {
    name: 'account_detail',
    description: '根据科目编码查询科目详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '科目编码（必填）',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      const validated = AccountDetailSchema.parse(params);
      return tools.getAccountDetail(validated);
    },
  };
}

/**
 * 创建科目创建工具
 */
export function createAccountCreateTool(client: BaseClient): MCPTool {
  const tools = new AccountTools(client);

  return {
    name: 'account_create',
    description: '创建新的会计科目',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '科目编码（必填）',
        },
        name: {
          type: 'string',
          description: '科目名称（必填）',
        },
        category: {
          type: 'string',
          description: '科目类别（必填）',
        },
        type: {
          type: 'string',
          description: '科目类型（必填）',
        },
        parentCode: {
          type: 'string',
          description: '上级科目编码',
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
        balanceDirection: {
          type: 'string',
          description: '余额方向：debit借方/credit贷方',
          enum: ['debit', 'credit'],
        },
        enabled: {
          type: 'boolean',
          description: '是否启用，默认true',
          default: true,
        },
      },
      required: ['code', 'name', 'category', 'type'],
    },
    handler: async (params) => {
      const validated = AccountCreateSchema.parse(params);
      return tools.createAccount(validated);
    },
  };
}

/**
 * 创建科目更新工具
 */
export function createAccountUpdateTool(client: BaseClient): MCPTool {
  const tools = new AccountTools(client);

  return {
    name: 'account_update',
    description: '更新会计科目信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '科目编码（必填）',
        },
        name: {
          type: 'string',
          description: '科目名称',
        },
        category: {
          type: 'string',
          description: '科目类别',
        },
        type: {
          type: 'string',
          description: '科目类型',
        },
        currency: {
          type: 'string',
          description: '币种编码',
        },
        balanceDirection: {
          type: 'string',
          description: '余额方向：debit借方/credit贷方',
          enum: ['debit', 'credit'],
        },
        enabled: {
          type: 'boolean',
          description: '是否启用',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      const validated = AccountUpdateSchema.parse(params);
      return tools.updateAccount(validated);
    },
  };
}

/**
 * 创建科目树查询工具
 */
export function createAccountTreeTool(client: BaseClient): MCPTool {
  const tools = new AccountTools(client);

  return {
    name: 'account_tree',
    description: '查询科目树形结构，支持指定根科目和最大深度',
    inputSchema: {
      type: 'object',
      properties: {
        rootCode: {
          type: 'string',
          description: '根科目编码，不传则查询完整科目树',
        },
        maxDepth: {
          type: 'number',
          description: '最大深度，1-10',
        },
        includeDisabled: {
          type: 'boolean',
          description: '是否包含未启用科目，默认false',
          default: false,
        },
      },
    },
    handler: async (params) => {
      const validated = AccountTreeSchema.parse(params);
      return tools.queryAccountTree(validated);
    },
  };
}

/**
 * 获取所有科目相关工具
 */
export function getAccountTools(client: BaseClient): MCPTool[] {
  return [
    createAccountQueryTool(client),
    createAccountDetailTool(client),
    createAccountCreateTool(client),
    createAccountUpdateTool(client),
    createAccountTreeTool(client),
  ];
}

export default AccountTools;
