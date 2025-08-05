import * as fs from 'fs';
import { StoriesData, MetaData, Story } from '../types';

// ====================================
// 数据解析层：处理stories文件的解析
// ====================================

/**
 * 解析 Stories 文件的主入口函数
 * 
 * 该函数是解析系统的核心，负责从 Stories 文件中提取所有必要的数据：
 * - 组件元信息（meta 配置）
 * - 所有导出的 Story 定义
 * 
 * @param storiesPath - Stories 文件的完整路径
 * @returns Promise<StoriesData> - 包含 meta 和 storyExports 的完整数据结构
 * 
 * @example
 * ```typescript
 * const data = await parseStoriesFile('./Button.stories.tsx');
 * console.log(data.meta?.componentDescription); // '这是一个按钮组件'
 * console.log(data.storyExports.length); // 3
 * ```
 * 
 * @throws {Error} 当文件不存在或无法读取时抛出异常
 */
export async function parseStoriesFile(storiesPath: string): Promise<StoriesData> {
  const fileContent = fs.readFileSync(storiesPath, 'utf-8');

  return {
    meta: parseMetaData(fileContent),
    storyExports: parseStoryExports(fileContent)
  };
}

/**
 * 从文件内容中解析 meta 配置数据
 * 
 * 负责提取 Stories 文件中的 meta 对象信息，特别关注：
 * - component 字段中的组件描述（反引号包围的内容）
 * - 其他元数据配置
 * 
 * @param content - Stories 文件的完整内容字符串
 * @returns MetaData | null - 解析成功返回元数据对象，失败返回 null
 * 
 * @example
 * ```typescript
 * const meta = parseMetaData(fileContent);
 * if (meta) {
 *   console.log(meta.componentDescription); // '按钮组件用于用户交互'
 * }
 * ```
 */
export function parseMetaData(content: string): MetaData | null {
  const metaSection = extractMetaSection(content);
  if (!metaSection) return null;

  // 使用更精确的方法提取component description
  const componentStart = metaSection.indexOf('component:');
  if (componentStart === -1) return null;

  const backtickStart = metaSection.indexOf('`', componentStart);
  if (backtickStart === -1) return null;

  const componentDescription = extractBacktickContent(metaSection, backtickStart);

  return {
    componentDescription: componentDescription
  };
}

/**
 * 从文件内容中定位并提取 meta 代码段
 * 
 * 支持多种 meta 定义格式的智能识别：
 * - const meta = { ... }
 * - const meta: Meta = { ... }
 * - const meta = { ... } as Meta
 * 
 * @param content - 完整的文件内容
 * @returns string | null - 找到的 meta 代码段，未找到返回 null
 * 
 * @internal 内部函数，仅供 parseMetaData 使用
 */
function extractMetaSection(content: string): string | null {
  // 支持多种 meta 定义格式
  let metaStart = content.indexOf('const meta');

  // 如果找不到 const meta，尝试其他格式
  if (metaStart === -1) {
    // 尝试查找其他可能的 meta 定义
    const patterns = [
      'const meta =',
      'const meta:',
      'const meta ='
    ];

    for (const pattern of patterns) {
      metaStart = content.indexOf(pattern);
      if (metaStart !== -1) break;
    }
  }

  if (metaStart === -1) return null;

  const metaEnd = content.indexOf('export default meta', metaStart);
  if (metaEnd === -1) return null;

  return content.substring(metaStart, metaEnd);
}

/**
 * 解析文件中所有导出的 Story
 * 
 * 该函数是 Story 解析的主控制器，负责：
 * 1. 识别所有符合格式的 Story 导出
 * 2. 区分对象格式和函数格式的 Story
 * 3. 根据 Story 名称判断类型（API 或 Demo）
 * 4. 提取每个 Story 的详细信息
 * 
 * 支持的 Story 格式：
 * - export const Primary: Story = { ... } （对象格式）
 * - export const Primary = () => { ... } （函数格式）
 * 
 * @param content - Stories 文件的完整内容
 * @returns Story[] - 解析出的所有 Story 对象数组
 * 
 * @example
 * ```typescript
 * const stories = parseStoryExports(content);
 * stories.forEach(story => {
 *   console.log(`${story.name}: ${story.type}`);
 * });
 * ```
 */
