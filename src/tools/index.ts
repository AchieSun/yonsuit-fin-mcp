/**
 * 工具模块
 * @module tools
 *
 * 提供MCP工具实现，包括：
 * - 凭证工具
 * - 科目工具
 * - 凭证类型工具
 * - 账簿工具
 * - 自定义档案工具
 * - 币种工具
 */

// 凭证工具
export { VoucherTools } from './voucher';

// 科目工具
export { AccountTools, getAccountTools } from './subject';
export {
  createAccountQueryTool,
  createAccountDetailTool,
  createAccountCreateTool,
  createAccountUpdateTool,
  createAccountTreeTool,
} from './subject';

// 凭证类型工具
export { VoucherTypeTools, getVoucherTypeTools } from './vouchertype';
export {
  createVoucherTypeQueryTool,
  createVoucherTypeDetailTool,
  createVoucherTypeCreateTool,
  createVoucherTypeUpdateTool,
  createDefaultVoucherTypeTool,
} from './vouchertype';

// 账簿工具
export { AccountBookTools, getAccountBookTools } from './account';
export {
  createAccountBookQueryTool,
  createAccountBookDetailTool,
  createGeneralLedgerTool,
  createDetailLedgerTool,
  createBalanceSheetTool,
} from './account';

// 自定义档案工具
export { CustomArchiveTools, getCustomArchiveTools } from './custom-doc';
export {
  createCustomArchiveQueryTool,
  createCustomArchiveDetailTool,
  createDepartmentQueryTool,
  createSupplierQueryTool,
  createCustomerQueryTool,
  createProjectQueryTool,
  createPersonnelQueryTool,
  createSettlementMethodQueryTool,
} from './custom-doc';

// 币种工具
export { CurrencyTools, getCurrencyTools } from './currency';
export {
  createCurrencyQueryTool,
  createCurrencyDetailTool,
  createBaseCurrencyTool,
  createCurrencyCreateTool,
  createCurrencyUpdateTool,
  createExchangeRateQueryTool,
  createCurrencyBatchQueryTool,
} from './currency';

import type { MCPTool } from '../types';
import type { BaseClient } from '../client';
import { getAccountTools } from './subject';
import { getVoucherTypeTools } from './vouchertype';
import { getAccountBookTools } from './account';
import { getCustomArchiveTools } from './custom-doc';
import { getCurrencyTools } from './currency';
import { VoucherTools } from './voucher';
import { VoucherService } from '../services/voucher-service';

/**
 * 获取所有档案相关工具
 * @param client API客户端
 * @returns 工具列表
 */
export function getAllArchiveTools(client: BaseClient): MCPTool[] {
  return [
    ...getAccountTools(client),
    ...getVoucherTypeTools(client),
    ...getAccountBookTools(client),
    ...getCustomArchiveTools(client),
    ...getCurrencyTools(client),
  ];
}

/**
 * 获取所有凭证相关工具
 * @param voucherService 凭证服务实例
 * @returns 工具列表
 */
export function getVoucherTools(voucherService: VoucherService): MCPTool[] {
  const voucherTools = new VoucherTools(voucherService);
  return voucherTools.getTools();
}

/**
 * 获取所有MCP工具（凭证工具 + 档案工具）
 * @param client API客户端
 * @param voucherService 凭证服务实例
 * @returns 工具列表
 */
export function getAllTools(client: BaseClient, voucherService: VoucherService): MCPTool[] {
  return [
    ...getVoucherTools(voucherService),
    ...getAllArchiveTools(client),
  ];
}
