/**
 * 凭证工具
 * @module tools/voucher
 *
 * 实现凭证相关的MCP工具接口，提供凭证的增删改查功能
 *
 * @example
 * // 查询凭证列表
 * const result = await queryVoucherList({ accountingPeriod: '2024-01', pageNum: 1, pageSize: 20 });
 *
 * // 创建凭证
 * const result = await saveVoucher({
 *   voucherTypeCode: '记-1',
 *   voucherDate: '2024-01-15',
 *   accountingPeriod: '2024-01',
 *   entries: [
 *     { accountCode: '1001', summary: '提现', debitAmount: 1000 },
 *     { accountCode: '1002', summary: '提现', creditAmount: 1000 }
 *   ]
 * });
 */

import { logger } from '../utils';
import { VoucherService } from '../services/voucher-service';
import { MCPTool, MCPToolResult, MCPContent } from '../types';
import type {
  VoucherCreateRequest,
  VoucherUpdateRequest,
  VoucherQueryParams,
  PageRequest,
  AuditStatus,
  PostStatus,
  VoucherEntryCreateRequest,
} from '../types';

/**
 * 凭证工具类
 * 提供凭证相关的MCP工具
 */
export class VoucherTools {
  private voucherService: VoucherService;

  /**
   * 构造函数
   * @param voucherService 凭证服务实例
   */
  constructor(voucherService: VoucherService) {
    this.voucherService = voucherService;
  }

  /**
   * 获取所有凭证工具
   * @returns 工具列表
   */
  getTools(): MCPTool[] {
    return [
      this.queryVoucherListTool,
      this.queryVoucherDetailTool,
      this.saveVoucherTool,
      this.deleteVoucherTool,
    ];
  }

