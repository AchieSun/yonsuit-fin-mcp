/**
 * MCP工具定义接口
 */
export interface MCPTool {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 输入参数Schema */
  inputSchema: MCPInputSchema;
  /** 处理函数 */
  handler: (params: Record<string, unknown>) => Promise<MCPToolResult>;
}

/**
 * MCP输入参数Schema
 * 兼容MCP SDK的Tool类型
 */
export interface MCPInputSchema {
  /** 参数类型 */
  type: 'object';
  /** 参数属性 */
  properties?: Record<string, MCPPropertySchema>;
  /** 必填参数 */
  required?: string[];
  /** 允许额外属性（兼容MCP SDK） */
  [key: string]: unknown;
}

/**
 * MCP属性Schema
 */
export interface MCPPropertySchema {
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 属性描述 */
  description: string;
  /** 枚举值 */
  enum?: string[];
  /** 默认值 */
  default?: unknown;
  /** 嵌套属性 */
  properties?: Record<string, MCPPropertySchema>;
  /** 数组项类型 */
  items?: MCPPropertySchema;
  /** 最小值（用于number类型） */
  minimum?: number;
  /** 最大值（用于number类型） */
  maximum?: number;
  /** 最小长度（用于string类型） */
  minLength?: number;
  /** 最大长度（用于string类型） */
  maxLength?: number;
  /** 正则表达式模式（用于string类型） */
  pattern?: string;
  /** 格式说明 */
  format?: string;
}

/**
 * MCP工具执行结果
 */
export interface MCPToolResult {
  /** 是否成功 */
  success: boolean;
  /** 结果内容 */
  content: MCPContent[];
  /** 错误信息 */
  error?: string;
}

/**
 * MCP内容接口
 */
export interface MCPContent {
  /** 内容类型 */
  type: 'text' | 'image' | 'resource';
  /** 文本内容 */
  text?: string;
  /** 图片数据 */
  data?: string;
  /** MIME类型 */
  mimeType?: string;
  /** 资源URI */
  uri?: string;
}

/**
 * MCP资源接口
 */
export interface MCPResource {
  /** 资源URI */
  uri: string;
  /** 资源名称 */
  name: string;
  /** 资源描述 */
  description?: string;
  /** MIME类型 */
  mimeType?: string;
}

/**
 * MCP提示词接口
 */
export interface MCPPrompt {
  /** 提示词名称 */
  name: string;
  /** 提示词描述 */
  description: string;
  /** 提示词参数 */
  arguments?: MCPPromptArgument[];
}

/**
 * MCP提示词参数
 */
export interface MCPPromptArgument {
  /** 参数名称 */
  name: string;
  /** 参数描述 */
  description: string;
  /** 是否必填 */
  required: boolean;
}
