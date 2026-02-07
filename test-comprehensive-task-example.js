// 综合任务示例 - 包含系统内函数调用、大模型工具调用和大模型自行执行
// 此示例展示如何创建一个包含多种操作类型的综合任务

const fs = require('fs');

// 创建综合任务示例
function createComprehensiveTaskExample() {
  console.log('=== 创建综合任务示例 ===');
  
  // 准备综合任务数据
  const taskData = {
    title: '市场分析与报告生成',
    description: '进行市场分析并生成详细报告，包含数据收集、分析和记录管理',
    params: {
      market: '人工智能',
      region: '全球',
      timeRange: '2026-Q1',
      reportFormat: 'pdf'
    },
    subtasks: [
      {
        title: '收集市场数据',
        description: '使用网页搜索工具收集最新的AI市场数据',
        type: 'model_tool_call', // 大模型工具调用
        modelToolCall: {
          type: 'web_search',
          parameters: {
            query: '2026年第一季度全球人工智能市场规模和趋势',
            limit: 5,
            language: 'zh'
          }
        }
      },
      {
        title: '分析市场趋势',
        description: '基于收集的数据进行市场趋势分析',
        type: 'llm_execution', // 大模型自行执行
        instructions: [
          '分析收集到的市场数据',
          '识别主要市场趋势和增长点',
          '分析竞争格局',
          '预测未来3-6个月的市场发展方向',
          '生成详细的分析报告'
        ]
      },
      {
        title: '创建市场分析记录',
        description: '将分析结果创建为系统记录',
        type: 'system_function', // 系统内函数调用
        functionCall: {
          name: 'createRecord',
          arguments: {
            type: 'report',
            title: '2026年Q1全球AI市场分析报告',
            content: '【市场分析报告内容将由大模型生成】',
            tags: ['市场', '分析', '人工智能', '2026-Q1']
          }
        }
      },
      {
        title: '获取相关记录',
        description: '查询系统中相关的市场分析记录',
        type: 'system_function', // 系统内函数调用
        functionCall: {
          name: 'getRecordList',
          arguments: {
            type: 'report',
            tags: ['市场', '人工智能'],
            limit: 5
          }
        }
      },
      {
        title: '生成最终报告',
        description: '基于所有信息生成最终的市场分析报告',
        type: 'llm_execution', // 大模型自行执行
        instructions: [
          '整合所有收集到的信息',
          '结合系统中已有的相关记录',
          '生成一份全面的市场分析报告',
          '报告应包括：市场规模、增长趋势、竞争格局、主要玩家、技术发展、未来预测等章节',
          '提供具体的数据支持和分析见解'
        ]
      }
    ]
  };
  
  console.log('任务数据:', JSON.stringify(taskData, null, 2));
  
  // 模拟AI响应格式 - 工具调用
  const aiResponse = {
    choices: [
      {
        message: {
          content: '好的，我来帮你创建一个市场分析与报告生成的综合任务。',
          tool_calls: [
            {
              id: 'tool_call_1',
              type: 'function',
              function: {
                name: 'createTask',
                arguments: JSON.stringify(taskData)
              }
            }
          ]
        }
      }
    ]
  };
  
  console.log('\n模拟AI响应:', JSON.stringify(aiResponse, null, 2));
  
  // 模拟任务执行流程
  const executionFlow = {
    taskId: 'task-' + Date.now(),
    steps: [
      {
        step: 1,
        name: '收集市场数据',
        type: 'model_tool_call',
        status: 'completed',
        result: '已收集5条关于2026年Q1全球AI市场的最新信息'
      },
      {
        step: 2,
        name: '分析市场趋势',
        type: 'llm_execution',
        status: 'completed',
        result: '已完成市场趋势分析，识别出5个主要趋势'
      },
      {
        step: 3,
        name: '创建市场分析记录',
        type: 'system_function',
        status: 'completed',
        result: '已创建市场分析记录，ID: record-20260201-001'
      },
      {
        step: 4,
        name: '获取相关记录',
        type: 'system_function',
        status: 'completed',
        result: '已获取3条相关的市场分析记录'
      },
      {
        step: 5,
        name: '生成最终报告',
        type: 'llm_execution',
        status: 'completed',
        result: '已生成完整的市场分析报告'
      }
    ]
  };
  
  console.log('\n模拟任务执行流程:', JSON.stringify(executionFlow, null, 2));
  
  // 模拟最终AI响应
  const finalAIResponse = {
    choices: [
      {
        message: {
          content: `任务执行完成！我已为你完成了市场分析与报告生成的综合任务。\n\n执行结果：\n• 收集了5条关于2026年Q1全球AI市场的最新信息\n• 分析识别出5个主要市场趋势\n• 创建了市场分析记录（ID: record-20260201-001）\n• 获取了3条相关的历史市场分析记录\n• 生成了完整的市场分析报告\n\n报告主要内容：\n1. 市场规模：全球AI市场在2026年Q1达到XX亿美元，同比增长XX%\n2. 主要趋势：生成式AI、多模态AI、行业大模型等\n3. 竞争格局：主要玩家市场份额分析\n4. 技术发展：最新技术突破和应用\n5. 未来预测：未来3-6个月市场发展方向\n\n报告已保存到系统中，你可以通过记录管理功能查看完整内容。`
        }
      }
    ]
  };
  
  console.log('\n模拟最终AI响应:');
  console.log(finalAIResponse.choices[0].message.content);
  
  // 保存示例到文件
  const exampleData = {
    taskData,
    aiResponse,
    executionFlow,
    finalAIResponse
  };
  
  fs.writeFileSync('comprehensive-task-example.json', JSON.stringify(exampleData, null, 2));
  console.log('\n示例已保存到 comprehensive-task-example.json');
  
  // 创建用户指令示例
  const userInstructions = [
    '帮我创建一个市场分析与报告生成的任务',
    '任务需要包含：收集最新市场数据、分析趋势、创建系统记录、查询相关历史记录、生成最终报告',
    '市场分析的主题是人工智能，时间范围是2026年第一季度，全球范围',
    '报告格式需要是PDF'
  ];
  
  console.log('\n=== 用户指令示例 ===');
  userInstructions.forEach((instruction, index) => {
    console.log(`${index + 1}. ${instruction}`);
  });
  
  // 保存用户指令示例
  fs.writeFileSync('user-instructions-example.txt', userInstructions.join('\n'));
  console.log('\n用户指令示例已保存到 user-instructions-example.txt');
  
  return exampleData;
}

// 运行函数
const exampleData = createComprehensiveTaskExample();

console.log('\n=== 示例总结 ===');
console.log('此示例包含三种类型的操作：');
console.log('1. 系统内函数调用：createRecord、getRecordList');
console.log('2. 大模型工具调用：web_search（网页搜索）');
console.log('3. 大模型自行执行：市场趋势分析、最终报告生成');
console.log('\n示例文件已生成，可用于测试和参考。');
