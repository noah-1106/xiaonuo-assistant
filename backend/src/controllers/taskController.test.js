/**
 * 任务控制器测试
 */
const taskController = require('./taskController');
const taskService = require('../services/taskService');

jest.mock('../services/taskService');

describe('任务控制器测试', () => {
  let req, res, next;
  
  beforeEach(() => {
    // 模拟请求对象
    req = {
      body: {},
      query: {},
      params: {},
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
  
  describe('获取用户任务列表', () => {
    it('当调用成功时，应该返回任务列表', async () => {
      const mockTasks = [{ _id: 'task1', title: '任务1' }, { _id: 'task2', title: '任务2' }];
      taskService.getUserTasks.mockResolvedValue(mockTasks);
      
      req.query = { status: 'pending', limit: '10' };
      
      await taskController.getUserTasks(req, res, next);
      
      expect(taskService.getUserTasks).toHaveBeenCalledWith('test-user-id', {
        status: 'pending',
        type: undefined,
        limit: 10
      });
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '获取任务列表成功',
        data: mockTasks
      });
    });
    
    it('当调用失败时，应该返回错误响应', async () => {
      const error = new Error('获取任务列表失败');
      taskService.getUserTasks.mockRejectedValue(error);
      
      await taskController.getUserTasks(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '获取任务列表失败: 获取任务列表失败'
      });
    });
  });
  
  describe('获取任务详情', () => {
    it('当调用成功时，应该返回任务详情', async () => {
      const mockTask = { _id: 'task1', title: '任务1', description: '任务描述' };
      taskService.getTaskDetail.mockResolvedValue(mockTask);
      
      req.params = { id: 'task1' };
      
      await taskController.getTaskDetail(req, res, next);
      
      expect(taskService.getTaskDetail).toHaveBeenCalledWith('task1', 'test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '获取任务详情成功',
        data: mockTask
      });
    });
    
    it('当调用失败时，应该返回错误响应', async () => {
      const error = new Error('获取任务详情失败');
      taskService.getTaskDetail.mockRejectedValue(error);
      
      req.params = { id: 'task1' };
      
      await taskController.getTaskDetail(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '获取任务详情失败: 获取任务详情失败'
      });
    });
  });
  
  describe('创建任务', () => {
    it('当调用成功时，应该返回创建的任务', async () => {
      const mockTask = { _id: 'task1', title: '任务1', status: 'pending' };
      taskService.createTask.mockResolvedValue(mockTask);
      
      req.body = {
        type: 'test',
        title: '任务1',
        description: '任务描述',
        params: { key: 'value' },
        sessionId: 'session1'
      };
      
      await taskController.createTask(req, res, next);
      
      expect(taskService.createTask).toHaveBeenCalledWith('test-user-id', {
        type: 'test',
        title: '任务1',
        description: '任务描述',
        params: { key: 'value' },
        sessionId: 'session1'
      });
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '创建任务成功',
        data: mockTask
      });
    });
    
    it('当调用失败时，应该返回错误响应', async () => {
      const error = new Error('创建任务失败');
      taskService.createTask.mockRejectedValue(error);
      
      req.body = {
        title: '任务1'
      };
      
      await taskController.createTask(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '创建任务失败: 创建任务失败'
      });
    });
  });
  
  describe('执行任务', () => {
    it('当调用成功时，应该返回执行结果', async () => {
      const mockResult = { success: true, data: '执行结果' };
      taskService.executeTask.mockResolvedValue(mockResult);
      
      req.params = { id: 'task1' };
      
      await taskController.executeTask(req, res, next);
      
      expect(taskService.executeTask).toHaveBeenCalledWith('task1');
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '执行任务成功',
        data: mockResult
      });
    });
    
    it('当调用失败时，应该返回错误响应', async () => {
      const error = new Error('执行任务失败');
      taskService.executeTask.mockRejectedValue(error);
      
      req.params = { id: 'task1' };
      
      await taskController.executeTask(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '执行任务失败: 执行任务失败'
      });
    });
  });
  
  describe('取消任务', () => {
    it('当调用成功时，应该返回取消结果', async () => {
      const mockResult = { success: true, message: '任务已取消' };
      taskService.cancelTask.mockResolvedValue(mockResult);
      
      req.params = { id: 'task1' };
      
      await taskController.cancelTask(req, res, next);
      
      expect(taskService.cancelTask).toHaveBeenCalledWith('task1', 'test-user-id');
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '取消任务成功',
        data: mockResult
      });
    });
    
    it('当调用失败时，应该返回错误响应', async () => {
      const error = new Error('取消任务失败');
      taskService.cancelTask.mockRejectedValue(error);
      
      req.params = { id: 'task1' };
      
      await taskController.cancelTask(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '取消任务失败: 取消任务失败'
      });
    });
  });
  
  describe('批量执行任务', () => {
    it('当未提供任务ID列表时，应该返回400错误', async () => {
      req.body = {};
      
      await taskController.batchExecuteTasks(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '缺少有效的任务ID列表'
      });
    });
    
    it('当任务ID列表不是数组时，应该返回400错误', async () => {
      req.body = { taskIds: 'task1' };
      
      await taskController.batchExecuteTasks(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '缺少有效的任务ID列表'
      });
    });
    
    it('当批量执行成功时，应该返回执行结果', async () => {
      const mockResult1 = { success: true, data: '结果1' };
      const mockResult2 = { success: true, data: '结果2' };
      taskService.executeTask.mockResolvedValueOnce(mockResult1).mockResolvedValueOnce(mockResult2);
      
      req.body = { taskIds: ['task1', 'task2'] };
      
      await taskController.batchExecuteTasks(req, res, next);
      
      expect(taskService.executeTask).toHaveBeenCalledTimes(2);
      expect(taskService.executeTask).toHaveBeenNthCalledWith(1, 'task1');
      expect(taskService.executeTask).toHaveBeenNthCalledWith(2, 'task2');
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '批量执行任务完成',
        data: [
          {
            taskId: 'task1',
            status: 'success',
            result: mockResult1
          },
          {
            taskId: 'task2',
            status: 'success',
            result: mockResult2
          }
        ]
      });
    });
    
    it('当部分任务执行失败时，应该返回包含成功和失败结果的响应', async () => {
      const mockResult1 = { success: true, data: '结果1' };
      const error = new Error('执行失败');
      taskService.executeTask.mockResolvedValueOnce(mockResult1).mockRejectedValueOnce(error);
      
      req.body = { taskIds: ['task1', 'task2'] };
      
      await taskController.batchExecuteTasks(req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '批量执行任务完成',
        data: [
          {
            taskId: 'task1',
            status: 'success',
            result: mockResult1
          },
          {
            taskId: 'task2',
            status: 'error',
            message: '执行失败'
          }
        ]
      });
    });
  });
  
  describe('更新任务反馈', () => {
    it('当调用成功时，应该返回更新结果', async () => {
      const mockResult = { success: true, message: '反馈更新成功' };
      taskService.updateFeedback.mockResolvedValue(mockResult);
      
      req.params = { id: 'task1' };
      req.body = { rating: 5, comment: '很好' };
      
      await taskController.updateFeedback(req, res, next);
      
      expect(taskService.updateFeedback).toHaveBeenCalledWith('task1', 'test-user-id', {
        rating: 5,
        comment: '很好'
      });
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        message: '更新任务反馈成功',
        data: mockResult
      });
    });
    
    it('当调用失败时，应该返回错误响应', async () => {
      const error = new Error('更新反馈失败');
      taskService.updateFeedback.mockRejectedValue(error);
      
      req.params = { id: 'task1' };
      req.body = { rating: 5 };
      
      await taskController.updateFeedback(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: '更新任务反馈失败: 更新反馈失败'
      });
    });
  });
});
