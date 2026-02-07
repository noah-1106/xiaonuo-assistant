/**
 * 聊天控制器测试 - 简化版
 */
const aiService = require('../services/aiService');
const { ForbiddenError } = require('../utils/customErrors');

// 模拟依赖模块
jest.mock('../services/aiService');

// 直接在 jest.mock 内部定义模拟实现，避免变量提升问题

// 模拟 ChatSession 模型
jest.mock('../models/ChatSession', () => {
  const mockInstance = {
    roles: {
      baseRole: 'basic',
      enhancedRole: null
    },
    save: jest.fn().mockResolvedValue({ 
      _id: 'session-1', 
      sessionId: 'new-session-id',
      roles: {
        baseRole: 'basic',
        enhancedRole: null
      }
    })
  };
  
  const mockConstructor = jest.fn().mockImplementation(() => mockInstance);
  mockConstructor.findOne = jest.fn().mockResolvedValue(null); // 初始返回null，触发创建新会话
  mockConstructor.prototype.save = mockInstance.save;
  
  return mockConstructor;
});

// 模拟 ChatMessage 模型
jest.mock('../models/ChatMessage', () => {
  const mockInstance = {
    save: jest.fn().mockResolvedValue({})
  };
  
  const mockConstructor = jest.fn().mockImplementation(() => mockInstance);
  mockConstructor.prototype.save = mockInstance.save;
  mockConstructor.countDocuments = jest.fn().mockResolvedValue(10); // 模拟消息数量为10
  
  return mockConstructor;
});

// 模拟 AISetting 模型
jest.mock('../models/AISetting', () => {
  const mock = {
    findOne: jest.fn().mockResolvedValue(null)
  };
  
  return mock;
});

// 模拟 Record 模型
jest.mock('../models/Record', () => {
  const mock = {
    save: jest.fn().mockResolvedValue({})
  };
  
  return mock;
});

// 在所有模拟完成后导入控制器
const {
  sendChatMessage
} = require('./chatController');

describe('聊天控制器测试', () => {
  let req, res, next;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      body: {
        message: '你好'
      },
      user: {
        _id: 'test-user-id',
        subscription: { status: 'subscribed' }
      }
    };
    
    // 模拟响应对象
    res = {
      json: jest.fn()
    };
    
    // 模拟 next 函数
    next = jest.fn();
    
    // 清除所有 mock
    jest.clearAllMocks();
  });
  
  describe('发送消息', () => {
    it('当用户订阅已过期时，应该抛出 ForbiddenError', async () => {
      req.user.subscription.status = 'expired';
      
      // 使用 try-catch 捕获直接抛出的错误
      await expect(sendChatMessage(req, res, next)).rejects.toThrow(ForbiddenError);
    });
    
    it('当用户发送消息时，应该调用 aiService.callAI', async () => {
      // 模拟 aiService.callAI 返回结果
      aiService.callAI.mockResolvedValue({
        choices: [{
          message: {
            content: 'AI响应内容'
          }
        }]
      });
      
      aiService.parseAIResponse.mockReturnValue({
        type: 'text',
        content: 'AI响应内容'
      });
      
      aiService.getCombinedPrompt.mockResolvedValue('系统提示词');
      
      // 直接模拟模块，避免构造函数问题
      jest.mock('../models/ChatSession', () => {
        const mockSession = {
          save: jest.fn().mockResolvedValue({ _id: 'session-1', sessionId: 'new-session-id' })
        };
        
        const mock = jest.fn().mockReturnValue(mockSession);
        mock.findOne = jest.fn().mockResolvedValue(mockSession);
        mock.save = mockSession.save;
        
        return mock;
      });
      
      jest.mock('../models/ChatMessage', () => {
        const mockMessage = {
          save: jest.fn().mockResolvedValue({})
        };
        
        const mock = jest.fn().mockReturnValue(mockMessage);
        mock.save = mockMessage.save;
        
        return mock;
      });
      
      await sendChatMessage(req, res, next);
      
      // 验证 aiService.callAI 被调用
      expect(aiService.callAI).toHaveBeenCalled();
    });
  });
});
