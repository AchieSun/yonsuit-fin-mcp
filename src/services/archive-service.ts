/**
 * 档案服务
 * @module services/archive-service
 *
 * 提供档案相关的业务逻辑封装，包括：
 * - 账簿查询：POST /yonbip/fi/fipub/basedoc/querybd/accbook
 * - 科目查询：POST /yonbip/fi/fipub/basedoc/querybd
 * - 凭证类型查询：POST /yonbip/AMP/yonbip-fi-epub/vouchertype/bill/list
 * - 自定义档案查询：POST /yonbip/digitalModel/customerdoc/batchQueryDetail
 * - 币种查询：POST /yonbip/digitalModel/currencytenant/batchQueryDetail
 */

import { logger } from '../utils';
import { yonyouClient } from '../client';
import { API_PATHS } from '../config/constants';
import type {
  Account,
  Currency,
  VoucherType,
  AccountBook,
  CustomArchive,
} from '../types/yonyou.types';

// ==================== 查询参数类型 ====================

/**
 * 账簿查询请求参数
 */
export interface AccountBookQueryParams {
  /** 账簿编码 */
  code?: string;
  /** 账簿名称 */
  name?: string;
  /** 会计年度 */
  fiscalYear?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 页码 */
  pageNum?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 科目查询请求参数
 */
export interface AccountQueryParams {
  /** 科目编码 */
  code?: string;
  /** 科目名称 */
  name?: string;
  /** 科目类别 */
  category?: string;
  /** 科目类型 */
  type?: string;
  /** 上级科目编码 */
  parentCode?: string;
  /** 是否末级 */
  isLeaf?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 是否返回树形结构 */
  tree?: boolean;
  /** 页码 */
  pageNum?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 凭证类型查询请求参数
 */
export interface VoucherTypeQueryParams {
  /** 凭证类型编码 */
  code?: string;
  /** 凭证类型名称 */
  name?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 页码 */
  pageNum?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 自定义档案查询请求参数
 */
export interface CustomArchiveQueryParams {
  /** 档案类型编码 */
  docTypeCode?: string;
  /** 档案编码 */
  code?: string;
  /** 档案名称 */
  name?: string;
  /** 是否启用 */
  enabled?: boolean;
  /** 编码列表（批量查询） */
  codes?: string[];
  /** 页码 */
  pageNum?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 币种查询请求参数
 */
export interface CurrencyQueryParams {
  /** 币种编码 */
  code?: string;
  /** 币种名称 */
  name?: string;
  /** 是否本位币 */
  isBase?: boolean;
  /** 是否启用 */
  enabled?: boolean;
  /** 编码列表（批量查询） */
  codes?: string[];
  /** 页码 */
  pageNum?: number;
  /** 每页数量 */
  pageSize?: number;
}

// ==================== 档案类型常量 ====================

/**
 * 档案类型编码
 */
export const ARCHIVE_TYPES = {
  /** 科目档案 */
  ACCOUNT: 'bd_account',
  /** 部门档案 */
  DEPARTMENT: 'bd_deptdoc',
  /** 供应商档案 */
  SUPPLIER: 'bd_supplier',
  /** 客户档案 */
  CUSTOMER: 'bd_customer',
  /** 项目档案 */
  PROJECT: 'bd_project',
  /** 人员档案 */
  PERSONNEL: 'bd_psndoc',
  /** 结算方式档案 */
  SETTLEMENT: 'bd_settlestyle',
  /** 存货档案 */
  INVENTORY: 'bd_inventory',
  /** 仓库档案 */
  WAREHOUSE: 'bd_warehouse',
} as const;

// ==================== 档案服务类 ====================

/**
 * 档案服务类
 * 提供档案相关的业务逻辑封装
 */
export class ArchiveService {
  // ==================== 账簿档案 ====================

