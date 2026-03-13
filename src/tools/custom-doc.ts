/**
 * 自定义档案工具模块
 * @module tools/custom-doc
 *
 * 提供自定义档案相关的MCP工具，包括部门、供应商、客户、项目、人员、结算方式等档案查询
 */

import { z } from 'zod';
import { BaseClient } from '../client';
import { MCPTool, MCPToolResult, MCPContent } from '../types';
import { CustomArchive, PageResponse } from '../types/yonyou.types';
import { logger } from '../utils';

/**
 * 自定义档案查询参数Schema
 */
const CustomArchiveQuerySchema = z.object({
  /** 档案类型编码 */
  docTypeCode: z.string().describe('档案类型编码（必填），如：bd_deptdoc(部门)、bd_supplier(供应商)、bd_customer(客户)、bd_project(项目)、bd_psndoc(人员)、bd_settlestyle(结算方式)'),
  /** 档案编码 */
  code: z.string().optional().describe('档案编码，支持模糊查询'),
  /** 档案名称 */
  name: z.string().optional().describe('档案名称，支持模糊查询'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 自定义档案详情查询参数Schema
 */
const CustomArchiveDetailSchema = z.object({
  /** 档案类型编码 */
  docTypeCode: z.string().describe('档案类型编码（必填）'),
  /** 档案编码 */
  code: z.string().describe('档案编码（必填）'),
});

/**
 * 部门档案查询参数Schema
 */
const DepartmentQuerySchema = z.object({
  /** 部门编码 */
  code: z.string().optional().describe('部门编码，支持模糊查询'),
  /** 部门名称 */
  name: z.string().optional().describe('部门名称，支持模糊查询'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 供应商档案查询参数Schema
 */
const SupplierQuerySchema = z.object({
  /** 供应商编码 */
  code: z.string().optional().describe('供应商编码，支持模糊查询'),
  /** 供应商名称 */
  name: z.string().optional().describe('供应商名称，支持模糊查询'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 客户档案查询参数Schema
 */
const CustomerQuerySchema = z.object({
  /** 客户编码 */
  code: z.string().optional().describe('客户编码，支持模糊查询'),
  /** 客户名称 */
  name: z.string().optional().describe('客户名称，支持模糊查询'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 项目档案查询参数Schema
 */
const ProjectQuerySchema = z.object({
  /** 项目编码 */
  code: z.string().optional().describe('项目编码，支持模糊查询'),
  /** 项目名称 */
  name: z.string().optional().describe('项目名称，支持模糊查询'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 人员档案查询参数Schema
 */
const PersonnelQuerySchema = z.object({
  /** 人员编码 */
  code: z.string().optional().describe('人员编码，支持模糊查询'),
  /** 人员姓名 */
  name: z.string().optional().describe('人员姓名，支持模糊查询'),
  /** 部门编码 */
  departmentCode: z.string().optional().describe('部门编码'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 结算方式档案查询参数Schema
 */
const SettlementMethodQuerySchema = z.object({
  /** 结算方式编码 */
  code: z.string().optional().describe('结算方式编码，支持模糊查询'),
  /** 结算方式名称 */
  name: z.string().optional().describe('结算方式名称，支持模糊查询'),
  /** 是否启用 */
  enabled: z.boolean().optional().describe('是否启用'),
  /** 页码 */
  pageNum: z.number().min(1).default(1).describe('页码，从1开始'),
  /** 每页数量 */
  pageSize: z.number().min(1).max(100).default(20).describe('每页数量，最大100'),
});

/**
 * 自定义档案工具类
 */
export class CustomArchiveTools {
  private client: BaseClient;

  constructor(client: BaseClient) {
    this.client = client;
  }

  /**
   * 查询自定义档案列表
   */
  async queryCustomArchives(params: z.infer<typeof CustomArchiveQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询自定义档案列表', { params });

      const response = await this.client.post<PageResponse<CustomArchive>>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        params as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询自定义档案列表成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询自定义档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询自定义档案列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询自定义档案详情
   */
  async getCustomArchiveDetail(params: z.infer<typeof CustomArchiveDetailSchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询自定义档案详情', { params });

      const response = await this.client.post<CustomArchive[]>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
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
                message: `未找到档案: ${params.code}`,
              }),
          },
          ],
          error: `未找到档案: ${params.code}`,
        };
      }

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询自定义档案详情成功',
              data: response[0],
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询自定义档案详情失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询自定义档案详情失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询部门档案列表
   */
  async queryDepartments(params: z.infer<typeof DepartmentQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询部门档案列表', { params });

      const requestBody: Record<string, unknown> = {
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        custdocdefid___code: 'bd_deptdoc',
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

      const response = await this.client.post<{ code: string; message: string; data: { recordList: CustomArchive[]; recordCount: number } }>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        requestBody as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询部门档案列表成功',
              data: {
                list: response.data?.recordList || [],
                total: response.data?.recordCount || 0,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询部门档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询部门档案列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询供应商档案列表
   */
  async querySuppliers(params: z.infer<typeof SupplierQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询供应商档案列表', { params });

      const requestBody: Record<string, unknown> = {
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        custdocdefid___code: 'bd_supplier',
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

      const response = await this.client.post<{ code: string; message: string; data: { recordList: CustomArchive[]; recordCount: number } }>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        requestBody as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询供应商档案列表成功',
              data: {
                list: response.data?.recordList || [],
                total: response.data?.recordCount || 0,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询供应商档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询供应商档案列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询客户档案列表
   */
  async queryCustomers(params: z.infer<typeof CustomerQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询客户档案列表', { params });

      const requestBody: Record<string, unknown> = {
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        custdocdefid___code: 'bd_customer',
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

      const response = await this.client.post<{ code: string; message: string; data: { recordList: CustomArchive[]; recordCount: number } }>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        requestBody as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询客户档案列表成功',
              data: {
                list: response.data?.recordList || [],
                total: response.data?.recordCount || 0,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询客户档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询客户档案列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询项目档案列表
   */
  async queryProjects(params: z.infer<typeof ProjectQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询项目档案列表', { params });

      const requestBody: Record<string, unknown> = {
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        custdocdefid___code: 'bd_project',
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

      const response = await this.client.post<{ code: string; message: string; data: { recordList: CustomArchive[]; recordCount: number } }>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        requestBody as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询项目档案列表成功',
              data: {
                list: response.data?.recordList || [],
                total: response.data?.recordCount || 0,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询项目档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询项目档案列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询人员档案列表
   */
  async queryPersonnel(params: z.infer<typeof PersonnelQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询人员档案列表', { params });

      const requestBody: Record<string, unknown> = {
        pageIndex: params.pageNum || 1,
        pageSize: params.pageSize || 20,
        custdocdefid___code: 'bd_psndoc',
      };

      if (params.code) {
        requestBody.code = params.code;
      }

      if (params.name) {
        requestBody.name = params.name;
      }

      if (params.departmentCode) {
        requestBody.departmentCode = params.departmentCode;
      }

      if (params.enabled !== undefined) {
        requestBody.enable = params.enabled ? 1 : 0;
      }

      const response = await this.client.post<{ code: string; message: string; data: { recordList: CustomArchive[]; recordCount: number } }>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        requestBody as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询人员档案列表成功',
              data: {
                list: response.data?.recordList || [],
                total: response.data?.recordCount || 0,
              },
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询人员档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询人员档案列表失败',
              error: (error as Error).message,
            }),
          },
        ],
        error: (error as Error).message,
      };
    }
  }

  /**
   * 查询结算方式档案列表
   */
  async querySettlementMethods(params: z.infer<typeof SettlementMethodQuerySchema>): Promise<MCPToolResult> {
    try {
      logger.info('查询结算方式档案列表', { params });

      const response = await this.client.post<PageResponse<CustomArchive>>(
        '/yonbip/digitalModel/customerdoc/batchQueryDetail',
        {
          ...params,
          docType: 'bd_settlestyle',
        } as Record<string, unknown>
      );

      const content: MCPContent[] = [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: '查询结算方式档案列表成功',
              data: response,
            },
            null,
            2
          ),
        },
      ];

      return { success: true, content };
    } catch (error) {
      logger.error('查询结算方式档案列表失败', error);
      return {
        success: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: '查询结算方式档案列表失败',
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
 * 创建自定义档案查询工具
 */
export function createCustomArchiveQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'customdoc_query',
    description: '查询自定义档案列表，支持按档案类型、编码、名称等条件筛选，支持分页查询。档案类型包括：bd_deptdoc(部门)、bd_supplier(供应商)、bd_customer(客户)、bd_project(项目)、bd_psndoc(人员)、bd_settlestyle(结算方式)',
    inputSchema: {
      type: 'object',
      properties: {
        docTypeCode: {
          type: 'string',
          description: '档案类型编码（必填），如：bd_deptdoc(部门)、bd_supplier(供应商)、bd_customer(客户)、bd_project(项目)、bd_psndoc(人员)、bd_settlestyle(结算方式)',
        },
        code: {
          type: 'string',
          description: '档案编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '档案名称，支持模糊查询',
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
      required: ['docTypeCode'],
    },
    handler: async (params) => {
      const validated = CustomArchiveQuerySchema.parse(params);
      return tools.queryCustomArchives(validated);
    },
  };
}

/**
 * 创建自定义档案详情查询工具
 */
export function createCustomArchiveDetailTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'customdoc_detail',
    description: '根据档案类型和编码查询自定义档案详细信息',
    inputSchema: {
      type: 'object',
      properties: {
        docTypeCode: {
          type: 'string',
          description: '档案类型编码（必填）',
        },
        code: {
          type: 'string',
          description: '档案编码（必填）',
        },
      },
      required: ['docTypeCode', 'code'],
    },
    handler: async (params) => {
      const validated = CustomArchiveDetailSchema.parse(params);
      return tools.getCustomArchiveDetail(validated);
    },
  };
}

/**
 * 创建部门档案查询工具
 */
export function createDepartmentQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'department_query',
    description: '查询部门档案列表，支持按编码、名称等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '部门编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '部门名称，支持模糊查询',
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
      const validated = DepartmentQuerySchema.parse(params);
      return tools.queryDepartments(validated);
    },
  };
}

/**
 * 创建供应商档案查询工具
 */
export function createSupplierQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'supplier_query',
    description: '查询供应商档案列表，支持按编码、名称等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '供应商编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '供应商名称，支持模糊查询',
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
      const validated = SupplierQuerySchema.parse(params);
      return tools.querySuppliers(validated);
    },
  };
}

/**
 * 创建客户档案查询工具
 */
export function createCustomerQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'customer_query',
    description: '查询客户档案列表，支持按编码、名称等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '客户编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '客户名称，支持模糊查询',
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
      const validated = CustomerQuerySchema.parse(params);
      return tools.queryCustomers(validated);
    },
  };
}

/**
 * 创建项目档案查询工具
 */
export function createProjectQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'project_query',
    description: '查询项目档案列表，支持按编码、名称等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '项目编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '项目名称，支持模糊查询',
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
      const validated = ProjectQuerySchema.parse(params);
      return tools.queryProjects(validated);
    },
  };
}

/**
 * 创建人员档案查询工具
 */
export function createPersonnelQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'personnel_query',
    description: '查询人员档案列表，支持按编码、姓名、部门等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '人员编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '人员姓名，支持模糊查询',
        },
        departmentCode: {
          type: 'string',
          description: '部门编码',
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
      const validated = PersonnelQuerySchema.parse(params);
      return tools.queryPersonnel(validated);
    },
  };
}

/**
 * 创建结算方式档案查询工具
 */
export function createSettlementMethodQueryTool(client: BaseClient): MCPTool {
  const tools = new CustomArchiveTools(client);

  return {
    name: 'settlement_method_query',
    description: '查询结算方式档案列表，支持按编码、名称等条件筛选，支持分页查询',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: '结算方式编码，支持模糊查询',
        },
        name: {
          type: 'string',
          description: '结算方式名称，支持模糊查询',
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
      const validated = SettlementMethodQuerySchema.parse(params);
      return tools.querySettlementMethods(validated);
    },
  };
}

/**
 * 获取所有自定义档案相关工具
 */
export function getCustomArchiveTools(client: BaseClient): MCPTool[] {
  return [
    createCustomArchiveQueryTool(client),
    createCustomArchiveDetailTool(client),
    createDepartmentQueryTool(client),
    createSupplierQueryTool(client),
    createCustomerQueryTool(client),
    createProjectQueryTool(client),
    createPersonnelQueryTool(client),
    createSettlementMethodQueryTool(client),
  ];
}

export default CustomArchiveTools;
