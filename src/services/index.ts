/**
 * 服务模块
 * @module services
 *
 * 提供用友API的业务服务封装，包括：
 * - 凭证服务：凭证的增删改查、审核、记账等操作
 * - 档案服务：账簿、科目、凭证类型、自定义档案、币种等查询
 * - 数据中心服务：网关地址获取、域名缓存管理
 */

// 导出凭证服务
export { VoucherService, voucherService } from './voucher-service';

// 导出档案服务
export { ArchiveService, archiveService } from './archive-service';

// 导出数据中心服务
export { DataCenterService, dataCenterService } from './datacenter-service';
export type { DataCenterCache, DataCenterApiResponse, DataCenterConfig } from './datacenter-service';

// 导出类型
export type {
  AccountBookQueryParams,
  AccountQueryParams,
  VoucherTypeQueryParams,
  CustomArchiveQueryParams,
  CurrencyQueryParams,
} from './archive-service';
