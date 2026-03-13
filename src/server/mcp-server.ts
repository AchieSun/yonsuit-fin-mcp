/**
 * MCP服务器模块
 * @module server
 *
 * 提供MCP协议服务器实现，包括：
 * - 工具注册和调用
 * - 资源管理
 * - 提示词管理
 * - 服务器生命周期管理
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  InitializeRequestSchema,
  type Tool,
  type Resource,
  type Prompt,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils';
import { appConfig, validateConfig } from '../config';
import { MCPTool, MCPResource, MCPPrompt } from '../types';

/**
 * 服务器状态枚举
 */
export enum ServerState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 已初始化 */
  INITIALIZED = 'initialized',
  /** 运行中 */
  RUNNING = 'running',
  /** 已停止 */
  STOPPED = 'stopped',
}

/**
 * 服务器统计信息
 */
export interface ServerStats {
  /** 注册的工具数量 */
  toolCount: number;
  /** 注册的资源数量 */
  resourceCount: number;
  /** 注册的提示词数量 */
  promptCount: number;
  /** 服务器状态 */
  state: ServerState;
  /** 启动时间 */
  startTime?: Date;
  /** 运行时长（毫秒） */
  uptime?: number;
}

/**
 * MCP服务器
 * 实现MCP协议的服务器端，提供工具、资源和提示词管理
 */
export class MCPServer {
  /** MCP服务器实例 */
  private server: Server;
  /** 已注册的工具 */
  private tools: Map<string, MCPTool> = new Map();
  /** 已注册的资源 */
  private resources: Map<string, MCPResource> = new Map();
  /** 已注册的提示词 */
  private prompts: Map<string, MCPPrompt> = new Map();
  /** 服务器状态 */
  private state: ServerState = ServerState.UNINITIALIZED;
  /** 启动时间 */
  private startTime?: Date;
  /** 传输层实例 */
  private transport?: StdioServerTransport;

