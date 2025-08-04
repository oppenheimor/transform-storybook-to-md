import * as fs from 'fs';
import * as path from 'path';
import { StoriesData, MetaData, Story } from './types';
import { parseStoriesFile } from './parser';

// ====================================
// 核心API：对外暴露的主要功能
// ====================================

/**
 * 将组件 storybook 文档内容转换成 markdown 内容的函数
 * @param componentNames - 组件名数组
 */
export async function generateComponentMarkdown(componentNames: string[]): Promise<void> {
  for (const componentName of componentNames) {
    try {
      await processComponent(componentName);
    } catch (error) {
      console.error(`❌ 处理组件 ${componentName} 时出错:`, (error as Error).message);
    }
  }
}

// ====================================
// 业务逻辑层：处理单个组件的完整流程
// ====================================

/**
 * 处理单个组件的文档生成流程
 * @param componentName - 组件名
 */
async function processComponent(componentName: string): Promise<string> {
  // 1. 构建文件路径
  const storiesPath = buildStoriesPath(componentName);
  
  // 2. 验证文件存在
  validateStoriesFile(storiesPath, componentName);
  
  // 3. 解析stories文件
  const storiesData = await parseStoriesFile(storiesPath);
  
  // 4. 生成markdown内容
  const markdownContent = generateMarkdownContent(storiesData, componentName);

  return markdownContent
}

/**
 * 构建stories文件路径
 * @param componentName - 组件名
 * @returns stories文件路径
 */
function buildStoriesPath(componentName: string): string {
  return path.join(process.cwd(), 'packages', componentName, 'src', 'index.stories.tsx');
}

/**
 * 验证stories文件是否存在
 * @param storiesPath - stories文件路径
 * @param componentName - 组件名（用于错误信息）
 */
function validateStoriesFile(storiesPath: string, componentName: string): void {
  if (!fs.existsSync(storiesPath)) {
    throw new Error(`组件 ${componentName} 的 stories 文件不存在: ${storiesPath}`);
  }
}

// ====================================
// Markdown生成器：将解析的数据转换为markdown格式
// ====================================

/**
 * 生成完整的markdown内容
 * @param storiesData - stories数据
 * @param componentName - 组件名
 * @returns markdown内容
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
 * 生成标题部分
 * @param componentName - 组件名
 * @returns 标题markdown
 */
function generateTitle(componentName: string): string {
  return `# ${componentName}\n\n`;
}

/**
 * 生成组件描述部分
 * @param meta - meta数据
 * @returns 描述markdown
 */
function generateDescription(meta: MetaData | null): string {
  if (!meta?.componentDescription) return '';
  return meta.componentDescription + '\n\n';
}

/**
 * 生成Demo示例部分
 * @param storyExports - story导出数组
 * @returns Demo示例markdown
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
 * 生成API文档部分
 * @param storyExports - story导出数组  
 * @returns API文档markdown
 */
function generateApiDocumentation(storyExports: Story[]): string {
  const apiStory = storyExports.find(story => story.type === 'api');
  if (!apiStory?.description) return '';
  
  return apiStory.description + '\n';
}

// ====================================
// 测试和导出
// ====================================

// 获取所有组件名称
export function getAllComponentNames(): string[] {
  const packagesDir = path.join(process.cwd(), 'packages');
  return fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}
