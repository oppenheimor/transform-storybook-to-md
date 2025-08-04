const fs = require('fs');
const path = require('path');

// ====================================
// 核心API：对外暴露的主要功能
// ====================================

/**
 * 将组件 storybook 文档内容转换成 markdown 内容的函数
 * @param {string[]} componentNames - 组件名数组
 */
async function generateComponentMarkdown(componentNames) {
  for (const componentName of componentNames) {
    try {
      await processComponent(componentName);
    } catch (error) {
      console.error(`❌ 处理组件 ${componentName} 时出错:`, error.message);
    }
  }
}

// ====================================
// 业务逻辑层：处理单个组件的完整流程
// ====================================

/**
 * 处理单个组件的文档生成流程
 * @param {string} componentName - 组件名
 */
async function processComponent(componentName) {
  // 1. 构建文件路径
  const storiesPath = buildStoriesPath(componentName);
  
  // 2. 验证文件存在
  validateStoriesFile(storiesPath, componentName);
  
  // 3. 解析stories文件
  const storiesData = await parseStoriesFile(storiesPath);
  
  // 4. 生成markdown内容
  const markdownContent = generateMarkdownContent(storiesData, componentName);
  
  // 5. 写入文件
  const outputPath = buildOutputPath(componentName);
  writeMarkdownFile(outputPath, markdownContent);
  
  console.log(`✅ 成功生成 ${componentName} 的文档: ${outputPath}`);
}

/**
 * 构建stories文件路径
 * @param {string} componentName - 组件名
 * @returns {string} stories文件路径
 */
function buildStoriesPath(componentName) {
  return path.join(__dirname, 'packages', componentName, 'src', 'index.stories.tsx');
}

/**
 * 构建输出文件路径
 * @param {string} componentName - 组件名
 * @returns {string} 输出文件路径
 */
function buildOutputPath(componentName) {
  // 原始逻辑（测试完成后恢复）：
  // return path.join(__dirname, 'packages', componentName, `${componentName}.md`);
  
  // 临时修改：将文档输出到根目录的 summrize 文件夹
  const summrizeDir = path.join(__dirname, 'summrize');
  
  // 确保 summrize 目录存在
  if (!fs.existsSync(summrizeDir)) {
    fs.mkdirSync(summrizeDir, { recursive: true });
  }
  
  return path.join(summrizeDir, `${componentName}.md`);
}

/**
 * 验证stories文件是否存在
 * @param {string} storiesPath - stories文件路径
 * @param {string} componentName - 组件名（用于错误信息）
 */
function validateStoriesFile(storiesPath, componentName) {
  if (!fs.existsSync(storiesPath)) {
    throw new Error(`组件 ${componentName} 的 stories 文件不存在: ${storiesPath}`);
  }
}

/**
 * 写入markdown文件
 * @param {string} outputPath - 输出路径
 * @param {string} content - 文件内容
 */
function writeMarkdownFile(outputPath, content) {
  fs.writeFileSync(outputPath, content, 'utf-8');
}

// ====================================
// 数据解析层：处理stories文件的解析
// ====================================

/**
 * 解析stories文件，提取所有必要数据
 * @param {string} storiesPath - stories文件路径
 * @returns {Object} 解析后的stories数据
 */
async function parseStoriesFile(storiesPath) {
  const fileContent = fs.readFileSync(storiesPath, 'utf-8');
  
  return {
    meta: parseMetaData(fileContent),
    storyExports: parseStoryExports(fileContent)
  };
}

/**
 * 解析meta配置数据
 * @param {string} content - 文件内容
 * @returns {Object|null} meta对象
 */