  /**
   * 查询账簿列表
   * @param params 查询参数
   * @returns 账簿列表
   */
  async queryAccountBooks(params?: AccountBookQueryParams): Promise<AccountBook[]> {
    logger.info('查询账簿列表', { params });

    try {
      const result = await yonyouClient.post<AccountBook[]>(
        API_PATHS.ACCOUNT_BOOK_QUERY,
        (params || {}) as Record<string, unknown>
      );

      logger.info('账簿列表查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('账簿列表查询失败', error);
      throw error;
    }
  }

  /**
   * 获取账簿详情
   * @param code 账簿编码
   * @returns 账簿详情
   */
  async getAccountBookDetail(code: string): Promise<AccountBook> {
    logger.info('获取账簿详情', { code });

    try {
      const result = await yonyouClient.post<AccountBook[]>(
        API_PATHS.ACCOUNT_BOOK_QUERY,
        { code } as Record<string, unknown>
      );

      if (!result || result.length === 0) {
        throw new Error(`账簿不存在: ${code}`);
      }

      logger.info('账簿详情查询成功', { code, name: result[0].name });
      return result[0];
    } catch (error) {
      logger.error('账簿详情查询失败', error);
      throw error;
    }
  }

  // ==================== 科目档案 ====================

  /**
   * 查询科目列表
   * @param params 查询参数
   * @returns 科目列表
   */
  async queryAccounts(params?: AccountQueryParams): Promise<Account[]> {
    logger.info('查询科目列表', { params });

    try {
      const result = await yonyouClient.post<Account[]>(
        API_PATHS.ACCOUNT_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.ACCOUNT,
        } as Record<string, unknown>
      );

      logger.info('科目列表查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('科目列表查询失败', error);
      throw error;
    }
  }

  /**
   * 获取科目详情
   * @param code 科目编码
   * @returns 科目详情
   */
  async getAccountDetail(code: string): Promise<Account> {
    logger.info('获取科目详情', { code });

    try {
      const result = await yonyouClient.post<Account[]>(
        API_PATHS.ACCOUNT_QUERY,
        {
          code,
          docType: ARCHIVE_TYPES.ACCOUNT,
        } as Record<string, unknown>
      );

      if (!result || result.length === 0) {
        throw new Error(`科目不存在: ${code}`);
      }

      logger.info('科目详情查询成功', { code, name: result[0].name });
      return result[0];
    } catch (error) {
      logger.error('科目详情查询失败', error);
      throw error;
    }
  }

  /**
   * 获取科目树
   * @param params 查询参数
   * @returns 科目树
   */
  async getAccountTree(params?: AccountQueryParams): Promise<Account[]> {
    logger.info('获取科目树', { params });

    try {
      const result = await yonyouClient.post<Account[]>(
        API_PATHS.ACCOUNT_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.ACCOUNT,
          tree: true,
        } as Record<string, unknown>
      );

      logger.info('科目树查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('科目树查询失败', error);
      throw error;
    }
  }

  /**
   * 获取子科目列表
   * @param parentCode 上级科目编码
   * @returns 子科目列表
   */
  async getChildAccounts(parentCode: string): Promise<Account[]> {
    logger.info('获取子科目列表', { parentCode });

    try {
      const result = await yonyouClient.post<Account[]>(
        API_PATHS.ACCOUNT_QUERY,
        {
          parentCode,
          docType: ARCHIVE_TYPES.ACCOUNT,
        } as Record<string, unknown>
      );

      logger.info('子科目列表查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('子科目列表查询失败', error);
      throw error;
    }
  }

  // ==================== 凭证类型档案 ====================

  /**
   * 查询凭证类型列表
   * @param params 查询参数
   * @returns 凭证类型列表
   */
  async queryVoucherTypes(params?: VoucherTypeQueryParams): Promise<VoucherType[]> {
    logger.info('查询凭证类型列表', { params });

    try {
      const result = await yonyouClient.post<VoucherType[]>(
        API_PATHS.VOUCHER_TYPE_LIST,
        (params || {}) as Record<string, unknown>
      );

      logger.info('凭证类型列表查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('凭证类型列表查询失败', error);
      throw error;
    }
  }

  /**
   * 获取凭证类型详情
   * @param code 凭证类型编码
   * @returns 凭证类型详情
   */
  async getVoucherTypeDetail(code: string): Promise<VoucherType> {
    logger.info('获取凭证类型详情', { code });

    try {
      const result = await yonyouClient.post<VoucherType[]>(
        API_PATHS.VOUCHER_TYPE_LIST,
        { code } as Record<string, unknown>
      );

      if (!result || result.length === 0) {
        throw new Error(`凭证类型不存在: ${code}`);
      }

      logger.info('凭证类型详情查询成功', { code, name: result[0].name });
      return result[0];
    } catch (error) {
      logger.error('凭证类型详情查询失败', error);
      throw error;
    }
  }

  // ==================== 自定义档案 ====================

  /**
   * 查询自定义档案
   * @param params 查询参数
   * @returns 自定义档案列表
   */
  async queryCustomArchives(params?: CustomArchiveQueryParams): Promise<CustomArchive[]> {
    logger.info('查询自定义档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        (params || {}) as Record<string, unknown>
      );

      logger.info('自定义档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('自定义档案查询失败', error);
      throw error;
    }
  }

  /**
   * 查询部门档案
   * @param params 查询参数
   * @returns 部门档案列表
   */
  async queryDepartments(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
    codes?: string[];
  }): Promise<CustomArchive[]> {
    logger.info('查询部门档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.DEPARTMENT,
        } as Record<string, unknown>
      );

      logger.info('部门档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('部门档案查询失败', error);
      throw error;
    }
  }

  /**
   * 查询供应商档案
   * @param params 查询参数
   * @returns 供应商档案列表
   */
  async querySuppliers(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
    codes?: string[];
  }): Promise<CustomArchive[]> {
    logger.info('查询供应商档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.SUPPLIER,
        } as Record<string, unknown>
      );

