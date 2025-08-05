import { StoriesData, MetaData, Story } from '../types';

// ====================================
// Markdown生成器：将解析的数据转换为markdown格式
// ====================================

/**
 * 生成完整的 Markdown 文档内容
 * 
 * 该函数是 Markdown 生成系统的主控制器，负责：
 * 1. 协调各个内容段落的生成
 * 2. 按照标准格式组织文档结构
 * 3. 确保输出格式的一致性
 * 
 * 生成的文档结构：
 * - 标题（组件名称）
 * - 组件描述（来自 meta 配置）
 * - 示例部分（所有 demo 类型的 Story）
 * - API 文档（api 类型的 Story）
 * 
 * @param storiesData - 解析后的 Stories 数据结构
 * @param componentName - 组件名称，用作文档标题
 * @returns string - 格式化的 Markdown 文档内容
 * 
 * @example
 * ```typescript
 * const markdown = generateMarkdownContent(data, 'Button');
 * // 输出：# Button\n\n组件描述...\n\n## 示例\n...
 * ```
 */
export function generateMarkdownContent(storiesData: StoriesData, componentName: string): string {
  const sections = [
    generateTitle(componentName),
    generateDescription(storiesData.meta),
    generateDemoExamples(storiesData.storyExports),
    generateApiDocumentation(storiesData.storyExports)
  ];

  return sections.filter(section => section).join('');
}

/**
 * 生成文档标题部分
 * 
 * 创建符合 Markdown 规范的一级标题，作为整个组件文档的开始
 * 
 * @param componentName - 组件的完整名称
 * @returns string - 格式化的 Markdown 标题（包含换行）
 * 
 * @example
 * ```typescript
 * const title = generateTitle('Button'); // '# Button\n\n'
 * ```
 * 
 * @internal 文档结构生成器
 */
function generateTitle(componentName: string): string {
  return `# ${componentName}\n\n`;
}

/**
 * 生成组件描述段落
 * 
 * 从 meta 数据中提取组件描述信息，生成文档的描述部分。
 * 如果没有描述信息，则返回空字符串
 * 
 * @param meta - 组件的元数据对象，可能包含描述信息
 * @returns string - 格式化的描述段落，无描述时返回空字符串
 * 
 * @example
 * ```typescript
 * const desc = generateDescription(meta);
 * // 有描述时：'这是一个按钮组件\n\n'
 * // 无描述时：''
 * ```
 * 
 * @internal 文档内容生成器
 */
function generateDescription(meta: MetaData | null): string {
  if (!meta?.componentDescription) return '';
  return meta.componentDescription + '\n\n';
}

/**
 * 生成演示示例部分
 * 
 * 遍历所有 demo 类型的 Story，为每个示例生成：
 * - 三级标题（示例名称）
 * - 示例描述（如果存在）
 * - 代码块（JSX 代码，使用 tsx 语法高亮）
 * 
 * @param storyExports - 包含所有 Story 的数组
 * @returns string - 格式化的示例部分 Markdown，无示例时返回空字符串
 * 
 * @example
 * ```typescript
 * const examples = generateDemoExamples(stories);
 * // 输出：## 示例\n\n### 主要按钮\n\n描述...\n\n```tsx\n<Button>点击</Button>\n```\n\n
 * ```
 * 
 * @internal 示例内容生成器
 */
function generateDemoExamples(storyExports: Story[]): string {
  const demoStories = storyExports.filter(story => story.type === 'demo');
  if (demoStories.length === 0) return '';

  let markdown = '## 示例\n\n';

  demoStories.forEach(story => {
    const displayName = story.displayName || story.name;
    markdown += `### ${displayName}\n\n`;

    if (story.description) {
      markdown += story.description + '\n\n';
    }

    if (story.code) {
      markdown += '```tsx\n' + story.code + '\n```\n\n';
    }
  });

  return markdown;
}

/**
 * 生成 API 文档部分
 * 
 * 查找并处理 api 类型的 Story，将其描述内容作为 API 文档。
 * API 文档通常包含组件的属性说明、方法介绍等技术细节
 * 
 * @param storyExports - 包含所有 Story 的数组
 * @returns string - API 文档的 Markdown 内容，无 API Story 时返回空字符串
 * 
 * @example
 * ```typescript
 * const apiDoc = generateApiDocumentation(stories);
 * // 输出：## Props\n### size\n- 类型：string\n...
 * ```
 * 
 * @internal API 文档生成器
 */
function generateApiDocumentation(storyExports: Story[]): string {
  const apiStory = storyExports.find(story => story.type === 'api');
  if (!apiStory?.description) return '';

  return apiStory.description + '\n';
}