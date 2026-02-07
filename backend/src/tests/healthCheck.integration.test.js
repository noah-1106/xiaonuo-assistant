/**
 * 健康检查API集成测试
 * 测试健康检查端点是否正常工作
 */

// 在测试前加载环境变量
require('dotenv').config();

// 设置必要的环境变量（如果没有设置）
process.env.ARK_API_KEY = process.env.ARK_API_KEY || 'test-api-key';

const request = require('supertest');
const app = require('../index');

describe('健康检查API测试', () => {
  /**
   * 测试健康检查端点
   * @description 验证GET /api/health端点返回正确的状态码和响应数据
   */
  it('should return 200 status and health info when accessing /api/health', async () => {
    const response = await request(app).get('/api/health');
    
    // 验证响应状态码
    expect(response.status).toBe(200);
    
    // 验证响应数据结构
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    
    // 验证响应数据内容
    expect(response.body.status).toBe('ok');
    expect(response.body.message).toBe('小诺智能助理后端服务运行正常');
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });
});