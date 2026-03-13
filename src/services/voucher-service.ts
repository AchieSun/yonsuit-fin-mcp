/**
 * 凭证服务
 * @module services/voucher-service
 *
 * 提供凭证相关的业务逻辑封装，包括：
 * - 凭证列表查询：POST /yonbip/fi/ficloud/voucher/list
 * - 凭证详情查询：POST /yonbip/fi/ficloud/voucher/detail
 * - 凭证保存：POST /yonbip/fi/ficloud/voucher/save
 * - 凭证删除：POST /yonbip/fi/ficloud/voucher/delete
 * - 凭证审核/反审核
 * - 凭证记账/反记账
 * - 凭证作废
 * - 凭证试算平衡检查
 * - 凭证导入/导出
 */

import { logger } from '../utils';
import { yonyouClient } from '../client';
import { API_PATHS } from '../config/constants';
import type {
  VoucherCreateRequest,
  VoucherUpdateRequest,
  VoucherQueryParams,
  VoucherDetailResponse,
  VoucherListResponse,
  VoucherDeleteRequest,
  VoucherAuditRequest,
  VoucherUnauditRequest,
  VoucherPostRequest,
  VoucherUnpostRequest,
  VoucherVoidRequest,
  VoucherBalanceCheck,
  VoucherImportRequest,
  VoucherImportResult,
  VoucherExportRequest,
  VoucherExportResult,
  VoucherCopyRequest,
  VoucherSummaryQuery,
  VoucherSummaryResult,
  VoucherRearrangeRequest,
  VoucherRearrangeResult,
} from '../types/voucher';
import type { PaginationParams } from '../types/common';

/**
 * 凭证服务配置
 */
interface VoucherServiceConfig {
  /** 是否启用借贷平衡自动校验 */
  autoBalanceCheck: boolean;
  /** 是否允许负数金额 */
  allowNegativeAmount: boolean;
  /** 借贷平衡误差阈值 */
  balanceThreshold: number;
}

/**
 * 默认服务配置
 */
const DEFAULT_CONFIG: VoucherServiceConfig = {
  autoBalanceCheck: true,
  allowNegativeAmount: false,
  balanceThreshold: 0.01,
};

/**
 * 凭证服务类
 * 封装用友凭证相关API调用逻辑
 */
export class VoucherService {
  private config: VoucherServiceConfig;

  constructor(config?: Partial<VoucherServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==================== 凭证查询 ====================

  /**
   * 查询凭证列表
   * @param params 查询参数
   * @param pagination 分页参数
   * @returns 凭证列表
   */
  async list(
    params: VoucherQueryParams,
    pagination?: PaginationParams
  ): Promise<VoucherListResponse> {
    logger.info('查询凭证列表', { params, pagination });

    try {
      const queryParams = {
        ...params,
        ...pagination,
      };

      const result = await yonyouClient.post<VoucherListResponse>(
        API_PATHS.VOUCHER_LIST,
        queryParams as unknown as Record<string, unknown>
      );

      logger.info('凭证列表查询成功', {
        total: result.total,
        pageNum: result.pageNum,
        pageSize: result.pageSize,
      });

      return result;
    } catch (error) {
      logger.error('凭证列表查询失败', error);
      throw error;
    }
  }

  /**
   * 查询凭证详情
   * @param id 凭证ID
   * @param voucherNo 凭证号（可选，与id二选一）
   * @returns 凭证详情
   */
  async detail(id?: string, voucherNo?: string): Promise<VoucherDetailResponse> {
    logger.info('查询凭证详情', { id, voucherNo });

    if (!id && !voucherNo) {
      throw new Error('凭证ID和凭证号至少需要提供一个');
    }

    try {
      const params: Record<string, string> = {};
      if (id) params.id = id;
      if (voucherNo) params.voucherNo = voucherNo;

      const result = await yonyouClient.post<VoucherDetailResponse>(
        API_PATHS.VOUCHER_DETAIL,
        params as unknown as Record<string, unknown>
      );

      logger.info('凭证详情查询成功', {
        id: result.id,
        voucherNo: result.voucherNo,
      });

      return result;
    } catch (error) {
      logger.error('凭证详情查询失败', error);
      throw error;
    }
  }

  // ==================== 凭证保存 ====================

  /**
   * 保存凭证（创建或更新）
   * @param data 凭证数据
   * @returns 凭证详情
   */
  async save(data: VoucherCreateRequest | VoucherUpdateRequest): Promise<VoucherDetailResponse> {
    const isUpdate = 'id' in data && data.id;
    logger.info('保存凭证', { isUpdate, voucherDate: data.voucherDate });

    try {
      // 自动校验借贷平衡
      if (this.config.autoBalanceCheck) {
        const balanceCheck = this.checkBalance(data.entries || []);
        if (!balanceCheck.isBalanced) {
          throw new Error(
            `凭证借贷不平衡: 借方合计${balanceCheck.totalDebit.toFixed(2)}，` +
            `贷方合计${balanceCheck.totalCredit.toFixed(2)}，` +
            `差额${balanceCheck.difference.toFixed(2)}`
          );
        }
      }

      // 验证凭证数据
      this.validateVoucher(data);

      const result = await yonyouClient.post<VoucherDetailResponse>(
        API_PATHS.VOUCHER_SAVE,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证保存成功', {
        id: result.id,
        voucherNo: result.voucherNo,
        isUpdate,
      });

      return result;
    } catch (error) {
      logger.error('凭证保存失败', error);
      throw error;
    }
  }

