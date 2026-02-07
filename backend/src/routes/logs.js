/**
 * 日志管理路由
 * 用于处理系统日志的查询和管理API
 */
const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// 日志管理路由
router.get('/files', authMiddleware, adminMiddleware, logController.getLogFiles);
router.get('/files/:filename', authMiddleware, adminMiddleware, logController.readLogFile);
router.delete('/files/:filename', authMiddleware, adminMiddleware, logController.deleteLogFile);
router.post('/cleanup', authMiddleware, adminMiddleware, logController.cleanupLogs);

module.exports = router;