      logger.info('供应商档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('供应商档案查询失败', error);
      throw error;
    }
  }

  /**
   * 查询客户档案
   * @param params 查询参数
   * @returns 客户档案列表
   */
  async queryCustomers(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
    codes?: string[];
  }): Promise<CustomArchive[]> {
    logger.info('查询客户档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.CUSTOMER,
        } as Record<string, unknown>
      );

      logger.info('客户档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('客户档案查询失败', error);
      throw error;
    }
  }

  /**
   * 查询项目档案
   * @param params 查询参数
   * @returns 项目档案列表
   */
  async queryProjects(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
    codes?: string[];
  }): Promise<CustomArchive[]> {
    logger.info('查询项目档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.PROJECT,
        } as Record<string, unknown>
      );

      logger.info('项目档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('项目档案查询失败', error);
      throw error;
    }
  }

  /**
   * 查询人员档案
   * @param params 查询参数
   * @returns 人员档案列表
   */
  async queryPersonnel(params?: {
    code?: string;
    name?: string;
    departmentCode?: string;
    enabled?: boolean;
    codes?: string[];
  }): Promise<CustomArchive[]> {
    logger.info('查询人员档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.PERSONNEL,
        } as Record<string, unknown>
      );

      logger.info('人员档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('人员档案查询失败', error);
      throw error;
    }
  }

  /**
   * 查询结算方式档案
   * @param params 查询参数
   * @returns 结算方式档案列表
   */
  async querySettlementMethods(params?: {
    code?: string;
    name?: string;
    enabled?: boolean;
  }): Promise<CustomArchive[]> {
    logger.info('查询结算方式档案', { params });

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          ...params,
          docType: ARCHIVE_TYPES.SETTLEMENT,
        } as Record<string, unknown>
      );

      logger.info('结算方式档案查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('结算方式档案查询失败', error);
      throw error;
    }
  }

  // ==================== 币种档案 ====================

  /**
   * 查询币种列表
   * @param params 查询参数
   * @returns 币种列表
   */
  async queryCurrencies(params?: CurrencyQueryParams): Promise<Currency[]> {
    logger.info('查询币种列表', { params });

    try {
      const result = await yonyouClient.post<Currency[]>(
        API_PATHS.CURRENCY_QUERY,
        (params || {}) as Record<string, unknown>
      );

      logger.info('币种列表查询成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('币种列表查询失败', error);
      throw error;
    }
  }

  /**
   * 获取币种详情
   * @param code 币种编码
   * @returns 币种详情
   */
  async getCurrencyDetail(code: string): Promise<Currency> {
    logger.info('获取币种详情', { code });

    try {
      const result = await yonyouClient.post<Currency[]>(
        API_PATHS.CURRENCY_QUERY,
        { code } as Record<string, unknown>
      );

      if (!result || result.length === 0) {
        throw new Error(`币种不存在: ${code}`);
      }

      logger.info('币种详情查询成功', { code, name: result[0].name });
      return result[0];
    } catch (error) {
      logger.error('币种详情查询失败', error);
      throw error;
    }
  }

  /**
   * 获取本位币
   * @returns 本位币信息
   */
  async getBaseCurrency(): Promise<Currency> {
    logger.info('获取本位币');

    try {
      const result = await yonyouClient.post<Currency[]>(
        API_PATHS.CURRENCY_QUERY,
        { isBase: true } as Record<string, unknown>
      );

      if (!result || result.length === 0) {
        throw new Error('未找到本位币设置');
      }

      logger.info('本位币查询成功', { code: result[0].code, name: result[0].name });
      return result[0];
    } catch (error) {
      logger.error('本位币查询失败', error);
      throw error;
    }
  }

  // ==================== 批量查询 ====================

  /**
   * 批量查询档案
   * @param docType 档案类型
   * @param codes 编码列表
   * @returns 档案列表
   */
  async batchQueryArchives(docType: string, codes: string[]): Promise<CustomArchive[]> {
    logger.info('批量查询档案', { docType, count: codes.length });

    if (!codes || codes.length === 0) {
      return [];
    }

    try {
      const result = await yonyouClient.post<CustomArchive[]>(
        API_PATHS.CUSTOM_ARCHIVE_QUERY,
        {
          docType,
          codes,
        } as Record<string, unknown>
      );

      logger.info('批量查询档案成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('批量查询档案失败', error);
      throw error;
    }
  }

  /**
   * 批量查询科目
   * @param codes 科目编码列表
   * @returns 科目列表
   */
  async batchQueryAccounts(codes: string[]): Promise<Account[]> {
    logger.info('批量查询科目', { count: codes.length });

    if (!codes || codes.length === 0) {
      return [];
    }

    try {
      const result = await yonyouClient.post<Account[]>(
        API_PATHS.ACCOUNT_QUERY,
        {
          codes,
          docType: ARCHIVE_TYPES.ACCOUNT,
        } as Record<string, unknown>
      );

      logger.info('批量查询科目成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('批量查询科目失败', error);
      throw error;
    }
  }

  /**
   * 批量查询币种
   * @param codes 币种编码列表
   * @returns 币种列表
   */
  async batchQueryCurrencies(codes: string[]): Promise<Currency[]> {
    logger.info('批量查询币种', { count: codes.length });

    if (!codes || codes.length === 0) {
      return [];
    }

    try {
      const result = await yonyouClient.post<Currency[]>(
        API_PATHS.CURRENCY_QUERY,
        { codes } as Record<string, unknown>
      );

      logger.info('批量查询币种成功', { count: result.length });
      return result;
    } catch (error) {
      logger.error('批量查询币种失败', error);
      throw error;
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 根据档案类型查询档案
   * @param archiveType 档案类型
   * @param params 查询参数
   * @returns 档案列表
   */
  async queryByType(
    archiveType: keyof typeof ARCHIVE_TYPES,
    params?: CustomArchiveQueryParams
  ): Promise<CustomArchive[]> {
    const docType = ARCHIVE_TYPES[archiveType];
    return this.queryCustomArchives({ ...params, docTypeCode: docType });
  }

  /**
   * 检查档案是否存在
   * @param docType 档案类型
   * @param code 档案编码
   * @returns 是否存在
   */
  async exists(docType: string, code: string): Promise<boolean> {
    try {
      const result = await this.queryCustomArchives({ docTypeCode: docType, code });
      return result && result.length > 0;
    } catch (error) {
      logger.error('检查档案存在失败', error);
      return false;
    }
  }

  /**
   * 获取档案名称映射
   * @param docType 档案类型
   * @param codes 编码列表
   * @returns 编码-名称映射
   */
  async getNameMap(docType: string, codes: string[]): Promise<Map<string, string>> {
    const archives = await this.batchQueryArchives(docType, codes);
    const map = new Map<string, string>();
    archives.forEach((archive) => {
      map.set(archive.code, archive.name);
    });
    return map;
  }
}

/**
 * 档案服务实例
 */
export const archiveService = new ArchiveService();

export default archiveService;