  /**
   * 查询凭证列表工具
   */
  private queryVoucherListTool: MCPTool = {
    name: 'query_voucher_list',
    description: `查询用友凭证列表，支持多条件筛选和分页查询。

功能说明：
- 支持按凭证号、凭证类型、会计期间、日期范围等条件查询
- 支持按科目、制单人、审核人、记账人筛选
- 支持按审核状态、记账状态筛选
- 支持按金额范围筛选
- 支持关键字模糊查询（摘要）
- 支持分页查询

使用场景：
1. 查询某个会计期间的所有凭证
2. 查询某个科目的相关凭证
3. 查询待审核或待记账的凭证
4. 查询某个制单人制作的凭证`,
    inputSchema: {
      type: 'object',
      properties: {
        // 查询条件
        id: {
          type: 'string',
          description: '凭证ID（精确查询）',
        },
        voucherNo: {
          type: 'string',
          description: '凭证号（精确查询，如：记-2024-01-001）',
        },
        voucherTypeCode: {
          type: 'string',
          description: '凭证类型编码（如：记-1、记-2、收-1、付-1等）',
        },
        accountingPeriod: {
          type: 'string',
          description: '会计期间，格式：YYYY-MM（如：2024-01）',
          pattern: '^\\d{4}-\\d{2}$',
        },
        voucherDateStart: {
          type: 'string',
          description: '凭证日期开始，格式：YYYY-MM-DD',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        voucherDateEnd: {
          type: 'string',
          description: '凭证日期结束，格式：YYYY-MM-DD',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        accountCode: {
          type: 'string',
          description: '科目编码（支持模糊匹配，如：1001）',
        },
        maker: {
          type: 'string',
          description: '制单人姓名',
        },
        auditor: {
          type: 'string',
          description: '审核人姓名',
        },
        poster: {
          type: 'string',
          description: '记账人姓名',
        },
        auditStatus: {
          type: 'string',
          description: '审核状态',
          enum: ['unaudited', 'audited', 'rejected'],
        },
        postStatus: {
          type: 'string',
          description: '记账状态',
          enum: ['unposted', 'posted'],
        },
        keyword: {
          type: 'string',
          description: '关键字（用于摘要模糊查询）',
        },
        amountMin: {
          type: 'number',
          description: '金额最小值（借方或贷方金额）',
          minimum: 0,
        },
        amountMax: {
          type: 'number',
          description: '金额最大值（借方或贷方金额）',
          minimum: 0,
        },
        accountBookCode: {
          type: 'string',
          description: '账簿编码',
        },
        externalVoucherNo: {
          type: 'string',
          description: '外部凭证号（用于对接外部系统，如钉钉审批单号）',
        },
        // 分页参数
        pageNum: {
          type: 'number',
          description: '页码，从1开始',
          default: 1,
          minimum: 1,
        },
        pageSize: {
          type: 'number',
          description: '每页数量，默认20，最大100',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
      },
    },
    handler: async (params: Record<string, unknown>): Promise<MCPToolResult> => {
      try {
        logger.info('执行查询凭证列表工具', params);

        // 构建查询参数
        const queryParams: VoucherQueryParams = {};
        if (params.id) queryParams.id = params.id as string;
        if (params.voucherNo) queryParams.voucherNo = params.voucherNo as string;
        if (params.voucherTypeCode) queryParams.voucherTypeCode = params.voucherTypeCode as string;
        if (params.accountingPeriod) queryParams.accountingPeriod = params.accountingPeriod as string;
        if (params.voucherDateStart) queryParams.voucherDateStart = params.voucherDateStart as string;
        if (params.voucherDateEnd) queryParams.voucherDateEnd = params.voucherDateEnd as string;
        if (params.accountCode) queryParams.accountCode = params.accountCode as string;
        if (params.maker) queryParams.maker = params.maker as string;
        if (params.auditor) queryParams.auditor = params.auditor as string;
        if (params.poster) queryParams.poster = params.poster as string;
        if (params.auditStatus) queryParams.auditStatus = params.auditStatus as AuditStatus;
        if (params.postStatus) queryParams.postStatus = params.postStatus as PostStatus;
        if (params.keyword) queryParams.keyword = params.keyword as string;
        if (params.amountMin !== undefined) queryParams.amountMin = params.amountMin as number;
        if (params.amountMax !== undefined) queryParams.amountMax = params.amountMax as number;
        if (params.accountBookCode) queryParams.accountBookCode = params.accountBookCode as string;
        if (params.externalVoucherNo) queryParams.externalVoucherNo = params.externalVoucherNo as string;

        // 构建分页参数
        const pageParams: PageRequest = {
          pageNum: Math.max(1, (params.pageNum as number) || 1),
          pageSize: Math.min(100, Math.max(1, (params.pageSize as number) || 20)),
        };

        // 调用服务查询凭证列表
        const result = await this.voucherService.list(queryParams, pageParams);

        // 格式化响应
        const content: MCPContent[] = [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `查询成功，共找到 ${result.total} 条凭证`,
              data: {
                total: result.total,
                pageNum: result.pageNum,
                pageSize: result.pageSize,
                pages: result.pages,
                list: result.list,
              },
            }, null, 2),
          },
        ];

        return {
          success: true,
          content,
        };
      } catch (error) {
        logger.error('查询凭证列表工具执行失败', error);
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `查询凭证列表失败: ${(error as Error).message}`,
                error: {
                  code: 'QUERY_VOUCHER_LIST_ERROR',
                  message: (error as Error).message,
                },
              }, null, 2),
            },
          ],
          error: (error as Error).message,
        };
      }
    },
  };

  /**
   * 查询凭证详情工具
   */
  private queryVoucherDetailTool: MCPTool = {
    name: 'query_voucher_detail',
    description: `查询用友凭证详细信息，包括凭证基本信息和所有分录明细。

功能说明：
- 通过凭证ID或凭证号查询凭证详情
- 返回凭证基本信息（凭证号、日期、期间、制单人等）
- 返回所有分录明细（科目、摘要、借贷金额、辅助核算等）
- 返回审核和记账状态信息

使用场景：
1. 查看某个凭证的完整信息
2. 核对凭证分录是否正确
3. 查看凭证的审核和记账状态`,
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '凭证ID（与voucherNo二选一，优先使用id）',
        },
        voucherNo: {
          type: 'string',
          description: '凭证号（与id二选一，如：记-2024-01-001）',
        },
      },
    },
    handler: async (params: Record<string, unknown>): Promise<MCPToolResult> => {
      try {
        logger.info('执行查询凭证详情工具', params);

        const id = params.id as string;
        const voucherNo = params.voucherNo as string;

        if (!id && !voucherNo) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '凭证ID和凭证号至少需要提供一个',
                  error: {
                    code: 'MISSING_REQUIRED_PARAM',
                    message: '请提供凭证ID(id)或凭证号(voucherNo)',
                  },
                }, null, 2),
              },
            ],
            error: '凭证ID和凭证号至少需要提供一个',
          };
        }

        // 调用服务查询凭证详情
        const result = await this.voucherService.detail(id, voucherNo);

        // 格式化响应
        const content: MCPContent[] = [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: '查询凭证详情成功',
              data: result,
            }, null, 2),
          },
        ];

        return {
          success: true,
          content,
        };
      } catch (error) {
        logger.error('查询凭证详情工具执行失败', error);
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `查询凭证详情失败: ${(error as Error).message}`,
                error: {
                  code: 'QUERY_VOUCHER_DETAIL_ERROR',
                  message: (error as Error).message,
                },
              }, null, 2),
            },
          ],
          error: (error as Error).message,
        };
      }
    },
  };

  /**
   * 保存凭证工具
   */
  private saveVoucherTool: MCPTool = {
    name: 'save_voucher',
    description: `保存用友凭证，支持创建新凭证或更新已有凭证。

功能说明：
- 创建凭证：不提供id，系统自动生成凭证号
- 更新凭证：提供id，修改已有凭证
- 自动验证凭证数据完整性和借贷平衡性
- 支持多币种、数量核算、辅助核算
- 支持现金流量项目指定

必填字段：
- voucherTypeCode: 凭证类型编码
- voucherDate: 凭证日期
- accountingPeriod: 会计期间
- entries: 凭证分录列表（至少一条）

分录必填字段：
- accountCode: 科目编码
- summary: 摘要
- debitAmount 或 creditAmount: 借方金额或贷方金额（二选一）

使用场景：
1. 创建新的记账凭证
2. 修改未审核的凭证
3. 从外部系统导入凭证`,
    inputSchema: {
      type: 'object',
      properties: {
        // 操作模式
        isUpdate: {
          type: 'boolean',
          description: '是否为更新操作，true表示更新，false或不填表示创建',
          default: false,
        },
        // 凭证基本信息
        id: {
          type: 'string',
          description: '凭证ID（更新时必填）',
        },
        voucherNo: {
          type: 'string',
          description: '凭证号（更新时可填，创建时系统自动生成）',
        },
        voucherTypeCode: {
          type: 'string',
          description: '凭证类型编码（必填，如：记-1、收-1、付-1等）',
        },
        voucherDate: {
          type: 'string',
          description: '凭证日期（必填，格式：YYYY-MM-DD）',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        accountingPeriod: {
          type: 'string',
          description: '会计期间（必填，格式：YYYY-MM）',
          pattern: '^\\d{4}-\\d{2}$',
        },
        accountBookCode: {
          type: 'string',
          description: '账簿编码',
        },
        maker: {
          type: 'string',
          description: '制单人',
        },
        attachmentCount: {
          type: 'number',
          description: '附单据数',
          minimum: 0,
        },
        remark: {
          type: 'string',
          description: '备注',
        },
        externalVoucherNo: {
          type: 'string',
          description: '外部凭证号（用于对接外部系统，如钉钉审批单号）',
        },
        modifyReason: {
          type: 'string',
          description: '修改原因（更新时建议填写）',
        },
        // 凭证分录
        entries: {
          type: 'array',
          description: '凭证分录列表（必填，至少一条分录）',
          items: {
            type: 'object',
            description: '凭证分录对象',
            properties: {
              accountCode: {
                type: 'string',
                description: '科目编码（必填）',
              },
              summary: {
                type: 'string',
                description: '摘要（必填）',
              },
              debitAmount: {
                type: 'number',
                description: '借方金额（与creditAmount二选一，不能同时填写）',
                minimum: 0,
              },
              creditAmount: {
                type: 'number',
                description: '贷方金额（与debitAmount二选一，不能同时填写）',
                minimum: 0,
              },
              currencyCode: {
                type: 'string',
                description: '币种编码（默认CNY）',
              },
              exchangeRate: {
                type: 'number',
                description: '汇率',
                minimum: 0,
              },
              originalAmount: {
                type: 'number',
                description: '原币金额',
                minimum: 0,
              },
              quantity: {
                type: 'number',
                description: '数量',
              },
              unitPrice: {
                type: 'number',
                description: '单价',
                minimum: 0,
              },
              settlementType: {
                type: 'string',
                description: '结算方式',
              },
              settlementNo: {
                type: 'string',
                description: '结算号',
              },
              settlementDate: {
                type: 'string',
                description: '结算日期（格式：YYYY-MM-DD）',
              },
              cashFlowCode: {
                type: 'string',
                description: '现金流量项目编码',
              },
              auxiliaryItems: {
                type: 'array',
                description: '辅助核算项',
                items: {
                  type: 'object',
                  description: '辅助核算项对象',
                  properties: {
                    typeCode: {
                      type: 'string',
                      description: '辅助核算类型编码',
                    },
                    valueCode: {
                      type: 'string',
                      description: '辅助核算值编码',
                    },
                  },
                },
              },
            },
          },
        },
        // 扩展字段
        extFields: {
          type: 'object',
          description: '扩展字段（键值对，用于存储自定义信息）',
        },
      },
      required: ['voucherTypeCode', 'voucherDate', 'accountingPeriod', 'entries'],
    },
    handler: async (params: Record<string, unknown>): Promise<MCPToolResult> => {
      try {
        logger.info('执行保存凭证工具', params);

        const isUpdate = params.isUpdate === true;

        // 验证必填字段
        const requiredFields = ['voucherTypeCode', 'voucherDate', 'accountingPeriod', 'entries'];
        const missingFields = requiredFields.filter(field => !params[field]);
        if (missingFields.length > 0) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: `缺少必填字段: ${missingFields.join(', ')}`,
                  error: {
                    code: 'MISSING_REQUIRED_FIELDS',
                    message: `请提供以下必填字段: ${missingFields.join(', ')}`,
                    fields: missingFields,
                  },
                }, null, 2),
              },
            ],
            error: `缺少必填字段: ${missingFields.join(', ')}`,
          };
        }

        // 验证更新模式下的id
        if (isUpdate && !params.id) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '更新凭证时必须提供凭证ID',
                  error: {
                    code: 'MISSING_VOUCHER_ID',
                    message: '更新模式下id字段为必填项',
                  },
                }, null, 2),
              },
            ],
            error: '更新凭证时必须提供凭证ID',
          };
        }

        // 验证分录
        const entries = params.entries as Array<Record<string, unknown>>;
        if (!Array.isArray(entries) || entries.length === 0) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '凭证分录不能为空',
                  error: {
                    code: 'EMPTY_ENTRIES',
                    message: '请至少提供一条凭证分录',
                  },
                }, null, 2),
              },
            ],
            error: '凭证分录不能为空',
          };
        }

        // 验证每条分录
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (!entry.accountCode) {
            return {
              success: false,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: `第${i + 1}条分录缺少科目编码`,
                    error: {
                      code: 'MISSING_ACCOUNT_CODE',
                      message: `第${i + 1}条分录的accountCode字段为必填项`,
                      entryIndex: i,
                    },
                  }, null, 2),
                },
              ],
              error: `第${i + 1}条分录缺少科目编码`,
            };
          }
          if (!entry.summary) {
            return {
              success: false,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: `第${i + 1}条分录缺少摘要`,
                    error: {
                      code: 'MISSING_SUMMARY',
                      message: `第${i + 1}条分录的summary字段为必填项`,
                      entryIndex: i,
                    },
                  }, null, 2),
                },
              ],
              error: `第${i + 1}条分录缺少摘要`,
            };
          }
          if (!entry.debitAmount && !entry.creditAmount) {
            return {
              success: false,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: `第${i + 1}条分录缺少金额`,
                    error: {
                      code: 'MISSING_AMOUNT',
                      message: `第${i + 1}条分录必须填写debitAmount或creditAmount`,
                      entryIndex: i,
                    },
                  }, null, 2),
                },
              ],
              error: `第${i + 1}条分录缺少金额`,
            };
          }
          if (entry.debitAmount && entry.creditAmount) {
            return {
              success: false,
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: false,
                    message: `第${i + 1}条分录借贷金额不能同时填写`,
                    error: {
                      code: 'INVALID_AMOUNT',
                      message: `第${i + 1}条分录不能同时填写debitAmount和creditAmount`,
                      entryIndex: i,
                    },
                  }, null, 2),
                },
              ],
              error: `第${i + 1}条分录借贷金额不能同时填写`,
            };
          }
        }

        // 构建凭证数据
        const voucherData: VoucherCreateRequest | VoucherUpdateRequest = {
          voucherTypeCode: params.voucherTypeCode as string,
          voucherDate: params.voucherDate as string,
          accountingPeriod: params.accountingPeriod as string,
          entries: entries.map(entry => ({
            accountCode: entry.accountCode as string,
            summary: entry.summary as string,
            debitAmount: entry.debitAmount as number | undefined,
            creditAmount: entry.creditAmount as number | undefined,
            currencyCode: entry.currencyCode as string | undefined,
            exchangeRate: entry.exchangeRate as number | undefined,
            originalAmount: entry.originalAmount as number | undefined,
            quantity: entry.quantity as number | undefined,
            unitPrice: entry.unitPrice as number | undefined,
            settlementType: entry.settlementType as string | undefined,
            settlementNo: entry.settlementNo as string | undefined,
            settlementDate: entry.settlementDate as string | undefined,
            cashFlowCode: entry.cashFlowCode as string | undefined,
            auxiliaryItems: entry.auxiliaryItems as VoucherEntryCreateRequest['auxiliaryItems'],
          })),
        };

        // 添加可选字段
        if (params.accountBookCode) voucherData.accountBookCode = params.accountBookCode as string;
        if (params.maker) voucherData.maker = params.maker as string;
        if (params.attachmentCount !== undefined) voucherData.attachmentCount = params.attachmentCount as number;
        if (params.remark) voucherData.remark = params.remark as string;
        if (params.externalVoucherNo) voucherData.externalVoucherNo = params.externalVoucherNo as string;
        if (params.extFields) voucherData.extFields = params.extFields as Record<string, unknown>;

        // 更新模式添加必需字段
        if (isUpdate) {
          (voucherData as VoucherUpdateRequest).id = params.id as string;
          if (params.voucherNo) (voucherData as VoucherUpdateRequest).voucherNo = params.voucherNo as string;
          if (params.modifyReason) (voucherData as VoucherUpdateRequest).modifyReason = params.modifyReason as string;
        }

        // 调用服务保存凭证
        const result = await this.voucherService.save(voucherData);

        // 格式化响应
        const content: MCPContent[] = [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: isUpdate ? '更新凭证成功' : '创建凭证成功',
              data: result,
            }, null, 2),
          },
        ];

        return {
          success: true,
          content,
        };
      } catch (error) {
        logger.error('保存凭证工具执行失败', error);
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `保存凭证失败: ${(error as Error).message}`,
                error: {
                  code: 'SAVE_VOUCHER_ERROR',
                  message: (error as Error).message,
                },
              }, null, 2),
            },
          ],
          error: (error as Error).message,
        };
      }
    },
  };

  /**
   * 删除凭证工具
   */
  private deleteVoucherTool: MCPTool = {
    name: 'delete_voucher',
    description: `删除用友凭证，支持批量删除。

功能说明：
- 支持批量删除多个凭证
- 只能删除未审核和未记账的凭证
- 删除操作不可恢复，请谨慎操作
- 建议填写删除原因以便审计

使用场景：
1. 删除错误创建的凭证
2. 批量删除作废凭证
3. 清理测试数据

注意事项：
- 已审核的凭证需要先反审核才能删除
- 已记账的凭证需要先反记账才能删除
- 删除后凭证号可能会产生断号`,
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          description: '要删除的凭证ID列表（必填，至少提供一个ID）',
          items: {
            type: 'string',
            description: '凭证ID',
          },
        },
        reason: {
          type: 'string',
          description: '删除原因（建议填写，便于审计追溯）',
        },
      },
      required: ['ids'],
    },
    handler: async (params: Record<string, unknown>): Promise<MCPToolResult> => {
      try {
        logger.info('执行删除凭证工具', params);

        const ids = params.ids as string[];
        const reason = params.reason as string;

        // 验证ids
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '请提供要删除的凭证ID',
                  error: {
                    code: 'MISSING_IDS',
                    message: 'ids字段为必填项，且至少包含一个凭证ID',
                  },
                }, null, 2),
              },
            ],
            error: '请提供要删除的凭证ID',
          };
        }

        // 过滤空值
        const validIds = ids.filter(id => id && typeof id === 'string' && id.trim());
        if (validIds.length === 0) {
          return {
            success: false,
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: '凭证ID不能为空',
                  error: {
                    code: 'EMPTY_IDS',
                    message: '请提供有效的凭证ID',
                  },
                }, null, 2),
              },
            ],
            error: '凭证ID不能为空',
          };
        }

        // 调用服务删除凭证
        await this.voucherService.delete(validIds, reason);

        // 格式化响应
        const content: MCPContent[] = [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `删除凭证成功，共删除 ${validIds.length} 条凭证`,
              data: {
                deletedCount: validIds.length,
                ids: validIds,
              },
            }, null, 2),
          },
        ];

        return {
          success: true,
          content,
        };
      } catch (error) {
        logger.error('删除凭证工具执行失败', error);
        return {
          success: false,
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `删除凭证失败: ${(error as Error).message}`,
                error: {
                  code: 'DELETE_VOUCHER_ERROR',
                  message: (error as Error).message,
                },
              }, null, 2),
            },
          ],
          error: (error as Error).message,
        };
      }
    },
  };
}

export default VoucherTools;
