const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const recordsController = require('../controllers/recordsController');
const { handleValidationErrors } = require('../middleware/validation');

// 创建新记录 - 验证规则
const createRecordValidation = [
  body('content')
    .notEmpty().withMessage('请提供记录内容')
    .isString().withMessage('记录内容必须为字符串')
    .isLength({ max: 5000 }).withMessage('记录内容长度不能超过5000个字符'),
  body('summary')
    .optional()
    .isString().withMessage('记录摘要必须为字符串')
    .isLength({ max: 200 }).withMessage('记录摘要长度不能超过200个字符'),
  body('title')
    .optional()
    .isString().withMessage('记录标题必须为字符串')
    .isLength({ max: 200 }).withMessage('记录标题长度不能超过200个字符'),
  body('type')
    .notEmpty().withMessage('请提供记录类型')
    .isString().withMessage('记录类型必须为字符串'),
  body('status')
    .optional()
    .isString().withMessage('记录状态必须为字符串'),
  body('tags')
    .optional()
    .isArray().withMessage('记录标签必须为数组'),
  body('tags.*')
    .optional()
    .isString().withMessage('记录标签必须为字符串'),
  handleValidationErrors
];

// 更新记录 - 验证规则
const updateRecordValidation = [
  param('id')
    .notEmpty().withMessage('请提供记录ID')
    .isMongoId().withMessage('记录ID必须为有效的MongoDB ID'),
  body('content')
    .optional()
    .isString().withMessage('记录内容必须为字符串')
    .isLength({ max: 5000 }).withMessage('记录内容长度不能超过5000个字符'),
  body('summary')
    .optional()
    .isString().withMessage('记录摘要必须为字符串')
    .isLength({ max: 200 }).withMessage('记录摘要长度不能超过200个字符'),
  body('type')
    .optional()
    .isString().withMessage('记录类型必须为字符串'),
  body('status')
    .optional()
    .isString().withMessage('记录状态必须为字符串'),
  body('tags')
    .optional()
    .isArray().withMessage('记录标签必须为数组'),
  body('tags.*')
    .optional()
    .isString().withMessage('记录标签必须为字符串'),
  body('title')
    .optional()
    .isString().withMessage('记录标题必须为字符串')
    .isLength({ max: 200 }).withMessage('记录标题长度不能超过200个字符'),
  body('link')
    .optional()
    .isString().withMessage('记录链接必须为字符串'),
  body('startTime')
    .optional()
    .isISO8601().withMessage('开始时间必须为有效的ISO8601格式'),
  body('endTime')
    .optional()
    .isISO8601().withMessage('结束时间必须为有效的ISO8601格式'),
  body('files')
    .optional()
    .isArray().withMessage('记录文件必须为数组'),
  handleValidationErrors
];

// 删除记录 - 验证规则
const deleteRecordValidation = [
  param('id')
    .notEmpty().withMessage('请提供记录ID')
    .isMongoId().withMessage('记录ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 获取用户所有记录
router.get('/', authMiddleware, recordsController.getRecords);

// 获取用户未整理记录数量
router.get('/pending-count', authMiddleware, recordsController.getPendingRecordsCount);

// 获取带筛选条件的记录列表
router.get('/filtered', authMiddleware, recordsController.getFilteredRecords);

// 获取最近的记录
router.get('/recent', authMiddleware, recordsController.getRecentRecords);

// 搜索记录
router.get('/search', authMiddleware, recordsController.searchRecords);

// 创建新记录
router.post('/', authMiddleware, createRecordValidation, recordsController.createRecord);

// 更新记录
router.put('/:id', authMiddleware, updateRecordValidation, recordsController.updateRecord);

// 删除记录
router.delete('/:id', authMiddleware, deleteRecordValidation, recordsController.deleteRecord);

// 发送记录到对话
router.post('/:id/send-to-chat', authMiddleware, recordsController.sendRecordToChat);

// 发送记录到邮件
router.post('/:id/send-to-email', authMiddleware, recordsController.sendRecordToEmail);

// 发送记录到短信
router.post('/:id/send-to-sms', authMiddleware, recordsController.sendRecordToSms);

module.exports = router;