/**
 * 用友做账MCP服务器 - 主入口
 * @module yonyou-mcp
 *
 * 提供基于MCP协议的用友财务系统对接服务，包括：
 * - 凭证管理：创建、查询、更新、删除凭证
 * - 档案管理：科目、凭证类型、账簿、自定义档案、币种等
 * - 账簿查询：总账、明细账、余额表等
 */

import { config } from 'dotenv';
import { MCPServer, ServerState } from './server';
import { voucherService } from './services';
import { yonyouClient } from './client';
import {
  VoucherTools,
  getAllArchiveTools,
} from './tools';
import { logger } from './utils/logger';
import { appConfig, validateConfig, printConfig } from './config';

// 加载环境变量（最早执行）
config();

/**
 * 应用启动时间
 */
const APP_START_TIME = Date.now();

/**
 * 优雅关闭超时时间（毫秒）
 */
const SHUTDOWN_TIMEOUT = 10000;

/**
 * 健康检查超时时间（毫秒）
 */
const HEALTH_CHECK_TIMEOUT = 5000;

/**
 * 全局MCP服务器实例
 */
let mcpServer: MCPServer | null = null;

/**
 * 是否正在关闭
 */
let isShuttingDown = false;

/**
 * 关闭超时定时器
 */
let shutdownTimer: NodeJS.Timeout | null = null;

/**
 * 错误类型枚举
 */
enum ErrorType {
  CONFIG = 'CONFIG_ERROR',
  NETWORK = 'NETWORK_ERROR',
  RUNTIME = 'RUNTIME_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

/**
 * 应用错误类
 */
class ApplicationError extends Error {
  public readonly originalError?: Error;
  
  constructor(
    public readonly type: ErrorType,
    message: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.originalError = originalError;
  }
}

/**
 * 带超时的健康检查
 * @param timeout 超时时间（毫秒）
 * @returns 健康检查结果
 */
async function healthCheckWithTimeout(timeout: number): Promise<boolean> {
  return Promise.race([
    yonyouClient.healthCheck(),
    new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error('健康检查超时')), timeout)
    ),
  ]);
}

/**
 * 注册所有MCP工具
 * @param server MCP服务器实例
 */
function registerAllTools(server: MCPServer): void {
  logger.info('开始注册MCP工具...');

  // 1. 注册凭证工具
  const voucherTools = new VoucherTools(voucherService);
  const voucherToolList = voucherTools.getTools();
  server.registerTools(voucherToolList);

  logger.info('凭证工具注册完成', {
    count: voucherToolList.length,
    tools: voucherToolList.map(t => t.name),
  });

  // 2. 注册档案工具（科目、凭证类型、账簿、自定义档案、币种）
  const archiveTools = getAllArchiveTools(yonyouClient);
  server.registerTools(archiveTools);

  logger.info('档案工具注册完成', {
    count: archiveTools.length,
    tools: archiveTools.map(t => t.name),
  });

  // 统计信息
  const stats = server.getStats();
  logger.info('所有工具注册完成', {
    totalTools: stats.toolCount,
    voucherTools: voucherToolList.length,
    archiveTools: archiveTools.length,
  });
}

/**
 * 注册MCP资源
 * @param server MCP服务器实例
 */
function registerResources(server: MCPServer): void {
  // 注册用友API信息资源
  server.registerResource({
    uri: 'yonyou://api/info',
    name: '用友API信息',
    description: '用友财务系统API的基本信息',
    mimeType: 'application/json',
  });

  // 注册当前会计期间资源
  server.registerResource({
    uri: 'yonyou://period/current',
    name: '当前会计期间',
    description: '获取当前会计期间信息',
    mimeType: 'application/json',
  });

  // 注册本位币资源
  server.registerResource({
    uri: 'yonyou://currency/base',
    name: '本位币信息',
    description: '获取系统本位币设置',
    mimeType: 'application/json',
  });

  logger.info('资源注册完成', {
    count: server.getStats().resourceCount,
  });
}

/**
 * 注册MCP提示词
 * @param server MCP服务器实例
 */
