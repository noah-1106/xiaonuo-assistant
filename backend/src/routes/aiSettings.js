const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const aiSettingsController = require('../controllers/aiSettingsController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// 更新AI设置 - 验证规则
const updateAISettingsValidation = [
  body('enhancedRoles')
    .optional()
    .isArray().withMessage('增强角色必须为数组'),
  body('enhancedRoles.*.id')
    .optional()
    .isString().withMessage('角色ID必须为字符串'),
  body('enhancedRoles.*.name')
    .optional()
    .isString().withMessage('角色名称必须为字符串')
    .isLength({ min: 1, max: 50 }).withMessage('角色名称长度必须为1-50个字符'),
  body('enhancedRoles.*.isEnabled')
    .optional()
    .isBoolean().withMessage('角色状态必须为布尔值'),
  handleValidationErrors
];

// 获取AI设置
router.get('/', authMiddleware, adminMiddleware, aiSettingsController.getAISettings);

// 更新AI设置
router.put('/', authMiddleware, adminMiddleware, updateAISettingsValidation, aiSettingsController.updateAISettings);

// 重置AI设置为默认值
router.post('/reset', authMiddleware, adminMiddleware, aiSettingsController.resetAISettings);

// 获取增强角色列表（不需要管理员权限）
router.get('/roles/enhanced', authMiddleware, aiSettingsController.getEnhancedRoles);

// 获取记录类型列表（不需要管理员权限）
router.get('/record-types', authMiddleware, aiSettingsController.getRecordTypes);

module.exports = router;