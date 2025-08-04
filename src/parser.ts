import * as fs from 'fs';
import { StoriesData, MetaData, Story } from './types';

// ====================================
// 数据解析层：处理stories文件的解析
// ====================================

/**
 * 解析stories文件，提取所有必要数据
 * @param storiesPath - stories文件路径
 * @returns 解析后的stories数据
 */
export async function parseStoriesFile(storiesPath: string): Promise<StoriesData> {
  const fileContent = fs.readFileSync(storiesPath, 'utf-8');
  
  return {
    meta: parseMetaData(fileContent),
    storyExports: parseStoryExports(fileContent)
  };
}

/**
 * 解析meta配置数据
 * @param content - 文件内容
 * @returns meta对象
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
 * 提取meta代码段
 * @param content - 文件内容
 * @returns meta代码段
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
 * 解析所有的story exports
 * @param content - 文件内容
 * @returns story数组
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
 * 提取单个story的内容
 * @param lines - 文件行数组
 * @param startIndex - 开始行索引
 * @returns story内容
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
 * 提取函数式story的内容
 * @param lines - 文件行数组
 * @param startIndex - 开始行索引
 * @returns story内容
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
 * 创建API类型的story对象
 * @param storyContent - story内容
 * @returns API story对象
 */
function createApiStory(storyContent: string): Story {
  return {
    name: 'API',
    type: 'api',
    description: extractApiDescription(storyContent)
  };
}

/**
 * 创建Demo类型的story对象
 * @param storyName - story名称
 * @param storyContent - story内容
 * @returns Demo story对象
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
 * 提取story的显示名称
 * @param storyContent - story内容
 * @returns 显示名称
 */
function extractStoryName(storyContent: string): string | undefined {
  const nameMatch = storyContent.match(/name:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1] : undefined;
}

/**
 * 提取story的描述信息
 * @param storyContent - story内容
 * @returns 描述信息
 */
function extractStoryDescription(storyContent: string): string | undefined {
  const storyMatch = storyContent.match(/story:\s*([\s\S]*?)(?:,\s*\}|\})/);
  if (!storyMatch) return undefined;
  
  return cleanQuotes(storyMatch[1].trim());
}

/**
 * 提取API文档描述
 * @param storyContent - story内容
 * @returns API描述
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
 * 提取render函数中的JSX代码
 * @param storyContent - story内容
 * @returns JSX代码
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
 * 清理字符串首尾的引号
 * @param str - 输入字符串
 * @returns 清理后的字符串
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
 * 提取反引号包围的内容，处理转义反引号
 * @param content - 内容字符串
 * @param startPos - 开始位置（反引号位置）
 * @returns 提取的内容
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
 * 计算指定位置前面连续反斜杠的数量
 * @param content - 内容字符串
 * @param pos - 当前位置
 * @returns 反斜杠数量
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