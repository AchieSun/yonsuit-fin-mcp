/**
 * API客户端模块
 * @module client
 *
 * 提供用友API的完整客户端实现，包括：
 * - 凭证管理API
 * - 档案管理API
 * - 账簿查询API
 * - 期末处理API
 */

import { AxiosInstance } from 'axios';
import { logger } from '../utils';
import { appConfig } from '../config';
import { authManager } from '../auth';
import { signatureGenerator } from '../signature';
import { API_PATHS, HTTP_HEADERS } from '../config/constants';
import { BaseClient } from './base-client';
import type { RequestConfig } from './types';

// 导入凭证相关类型
import type {
  VoucherCreateRequest,
  VoucherUpdateRequest,
  VoucherQueryParams,
  VoucherDetailResponse,
  VoucherListResponse,
  VoucherAuditRequest,
  VoucherUnauditRequest,
  VoucherPostRequest,
  VoucherUnpostRequest,
  VoucherVoidRequest,
  VoucherImportRequest,
  VoucherImportResult,
  VoucherExportRequest,
  VoucherExportResult,
  VoucherBalanceCheck,
} from '../types/voucher';

// 导入用友类型
import type {
  Account,
  Currency,
  VoucherType,
  AccountBook,
  PeriodStatus,
  CustomArchive,
} from '../types/yonyou.types';

// 导入通用类型
import type { PaginationParams } from '../types/common';

/**
 * 用友API客户端
 * 继承基础客户端，提供业务API封装
 */
export class YonyouClient extends BaseClient {
  /** Axios实例（用于特殊场景） */
  private client: AxiosInstance;

  constructor() {
    super();

    // 保存axios实例引用
    this.client = (this as unknown as { axiosInstance: AxiosInstance }).axiosInstance;

    // 设置Token刷新回调
    this.setTokenRefreshCallback(async () => {
      return authManager.refreshAccessToken();
    });

    // 设置业务请求拦截器
    this.setupBusinessInterceptors();
  }

