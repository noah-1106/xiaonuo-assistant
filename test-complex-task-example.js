// 复杂任务示例 - 包含多个子任务和工具调用
// 此示例展示如何创建一个包含多个子任务的复杂任务，每个子任务都使用系统函数

const axios = require('axios');
const fs = require('fs');

// 测试创建复杂任务
async function testCreateComplexTask() {
  console.log('=== 测试创建复杂任务 ===');
  
  try {
    // 准备任务数据
    const taskData = {
      title: '项目报告生成与管理',
      description: '生成项目进度报告并进行相关管理操作',
      params: {
        projectId: 'proj-2026-001',
        format: 'pdf'
      },
      subtasks: [
        {
          title: '收集项目数据',
          description: '获取项目的最新进度数据',
          functionCall: {
            name: 'getRecordList',
            arguments: {
              type: 'project',
              tags: ['进度'],
              limit: 10
            }
          }
        },
        {
          title: '创建报告记录',
          description: '基于收集的数据创建报告记录',
          functionCall: {
            name: 'createRecord',
            arguments: {
              type: 'report',
              title: '2026年项目进度报告',
              content: '项目进度报告内容：\n1. 项目完成度：75%\n2. 已完成任务：15个\n3. 剩余任务：5个\n4. 预计完成时间：2026年3月\n5. 风险评估：低',
              tags: ['项目', '报告', '进度']
            }
          }
        },
        {
          title: '创建后续任务',
          description: '为项目剩余工作创建任务',
          functionCall: {
            name: 'createTask',
            arguments: {
              title: '完成项目收尾工作',
              description: '完成项目的剩余5个任务',
              subtasks: [
                {
                  title: '完成文档编写',
                  description: '编写项目最终文档'
                },
                {
                  title: '进行项目测试',
                  description: '进行全面的项目测试'
                },
                {
                  title: '准备项目验收',
                  description: '准备项目验收材料'
                }
              ]
            }
          }
        },
        {
          title: '获取任务列表',
          description: '验证新创建的任务是否成功',
          functionCall: {
            name: 'getTaskList',
            arguments: {
              limit: 5
            }
          }
        }
      ]
    };
    
    console.log('任务数据:', JSON.stringify(taskData, null, 2));
    
    // 模拟AI响应格式 - 工具调用
    const aiResponse = {
      choices: [
        {
          message: {
            content: '好的，我来帮你创建一个项目报告生成与管理的任务。',
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
    
    // 保存示例到文件
    fs.writeFileSync('complex-task-example.json', JSON.stringify({
      taskData,
      aiResponse
    }, null, 2));
    
    console.log('\n示例已保存到 complex-task-example.json');
    
    // 模拟函数调用处理流程
    console.log('\n=== 模拟函数调用处理流程 ===');
    
    // 1. 解析AI响应
    const toolCall = aiResponse.choices[0].message.tool_calls[0];
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    
    console.log('1. 解析工具调用:');
    console.log('   函数名:', functionName);
    console.log('   参数:', JSON.stringify(functionArgs, null, 2));
    
    // 2. 执行函数调用
    console.log('\n2. 执行函数调用:');
    console.log('   创建复杂任务...');
    console.log('   任务标题:', functionArgs.title);
    console.log('   子任务数量:', functionArgs.subtasks.length);
    
    // 3. 模拟执行结果
    const mockTaskId = 'task-' + Date.now();
    
    console.log('\n3. 执行结果:');
    console.log('   任务创建成功');
    console.log('   任务ID:', mockTaskId);
    console.log('   任务状态: 待执行');
    console.log('   子任务数量:', functionArgs.subtasks.length);
    
    // 4. 模拟AI最终响应
    const finalAIResponse = {
      choices: [
        {
          message: {
            content: `任务创建成功！我已为你创建了一个包含${functionArgs.subtasks.length}个子任务的复杂任务。\n\n任务详情：\n• 标题：${functionArgs.title}\n• 描述：${functionArgs.description}\n• 任务ID：${mockTaskId}\n• 状态：待执行\n\n子任务列表：\n${functionArgs.subtasks.map((subtask, index) => `• ${index + 1}. ${subtask.title} - ${subtask.description}`).join('\n')}\n\n你可以使用 executeTask 函数来执行这个任务。`
          }
        }
      ]
    };
    
    console.log('\n4. 模拟AI最终响应:');
    console.log(finalAIResponse.choices[0].message.content);
    
    // 保存执行流程到文件
    fs.writeFileSync('complex-task-execution-flow.json', JSON.stringify({
      taskData,
      aiResponse,
      executionSteps: [
        {
          step: 1,
          description: '解析AI响应',
          result: '成功解析工具调用指令'
        },
        {
          step: 2,
          description: '执行函数调用',
          result: '成功创建复杂任务'
        },
        {
          step: 3,
          description: '生成执行结果',
          result: `任务创建成功，ID: ${mockTaskId}`
        },
        {
          step: 4,
          description: '返回AI响应',
          result: '成功返回任务创建结果'
        }
      ],
      finalAIResponse
    }, null, 2));
    
    console.log('\n执行流程已保存到 complex-task-execution-flow.json');
    
  } catch (error) {
    console.error('测试出错:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testCreateComplexTask();
