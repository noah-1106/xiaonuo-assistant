// 模拟构建"我是谁？"消息的请求体过程
const { db } = require('./src/config');

// 模拟DoubaoAdapter的配置
const mockConfig = {
  model: 'doubao-seed-1-8-251228',
  apiKey: 'mock-api-key',
  temperature: 0.8,
  topP: 0.95,
  chatBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  responsesBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3/responses',
  filesBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3/files'
};

// 模拟用户消息
const userMessage = '我是谁？';

// 模拟上下文（首次对话，可能包含系统提示词）
const mockContext = [
  {
    role: 'system',
    content: '你是小诺，一个智能助手，帮助用户解决问题，提供友好的回答。'
  }
];

// 模拟functions参数（空）
const mockFunctions = [];

// 模拟userId
const mockUserId = '697792dd2cd5890d4d9fd04b';

// 模拟previousResponseId（首次对话，为空）
const mockPreviousResponseId = null;

// 模拟needsWebSearch方法
function needsWebSearch(text) {
  const searchKeywords = [
    '搜索', '查询', '查找', '搜索一下', '帮我搜索',
    '百度', '谷歌', 'bing', '搜索', '网络搜索',
    '最近', '最新', '今天', '昨天', '现在',
    '天气', '新闻', '股价', '比赛结果', '当前',
    'can you search', 'search for', 'find', 'look up',
    'what is the', 'what are the', 'who is', 'when is'
  ];
  
  const lowerText = text.toLowerCase();
  return searchKeywords.some(keyword => lowerText.includes(keyword));
}

// 模拟构建请求体的过程
function simulateRequestBodyConstruction() {
  console.log('📝 开始模拟构建请求体过程');
  console.log('----------------------------------------');
  console.log('用户消息:', userMessage);
  console.log('是否需要web搜索:', needsWebSearch(userMessage));
  console.log('----------------------------------------');
  
  // 提取系统提示词
  let instructions = null;
  if (!mockPreviousResponseId && mockContext && Array.isArray(mockContext)) {
    const systemMessages = mockContext.filter(msg => msg.role === 'system');
    if (systemMessages.length > 0) {
      instructions = systemMessages.map(msg => msg.content).join('\n\n');
      console.log('提取到系统提示词:', instructions);
    }
  }
  
  console.log('----------------------------------------');
  
  // 构建input消息
  const inputMessages = [{
    type: 'message',
    role: 'user',
    content: userMessage
  }];
  console.log('构建的input消息:', JSON.stringify(inputMessages, null, 2));
  
  console.log('----------------------------------------');
  
  // 构建请求体
  const body = {
    model: mockConfig.model,
    input: inputMessages,
    stream: true
  };
  
  // 添加系统提示词
  if (instructions) {
    body.instructions = instructions;
  }
  
  // 添加previousResponseId
  if (mockPreviousResponseId) {
    body.previous_response_id = mockPreviousResponseId;
  }
  
  // 添加functions
  if (mockFunctions && mockFunctions.length > 0) {
    body.tools = mockFunctions.map(func => ({
      type: 'function',
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }
    }));
  }
  
  console.log('最终构建的请求体:');
  console.log(JSON.stringify(body, null, 2));
  
  console.log('----------------------------------------');
  console.log('请求体大小:', JSON.stringify(body).length, '字符');
  console.log('📝 模拟构建请求体过程完成');
  
  return body;
}

// 运行模拟
const requestBody = simulateRequestBodyConstruction();

// 导出结果
module.exports = { requestBody };
