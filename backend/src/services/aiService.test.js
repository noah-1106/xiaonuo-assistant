const axios = require('axios');

// 模拟axios
jest.mock('axios');
const mockAxios = axios;

// 模拟模型
jest.mock('../models/AISetting', () => ({
  findOne: jest.fn()
}));
const AISetting = require('../models/AISetting');

describe('AIService', () => {
  let AIService;
  let aiService;
  
  beforeEach(() => {
    // 重置模拟
    jest.clearAllMocks();
    
    // 清除所有相关环境变量
    delete process.env.AI_MODEL;
    delete process.env.ARK_API_KEY;
    delete process.env.AI_TEMPERATURE;
    delete process.env.AI_TOP_P;
    
    // 默认设置测试环境变量
    process.env.AI_MODEL = 'test-model';
    process.env.ARK_API_KEY = 'test-api-key';
    process.env.AI_TEMPERATURE = '0.7';
    process.env.AI_TOP_P = '0.9';
    
    // 清除模块缓存
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('./aiService')];
    
    // 重新导入模块
    const aiServiceModule = require('./aiService');
    AIService = aiServiceModule.constructor;
    aiService = aiServiceModule;
  });

  afterEach(() => {
    // 清除环境变量
    delete process.env.AI_MODEL;
    delete process.env.ARK_API_KEY;
    delete process.env.AI_TEMPERATURE;
    delete process.env.AI_TOP_P;
    
    // 清除模块缓存
    delete require.cache[require.resolve('../config')];
    delete require.cache[require.resolve('./aiService')];
  });

  describe('初始化', () => {
    it('should initialize with environment variables', () => {
      expect(aiService.model).toBe('test-model');
      expect(aiService.apiKey).toBe('test-api-key');
      expect(aiService.temperature).toBe(0.7);
      expect(aiService.topP).toBe(0.9);
    });

    it('should use default values for properties', () => {
      // 先导入AIService类
      const AIServiceClass = require('./aiService').constructor;
      
      // 创建一个新的AIService实例
      const service = new AIServiceClass();
      
      // 检查默认值设置
      const { ai: aiConfig } = require('../config');
      
      // 验证aiConfig中的默认值设置
      expect(aiConfig.model).toBeDefined();
      expect(aiConfig.apiKey).toBeDefined();
      expect(aiConfig.temperature).toBeDefined();
      expect(aiConfig.topP).toBeDefined();
      
      // 验证service实例使用了aiConfig中的值，注意温度和topP会进行类型转换
      expect(service.model).toBe(aiConfig.model);
      expect(service.apiKey).toBe(aiConfig.apiKey);
      // 温度和topP在构造函数中会被转换为数字类型
      expect(service.temperature).toBe(parseFloat(aiConfig.temperature));
      expect(service.topP).toBe(parseFloat(aiConfig.topP));
    });
  });

  describe('setParams', () => {
    it('should update parameters correctly', () => {
      // 创建一个全新的AIService实例进行测试
      const AIServiceClass = require('./aiService').constructor;
      const newAiService = new AIServiceClass();
      
      newAiService.setParams({
        model: 'new-model',
        apiKey: 'new-api-key',
        temperature: 0.5,
        topP: 0.8
      });
      
      expect(newAiService.model).toBe('new-model');
      expect(newAiService.apiKey).toBe('new-api-key');
      expect(newAiService.temperature).toBe(0.5);
      expect(newAiService.topP).toBe(0.8);
    });

    it('should update only provided parameters', () => {
      // 创建一个全新的AIService实例进行测试
      const AIServiceClass = require('./aiService').constructor;
      const newAiService = new AIServiceClass();
      
      // 手动设置初始值，确保测试的可靠性
      newAiService.model = 'test-model';
      newAiService.apiKey = 'test-api-key';
      newAiService.temperature = 0.7;
      newAiService.topP = 0.9;
      
      newAiService.setParams({
        model: 'new-model',
        temperature: 0.5
      });
      
      expect(newAiService.model).toBe('new-model');
      expect(newAiService.temperature).toBe(0.5);
      // 这些应该保持不变
      expect(newAiService.apiKey).toBe('test-api-key');
      expect(newAiService.topP).toBe(0.9);
    });
  });

  describe('getHeaders', () => {
    it('should return correct headers with API key', () => {
      // 创建一个全新的AIService实例进行测试
      const AIServiceClass = require('./aiService').constructor;
      const newAiService = new AIServiceClass();
      
      // 手动设置API key
      newAiService.apiKey = 'test-api-key';
      
      const headers = newAiService.getHeaders();
      
      expect(headers).toEqual({
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json'
      });
    });
  });

  describe('getCombinedPrompt', () => {
    it('should return default prompt when no AISetting found', async () => {
      AISetting.findOne.mockResolvedValue(null);
      
      const prompt = await aiService.getCombinedPrompt('base-role-id');
      
      expect(prompt).toBe('你是一个智能助手，叫做小诺，你需要帮助用户完成各种任务，包括创建记录、回答问题等。');
      expect(AISetting.findOne).toHaveBeenCalled();
    });

    it('should return combined prompt with system and efficiency assistant prompts', async () => {
      AISetting.findOne.mockResolvedValue({
        systemPrompt: '系统提示词',
        efficiencyAssistant: {
          prompt: '效率助手提示词'
        },
        enhancedRoles: []
      });
      
      const prompt = await aiService.getCombinedPrompt('base-role-id');
      
      expect(prompt).toBe('系统提示词\n\n效率助手提示词');
    });

    it('should include enhanced role prompt when provided', async () => {
      AISetting.findOne.mockResolvedValue({
        systemPrompt: '系统提示词',
        efficiencyAssistant: {
          prompt: '效率助手提示词'
        },
        enhancedRoles: [
          {
            id: 'enhanced-role-1',
            prompt: '增强角色提示词',
            isEnabled: true
          }
        ]
      });
      
      const prompt = await aiService.getCombinedPrompt('base-role-id', 'enhanced-role-1');
      
      expect(prompt).toBe('系统提示词\n\n效率助手提示词\n\n增强角色提示词');
    });
  });

  describe('getSessionRecordTypes', () => {
    it('should return default types when no AISetting found', async () => {
      AISetting.findOne.mockResolvedValue(null);
      
      const types = await aiService.getSessionRecordTypes();
      
      expect(types).toEqual(['todo', 'article', 'inspiration', 'other']);
    });

    it('should return combined types from efficiency assistant and enhanced role', async () => {
      AISetting.findOne.mockResolvedValue({
        efficiencyAssistant: {
          recordTypes: [
            { id: 'todo' },
            { id: 'article' }
          ]
        },
        enhancedRoles: [
          {
            id: 'enhanced-role-1',
            enhancedRecordTypes: [
              { id: 'project' },
              { id: 'meeting' }
            ],
            isEnabled: true
          }
        ]
      });
      
      const types = await aiService.getSessionRecordTypes('enhanced-role-1');
      
      expect(types).toEqual(['todo', 'article', 'project', 'meeting']);
    });

    it('should handle string recordTypes format', async () => {
      AISetting.findOne.mockResolvedValue({
        efficiencyAssistant: {
          recordTypes: 'todo, article, inspiration'
        },
        enhancedRoles: []
      });
      
      const types = await aiService.getSessionRecordTypes();
      
      expect(types).toEqual(['todo', 'article', 'inspiration']);
    });
  });

  describe('callAI', () => {
    it('should call chat completions API without tools', async () => {
      // 重置mock调用计数
      mockAxios.post.mockClear();
      
      // 创建一个全新的AIService实例进行测试
      const AIServiceClass = require('./aiService').constructor;
      const newAiService = new AIServiceClass();
      
      // 手动设置初始值
      newAiService.model = 'test-model';
      newAiService.apiKey = 'test-api-key';
      newAiService.temperature = 0.7;
      newAiService.topP = 0.9;
      
      AISetting.findOne.mockResolvedValue(null);
      mockAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: 'AI响应内容'
            }
          }]
        }
      });
      
      const messages = [
        { role: 'user', content: '你好' }
      ];
      
      const result = await newAiService.callAI(messages);
      
      // 检查调用次数
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      
      // 检查返回结果
      expect(result).toEqual({
        choices: [{
          message: {
            content: 'AI响应内容'
          }
        }]
      });
    });

    it('should call AI with functions when provided', async () => {
      // 重置mock调用计数
      mockAxios.post.mockClear();
      
      // 创建一个全新的AIService实例进行测试
      const AIServiceClass = require('./aiService').constructor;
      const newAiService = new AIServiceClass();
      
      AISetting.findOne.mockResolvedValue(null);
      mockAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              content: 'AI响应内容'
            }
          }]
        }
      });
      
      const messages = [
        { role: 'user', content: '你好' }
      ];
      
      const functions = [
        {
          name: 'test_function',
          description: '测试函数',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      ];
      
      const result = await newAiService.callAI(messages, functions);
      
      // 检查调用次数
      expect(mockAxios.post).toHaveBeenCalledTimes(1);
      
      // 检查返回结果
      expect(result).toEqual({
        choices: [{
          message: {
            content: 'AI响应内容'
          }
        }]
      });
    });
  });

  describe('parseAIResponse', () => {
    it('should parse text response from chat completions API', () => {
      const response = {
        choices: [{
          message: {
            content: 'AI文本响应'
          }
        }]
      };
      
      const result = aiService.parseAIResponse(response);
      
      expect(result).toEqual({
        type: 'text',
        content: 'AI文本响应'
      });
    });

    it('should parse function call response from chat completions API', () => {
      const response = {
        choices: [{
          message: {
            content: null,
            function_call: {
              name: 'test_function',
              arguments: '{"param1": "value1"}'
            }
          }
        }]
      };
      
      const result = aiService.parseAIResponse(response);
      
      expect(result).toEqual({
        type: 'function_call',
        functionName: 'test_function',
        functionArgs: { param1: 'value1' },
        content: null
      });
    });

    it('should parse text response from responses API', () => {
      const response = {
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: 'Responses API文本响应'
              }
            ]
          }
        ]
      };
      
      const result = aiService.parseAIResponse(response);
      
      expect(result).toEqual({
        type: 'text',
        content: 'Responses API文本响应'
      });
    });

    it('should return error for unknown response format', () => {
      const response = {
        unknownField: 'unknownValue'
      };
      
      const result = aiService.parseAIResponse(response);
      
      expect(result).toEqual({
        type: 'error',
        content: 'AI响应解析失败'
      });
    });
  });

  describe('formatMessages', () => {
    it('should format message history correctly', () => {
      const history = [
        {
          sender: 'user',
          content: '用户消息'
        },
        {
          sender: 'bot',
          content: '机器人消息'
        }
      ];
      
      const result = aiService.formatMessages(history);
      
      expect(result).toEqual([
        {
          role: 'user',
          content: '用户消息',
          name: 'user'
        },
        {
          role: 'assistant',
          content: '机器人消息',
          name: 'assistant'
        }
      ]);
    });
  });

  describe('processImageMessage', () => {
    it('should process image message correctly', async () => {
      const imageUrl = 'https://example.com/image.jpg';
      
      const result = await aiService.processImageMessage(imageUrl);
      
      expect(result).toEqual({
        type: 'image',
        content: imageUrl
      });
    });
  });

  describe('processLinkMessage', () => {
    it('should process link message correctly', async () => {
      const link = 'https://example.com';
      
      const result = await aiService.processLinkMessage(link);
      
      expect(result).toEqual({
        type: 'link',
        content: link
      });
    });
  });

  describe('processAttachmentMessage', () => {
    it('should process attachment message correctly', async () => {
      const attachment = {
        name: 'test-file.txt'
      };
      
      const result = await aiService.processAttachmentMessage(attachment);
      
      expect(result).toEqual({
        type: 'attachment',
        content: 'test-file.txt'
      });
    });
  });

  describe('executeToolCall', () => {
    it('should execute web_search tool correctly', async () => {
      const functionCall = {
        name: 'web_search',
        arguments: '{}'
      };
      
      const result = await aiService.executeToolCall(functionCall);
      
      expect(result).toEqual({
        search_results: [
          {
            title: '示例搜索结果1',
            url: 'https://example.com/1',
            content: '这是示例搜索结果1的内容摘要。'
          },
          {
            title: '示例搜索结果2',
            url: 'https://example.com/2',
            content: '这是示例搜索结果2的内容摘要。'
          }
        ]
      });
    });

    it('should return error for unknown tool', async () => {
      const functionCall = {
        name: 'unknown_tool',
        arguments: '{}'
      };
      
      const result = await aiService.executeToolCall(functionCall);
      
      expect(result).toEqual({
        error: '未知工具: unknown_tool'
      });
    });
  });
});