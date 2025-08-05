/**
 * Stories 文件解析后的完整数据结构
 * 
 * 包含组件的元信息和所有导出的 Story 实例，
 * 是连接解析器和 Markdown 生成器的核心数据接口
 */
export interface StoriesData {
  /** 组件元信息，包含描述等基础信息 */
  meta: MetaData | null;
  /** 所有导出的 Story 集合，包括 API 文档和示例代码 */
  storyExports: Story[];
}

/**
 * 组件元数据定义
 * 
 * 从 Stories 文件的 meta 配置中提取的组件基础信息
 */
export interface MetaData {
  /** 组件描述文本，通常从 meta.component 的反引号内容中提取 */
  componentDescription?: string;
}

/**
 * 单个 Story 的数据结构
 * 
 * 表示 Stories 文件中的一个导出 Story，可以是 API 文档或演示示例
 */
export interface Story {
  /** Story 的导出名称（如：'Primary', 'Secondary', 'API'） */
  name: string;
  /** Story 类型：'api' 表示 API 文档，'demo' 表示演示示例 */
  type: 'api' | 'demo';
  /** Story 的显示名称，从 name 属性中提取 */
  displayName?: string;
  /** Story 的描述信息，从 story 属性中提取 */
  description?: string;
  /** 演示代码，从 render 函数中提取的 JSX 代码 */
  code?: string;
}