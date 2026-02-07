/**
 * 测试用户提供的确切函数调用格式
 * 使用用户最新消息中的完整内容
 */

// 用户在最新消息中提供的完整内容
const exactUserContent = '[FUNCTION_CALL]createTask({"title":"修改控制体型记录状态","subtasks":[{"id":"subtask-1","title":"更新记录状态为已完成","description":"将记录ID为6984afb72004d003a0311f8d的待办事项状态从pending改为completed","functionCall":{"name":"updateRecord","arguments":{"recordId":"6984afb72004d003a0311f8d","status":"completed"}}},"executionMode":"auto"})[/FUNCTION_CALL] ';

console.log('=== 测试用户提供的确切内容 ===');
console.log('用户提供的完整内容:', exactUserContent);

// 提取并验证
function testContent(content) {
  try {
    // 移除FUNCTION_CALL包裹并清理空白
    const cleaned = content.replace(/\[FUNCTION_CALL\]/g, '').replace(/\[\/FUNCTION_CALL\]/g, '').trim();
    
    console.log('\n清理后内容:', cleaned);
    
    // 提取函数名和参数
    const match = cleaned.match(/^([a-zA-Z0-9]+)\((.*)\)$/);
    if (!match) {
      throw new Error('格式错误：无法识别函数调用');
    }
    
    const [, funcName, jsonStr] = match;
    console.log('\n函数名:', funcName);
    console.log('JSON参数:', jsonStr);
    
    // 验证JSON格式
    const parsed = JSON.parse(jsonStr);
    console.log('\n✅ JSON解析成功！');
    console.log('解析结果:', JSON.stringify(parsed, null, 2));
    
    // 验证结构
    console.log('\n=== 结构验证 ===');
    console.log('✓ title:', parsed.title);
    console.log('✓ subtasks类型:', Array.isArray(parsed.subtasks) ? 'array' : typeof parsed.subtasks);
    console.log('✓ subtasks长度:', parsed.subtasks ? parsed.subtasks.length : 0);
    console.log('✓ executionMode:', parsed.executionMode);
    
    return true;
  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    return false;
  }
}

// 测试用户提供的内容
const result = testContent(exactUserContent);

console.log('\n=== 最终测试结果 ===');
if (result) {
  console.log('✅ 用户提供的格式正确，可以执行');
} else {
  console.log('❌ 用户提供的格式有错误');
}

// 测试正确的格式作为对比
console.log('\n=== 测试正确格式作为对比 ===');
const correctFormat = '[FUNCTION_CALL]createTask({"title":"修改控制体型记录状态","subtasks":[{"id":"subtask-1","title":"更新记录状态为已完成","description":"将记录ID为6984afb72004d003a0311f8d的待办事项状态从pending改为completed","functionCall":{"name":"updateRecord","arguments":{"recordId":"6984afb72004d003a0311f8d","status":"completed"}}}],"executionMode":"auto"})[/FUNCTION_CALL]';

const correctResult = testContent(correctFormat);

console.log('\n=== 正确格式测试结果 ===');
if (correctResult) {
  console.log('✅ 正确格式验证通过');
} else {
  console.log('❌ 正确格式验证失败');
}
