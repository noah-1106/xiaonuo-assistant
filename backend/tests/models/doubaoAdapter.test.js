/**
 * 豆包模型适配器单元测试
 */
const DoubaoAdapter = require('../../src/models/doubaoAdapter');
const axios = require('axios');

// 模拟axios
jest.mock('axios');

describe('DoubaoAdapter', () => {
  let doubaoAdapter;
  const mockConfig = {
    model: 'doubao-seed-1-8-251228',
    apiKey: 'test-api-key',
    temperature: 0.8,
    topP: 0.95
  };

  beforeEach(() => {
    doubaoAdapter = new DoubaoAdapter(mockConfig);
    // 重置模拟
    jest.clearAllMocks();
  });

  test('应该初始化配置', () => {
    expect(doubaoAdapter.config).toEqual(mockConfig);
    expect(doubaoAdapter.model).toBe('doubao-seed-1-8-251228');
    expect(doubaoAdapter.apiKey).toBe('test-api-key');
  });

  test('getHeaders方法应该返回正确的headers', () => {
    const headers = doubaoAdapter.getHeaders();
    expect(headers).toEqual({
      'Authorization': 'Bearer test-api-key',
      'Content-Type': 'application/json'
    });
  });

  test('getCapabilities方法应该返回正确的能力', () => {
    const capabilities = doubaoAdapter.getCapabilities();
    expect(capabilities).toEqual({
      text: true,
      image: true,
      video: true,
      file: true,
      tools: ['web_search']
    });
  });

  test('supports方法应该返回正确的能力状态', () => {
    expect(doubaoAdapter.supports('text')).toBe(true);
    expect(doubaoAdapter.supports('image')).toBe(true);
    expect(doubaoAdapter.supports('video')).toBe(true);
    expect(doubaoAdapter.supports('file')).toBe(true);
    expect(doubaoAdapter.supports('unknown')).toBe(false);
  });

  test('parseAIResponse方法应该解析Chat Completions API响应', () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Hello, world!'
        }
      }]
    };
    const result = doubaoAdapter.parseAIResponse(mockResponse);
    expect(result).toEqual({
      type: 'text',
      content: 'Hello, world!'
    });
  });

  test('parseAIResponse方法应该解析函数调用响应', () => {
    const mockResponse = {
      choices: [{
        message: {
          function_call: {
            name: 'web_search',
            arguments: '{"query":"test"}'
          }
        }
      }]
    };
    const result = doubaoAdapter.parseAIResponse(mockResponse);
    expect(result).toEqual({
      type: 'function_call',
      functionName: 'web_search',
      functionArgs: { query: 'test' },
      content: undefined
    });
  });

  test('parseAIResponse方法应该解析Responses API响应', () => {
    const mockResponse = {
      output: [{
        type: 'message',
        content: 'Hello from Responses API'
      }]
    };
    const result = doubaoAdapter.parseAIResponse(mockResponse);
    expect(result).toEqual({
      type: 'text',
      content: 'Hello from Responses API'
    });
  });

  test('parseAIResponse方法应该处理未知响应格式', () => {
    const mockResponse = {};
    const result = doubaoAdapter.parseAIResponse(mockResponse);
    expect(result).toEqual({
      type: 'error',
      content: 'AI响应解析失败'
    });
  });
});
