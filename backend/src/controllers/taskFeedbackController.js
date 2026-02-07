const taskFeedbackService = require('../services/taskFeedbackService');
const logger = require('../utils/logger');

/**
 * 创建任务反馈
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.createFeedback = async (req, res) => {
  const { taskId, feedbackType, rating, content, improvementSuggestions, problemSolved } = req.body;
  
  try {
    const feedback = await taskFeedbackService.createFeedback(req.user._id, {
      taskId,
      feedbackType,
      rating,
      content,
      improvementSuggestions,
      problemSolved
    });
    
    res.json({
      status: 'ok',
      message: '任务反馈创建成功',
      data: feedback
    });
  } catch (error) {
    logger.error('创建任务反馈失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '创建任务反馈失败: ' + error.message
    });
  }
};

/**
 * 获取任务的反馈
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getTaskFeedback = async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const feedbacks = await taskFeedbackService.getTaskFeedback(taskId);
    
    res.json({
      status: 'ok',
      message: '获取任务反馈成功',
      data: feedbacks
    });
  } catch (error) {
    logger.error('获取任务反馈失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '获取任务反馈失败: ' + error.message
    });
  }
};

/**
 * 获取用户的反馈历史
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getUserFeedbackHistory = async (req, res) => {
  const { limit, offset } = req.query;
  
  try {
    const result = await taskFeedbackService.getUserFeedbackHistory(req.user._id, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });
    
    res.json({
      status: 'ok',
      message: '获取用户反馈历史成功',
      data: result
    });
  } catch (error) {
    logger.error('获取用户反馈历史失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '获取用户反馈历史失败: ' + error.message
    });
  }
};

/**
 * 获取任务反馈统计
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getTaskFeedbackStats = async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const stats = await taskFeedbackService.getTaskFeedbackStats(taskId);
    
    res.json({
      status: 'ok',
      message: '获取任务反馈统计成功',
      data: stats
    });
  } catch (error) {
    logger.error('获取任务反馈统计失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '获取任务反馈统计失败: ' + error.message
    });
  }
};

/**
 * 更新反馈
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateFeedback = async (req, res) => {
  const { feedbackId } = req.params;
  const { feedbackType, rating, content, improvementSuggestions, problemSolved } = req.body;
  
  try {
    const feedback = await taskFeedbackService.updateFeedback(feedbackId, req.user._id, {
      feedbackType,
      rating,
      content,
      improvementSuggestions,
      problemSolved
    });
    
    res.json({
      status: 'ok',
      message: '更新任务反馈成功',
      data: feedback
    });
  } catch (error) {
    logger.error('更新任务反馈失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '更新任务反馈失败: ' + error.message
    });
  }
};

/**
 * 删除反馈
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.deleteFeedback = async (req, res) => {
  const { feedbackId } = req.params;
  
  try {
    await taskFeedbackService.deleteFeedback(feedbackId, req.user._id);
    
    res.json({
      status: 'ok',
      message: '删除任务反馈成功'
    });
  } catch (error) {
    logger.error('删除任务反馈失败:', error.message);
    res.status(500).json({
      status: 'error',
      message: '删除任务反馈失败: ' + error.message
    });
  }
};