export function parseStoryExports(content: string): Story[] {
  const stories: Story[] = [];
  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    // 支持多种 story 定义格式
    let storyMatch = lines[i].match(/^export const (\w+): Story = \{\s*$/);  // 对象格式
    let isObjectFormat = true;

    // 如果没有匹配到对象格式，尝试函数格式
    if (!storyMatch) {
      storyMatch = lines[i].match(/^export const (\w+) = \(\) => \{/);  // 函数格式
      if (!storyMatch) {
        storyMatch = lines[i].match(/^export const (\w+): Story = \(/);  // 函数格式变体
      }
      isObjectFormat = false;
    }

    if (storyMatch) {
      const storyName = storyMatch[1];

      // 根据格式选择不同的内容提取方法
      let storyContent: string;
      if (isObjectFormat) {
        storyContent = extractStoryContent(lines, i);
      } else {
        storyContent = extractFunctionStoryContent(lines, i);
      }

      // 根据story类型创建不同的数据结构
      if (storyName === 'API') {
        stories.push(createApiStory(storyContent));
      } else {
        stories.push(createDemoStory(storyName, storyContent));
      }

      // 跳过已处理的行
      i += isObjectFormat ? countStoryLines(lines, i) : countFunctionStoryLines(lines, i);
    } else {
      i++;
    }
  }

  return stories;
}

/**
 * 提取对象格式 Story 的完整内容
 * 
 * 使用大括号计数算法精确提取 Story 对象的完整定义，
 * 处理嵌套对象和复杂结构
 * 
 * @param lines - 文件按行分割的数组
 * @param startIndex - Story 开始行的索引位置
 * @returns string - 提取的 Story 内容（不包含开始的 export const 行）
 * 
 * @internal 内部函数，用于对象格式 Story 的内容提取
 */
function extractStoryContent(lines: string[], startIndex: number): string {
  let braceLevel = 1;
  let storyLines: string[] = [];
  let i = startIndex + 1; // 跳过开始行

  while (i < lines.length && braceLevel > 0) {
    const currentLine = lines[i];
    storyLines.push(currentLine);

    // 计算大括号层级
    for (const char of currentLine) {
      if (char === '{') braceLevel++;
      if (char === '}') braceLevel--;
    }

    i++;
  }

  return storyLines.join('\n');
}

/**
 * 计算story占用的行数
 * @param lines - 文件行数组
 * @param startIndex - 开始行索引
 * @returns 行数
 */
function countStoryLines(lines: string[], startIndex: number): number {
  let braceLevel = 1;
  let lineCount = 1; // 包含开始行
  let i = startIndex + 1;

  while (i < lines.length && braceLevel > 0) {
    const currentLine = lines[i];

    for (const char of currentLine) {
      if (char === '{') braceLevel++;
      if (char === '}') braceLevel--;
    }

    lineCount++;
    i++;
  }

  return lineCount;
}

/**
 * 提取函数格式 Story 的完整内容
 * 
 * 专门处理函数格式的 Story 定义，使用大括号平衡算法
 * 确保完整提取函数体内容
 * 
 * @param lines - 文件按行分割的数组
 * @param startIndex - Story 函数开始行的索引位置
 * @returns string - 提取的函数体内容
 * 
 * @internal 内部函数，用于函数格式 Story 的内容提取
 */
function extractFunctionStoryContent(lines: string[], startIndex: number): string {
  let braceLevel = 1;
  let storyLines: string[] = [];
  let i = startIndex + 1; // 跳过开始行

  while (i < lines.length && braceLevel > 0) {
    const currentLine = lines[i];
    storyLines.push(currentLine);

    // 计算大括号层级
    for (const char of currentLine) {
      if (char === '{') braceLevel++;
      if (char === '}') braceLevel--;
    }

    i++;
  }

  return storyLines.join('\n');
}

/**
 * 计算函数式story占用的行数
 * @param lines - 文件行数组
 * @param startIndex - 开始行索引
 * @returns 行数
 */
function countFunctionStoryLines(lines: string[], startIndex: number): number {
  let braceLevel = 1;
  let lineCount = 1; // 包含开始行
  let i = startIndex + 1;

  while (i < lines.length && braceLevel > 0) {
    const currentLine = lines[i];

    for (const char of currentLine) {
      if (char === '{') braceLevel++;
      if (char === '}') braceLevel--;
    }

    lineCount++;
    i++;
  }

  return lineCount;
}

// ====================================
// Story数据构造器：创建不同类型的story对象
// ====================================

/**
 * 构造 API 类型的 Story 对象
 * 
 * API Story 通常包含组件的接口文档和使用说明，
 * 从 story 字段中提取文档内容
 * 
 * @param storyContent - Story 的原始内容字符串
 * @returns Story - 类型为 'api' 的 Story 对象
 * 
 * @internal Story 构造器函数
 */
function createApiStory(storyContent: string): Story {
  return {
    name: 'API',
    type: 'api',
    description: extractApiDescription(storyContent)
  };
}

/**
 * 构造演示类型的 Story 对象
 * 
 * Demo Story 包含可运行的组件示例，需要提取：
 * - 显示名称（name 字段）
 * - 描述信息（story 字段）
 * - JSX 代码（render 函数）
 * 
 * @param storyName - Story 的导出名称
 * @param storyContent - Story 的原始内容字符串
 * @returns Story - 类型为 'demo' 的 Story 对象
 * 
 * @internal Story 构造器函数
 */
function createDemoStory(storyName: string, storyContent: string): Story {
  return {
    name: storyName,
    type: 'demo',
    displayName: extractStoryName(storyContent),
    description: extractStoryDescription(storyContent),
    code: extractRenderCode(storyContent)
  };
}

// ====================================
// 内容提取器：从story内容中提取特定字段
// ====================================

/**
 * 从 Story 配置中提取显示名称
 * 
 * 查找 Story 对象中的 name 属性值，支持单引号和双引号格式
 * 
 * @param storyContent - Story 的内容字符串
 * @returns string | undefined - 找到的显示名称，未找到返回 undefined
 * 
 * @example
 * ```typescript
 * // Story 内容: { name: '主要按钮', ... }
 * const name = extractStoryName(content); // '主要按钮'
 * ```
 */
function extractStoryName(storyContent: string): string | undefined {
  const nameMatch = storyContent.match(/name:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1] : undefined;
}

/**
 * 从 Story 配置中提取描述信息
 * 
 * 查找并提取 story 字段的值，自动清理引号包围
 * 
 * @param storyContent - Story 的内容字符串
 * @returns string | undefined - 清理后的描述文本，未找到返回 undefined
 * 
 * @example
 * ```typescript
 * // Story 内容: { story: '这是一个主要按钮示例' }
 * const desc = extractStoryDescription(content); // '这是一个主要按钮示例'
 * ```
 */
function extractStoryDescription(storyContent: string): string | undefined {
  const storyMatch = storyContent.match(/story:\s*([\s\S]*?)(?:,\s*\}|\})/);
  if (!storyMatch) return undefined;

  return cleanQuotes(storyMatch[1].trim());
}

