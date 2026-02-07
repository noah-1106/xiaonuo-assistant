const express = require('express');
const router = express.Router();
const taskFeedbackController = require('../controllers/taskFeedbackController');
const { authMiddleware } = require('../middleware/auth');

// 应用认证中间件
router.use(authMiddleware);

/**
 * 任务反馈相关路由
 */

// 创建任务反馈
router.post('/', taskFeedbackController.createFeedback);

// 获取任务的反馈
router.get('/task/:taskId', taskFeedbackController.getTaskFeedback);

// 获取用户的反馈历史
router.get('/user/history', taskFeedbackController.getUserFeedbackHistory);

// 获取任务反馈统计
router.get('/task/:taskId/stats', taskFeedbackController.getTaskFeedbackStats);

// 更新反馈
router.put('/:feedbackId', taskFeedbackController.updateFeedback);

// 删除反馈
router.delete('/:feedbackId', taskFeedbackController.deleteFeedback);

module.exports = router;