  constructor() {
    // 验证配置
    validateConfig();

    // 创建服务器实例
    this.server = new Server(
      {
        name: appConfig.mcp.name,
        version: appConfig.mcp.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.state = ServerState.INITIALIZED;

    logger.info('MCP服务器实例创建完成', {
      name: appConfig.mcp.name,
      version: appConfig.mcp.version,
    });
  }

  /**
   * 设置请求处理器
   */
  private setupHandlers(): void {
    // 初始化处理器
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      logger.info('收到初始化请求', {
        protocolVersion: request.params.protocolVersion,
        clientInfo: request.params.clientInfo,
      });

      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: appConfig.mcp.name,
          version: appConfig.mcp.version,
        },
      };
    });

    // 工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      logger.debug('返回工具列表', { count: tools.length });
      return { tools };
    });

    // 工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const tool = this.tools.get(name);

      if (!tool) {
        logger.warn('未知的工具调用', { toolName: name });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: {
                  code: 'UNKNOWN_TOOL',
                  message: `未知的工具: ${name}`,
                  availableTools: Array.from(this.tools.keys()),
                },
              }),
            },
          ],
          isError: true,
        };
      }

      try {
        logger.info('执行工具调用', {
          tool: name,
          args: this.sanitizeArgs(args),
        });

        const startTime = Date.now();
        const result = await tool.handler(args || {});
        const duration = Date.now() - startTime;

        logger.info('工具执行完成', {
          tool: name,
          success: result.success,
          duration: `${duration}ms`,
        });

        // 返回符合MCP SDK要求的格式
        return {
          content: result.content,
          isError: !result.success,
        };
      } catch (error) {
        const err = error as Error;
        logger.error('工具执行失败', {
          tool: name,
          error: err.message,
          stack: err.stack,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: false,
                error: {
                  code: 'TOOL_EXECUTION_ERROR',
                  message: err.message,
                  tool: name,
                },
              }),
            },
          ],
          isError: true,
        };
      }
    });

    // 资源列表处理器
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources: Resource[] = Array.from(this.resources.values()).map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      }));

      logger.debug('返回资源列表', { count: resources.length });
      return { resources };
    });

    // 资源读取处理器
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const resource = this.resources.get(uri);

      if (!resource) {
        logger.warn('未知的资源请求', { uri });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                error: '资源不存在',
                uri,
              }),
            },
          ],
        };
      }

      try {
        logger.debug('读取资源', { uri });

        // 如果资源有读取处理器，调用它
        if ('handler' in resource && typeof (resource as any).handler === 'function') {
          const content = await (resource as any).handler();
          return {
            contents: [
              {
                uri,
                mimeType: resource.mimeType || 'application/json',
                text: typeof content === 'string' ? content : JSON.stringify(content),
              },
            ],
          };
        }

        // 默认返回资源信息
        return {
          contents: [
            {
              uri,
              mimeType: resource.mimeType || 'application/json',
              text: JSON.stringify({
                name: resource.name,
                description: resource.description,
                uri: resource.uri,
              }),
            },
          ],
        };
      } catch (error) {
        logger.error('读取资源失败', { uri, error });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                error: '读取资源失败',
                message: (error as Error).message,
              }),
            },
          ],
        };
      }
    });

    // 提示词列表处理器
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts: Prompt[] = Array.from(this.prompts.values()).map((prompt) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
      }));

      logger.debug('返回提示词列表', { count: prompts.length });
      return { prompts };
    });

    // 提示词获取处理器
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const prompt = this.prompts.get(name);

      if (!prompt) {
        logger.warn('未知的提示词请求', { name });
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `提示词 "${name}" 不存在。可用的提示词: ${Array.from(this.prompts.keys()).join(', ')}`,
              },
            },
          ],
        };
      }

      try {
        logger.debug('获取提示词', { name, args });

        // 如果提示词有处理器，调用它
        if ('handler' in prompt && typeof (prompt as any).handler === 'function') {
          const messages = await (prompt as any).handler(args);
          return { messages };
        }

        // 默认返回提示词描述
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: prompt.description,
              },
            },
          ],
        };
      } catch (error) {
        logger.error('获取提示词失败', { name, error });
        return {
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: `获取提示词失败: ${(error as Error).message}`,
              },
            },
          ],
        };
      }
    });

    logger.debug('MCP服务器处理器设置完成');
  }

  /**
   * 注册工具
   * @param tool 工具定义
   */
  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) {
      logger.warn('工具已存在，将被覆盖', { toolName: tool.name });
    }

    this.tools.set(tool.name, tool);
    logger.info('注册工具成功', {
      toolName: tool.name,
      totalTools: this.tools.size,
    });
  }

  /**
   * 批量注册工具
   * @param tools 工具列表
   */
  registerTools(tools: MCPTool[]): void {
    tools.forEach((tool) => this.registerTool(tool));
    logger.info('批量注册工具完成', {
      count: tools.length,
      totalTools: this.tools.size,
    });
  }

  /**
   * 注册资源
   * @param resource 资源定义
   */
  registerResource(resource: MCPResource): void {
    if (this.resources.has(resource.uri)) {
      logger.warn('资源已存在，将被覆盖', { uri: resource.uri });
    }

    this.resources.set(resource.uri, resource);
    logger.info('注册资源成功', {
      uri: resource.uri,
      totalResources: this.resources.size,
    });
  }

  /**
   * 批量注册资源
   * @param resources 资源列表
   */
  registerResources(resources: MCPResource[]): void {
    resources.forEach((resource) => this.registerResource(resource));
    logger.info('批量注册资源完成', {
      count: resources.length,
      totalResources: this.resources.size,
    });
  }

  /**
   * 注册提示词
   * @param prompt 提示词定义
   */
  registerPrompt(prompt: MCPPrompt): void {
    if (this.prompts.has(prompt.name)) {
      logger.warn('提示词已存在，将被覆盖', { promptName: prompt.name });
    }

    this.prompts.set(prompt.name, prompt);
    logger.info('注册提示词成功', {
      promptName: prompt.name,
      totalPrompts: this.prompts.size,
    });
  }

  /**
   * 批量注册提示词
   * @param prompts 提示词列表
   */
  registerPrompts(prompts: MCPPrompt[]): void {
    prompts.forEach((prompt) => this.registerPrompt(prompt));
    logger.info('批量注册提示词完成', {
      count: prompts.length,
      totalPrompts: this.prompts.size,
    });
  }

  /**
   * 获取已注册的工具列表
   */
  getRegisteredTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取已注册的资源列表
   */
  getRegisteredResources(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * 获取已注册的提示词列表
   */
  getRegisteredPrompts(): string[] {
    return Array.from(this.prompts.keys());
  }

  /**
   * 获取服务器统计信息
   */
  getStats(): ServerStats {
    const stats: ServerStats = {
      toolCount: this.tools.size,
      resourceCount: this.resources.size,
      promptCount: this.prompts.size,
      state: this.state,
      startTime: this.startTime,
    };

    if (this.startTime) {
      stats.uptime = Date.now() - this.startTime.getTime();
    }

    return stats;
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    if (this.state === ServerState.RUNNING) {
      logger.warn('服务器已在运行中');
      return;
    }

    try {
      logger.info('正在启动MCP服务器...', {
        tools: this.tools.size,
        resources: this.resources.size,
        prompts: this.prompts.size,
      });

      // 创建传输层
      this.transport = new StdioServerTransport();

      // 连接服务器
      await this.server.connect(this.transport);

      // 更新状态
      this.state = ServerState.RUNNING;
      this.startTime = new Date();

      logger.info('MCP服务器启动成功', {
        state: this.state,
        startTime: this.startTime.toISOString(),
      });
    } catch (error) {
      this.state = ServerState.STOPPED;
      logger.error('MCP服务器启动失败', { error });
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    if (this.state !== ServerState.RUNNING) {
      logger.warn('服务器未在运行中', { state: this.state });
      return;
    }

    try {
      logger.info('正在停止MCP服务器...');

      // 关闭服务器
      await this.server.close();

      // 清理传输层
      this.transport = undefined;

      // 更新状态
      this.state = ServerState.STOPPED;

      const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
      logger.info('MCP服务器已停止', {
        state: this.state,
        uptime: `${Math.floor(uptime / 1000)}秒`,
      });
    } catch (error) {
      logger.error('MCP服务器停止失败', { error });
      throw error;
    }
  }

  /**
   * 获取服务器状态
   */
  getState(): ServerState {
    return this.state;
  }

  /**
   * 检查服务器是否正在运行
   */
  isRunning(): boolean {
    return this.state === ServerState.RUNNING;
  }

  /**
   * 清理参数中的敏感信息（用于日志记录）
   */
  private sanitizeArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!args) return {};

    const sanitized = { ...args };
    const sensitiveKeys = ['password', 'secret', 'token', 'apiKey', 'appSecret'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '******';
      }
    }

    return sanitized;
  }
}

export default MCPServer;
