const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

/**
 * 任务管理路由
 * 所有路由都需要身份验证
 */

// 获取用户的任务列表
router.get('/', authMiddleware, taskController.getUserTasks);

// 获取任务详情
router.get('/:id', authMiddleware, taskController.getTaskDetail);

// 创建任务
router.post('/', authMiddleware, taskController.createTask);

// 执行任务
router.post('/:id/execute', authMiddleware, taskController.executeTask);

// 取消任务
router.post('/:id/cancel', authMiddleware, taskController.cancelTask);

// 批量执行任务
router.post('/batch/execute', authMiddleware, taskController.batchExecuteTasks);

// 更新任务反馈
router.post('/:id/feedback', authMiddleware, taskController.updateFeedback);

module.exports = router;