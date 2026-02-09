const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const chatController = require('../controllers/chatController');
const { authMiddleware } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// 创建聊天会话 - 验证规则
const createChatSessionValidation = [
  body('title')
    .optional()
    .isString().withMessage('会话标题必须为字符串')
    .isLength({ max: 100 }).withMessage('会话标题长度不能超过100个字符'),
  body('enhancedRole')
    .optional()
    .custom((value) => {
      // 允许值为null或字符串
      return value === null || typeof value === 'string';
    }).withMessage('增强角色ID必须为字符串或null'),
  handleValidationErrors
];

// 切换会话的增强角色 - 验证规则
const switchEnhancedRoleValidation = [
  param('id')
    .notEmpty().withMessage('请提供会话ID')
    .isString().withMessage('会话ID必须为字符串'),
  body('enhancedRole')
    .optional()
    .custom((value) => {
      // 允许值为null或字符串
      return value === null || typeof value === 'string';
    }).withMessage('增强角色ID必须为字符串或null'),
  handleValidationErrors
];

// 获取聊天会话详情 - 验证规则
const getChatSessionDetailValidation = [
  param('id')
    .notEmpty().withMessage('请提供会话ID')
    .isString().withMessage('会话ID必须为字符串'),
  handleValidationErrors
];

// 更新聊天会话 - 验证规则
const updateChatSessionValidation = [
  param('id')
    .notEmpty().withMessage('请提供会话ID')
    .isString().withMessage('会话ID必须为字符串'),
  body('title')
    .optional()
    .isString().withMessage('会话标题必须为字符串')
    .isLength({ max: 100 }).withMessage('会话标题长度不能超过100个字符'),
  handleValidationErrors
];

// 删除聊天会话 - 验证规则
const deleteChatSessionValidation = [
  param('id')
    .notEmpty().withMessage('请提供会话ID')
    .isString().withMessage('会话ID必须为字符串'),
  handleValidationErrors
];

// 发送消息 - 验证规则
const sendChatMessageValidation = [
  body('message')
    .optional()
    .isString().withMessage('消息内容必须为字符串')
    .isLength({ max: 10000 }).withMessage('消息内容长度不能超过10000个字符'),
  body('files')
    .optional(),
  body('sessionId')
    .optional()
    .isString().withMessage('会话ID必须为字符串'),
  body('history')
    .optional()
    .isArray().withMessage('历史消息必须为数组'),
  handleValidationErrors
];

// 获取聊天会话列表
router.get('/sessions', authMiddleware, chatController.getChatSessions);

// 创建聊天会话 - 支持可选增强角色
router.post('/sessions', authMiddleware, createChatSessionValidation, chatController.createChatSession);

// 切换会话的增强角色
router.put('/sessions/:id/enhanced-role', authMiddleware, switchEnhancedRoleValidation, chatController.switchEnhancedRole);

// 获取聊天会话详情
router.get('/sessions/:id', authMiddleware, getChatSessionDetailValidation, chatController.getChatSessionDetail);

// 更新聊天会话
router.put('/sessions/:id', authMiddleware, updateChatSessionValidation, chatController.updateChatSession);

// 删除聊天会话
router.delete('/sessions/:id', authMiddleware, deleteChatSessionValidation, chatController.deleteChatSession);

// 发送消息路由 - 支持角色提示词和AI自动创建简录
router.post('/send', authMiddleware, sendChatMessageValidation, chatController.sendChatMessage);

module.exports = router;
