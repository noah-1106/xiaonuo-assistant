/**
 * 测试函数调用格式是否正确
 * 验证JSON格式是否标准可解析
 */

// 用户提供的函数调用内容
const functionCallContent = '[FUNCTION_CALL]createTask({"title":"修改控制体型记录状态","subtasks":[{"id":"subtask-1","title":"更新记录状态为已完成","description":"将记录ID为6984afb72004d003a0311f8d的待办事项状态从pending改为completed","functionCall":{"name":"updateRecord","arguments":{"recordId":"6984afb72004d003a0311f8d","status":"completed"}}},"executionMode":"auto"})[/FUNCTION_CALL]';

console.log('=== 测试函数调用格式 ===');
console.log('原始内容:', functionCallContent);

// 提取JSON部分
function extractJson(content) {
  try {
    // 移除FUNCTION_CALL包裹
    const cleaned = content.replace(/\[FUNCTION_CALL\]/g, '').replace(/\[\/FUNCTION_CALL\]/g, '');
    
    // 找到函数名和参数的开始位置
    const funcMatch = cleaned.match(/^([a-zA-Z0-9]+)\((.*)\)$/);
    if (!funcMatch) {
      throw new Error('无法提取函数调用格式');
    }
    
    const [, functionName, jsonStr] = funcMatch;
    console.log('\n提取结果:');
    console.log('函数名:', functionName);
    console.log('JSON字符串:', jsonStr);
    
    return {
      functionName,
      jsonStr
    };
  } catch (error) {
    console.error('提取JSON失败:', error.message);
    throw error;
  }
}

// 验证JSON格式
function validateJson(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    console.log('\n=== JSON解析成功 ===');
    console.log('解析结果:', JSON.stringify(parsed, null, 2));
    
    // 验证必要字段
    if (!parsed.title) {
      throw new Error('缺少title字段');
    }
    if (!parsed.subtasks || !Array.isArray(parsed.subtasks)) {
      throw new Error('缺少subtasks字段或格式错误');
    }
    
    console.log('\n=== 字段验证 ===');
    console.log('✓ title:', parsed.title);
    console.log('✓ subtasks数量:', parsed.subtasks.length);
    
    // 验证子任务
    parsed.subtasks.forEach((subtask, index) => {
      console.log(`\n子任务 ${index + 1}:`);
      console.log('  ✓ id:', subtask.id);
      console.log('  ✓ title:', subtask.title);
      console.log('  ✓ description:', subtask.description);
      
      if (subtask.functionCall) {
        console.log('  ✓ functionCall:');
        console.log('    ✓ name:', subtask.functionCall.name);
        console.log('    ✓ arguments:', JSON.stringify(subtask.functionCall.arguments));
      }
    });
    
    return true;
  } catch (error) {
    console.error('\n=== JSON解析失败 ===');
    console.error('错误:', error.message);
    return false;
  }
}

// 执行测试
try {
  const { functionName, jsonStr } = extractJson(functionCallContent);
  const isValid = validateJson(jsonStr);
  
  console.log('\n=== 测试结果 ===');
  if (isValid) {
    console.log('✅ 函数调用格式正确，可以执行');
  } else {
    console.log('❌ 函数调用格式错误，需要修改');
  }
} catch (error) {
  console.error('测试失败:', error);
}
