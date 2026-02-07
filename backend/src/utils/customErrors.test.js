/**
 * 自定义错误类测试
 */
const { 
  AppError, 
  BadRequestError, 
  UnauthorizedError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} = require('./customErrors');

describe('自定义错误类测试', () => {
  describe('AppError 基础类', () => {
    it('应该创建带有正确属性的 AppError 实例', () => {
      const message = '测试错误信息';
      const statusCode = 500;
      const error = new AppError(message, statusCode);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.name).toBe('AppError');
    });
  });
  
  describe('BadRequestError', () => {
    it('应该创建带有默认消息和状态码 400 的错误', () => {
      const error = new BadRequestError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('请求参数错误');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
    });
    
    it('应该创建带有自定义消息和状态码 400 的错误', () => {
      const message = '自定义请求错误';
      const error = new BadRequestError(message);
      
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
    });
  });
  
  describe('UnauthorizedError', () => {
    it('应该创建带有默认消息和状态码 401 的错误', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('未授权访问');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });
  });
  
  describe('ForbiddenError', () => {
    it('应该创建带有默认消息和状态码 403 的错误', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('禁止访问');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });
  });
  
  describe('NotFoundError', () => {
    it('应该创建带有默认消息和状态码 404 的错误', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('资源不存在');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });
  
  describe('ConflictError', () => {
    it('应该创建带有默认消息和状态码 409 的错误', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('资源冲突');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });
});