  /**
   * 设置业务拦截器
   */
  private setupBusinessInterceptors(): void {
    // 请求拦截器 - 添加认证和签名
    this.client.interceptors.request.use(
      async (config) => {
        const customConfig = config as unknown as RequestConfig;

        // 跳过认证
        if (!customConfig.skipAuth) {
          const token = await authManager.getAccessToken();
          config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加租户信息
        config.headers[HTTP_HEADERS.TENANT_ID] = appConfig.yonyou.tenantId;
        config.headers[HTTP_HEADERS.DATA_CENTER] = appConfig.yonyou.dataCenterDomain;

        // 跳过签名
        if (!customConfig.skipSignature && appConfig.security.enableRequestSignature && config.data) {
          const signature = signatureGenerator.generate(config.data as Record<string, unknown>);
          config.headers[HTTP_HEADERS.SIGNATURE] = signature;
        }

        logger.debug('业务请求拦截', {
          url: config.url,
          method: config.method,
        });

        return config;
      },
      (error) => {
        logger.error('业务请求拦截错误', error);
        return Promise.reject(error);
      }
    );
  }

  // ==================== 凭证管理API ====================

  /**
   * 创建凭证
   */
  async createVoucher(data: VoucherCreateRequest): Promise<VoucherDetailResponse> {
    logger.info('创建凭证', { voucherDate: data.voucherDate, entries: data.entries.length });
    return this.post<VoucherDetailResponse>(API_PATHS.VOUCHER_SAVE, data as unknown as Record<string, unknown>);
  }

  /**
   * 更新凭证
   */
  async updateVoucher(data: VoucherUpdateRequest): Promise<VoucherDetailResponse> {
    logger.info('更新凭证', { id: data.id, voucherNo: data.voucherNo });
    return this.put<VoucherDetailResponse>(API_PATHS.VOUCHER_SAVE, data as unknown as Record<string, unknown>);
  }

  /**
   * 删除凭证
   */
  async deleteVoucher(ids: string[], reason?: string): Promise<void> {
    logger.info('删除凭证', { ids, reason });
    await this.post(API_PATHS.VOUCHER_DELETE, { ids, reason });
  }

  /**
   * 获取凭证详情
   */
  async getVoucherDetail(id: string): Promise<VoucherDetailResponse> {
    logger.debug('获取凭证详情', { id });
    return this.get<VoucherDetailResponse>(API_PATHS.VOUCHER_DETAIL, { id });
  }

  /**
   * 查询凭证列表
   */
  async queryVouchers(
    params: VoucherQueryParams,
    pagination?: PaginationParams
  ): Promise<VoucherListResponse> {
    logger.debug('查询凭证列表', { params, pagination });
    const queryParams = {
      ...params,
      ...pagination,
    };
    return this.post<VoucherListResponse>(API_PATHS.VOUCHER_LIST, queryParams as unknown as Record<string, unknown>);
  }

  /**
   * 凭证审核
   */
  async auditVoucher(data: VoucherAuditRequest): Promise<void> {
    logger.info('凭证审核', { ids: data.ids, auditor: data.auditor });
    await this.post(API_PATHS.VOUCHER_AUDIT, data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证反审核
   */
  async unauditVoucher(data: VoucherUnauditRequest): Promise<void> {
    logger.info('凭证反审核', { ids: data.ids, operator: data.operator });
    await this.post(API_PATHS.VOUCHER_UNAUDIT, data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证记账
   */
  async postVoucher(data: VoucherPostRequest): Promise<void> {
    logger.info('凭证记账', { ids: data.ids, poster: data.poster });
    await this.post(API_PATHS.VOUCHER_POST, data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证反记账
   */
  async unpostVoucher(data: VoucherUnpostRequest): Promise<void> {
    logger.info('凭证反记账', { ids: data.ids, operator: data.operator });
    await this.post(API_PATHS.VOUCHER_UNAUDIT, data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证作废
   */
  async voidVoucher(data: VoucherVoidRequest): Promise<void> {
    logger.info('凭证作废', { id: data.id, reason: data.reason });
    await this.post('/yonbip/fi/voucher/void', data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证试算平衡检查
   */
  async checkVoucherBalance(data: VoucherCreateRequest): Promise<VoucherBalanceCheck> {
    logger.debug('凭证试算平衡检查', { entries: data.entries.length });
    return this.post<VoucherBalanceCheck>('/yonbip/fi/voucher/balance-check', data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证导入
   */
  async importVouchers(data: VoucherImportRequest): Promise<VoucherImportResult> {
    logger.info('凭证导入', { total: data.data.length, mode: data.mode });
    return this.post<VoucherImportResult>('/yonbip/fi/voucher/import', data as unknown as Record<string, unknown>);
  }

  /**
   * 凭证导出
   */
  async exportVouchers(data: VoucherExportRequest): Promise<VoucherExportResult> {
    logger.info('凭证导出', { format: data.format });
    return this.post<VoucherExportResult>('/yonbip/fi/voucher/export', data as unknown as Record<string, unknown>);
  }

  // ==================== 档案管理API ====================

  /**
   * 获取科目列表
   */
  async getAccountList(params?: {
    code?: string;
    name?: string;
    category?: string;
    enabled?: boolean;
  }): Promise<Account[]> {
    logger.debug('获取科目列表', { params });
    return this.get<Account[]>(API_PATHS.ACCOUNT_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取科目详情
   */
  async getAccountDetail(code: string): Promise<Account> {
    logger.debug('获取科目详情', { code });
    return this.get<Account>(API_PATHS.ACCOUNT_DETAIL, { code });
  }

  /**
   * 创建科目
   */
  async createAccount(data: Partial<Account>): Promise<Account> {
    logger.info('创建科目', { code: data.code, name: data.name });
    return this.post<Account>(API_PATHS.ACCOUNT_CREATE, data as unknown as Record<string, unknown>);
  }

  /**
   * 更新科目
   */
  async updateAccount(code: string, data: Partial<Account>): Promise<Account> {
    logger.info('更新科目', { code, name: data.name });
    return this.put<Account>(API_PATHS.ACCOUNT_UPDATE, { code, ...data } as unknown as Record<string, unknown>);
  }

  /**
   * 获取部门档案列表
   */
  async getDepartmentList(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
  }): Promise<CustomArchive[]> {
    logger.debug('获取部门档案列表', { params });
    return this.get<CustomArchive[]>(API_PATHS.DEPARTMENT_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取部门档案详情
   */
  async getDepartmentDetail(code: string): Promise<CustomArchive> {
    logger.debug('获取部门档案详情', { code });
    return this.get<CustomArchive>(API_PATHS.DEPARTMENT_DETAIL, { code });
  }

  /**
   * 创建部门档案
   */
  async createDepartment(data: Partial<CustomArchive>): Promise<CustomArchive> {
    logger.info('创建部门档案', { code: data.code, name: data.name });
    return this.post<CustomArchive>(API_PATHS.DEPARTMENT_CREATE, data as unknown as Record<string, unknown>);
  }

  /**
   * 获取供应商档案列表
   */
  async getSupplierList(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
  }): Promise<CustomArchive[]> {
    logger.debug('获取供应商档案列表', { params });
    return this.get<CustomArchive[]>(API_PATHS.SUPPLIER_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取客户档案列表
   */
  async getCustomerList(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
  }): Promise<CustomArchive[]> {
    logger.debug('获取客户档案列表', { params });
    return this.get<CustomArchive[]>(API_PATHS.CUSTOMER_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取项目档案列表
   */
  async getProjectList(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
  }): Promise<CustomArchive[]> {
    logger.debug('获取项目档案列表', { params });
    return this.get<CustomArchive[]>(API_PATHS.PROJECT_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取人员档案列表
   */
  async getPersonnelList(params?: {
    code?: string;
    name?: string;
    departmentCode?: string;
    enabled?: boolean;
  }): Promise<CustomArchive[]> {
    logger.debug('获取人员档案列表', { params });
    return this.get<CustomArchive[]>(API_PATHS.PERSONNEL_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取结算方式列表
   */
  async getSettlementList(): Promise<CustomArchive[]> {
    logger.debug('获取结算方式列表');
    return this.get<CustomArchive[]>(API_PATHS.SETTLEMENT_LIST);
  }

  /**
   * 获取币种列表
   */
  async getCurrencyList(): Promise<Currency[]> {
    logger.debug('获取币种列表');
    return this.get<Currency[]>(API_PATHS.CURRENCY_LIST);
  }

  /**
   * 获取凭证类型列表
   */
  async getVoucherTypeList(): Promise<VoucherType[]> {
    logger.debug('获取凭证类型列表');
    return this.get<VoucherType[]>('/yonbip/fi/vouchertype/list');
  }

  // ==================== 账簿管理API ====================

  /**
   * 获取账簿列表
   */
  async getAccountBookList(params?: {
    code?: string;
    name?: string;
    fiscalYear?: number;
    enabled?: boolean;
  }): Promise<AccountBook[]> {
    logger.debug('获取账簿列表', { params });
    return this.get<AccountBook[]>(API_PATHS.ACCOUNT_BOOK_LIST, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取账簿详情
   */
  async getAccountBookDetail(code: string): Promise<AccountBook> {
    logger.debug('获取账簿详情', { code });
    return this.get<AccountBook>(API_PATHS.ACCOUNT_BOOK_DETAIL, { code });
  }

  /**
   * 查询总账
   */
  async getGeneralLedger(params: {
    accountBookCode: string;
    accountCode?: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<unknown[]> {
    logger.debug('查询总账', { params });
    return this.get(API_PATHS.GENERAL_LEDGER, params as unknown as Record<string, unknown>);
  }

  /**
   * 查询明细账
   */
  async getDetailLedger(params: {
    accountBookCode: string;
    accountCode: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<unknown[]> {
    logger.debug('查询明细账', { params });
    return this.get(API_PATHS.DETAIL_LEDGER, params as unknown as Record<string, unknown>);
  }

  /**
   * 查询余额表
   */
  async getBalanceSheet(params: {
    accountBookCode: string;
    accountCode?: string;
    period: string;
  }): Promise<unknown[]> {
    logger.debug('查询余额表', { params });
    return this.get(API_PATHS.BALANCE_SHEET, params as unknown as Record<string, unknown>);
  }

  // ==================== 期末处理API ====================

  /**
   * 获取当前会计期间
   */
  async getCurrentPeriod(accountBookCode?: string): Promise<PeriodStatus> {
    logger.debug('获取当前会计期间', { accountBookCode });
    return this.get<PeriodStatus>(API_PATHS.CURRENT_PERIOD, { accountBookCode });
  }

  /**
   * 获取会计期间列表
   */
  async getPeriodList(fiscalYear?: number): Promise<PeriodStatus[]> {
    logger.debug('获取会计期间列表', { fiscalYear });
    return this.get<PeriodStatus[]>(API_PATHS.PERIOD_LIST, { fiscalYear });
  }

  /**
   * 期末结账
   */
  async closePeriod(data: {
    accountBookCode: string;
    fiscalYear: number;
    period: number;
    operator?: string;
  }): Promise<void> {
    logger.info('期末结账', data);
    await this.post(API_PATHS.PERIOD_CLOSE, data as unknown as Record<string, unknown>);
  }

  /**
   * 反结账
   */
  async reopenPeriod(data: {
    accountBookCode: string;
    fiscalYear: number;
    period: number;
    operator?: string;
    reason?: string;
  }): Promise<void> {
    logger.info('反结账', data);
    await this.post(API_PATHS.PERIOD_REOPEN, data as unknown as Record<string, unknown>);
  }

  /**
   * 期末结转
   */
  async carryoverPeriod(data: {
    accountBookCode: string;
    fiscalYear: number;
    period: number;
    carryoverType: 'income_expense' | 'profit' | 'custom';
    operator?: string;
  }): Promise<void> {
    logger.info('期末结转', data);
    await this.post(API_PATHS.PERIOD_CARRYOVER, data as unknown as Record<string, unknown>);
  }

  /**
   * 汇兑损益结转
   */
  async exchangeGainLoss(data: {
    accountBookCode: string;
    fiscalYear: number;
    period: number;
    currencyCode?: string;
    operator?: string;
  }): Promise<void> {
    logger.info('汇兑损益结转', data);
    await this.post(API_PATHS.EXCHANGE_GAIN_LOSS, data as unknown as Record<string, unknown>);
  }

  // ==================== 报表API ====================

  /**
   * 获取资产负债表
   */
  async getBalanceReport(params: {
    accountBookCode: string;
    period: string;
  }): Promise<unknown> {
    logger.debug('获取资产负债表', { params });
    return this.get(API_PATHS.BALANCE_REPORT, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取利润表
   */
  async getIncomeReport(params: {
    accountBookCode: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<unknown> {
    logger.debug('获取利润表', { params });
    return this.get(API_PATHS.INCOME_REPORT, params as unknown as Record<string, unknown>);
  }

  /**
   * 获取现金流量表
   */
  async getCashflowReport(params: {
    accountBookCode: string;
    fiscalYear: number;
  }): Promise<unknown> {
    logger.debug('获取现金流量表', { params });
    return this.get(API_PATHS.CASHFLOW_REPORT, params as unknown as Record<string, unknown>);
  }

  // ==================== 工具方法 ====================

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getCurrentPeriod();
      return true;
    } catch (error) {
      logger.error('健康检查失败', error);
      return false;
    }
  }

  /**
   * 获取API版本信息
   */
  async getApiVersion(): Promise<{ version: string; buildTime: string }> {
    return this.get('/yonbip/system/version');
  }
}

/**
 * API客户端实例
 */
export const yonyouClient = new YonyouClient();

// 导出类型
export * from './types';
export * from './errors';
export { BaseClient } from './base-client';

export default yonyouClient;