  /**
   * 创建凭证
   * @param data 凭证创建数据
   * @returns 凭证详情
   */
  async create(data: VoucherCreateRequest): Promise<VoucherDetailResponse> {
    logger.info('创建凭证', {
      voucherDate: data.voucherDate,
      entries: data.entries?.length || 0,
    });

    return this.save(data);
  }

  /**
   * 更新凭证
   * @param data 凭证更新数据
   * @returns 凭证详情
   */
  async update(data: VoucherUpdateRequest): Promise<VoucherDetailResponse> {
    logger.info('更新凭证', { id: data.id, voucherNo: data.voucherNo });

    if (!data.id) {
      throw new Error('更新凭证时必须提供凭证ID');
    }

    return this.save(data);
  }

  // ==================== 凭证删除 ====================

  /**
   * 删除凭证
   * @param ids 凭证ID列表
   * @param reason 删除原因
   */
  async delete(ids: string[], reason?: string): Promise<void> {
    logger.info('删除凭证', { ids, reason });

    if (!ids || ids.length === 0) {
      throw new Error('请提供要删除的凭证ID');
    }

    try {
      await yonyouClient.post(API_PATHS.VOUCHER_DELETE, {
        ids,
        reason,
      } as Record<string, unknown>);

      logger.info('凭证删除成功', { count: ids.length });
    } catch (error) {
      logger.error('凭证删除失败', error);
      throw error;
    }
  }

  /**
   * 批量删除凭证
   * @param data 删除请求
   */
  async batchDelete(data: VoucherDeleteRequest): Promise<void> {
    logger.info('批量删除凭证', { ids: data.ids });

    try {
      await yonyouClient.post(
        API_PATHS.VOUCHER_DELETE,
        data as unknown as Record<string, unknown>
      );

      logger.info('批量删除凭证成功', { count: data.ids.length });
    } catch (error) {
      logger.error('批量删除凭证失败', error);
      throw error;
    }
  }

  // ==================== 凭证审核 ====================

