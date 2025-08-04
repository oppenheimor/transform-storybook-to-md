const { generateComponentMarkdown } = require('./dist/index.js');

// 测试 generateComponentMarkdown 函数
async function testGenerateComponentMarkdown() {
  console.log('🧪 开始测试 generateComponentMarkdown 函数...\n');
  
  try {
    // 测试用例1: 传入单个组件
    console.log('📝 测试1: 生成单个组件文档');
    await generateComponentMarkdown(['TestComponent']);
    console.log('✅ 测试1 通过\n');
    
    // 测试用例2: 传入多个组件
    console.log('📝 测试2: 生成多个组件文档'); 
    await generateComponentMarkdown(['ComponentA', 'ComponentB']);
    console.log('✅ 测试2 通过\n');
    
    // 测试用例3: 传入空数组
    console.log('📝 测试3: 传入空数组');
    await generateComponentMarkdown([]);
    console.log('✅ 测试3 通过\n');
    
    console.log('🎉 所有测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

// 执行测试
testGenerateComponentMarkdown();