/**
 * 错误处理工具模块
 * @module utils/error-handler
 */

import { MCPToolResult, MCPContent } from '../types';
import { logger } from './logger';

/**
 * 统一错误处理函数
 * @param operation 操作名称
 * @param error 错误对象
 * @returns MCP工具结果
 */
export function handleToolError(operation: string, error: unknown): MCPToolResult {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  logger.error(`${operation}失败`, error);

  const content: MCPContent[] = [
    {
      type: 'text',
      text: JSON.stringify({
        success: false,
        message: `${operation}失败`,
        error: errorMessage,
      }),
    },
  ];

  return {
    success: false,
    content,
    error: errorMessage,
  };
}

/**
 * 统一成功响应函数
 * @param operation 操作名称
 * @param data 响应数据
 * @returns MCP工具结果
 */
export function handleToolSuccess<T>(operation: string, data: T): MCPToolResult {
  logger.info(`${operation}成功`);

  const content: MCPContent[] = [
    {
      type: 'text',
      text: JSON.stringify(
        {
          success: true,
          message: `${operation}成功`,
          data,
        },
        null,
        2
      ),
    },
  ];

  return {
    success: true,
    content,
  };
}
