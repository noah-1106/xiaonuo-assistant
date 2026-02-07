/**
 * 认证API集成测试
 * 测试认证相关端点是否正常工作
 */

// 在测试前加载环境变量
require('dotenv').config();

// 设置必要的环境变量（如果没有设置）
process.env.ARK_API_KEY = process.env.ARK_API_KEY || 'test-api-key';

const request = require('supertest');
const app = require('../index');

describe('认证API测试', () => {
  /**
   * 测试发送验证码端点
   * @description 验证POST /api/auth/send-code端点返回正确的状态码和响应数据
   */
  it('should return 400 status when phone is invalid', async () => {
    const response = await request(app)
      .post('/api/auth/send-code')
      .send({ phone: '123456' });
    
    // 验证响应状态码
    expect(response.status).toBe(400);
    
    // 验证响应数据结构
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    
    // 验证响应数据内容
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('验证失败');
  });

  /**
   * 测试获取当前用户信息端点
   * @description 验证GET /api/auth/me端点在没有认证时返回401状态
   */
  it('should return 401 status when accessing /api/auth/me without token', async () => {
    const response = await request(app).get('/api/auth/me');
    
    // 验证响应状态码
    expect(response.status).toBe(401);
    
    // 验证响应数据结构
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    
    // 验证响应数据内容
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('未授权访问');
  });

  /**
   * 测试用户名密码登录端点
   * @description 验证POST /api/auth/login-with-password端点在用户名密码错误时返回401状态
   */
  it('should return 401 status when login with invalid username and password', async () => {
    const response = await request(app)
      .post('/api/auth/login-with-password')
      .send({ username: 'testuser', password: 'wrongpassword' });
    
    // 验证响应状态码
    expect(response.status).toBe(401);
    
    // 验证响应数据结构
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    
    // 验证响应数据内容
    expect(response.body.status).toBe('error');
    expect(response.body.message).toBe('未授权访问');
  });
});