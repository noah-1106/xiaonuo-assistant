const AIService = require('./backend/src/services/aiService');
const AISetting = require('./backend/src/models/AISetting');

async function testAIResponse() {
  try {
    console.log('开始测试AI响应...');
    
    // 初始化AI服务
    const aiService = new AIService();
    
    // 获取AI设置
    const aiSetting = await AISetting.findOne();
    if (!aiSetting) {
      console.error('没有找到AI设置');
      return;
    }
    
    // 初始化模型适配器
    await aiService.initModelAdapter(aiSetting);
    
    // 测试消息
    const testMessage = '删除和喂猫有关的记录';
    
    // 构建消息格式
    const messages = [
      {
        role: 'system',
        content: '你是一个智能助理，需要帮助用户完成各种任务。当用户请求删除记录时，你需要创建一个任务来执行这个操作。'
      },
      {
        role: 'user',
        content: testMessage
      }
    ];
    
    // 定义可用的函数
    const functions = [
      {
        name: 'createTask',
        description: '创建一个新任务',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: '任务标题'
            },
            description: {
              type: 'string',
              description: '任务描述'
            },
            subtasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: '子任务标题'
                  },
                  description: {
                    type: 'string',
                    description: '子任务描述'
                  }
                },
                required: ['title', 'description']
              },
              description: '子任务列表'
            }
          },
          required: ['title', 'description']
        }
      }
    ];
    
    console.log('发送测试请求给AI...');
    console.log('测试消息:', testMessage);
    
    // 调用AI服务
    const response = await aiService.callAI(messages, functions, true);
    
    console.log('\n=== AI原始响应 ===');
    console.log(JSON.stringify(response, null, 2));
    
    // 解析AI响应
    const parsedResponse = aiService.parseAIResponse(response);
    
    console.log('\n=== 解析后的AI响应 ===');
    console.log(JSON.stringify(parsedResponse, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

testAIResponse();
