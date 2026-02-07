/**
 * 认证控制器测试
 */
const { sendCode, loginWithCode, loginWithPassword } = require('./authController');
const User = require('../models/User');
const { BadRequestError, ConflictError } = require('../utils/customErrors');

describe('认证控制器测试', () => {
  let req, res, next;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      body: {},
      user: { _id: 'test-user-id' }
    };
    
    // 模拟响应对象
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // 模拟 next 函数
    next = jest.fn();
    
    // 清除所有 mock
    jest.clearAllMocks();
  });
  
  describe('发送验证码', () => {
    it('当未提供手机号码时，应该调用 next 并传递 BadRequestError', async () => {
      req.body = {};
      
      await sendCode(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('请提供手机号码');
    });
    
    it('当提供了手机号码时，应该返回成功响应', async () => {
      req.body = { phone: '13800138000' };
      
      await sendCode(req, res, next);
      
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '验证码发送成功',
        data: expect.objectContaining({
          phone: '13800138000',
          expireAt: expect.any(Number)
        })
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('验证码登录', () => {
    it('当未提供手机号码或验证码时，应该调用 next 并传递 BadRequestError', async () => {
      req.body = {};
      
      await loginWithCode(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('请提供手机号码和验证码');
    });
    
    it('当提供了测试账号和正确的验证码时，应该返回成功响应', async () => {
      req.body = { phone: '13800138000', code: '123456' };
      
      // 模拟 User.findOne 和 User.create
      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue({
        _id: 'test-user-id',
        phone: '13800138000',
        nickname: '用户8000'
      });
      
      await loginWithCode(req, res, next);
      
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].status).toBe('ok');
      expect(res.json.mock.calls[0][0].message).toBe('登录成功');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('token');
      expect(res.json.mock.calls[0][0].data).toHaveProperty('user');
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('密码登录', () => {
    it('当未提供用户名或密码时，应该调用 next 并传递 BadRequestError', async () => {
      req.body = {};
      
      await loginWithPassword(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(BadRequestError);
      expect(next.mock.calls[0][0].message).toBe('请提供用户名和密码');
    });
  });
});