/**
 * 从 API Story 中提取文档描述
 * 
 * API Story 的描述通常包含在 story 字段的反引号内容中，
 * 需要特殊处理反引号包围的长文本
 * 
 * @param storyContent - API Story 的内容字符串
 * @returns string | undefined - 提取的 API 文档内容，未找到返回 undefined
 * 
 * @example
 * ```typescript
 * // API Story: { story: `## Props\n### size\n...` }
 * const apiDoc = extractApiDescription(content); // '## Props\n### size\n...'
 * ```
 */
function extractApiDescription(storyContent: string): string | undefined {
  const storyStart = storyContent.indexOf('story:');
  if (storyStart === -1) return undefined;

  const backtickStart = storyContent.indexOf('`', storyStart);
  if (backtickStart === -1) return undefined;

  const result = extractBacktickContent(storyContent, backtickStart);

  return result;
}

/**
 * 从 Story 中提取可执行的 JSX 代码
 * 
 * 支持多种 render 函数格式的代码提取：
 * - 对象格式：render: () => { return <JSX/> }
 * - 函数格式：() => { return <JSX/> }
 * - 带括号和不带括号的 return 语句
 * 
 * @param storyContent - Story 的内容字符串
 * @returns string | undefined - 提取的 JSX 代码，未找到返回 undefined
 * 
 * @example
 * ```typescript
 * // render: () => { return <Button>Click</Button> }
 * const code = extractRenderCode(content); // '<Button>Click</Button>'
 * ```
 */