function parseMetaData(content) {
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
 * @param {string} content - 文件内容
 * @returns {string|null} meta代码段
 */
function extractMetaSection(content) {
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
 * @param {string} content - 文件内容
 * @returns {Array} story数组
 */
function parseStoryExports(content) {
  const stories = [];
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
      let storyContent;
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
 * @param {string[]} lines - 文件行数组
 * @param {number} startIndex - 开始行索引
 * @returns {string} story内容
 */
function extractStoryContent(lines, startIndex) {
  let braceLevel = 1;
  let storyLines = [];
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
 * @param {string[]} lines - 文件行数组
 * @param {number} startIndex - 开始行索引
 * @returns {number} 行数
 */
function countStoryLines(lines, startIndex) {
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
 * @param {string[]} lines - 文件行数组
 * @param {number} startIndex - 开始行索引
 * @returns {string} story内容
 */
function extractFunctionStoryContent(lines, startIndex) {
  let braceLevel = 1;
  let storyLines = [];
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
 * @param {string[]} lines - 文件行数组
 * @param {number} startIndex - 开始行索引
 * @returns {number} 行数
 */
function countFunctionStoryLines(lines, startIndex) {
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
 * @param {string} storyContent - story内容
 * @returns {Object} API story对象
 */
function createApiStory(storyContent) {
  return {
    name: 'API',
    type: 'api',
    description: extractApiDescription(storyContent)
  };
}

/**
 * 创建Demo类型的story对象
 * @param {string} storyName - story名称
 * @param {string} storyContent - story内容
 * @returns {Object} Demo story对象
 */
function createDemoStory(storyName, storyContent) {
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
 * @param {string} storyContent - story内容
 * @returns {string|null} 显示名称
 */
function extractStoryName(storyContent) {
  const nameMatch = storyContent.match(/name:\s*["']([^"']+)["']/);
  return nameMatch ? nameMatch[1] : null;
}

/**
 * 提取story的描述信息
 * @param {string} storyContent - story内容
 * @returns {string|null} 描述信息
 */
function extractStoryDescription(storyContent) {
  const storyMatch = storyContent.match(/story:\s*([\s\S]*?)(?:,\s*\}|\})/);
  if (!storyMatch) return null;
  
  return cleanQuotes(storyMatch[1].trim());
}

/**
 * 提取API文档描述
 * @param {string} storyContent - story内容
 * @returns {string|null} API描述
 */
function extractApiDescription(storyContent) {
  const storyStart = storyContent.indexOf('story:');
  if (storyStart === -1) return null;
  
  const backtickStart = storyContent.indexOf('`', storyStart);
  if (backtickStart === -1) return null;
  
  const result = extractBacktickContent(storyContent, backtickStart);
  
  
  return result;
}

/**
 * 提取render函数中的JSX代码
 * @param {string} storyContent - story内容
 * @returns {string|null} JSX代码
 */
function extractRenderCode(storyContent) {
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
    
    return null;
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
  
  return null;
}

// ====================================
// 字符串处理工具：处理引号、反引号等特殊字符
// ====================================

/**
 * 清理字符串首尾的引号
 * @param {string} str - 输入字符串
 * @returns {string} 清理后的字符串
 */
function cleanQuotes(str) {
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
 * @param {string} content - 内容字符串
 * @param {number} startPos - 开始位置（反引号位置）
 * @returns {string} 提取的内容
 */
function extractBacktickContent(content, startPos) {
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
 * @param {string} content - 内容字符串
 * @param {number} pos - 当前位置
 * @returns {number} 反斜杠数量
 */
function countPrecedingBackslashes(content, pos) {
  let count = 0;
  let checkPos = pos - 1;
  
  while (checkPos >= 0 && content[checkPos] === '\\') {
    count++;
    checkPos--;
  }
  
  return count;
}

// ====================================
// Markdown生成器：将解析的数据转换为markdown格式
// ====================================

/**
 * 生成完整的markdown内容
 * @param {Object} storiesData - stories数据
 * @param {string} componentName - 组件名
 * @returns {string} markdown内容
 */
function generateMarkdownContent(storiesData, componentName) {
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
 * @param {string} componentName - 组件名
 * @returns {string} 标题markdown
 */
function generateTitle(componentName) {
  return `# ${componentName}\n\n`;
}

/**
 * 生成组件描述部分
 * @param {Object} meta - meta数据
 * @returns {string} 描述markdown
 */
function generateDescription(meta) {
  if (!meta?.componentDescription) return '';
  return meta.componentDescription + '\n\n';
}

/**
 * 生成Demo示例部分
 * @param {Array} storyExports - story导出数组
 * @returns {string} Demo示例markdown
 */
function generateDemoExamples(storyExports) {
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
 * @param {Array} storyExports - story导出数组  
 * @returns {string} API文档markdown
 */
function generateApiDocumentation(storyExports) {
  const apiStory = storyExports.find(story => story.type === 'api');
  if (!apiStory?.description) return '';
  
  return apiStory.description + '\n';
}

// ====================================
// 测试和导出
// ====================================

// 获取所有组件名称
function getAllComponentNames() {
  const packagesDir = path.join(__dirname, 'packages');
  return fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

// 测试用例：生成所有组件文档
if (require.main === module) {
  console.log('🚀 开始生成组件文档...\n');
  const allComponents = getAllComponentNames();
  console.log(`📦 发现 ${allComponents.length} 个组件:`, allComponents.join(', '));
  console.log('');
  
  generateComponentMarkdown(allComponents).then(() => {
    console.log('\n✨ 文档生成完成！');
  }).catch(error => {
    console.error('❌ 生成文档失败:', error);
  });
}

// 导出主要API
module.exports = {
  generateComponentMarkdown,
  generateMarkdownContent,
  parseStoriesFile,
  parseMetaData,
  parseStoryExports
};