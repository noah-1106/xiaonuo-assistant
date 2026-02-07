const taskService = require('../services/taskService');
const taskQueueService = require('../services/taskQueueService');
const { NotFoundError, ForbiddenError } = require('../utils/customErrors');

/**
 * 获取用户的任务列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getUserTasks = async (req, res) => {
  const { status, type, limit } = req.query;
  
  try {
    const tasks = await taskService.getUserTasks(req.user._id, {
      status,
      type,
      limit: parseInt(limit) || 50
    });
    
    res.json({
      status: 'ok',
      message: '获取任务列表成功',
      data: tasks
    });
  } catch (error) {
    console.error('获取任务列表失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '获取任务列表失败: ' + error.message
    });
  }
};

/**
 * 获取任务详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getTaskDetail = async (req, res) => {
  const { id } = req.params;
  
  try {
    const task = await taskService.getTaskDetail(id, req.user._id);
    
    res.json({
      status: 'ok',
      message: '获取任务详情成功',
      data: task
    });
  } catch (error) {
    console.error('获取任务详情失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '获取任务详情失败: ' + error.message
    });
  }
};

/**
 * 创建任务
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.createTask = async (req, res) => {
  const { type, title, description, params, sessionId } = req.body;
  
  try {
    const task = await taskService.createTask(req.user._id, {
      type,
      title,
      description,
      params,
      sessionId
    });
    
    res.json({
      status: 'ok',
      message: '创建任务成功',
      data: task
    });
  } catch (error) {
    console.error('创建任务失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '创建任务失败: ' + error.message
    });
  }
};

/**
 * 执行任务
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.executeTask = async (req, res) => {
  const { id } = req.params;
  
  try {
    // 验证任务存在且属于当前用户
    const task = await taskService.getTaskDetail(id, req.user._id);
    
    // 添加任务到队列
    const queueResult = await taskQueueService.addTask(id);
    
    res.json({
      status: 'ok',
      message: queueResult.message,
      data: {
        taskId: id,
        status: queueResult.status,
        queueLength: queueResult.queueLength,
        taskInfo: {
          title: task.title,
          description: task.description,
          subtaskCount: task.subtasks ? task.subtasks.length : 0
        }
      }
    });
  } catch (error) {
    console.error('执行任务失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '执行任务失败: ' + error.message
    });
  }
};

/**
 * 取消任务
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.cancelTask = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await taskService.cancelTask(id, req.user._id);
    
    res.json({
      status: 'ok',
      message: '取消任务成功',
      data: result
    });
  } catch (error) {
    console.error('取消任务失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '取消任务失败: ' + error.message
    });
  }
};

/**
 * 批量执行任务
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.batchExecuteTasks = async (req, res) => {
  const { taskIds } = req.body;
  
  if (!taskIds || !Array.isArray(taskIds)) {
    return res.status(400).json({ 
      status: 'error',
      message: '缺少有效的任务ID列表'
    });
  }
  
  try {
    const results = [];
    
    for (const taskId of taskIds) {
      try {
        // 验证任务存在且属于当前用户
        await taskService.getTaskDetail(taskId, req.user._id);
        
        // 添加任务到队列
        const queueResult = await taskQueueService.addTask(taskId);
        
        results.push({
          taskId,
          status: queueResult.status,
          message: queueResult.message,
          queueLength: queueResult.queueLength
        });
      } catch (error) {
        results.push({
          taskId,
          status: 'error',
          message: error.message
        });
      }
    }
    
    res.json({
      status: 'ok',
      message: '批量执行任务已添加到队列',
      data: results
    });
  } catch (error) {
    console.error('批量执行任务失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '批量执行任务失败: ' + error.message
    });
  }
};

/**
 * 更新任务反馈
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  
  try {
    const result = await taskService.updateFeedback(id, req.user._id, { rating, comment });
    
    res.json({
      status: 'ok',
      message: '更新任务反馈成功',
      data: result
    });
  } catch (error) {
    console.error('更新任务反馈失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '更新任务反馈失败: ' + error.message
    });
  }
};