function registerPrompts(server: MCPServer): void {
  // 注册凭证创建提示词
  server.registerPrompt({
    name: 'create_voucher',
    description: '创建记账凭证的提示词模板',
    arguments: [
      {
        name: 'voucherType',
        description: '凭证类型（如：记-1、收-1、付-1）',
        required: true,
      },
      {
        name: 'date',
        description: '凭证日期（格式：YYYY-MM-DD）',
        required: true,
      },
    ],
  });

  // 注册凭证查询提示词
  server.registerPrompt({
    name: 'query_voucher',
    description: '查询凭证的提示词模板',
    arguments: [
      {
        name: 'period',
        description: '会计期间（格式：YYYY-MM）',
        required: false,
      },
    ],
  });

  // 注册科目查询提示词
  server.registerPrompt({
    name: 'query_account',
    description: '查询会计科目的提示词模板',
    arguments: [
      {
        name: 'keyword',
        description: '科目关键字（编码或名称）',
        required: false,
      },
    ],
  });

  logger.info('提示词注册完成', {
    count: server.getStats().promptCount,
  });
}

/**
 * 强制退出进程
 */
function forceExit(): void {
  logger.warn('强制退出进程');
  process.exit(1);
}

/**
 * 优雅关闭服务器
 * @param signal 关闭信号
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    logger.warn('正在关闭中，请勿重复操作');
    return;
  }

  isShuttingDown = true;
  const shutdownStart = Date.now();
  logger.info(`收到${signal}信号，开始优雅关闭...`);

  // 设置强制退出定时器
  shutdownTimer = setTimeout(() => {
    logger.error(`优雅关闭超时（${SHUTDOWN_TIMEOUT}ms），强制退出`);
    forceExit();
  }, SHUTDOWN_TIMEOUT);

  try {
    if (mcpServer && mcpServer.isRunning()) {
      // 停止服务器
      await mcpServer.stop();
      logger.info('MCP服务器已停止');
    }

    // 清理定时器
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
      shutdownTimer = null;
    }

    const shutdownDuration = Date.now() - shutdownStart;
    logger.info(`服务器关闭完成，耗时 ${shutdownDuration}ms`);
    
    // 计算总运行时间
    const totalUptime = Date.now() - APP_START_TIME;
    logger.info(`总运行时间: ${Math.floor(totalUptime / 1000)}秒`);
    
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    logger.error('优雅关闭失败', {
      error: err.message,
      stack: err.stack,
    });
    
    // 清理定时器
    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
      shutdownTimer = null;
    }
    
    forceExit();
  }
}

/**
 * 设置进程信号处理
 */
