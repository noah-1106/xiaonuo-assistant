/**
 * 错误处理中间件测试
 */
const errorHandler = require('./errorHandler');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

describe('错误处理中间件测试', () => {
  let req, res, next;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      originalUrl: '/test',
      accepts: jest.fn().mockImplementation((type) => {
        // 根据不同的类型返回不同的值
        if (type === 'html') {
          return false; // 不接受HTML
        }
        return 'json'; // 接受JSON
      }),
      // 添加 get 方法，解决 req.get is not a function 错误
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      // 添加 ip 属性
      ip: '127.0.0.1',
      // 添加 url 属性
      url: '/test'
    };
    
    // 模拟响应对象
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    
    // 模拟 next 函数
    next = jest.fn();
  });
  
  describe('处理 API 请求错误', () => {
    it('应该返回 404 状态码和 JSON 格式的 NotFoundError 响应', () => {
      const error = new NotFoundError('资源不存在');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '资源不存在'
      });
    });
    
    it('应该返回 400 状态码和 JSON 格式的 BadRequestError 响应', () => {
      const error = new BadRequestError('请求参数错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '请求参数错误'
      });
    });
    
    it('应该返回 500 状态码和默认消息的服务器错误响应', () => {
      const error = new Error('服务器内部错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '服务器内部错误'
      });
    });
    
    it('开发环境下应该返回详细的错误信息', () => {
      // 保存原始环境变量
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new BadRequestError('请求参数错误');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '请求参数错误',
        error: '请求参数错误',
        stack: expect.any(String)
      });
      
      // 恢复环境变量
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
  
  describe('处理 HTML 请求错误', () => {
    it('应该返回 404 状态码和 HTML 格式的 NotFoundError 响应', () => {
      // 修改请求对象，使其接受 HTML
      req.accepts = jest.fn().mockReturnValue('html');
      
      const error = new NotFoundError('资源不存在');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();
      expect(typeof res.send.mock.calls[0][0]).toBe('string');
      expect(res.send.mock.calls[0][0]).toContain('<html');
    });
  });
});
