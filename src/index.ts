import { parseStoriesFile } from './utils/parser';
import { generateMarkdownContent } from './utils/markdownGenerator';

/**
 * 将 Storybook 组件文档转换为 Markdown 格式
 * 
 * 该函数是整个转换系统的主入口，负责协调解析和生成过程：
 * 1. 解析 Stories 文件，提取组件元数据和示例代码
 * 2. 将解析的数据转换为格式化的 Markdown 文档
 * 
 * @param storyBookPath - Stories 文件的完整路径（如：/Users/paulchess/Desktop/Home/work/ainvest-matrix-ui-react/packages/button/src/index.stories.tsx）
 * @param componentName - 目标组件名称，用作 Markdown 文档标题
 * @returns Promise<string> - 生成的 Markdown 内容字符串
 * 
 * @example
 * ```typescript
 * const markdown = await transformStoryBookToMarkdown(
 *   '/Users/paulchess/Desktop/Home/work/ainvest-matrix-ui-react/packages/button/src/index.stories.tsx',
 *   '@oversea/Button'
 * );
 * console.log(markdown); // # Button\n\n组件描述...\n\n## 示例\n...
 * ```
 * 
 * @throws {Error} 当 Stories 文件不存在或格式错误时抛出异常
 */
async function transformStoryBookToMarkdown(storyBookPath: string, componentName: string): Promise<string> {
  // 1. 解析 Stories 文件，提取元数据和示例数据
  const storiesData = await parseStoriesFile(storyBookPath);

  // 2. 基于解析数据生成结构化的 Markdown 内容
  const markdownContent = generateMarkdownContent(storiesData, componentName);

  return markdownContent
}

export { transformStoryBookToMarkdown }