function setupSignalHandlers(): void {
  // SIGINT (Ctrl+C)
  process.on('SIGINT', async () => {
    await gracefulShutdown('SIGINT');
  });

  // SIGTERM (kill命令)
  process.on('SIGTERM', async () => {
    await gracefulShutdown('SIGTERM');
  });

  // SIGBREAK (Windows下的Ctrl+Break)
  process.on('SIGBREAK', async () => {
    await gracefulShutdown('SIGBREAK');
  });

  // 未捕获的异常
  process.on('uncaughtException', (error: Error) => {
    logger.error('未捕获的异常', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // 对于未捕获的异常，记录后尝试优雅关闭
    gracefulShutdown('uncaughtException').catch(() => {
      forceExit();
    });
  });

  // 未处理的Promise拒绝
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    const reasonStr = reason instanceof Error 
      ? `${reason.message}\n${reason.stack}` 
      : String(reason);
    
    logger.error('未处理的Promise拒绝', {
      reason: reasonStr,
      promise: String(promise),
    });
    
    // 在Node.js 15+版本，未处理的Promise拒绝会导致进程退出
    // 这里我们选择记录错误但继续运行，除非是致命错误
    if (reason instanceof ApplicationError) {
      gracefulShutdown('unhandledRejection').catch(() => {
        forceExit();
      });
    }
  });

  // 警告处理
  process.on('warning', (warning) => {
    logger.warn('进程警告', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  // 内存使用警告
  process.on('maxListenersExceeded', (eventName: string, emitter: unknown) => {
    logger.warn('事件监听器数量超出警告', {
      eventName,
      emitter: String(emitter),
    });
  });

  logger.debug('进程信号处理器设置完成');
}

/**
 * 验证配置并打印配置信息
 */
function validateAndPrintConfig(): void {
  try {
    logger.info('验证配置...');
    validateConfig();
    logger.info('配置验证通过');
    
    // 打印配置信息（隐藏敏感信息）
    if (appConfig.env !== 'production') {
      printConfig();
    }
  } catch (error) {
    const err = error as Error;
    throw new ApplicationError(
      ErrorType.CONFIG,
      `配置验证失败: ${err.message}`,
      err
    );
  }
}

/**
 * 执行启动前健康检查
 */
async function performHealthCheck(): Promise<void> {
  logger.info('执行启动前健康检查...');
  
  try {
    const isHealthy = await healthCheckWithTimeout(HEALTH_CHECK_TIMEOUT);
    
    if (isHealthy) {
      logger.info('用友API连接正常');
    } else {
      logger.warn('用友API连接异常，但服务将继续启动');
    }
  } catch (error) {
    const err = error as Error;
    logger.warn('用友API健康检查失败', {
      error: err.message,
      note: '服务将继续启动，但部分功能可能受限',
    });
  }
}

/**
 * 主函数 - 启动MCP服务器
 */
async function main(): Promise<void> {
  try {
    logger.info('========================================');
    logger.info('用友做账MCP服务器启动中...');
    logger.info('========================================');
    logger.info('应用信息', {
      name: appConfig.name,
      version: appConfig.version,
      env: appConfig.env,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    });

    // 1. 验证配置（最早执行）
    validateAndPrintConfig();

    // 2. 设置进程信号处理
    setupSignalHandlers();

    // 3. 执行启动前健康检查（可选，不阻塞启动）
    await performHealthCheck();

    // 4. 创建MCP服务器实例
    mcpServer = new MCPServer();
    logger.info('MCP服务器实例创建成功');

    // 5. 注册所有工具
    registerAllTools(mcpServer);

    // 6. 注册资源
    registerResources(mcpServer);

    // 7. 注册提示词
    registerPrompts(mcpServer);

    // 8. 打印服务器统计信息
    const stats = mcpServer.getStats();
    logger.info('服务器初始化完成', {
      tools: stats.toolCount,
      resources: stats.resourceCount,
      prompts: stats.promptCount,
      state: stats.state,
    });

    // 9. 启动服务器
    await mcpServer.start();

    // 10. 计算启动耗时
    const startupDuration = Date.now() - APP_START_TIME;
    
    logger.info('========================================');
    logger.info('用友做账MCP服务器启动成功！');
    logger.info('========================================');
    logger.info(`启动耗时: ${startupDuration}ms`);
    logger.info('服务器已就绪，等待客户端连接...');
    logger.info('已注册工具列表:', {
      count: stats.toolCount,
      tools: mcpServer.getRegisteredTools(),
    });
    
    // 11. 打印内存使用情况
    const memUsage = process.memoryUsage();
    logger.info('内存使用情况', {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    });

  } catch (error) {
    const err = error as Error;
    
    // 根据错误类型进行不同处理
    if (err instanceof ApplicationError) {
      logger.error('应用启动失败', {
        type: err.type,
        message: err.message,
        originalError: err.originalError?.message,
        stack: err.stack,
      });
    } else {
      logger.error('启动MCP服务器失败', {
        error: err.message,
        stack: err.stack,
        name: err.name,
      });
    }
    
    // 退出进程
    process.exit(1);
  }
}

// 启动应用
main();

// 导出模块（用于测试和外部使用）
export { 
  MCPServer, 
  ServerState, 
  registerAllTools,
  registerResources,
  registerPrompts,
  gracefulShutdown,
  ApplicationError,
  ErrorType,
};

// 导出类型
export type { ServerStats } from './server';
