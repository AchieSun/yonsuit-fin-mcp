/**
 * 凭证类型工具模块
 * @module tools/vouchertype
 *
 * 提供凭证类型档案相关的MCP工具，包括凭证类型查询等功能
 */

import { z } from 'zod';
import { BaseClient } from '../client';
import { MCPTool, MCPToolResult, MCPContent } from '../types';
import { VoucherType } from '../types/yonyou.types';
import { logger } from '../utils';

/**
 * 凭证类型查询参数Schema
 */
const VoucherTypeQuerySchema = z.object({
  /** 凭证类型编码 */
  code: z.string().optional().describe('凭证类型编码'),
  /** 凭证类型名称（模糊查询） */
  name: z.string().optional().describe('凭证类型名称，支持模糊查询'),
  /** 凭证类型简称 */
  shortName: z.string().optional().describe('凭证类型简称'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
});

/**
 * 凭证类型详情查询参数Schema
 */
const VoucherTypeDetailSchema = z.object({
  /** 凭证类型编码 */
  code: z.string().describe('凭证类型编码（必填）'),
});

/**
 * 凭证类型创建参数Schema
 */
const VoucherTypeCreateSchema = z.object({
  /** 凭证类型编码 */
  code: z.string().describe('凭证类型编码（必填）'),
  /** 凭证类型名称 */
  name: z.string().describe('凭证类型名称（必填）'),
  /** 凭证类型简称 */
  shortName: z.string().describe('凭证类型简称（必填）'),
  /** 是否启用 */
  enabled: z.boolean().optional().default(true).describe('是否启用，默认true'),
});

/**
 * 凭证类型更新参数Schema
 */
const VoucherTypeUpdateSchema = z.object({
  /** 凭证类型编码 */
  code: z.string().describe('凭证类型编码（必填）'),
  /** 凭证类型名称 */
  name: z.string().optional().describe('凭证类型名称'),
  /** 凭证类型简称 */
  shortName: z.string().optional().describe('凭证类型简称'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
});

/**
 * 凭证类型工具类
 */
export class VoucherTypeTools {
  private client: BaseClient;
  private cache: Map<string, { data: VoucherType[]; expiresAt: number }> = new Map();
  private readonly CACHE_TTL = 3600000; // 1小时缓存

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * 查询凭证类型列表
   */
  async queryVoucherTypes(params: z.infer<typeof VoucherTypeQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询凭证类型列表', { params });

      // 尝试从缓存获取
      const cacheKey = 'voucher_types_all';
      const cached = this.cache.get(cacheKey);
      let voucherTypes: VoucherType[];

      if (cached && Date.now() < cached.expiresAt) {
        voucherTypes = cached.data;
        logger.debug('使用缓存的凭证类型数据');
      } else {
        // 从API获取数据
        const response = await this.client.get<VoucherType[]>('/yonbip/fi/vouchertype/list', {});
        voucherTypes = response;

        // 更新缓存
        this.cache.set(cacheKey, {
          data: voucherTypes,
          expiresAt: Date.now() + this.CACHE_TTL,
        });
      }

      // 应用筛选条件
      let filtered = voucherTypes;

      if (params.code) {
        filtered = filtered.filter((vt) => vt.code.includes(params.code!));
      }

      if (params.name) {
        filtered = filtered.filter((vt) => vt.name.includes(params.name!));
      }

      if (params.shortName) {
        filtered = filtered.filter((vt) => vt.shortName.includes(params.shortName!));
      }

      if (params.enabled !== undefined) {
        filtered = filtered.filter((vt) => vt.enabled === params.enabled);
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询凭证类型列表成功',
              data: {
                list: filtered,
                total: filtered.length,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询凭证类型列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询凭证类型列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询凭证类型详情
   */
  async getVoucherTypeDetail(params: z.infer<typeof VoucherTypeDetailSchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询凭证类型详情', { params });

      // 尝试从缓存获取
      const cacheKey = 'voucher_types_all';
      const cached = this.cache.get(cacheKey);
      let voucherTypes: VoucherType[];

      if (cached && Date.now() < cached.expiresAt) {
        voucherTypes = cached.data;
      } else {
        const response = await this.client.get<VoucherType[]>('/yonbip/fi/vouchertype/list', {});
        voucherTypes = response;
        this.cache.set(cacheKey, {
          data: voucherTypes,
          expiresAt: Date.now() + this.CACHE_TTL,
        });
      }

      const voucherType = voucherTypes.find((vt) => vt.code === params.code);

      if (!voucherType) {
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `未找到凭证类型: ${params.code}`,
              }),
            },
          ],
          error: `未找到凭证类型: ${params.code}`,
        };
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询凭证类型详情成功',
              data: voucherType,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询凭证类型详情失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询凭证类型详情失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 创建凭证类型
   */
  async createVoucherType(params: z.infer<typeof VoucherTypeCreateSchema>): Promise<MCPToolResult> {
    try {
      logger.info('创建凭证类型', { params });

      const response = await this.client.post<VoucherType>(
        '/yonbip/fi/vouchertype/create',
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
              message: '创建凭证类型成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('创建凭证类型失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '创建凭证类型失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 更新凭证类型
   */
  async updateVoucherType(params: z.infer<typeof VoucherTypeUpdateSchema>): Promise<MCPToolResult> {
    try {
      logger.info('更新凭证类型', { params });

      const response = await this.client.put<VoucherType>(
        '/yonbip/fi/vouchertype/update',
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
              message: '更新凭证类型成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('更新凭证类型失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '更新凭证类型失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 获取默认凭证类型
   */
  async getDefaultVoucherType(): Promise<MCPToolResult> {
    try {
      logger.info('获取默认凭证类型');

      // 尝试从缓存获取
      const cacheKey = 'voucher_types_all';
      const cached = this.cache.get(cacheKey);
      let voucherTypes: VoucherType[];

      if (cached && Date.now() < cached.expiresAt) {
        voucherTypes = cached.data;
      } else {
        const response = await this.client.get<VoucherType[]>('/yonbip/fi/vouchertype/list', {});
        voucherTypes = response;
        this.cache.set(cacheKey, {
          data: voucherTypes,
          expiresAt: Date.now() + this.CACHE_TTL,
        });
      }

      // 查找默认凭证类型（通常是第一个启用的）
      const defaultVoucherType = voucherTypes.find((vt) => vt.enabled) || voucherTypes[0];

      if (!defaultVoucherType) {
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: '未找到可用的凭证类型',
              }),
            },
          ],
          error: '未找到可用的凭证类型',
        };
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '获取默认凭证类型成功',
              data: defaultVoucherType,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('获取默认凭证类型失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '获取默认凭证类型失败',
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
 * 创建凭证类型查询工具
 */
export function createVoucherTypeQueryTool(client: BaseClient): MCPTool {
  const tools = new VoucherTypeTools(client);

  return {
    name: 'vouchertype_query',
    description: '查询凭证类型列表，支持按编码、名称、简称等条件筛选',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '凭证类型编码',
        },
        name: {
          type: 'string',
          description: '凭证类型名称，支持模糊查询',
        },
        shortName: {
          type: 'string',
          description: '凭证类型简称',
        },
        enabled: {
          type: 'boolean',
          description: '是否启用',
        },
      },
    },
    handler: async (params) => {
      const validated = VoucherTypeQuerySchema.parse(params);
      return tools.queryVoucherTypes(validated);
    },
  };
}

/**
 * 创建凭证类型详情查询工具
 */
export function createVoucherTypeDetailTool(client: BaseClient): MCPTool {
  const tools = new VoucherTypeTools(client);

  return {
    name: 'vouchertype_detail',
    description: '根据凭证类型编码查询凭证类型详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '凭证类型编码（必填）',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      const validated = VoucherTypeDetailSchema.parse(params);
      return tools.getVoucherTypeDetail(validated);
    },
  };
}

/**
 * 创建凭证类型创建工具
 */
export function createVoucherTypeCreateTool(client: BaseClient): MCPTool {
  const tools = new VoucherTypeTools(client);

  return {
    name: 'vouchertype_create',
    description: '创建新的凭证类型',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '凭证类型编码（必填）',
        },
        name: {
          type: 'string',
          description: '凭证类型名称（必填）',
        },
        shortName: {
          type: 'string',
          description: '凭证类型简称（必填）',
        },
        enabled: {
          type: 'boolean',
          description: '是否启用，默认true',
          default: true,
        },
      },
      required: ['code', 'name', 'shortName'],
    },
    handler: async (params) => {
      const validated = VoucherTypeCreateSchema.parse(params);
      return tools.createVoucherType(validated);
    },
  };
}

/**
 * 创建凭证类型更新工具
 */
export function createVoucherTypeUpdateTool(client: BaseClient): MCPTool {
  const tools = new VoucherTypeTools(client);

  return {
    name: 'vouchertype_update',
    description: '更新凭证类型信息',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '凭证类型编码（必填）',
        },
        name: {
          type: 'string',
          description: '凭证类型名称',
        },
        shortName: {
          type: 'string',
          description: '凭证类型简称',
        },
        enabled: {
          type: 'boolean',
          description: '是否启用',
        },
      },
      required: ['code'],
    },
    handler: async (params) => {
      const validated = VoucherTypeUpdateSchema.parse(params);
      return tools.updateVoucherType(validated);
    },
  };
}

/**
 * 创建默认凭证类型获取工具
 */
export function createDefaultVoucherTypeTool(client: BaseClient): MCPTool {
  const tools = new VoucherTypeTools(client);

  return {
    name: 'vouchertype_default',
    description: '获取默认凭证类型，返回第一个启用的凭证类型',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return tools.getDefaultVoucherType();
    },
  };
}

/**
 * 获取所有凭证类型相关工具
 */
export function getVoucherTypeTools(client: BaseClient): MCPTool[] {
  return [
    createVoucherTypeQueryTool(client),
    createVoucherTypeDetailTool(client),
    createVoucherTypeCreateTool(client),
    createVoucherTypeUpdateTool(client),
    createDefaultVoucherTypeTool(client),
  ];
}

export default VoucherTypeTools;