  /**
   * 凭证审核
   * @param data 审核请求
   */
  async audit(data: VoucherAuditRequest): Promise<void> {
    logger.info('凭证审核', { ids: data.ids, auditor: data.auditor });

    try {
      await yonyouClient.post(
        API_PATHS.VOUCHER_AUDIT,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证审核成功', { count: data.ids.length });
    } catch (error) {
      logger.error('凭证审核失败', error);
      throw error;
    }
  }

  /**
   * 凭证反审核
   * @param data 反审核请求
   */
  async unaudit(data: VoucherUnauditRequest): Promise<void> {
    logger.info('凭证反审核', { ids: data.ids, operator: data.operator });

    try {
      await yonyouClient.post(
        API_PATHS.VOUCHER_UNAUDIT,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证反审核成功', { count: data.ids.length });
    } catch (error) {
      logger.error('凭证反审核失败', error);
      throw error;
    }
  }

  // ==================== 凭证记账 ====================

  /**
   * 凭证记账
   * @param data 记账请求
   */
  async post(data: VoucherPostRequest): Promise<void> {
    logger.info('凭证记账', { ids: data.ids, poster: data.poster });

    try {
      await yonyouClient.post(
        API_PATHS.VOUCHER_POST,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证记账成功', { count: data.ids.length });
    } catch (error) {
      logger.error('凭证记账失败', error);
      throw error;
    }
  }

  /**
   * 凭证反记账
   * @param data 反记账请求
   */
  async unpost(data: VoucherUnpostRequest): Promise<void> {
    logger.info('凭证反记账', { ids: data.ids, operator: data.operator });

    try {
      await yonyouClient.post(
        API_PATHS.VOUCHER_UNPOST,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证反记账成功', { count: data.ids.length });
    } catch (error) {
      logger.error('凭证反记账失败', error);
      throw error;
    }
  }

  // ==================== 凭证作废 ====================

  /**
   * 凭证作废
   * @param data 作废请求
   */
  async void(data: VoucherVoidRequest): Promise<void> {
    logger.info('凭证作废', { id: data.id, reason: data.reason });

    try {
      await yonyouClient.post(
        API_PATHS.VOUCHER_VOID,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证作废成功', { id: data.id });
    } catch (error) {
      logger.error('凭证作废失败', error);
      throw error;
    }
  }

  // ==================== 凭证试算平衡 ====================

  /**
   * 凭证试算平衡检查
   * @param data 凭证数据
   * @returns 检查结果
   */
  async checkBalanceApi(data: VoucherCreateRequest): Promise<VoucherBalanceCheck> {
    logger.debug('凭证试算平衡检查', { entries: data.entries.length });

    try {
      const result = await yonyouClient.post<VoucherBalanceCheck>(
        API_PATHS.VOUCHER_BALANCE_CHECK,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证试算平衡检查完成', { isBalanced: result.isBalanced });
      return result;
    } catch (error) {
      logger.error('凭证试算平衡检查失败', error);
      throw error;
    }
  }

  /**
   * 本地借贷平衡检查（不调用API）
   * @param entries 分录列表
   * @returns 检查结果
   */
  checkBalance(
    entries: Array<{ debitAmount?: number; creditAmount?: number }>
  ): VoucherBalanceCheck {
    let totalDebit = 0;
    let totalCredit = 0;
    const errors: VoucherBalanceCheck['errors'] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const debit = entry.debitAmount || 0;
      const credit = entry.creditAmount || 0;

      // 检查负数金额
      if (!this.config.allowNegativeAmount && (debit < 0 || credit < 0)) {
        errors?.push({
          type: 'amount_invalid',
          message: `第${i + 1}条分录金额不能为负数`,
          entrySequence: i + 1,
          field: debit < 0 ? 'debitAmount' : 'creditAmount',
        });
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < this.config.balanceThreshold;

    if (!isBalanced) {
      errors?.push({
        type: 'debit_credit_not_equal',
        message:
          `借贷不平衡，借方合计${totalDebit.toFixed(2)}，` +
          `贷方合计${totalCredit.toFixed(2)}，` +
          `差额${difference.toFixed(2)}`,
      });
    }

    return {
      isBalanced,
      totalDebit,
      totalCredit,
      difference: isBalanced ? 0 : difference,
      errors: errors && errors.length > 0 ? errors : undefined,
    };
  }

  // ==================== 凭证导入导出 ====================

  /**
   * 凭证导入
   * @param data 导入请求
   * @returns 导入结果
   */
  async import(data: VoucherImportRequest): Promise<VoucherImportResult> {
    logger.info('凭证导入', { total: data.data.length, mode: data.mode });

    try {
      const result = await yonyouClient.post<VoucherImportResult>(
        API_PATHS.VOUCHER_IMPORT,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证导入完成', {
        total: result.total,
        successCount: result.successCount,
        failCount: result.failCount,
      });

      return result;
    } catch (error) {
      logger.error('凭证导入失败', error);
      throw error;
    }
  }

  /**
   * 凭证导出
   * @param data 导出请求
   * @returns 导出结果
   */
  async export(data: VoucherExportRequest): Promise<VoucherExportResult> {
    logger.info('凭证导出', { format: data.format });

    try {
      const result = await yonyouClient.post<VoucherExportResult>(
        API_PATHS.VOUCHER_EXPORT,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证导出成功', { fileName: result.fileName });
      return result;
    } catch (error) {
      logger.error('凭证导出失败', error);
      throw error;
    }
  }

  // ==================== 凭证其他操作 ====================

  /**
   * 凭证复制
   * @param data 复制请求
   * @returns 新凭证详情
   */
  async copy(data: VoucherCopyRequest): Promise<VoucherDetailResponse> {
    logger.info('凭证复制', {
      sourceId: data.sourceId,
      targetPeriod: data.targetPeriod,
    });

    try {
      const result = await yonyouClient.post<VoucherDetailResponse>(
        API_PATHS.VOUCHER_COPY,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证复制成功', { id: result.id, voucherNo: result.voucherNo });
      return result;
    } catch (error) {
      logger.error('凭证复制失败', error);
      throw error;
    }
  }

  /**
   * 凭证汇总查询
   * @param query 汇总查询参数
   * @returns 汇总结果
   */
  async summary(query: VoucherSummaryQuery): Promise<VoucherSummaryResult[]> {
    logger.info('凭证汇总查询', { query });

    try {
      const result = await yonyouClient.post<VoucherSummaryResult[]>(
        API_PATHS.VOUCHER_SUMMARY,
        query as unknown as Record<string, unknown>
      );

      logger.info('凭证汇总查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('凭证汇总查询失败', error);
      throw error;
    }
  }

  /**
   * 凭证整理
   * @param data 整理请求
   * @returns 整理结果
   */
  async rearrange(data: VoucherRearrangeRequest): Promise<VoucherRearrangeResult> {
    logger.info('凭证整理', { accountingPeriod: data.accountingPeriod });

    try {
      const result = await yonyouClient.post<VoucherRearrangeResult>(
        API_PATHS.VOUCHER_REARRANGE,
        data as unknown as Record<string, unknown>
      );

      logger.info('凭证整理完成', { count: result.count });
      return result;
    } catch (error) {
      logger.error('凭证整理失败', error);
      throw error;
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 验证凭证数据
   * @param voucher 凭证数据
   */
  private validateVoucher(voucher: VoucherCreateRequest | VoucherUpdateRequest): void {
    // 验证凭证类型
    if (!voucher.voucherTypeCode) {
      throw new Error('凭证类型编码不能为空');
    }

    // 验证凭证日期
    if (!voucher.voucherDate) {
      throw new Error('凭证日期不能为空');
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(voucher.voucherDate)) {
      throw new Error('凭证日期格式错误，应为YYYY-MM-DD');
    }

    // 验证会计期间
    if (!voucher.accountingPeriod) {
      throw new Error('会计期间不能为空');
    }

    // 验证会计期间格式
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(voucher.accountingPeriod)) {
      throw new Error('会计期间格式错误，应为YYYY-MM');
    }

    // 验证分录
    const entries = voucher.entries || [];
    if (entries.length === 0) {
      throw new Error('凭证分录不能为空');
    }

    // 验证每个分录
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.accountCode) {
        throw new Error(`第${i + 1}条分录的科目编码不能为空`);
      }
      if (!entry.summary) {
        throw new Error(`第${i + 1}条分录的摘要不能为空`);
      }
      if (!entry.debitAmount && !entry.creditAmount) {
        throw new Error(`第${i + 1}条分录必须填写借方金额或贷方金额`);
      }
      if (entry.debitAmount && entry.creditAmount) {
        throw new Error(`第${i + 1}条分录不能同时填写借方金额和贷方金额`);
      }
    }
  }

  /**
   * 更新服务配置
   * @param config 配置项
   */
  updateConfig(config: Partial<VoucherServiceConfig>): void {
    this.config = { ...this.config, ...config };
    logger.debug('凭证服务配置已更新', { config: this.config });
  }

  /**
   * 获取当前配置
   */
  getConfig(): Readonly<VoucherServiceConfig> {
    return { ...this.config };
  }
}

/**
 * 凭证服务实例
 */
export const voucherService = new VoucherService();

export default voucherService;