function extractRenderCode(storyContent: string): string | undefined {
  // 先尝试匹配对象格式中的 render 函数
  let renderMatch = storyContent.match(/render:\s*\(\)\s*=>\s*\{([\s\S]*?)\n  \}/);

  // 如果没有匹配到，尝试匹配函数格式（直接是函数体）
  if (!renderMatch) {
    // 对于函数格式，尝试提取 return 语句
    const returnMatch = storyContent.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;/);
    if (returnMatch) {
      return returnMatch[1].trim();
    }

    // 尝试没有括号的 return
    const simpleReturnMatch = storyContent.match(/return\s+([\s\S]*?);/);
    if (simpleReturnMatch) {
      return simpleReturnMatch[1].trim();
    }

    return undefined;
  }

  const renderCode = renderMatch[1].trim();

  // 尝试匹配带括号的return语句: return (<JSX>);
  let returnMatch = renderCode.match(/return\s*\(([\s\S]*?)\);\s*$/);
  if (returnMatch) {
    return returnMatch[1].trim();
  }

  // 尝试匹配不带括号的return语句: return <JSX>;
  returnMatch = renderCode.match(/return\s+([^;]+);\s*$/);
  if (returnMatch) {
    return returnMatch[1].trim();
  }

  // 尝试匹配多行的return语句，但没有括号包围
  returnMatch = renderCode.match(/return\s+([\s\S]*?);\s*$/);
  if (returnMatch) {
    return returnMatch[1].trim();
  }

  return undefined;
}

// ====================================
// 字符串处理工具：处理引号、反引号等特殊字符
// ====================================

/**
 * 清理字符串首尾的引号字符
 * 
 * 智能处理各种引号格式：
 * - 双引号包围："text" → text
 * - 单引号包围：'text' → text
 * - 混合情况的清理
 * 
 * @param str - 需要清理的字符串
 * @returns string - 移除引号后的纯文本
 * 
 * @internal 字符串处理工具函数
 */
function cleanQuotes(str: string): string {
  // 处理双引号包围的字符串
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1);
  }

  // 处理单引号包围的字符串
  if (str.startsWith("'") && str.endsWith("'")) {
    return str.slice(1, -1);
  }

  // 移除首尾的引号（处理混合情况）
  return str.replace(/^["']|["']$/g, '');
}

/**
 * 智能提取反引号包围的内容
 * 
 * 处理复杂的反引号内容提取，包括：
 * - 转义反引号的正确识别（\`）
 * - 嵌套内容的完整提取
 * - 多行内容的保持
 * 
 * @param content - 包含反引号内容的字符串
 * @param startPos - 起始反引号的位置索引
 * @returns string - 提取的纯内容（不包含反引号）
 * 
 * @example
 * ```typescript
 * // 内容: `这是一个\`转义\`的内容`
 * const result = extractBacktickContent(content, 0); // '这是一个`转义`的内容'
 * ```
 * 
 * @internal 高级字符串解析工具
 */
function extractBacktickContent(content: string, startPos: number): string {
  // 寻找匹配的结束反引号，从startPos+1开始
  let pos = startPos + 1;
  let result = '';

  while (pos < content.length) {
    const char = content[pos];

    if (char === '`') {
      // 检查前面是否有反斜杠转义
      const backslashCount = countPrecedingBackslashes(content, pos);

      // 如果反斜杠数量为偶数（包括0），说明这个反引号没有被转义
      if (backslashCount % 2 === 0) {
        // 找到了结束的反引号
        break;
      }
    }

    result += char;
    pos++;
  }

  return result.trim();
}

/**
 * 计算指定位置前的连续反斜杠数量
 * 
 * 用于判断反引号是否被转义：
 * - 偶数个反斜杠（包括0）：反引号未转义
 * - 奇数个反斜杠：反引号已转义
 * 
 * @param content - 待检查的字符串内容
 * @param pos - 当前字符的位置索引
 * @returns number - 连续反斜杠的数量
 * 
 * @internal 转义字符分析工具
 */
function countPrecedingBackslashes(content: string, pos: number): number {
  let count = 0;
  let checkPos = pos - 1;

  while (checkPos >= 0 && content[checkPos] === '\\') {
    count++;
    checkPos--;
  }

  return count;
}