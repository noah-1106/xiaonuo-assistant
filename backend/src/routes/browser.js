const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const browserController = require('../controllers/browserController');
const { handleValidationErrors } = require('../middleware/validation');

// 创建标签页 - 验证规则
const createTabValidation = [
  body('title')
    .optional()
    .isString().withMessage('标签页标题必须为字符串')
    .isLength({ max: 100 }).withMessage('标签页标题长度不能超过100个字符'),
  body('url')
    .optional()
    .isURL().withMessage('标签页URL必须为有效的URL'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('标签页激活状态必须为布尔值'),
  body('position')
    .optional()
    .isInt().withMessage('标签页位置必须为整数'),
  body('favicon')
    .optional()
    .isString().withMessage('标签页图标必须为字符串'),
  handleValidationErrors
];

// 更新标签页 - 验证规则
const updateTabValidation = [
  param('id')
    .notEmpty().withMessage('请提供标签页ID')
    .isString().withMessage('标签页ID必须为字符串'),
  body('title')
    .optional()
    .isString().withMessage('标签页标题必须为字符串')
    .isLength({ max: 100 }).withMessage('标签页标题长度不能超过100个字符'),
  body('url')
    .optional()
    .isURL().withMessage('标签页URL必须为有效的URL'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('标签页激活状态必须为布尔值'),
  body('position')
    .optional()
    .isInt().withMessage('标签页位置必须为整数'),
  body('favicon')
    .optional()
    .isString().withMessage('标签页图标必须为字符串'),
  handleValidationErrors
];

// 删除标签页 - 验证规则
const deleteTabValidation = [
  param('id')
    .notEmpty().withMessage('请提供标签页ID')
    .isString().withMessage('标签页ID必须为字符串'),
  handleValidationErrors
];

// 激活标签页 - 验证规则
const activateTabValidation = [
  param('id')
    .notEmpty().withMessage('请提供标签页ID')
    .isString().withMessage('标签页ID必须为字符串'),
  handleValidationErrors
];

// 获取标签页列表
router.get('/tabs', browserController.getTabs);

// 创建标签页
router.post('/tabs', createTabValidation, browserController.createTab);

// 更新标签页
router.put('/tabs/:id', updateTabValidation, browserController.updateTab);

// 删除标签页
router.delete('/tabs/:id', deleteTabValidation, browserController.deleteTab);

// 激活标签页
router.put('/tabs/:id/active', activateTabValidation, browserController.activateTab);

module.exports = router;
