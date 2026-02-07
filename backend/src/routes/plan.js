const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const planController = require('../controllers/planController');
const { handleValidationErrors } = require('../middleware/validation');

// 添加新套餐 - 验证规则
const addPlanValidation = [
  body('name')
    .notEmpty().withMessage('请提供套餐名称')
    .isString().withMessage('套餐名称必须为字符串')
    .isLength({ min: 1, max: 50 }).withMessage('套餐名称长度必须为1-50个字符'),
  body('description')
    .notEmpty().withMessage('请提供套餐描述')
    .isString().withMessage('套餐描述必须为字符串')
    .isLength({ max: 200 }).withMessage('套餐描述长度不能超过200个字符'),
  body('price')
    .notEmpty().withMessage('请提供套餐价格')
    .isNumeric().withMessage('套餐价格必须为数字')
    .isFloat({ min: 0 }).withMessage('套餐价格不能为负数'),
  body('discountPrice')
    .optional()
    .isNumeric().withMessage('折扣价格必须为数字')
    .isFloat({ min: 0 }).withMessage('折扣价格不能为负数'),
  body('duration')
    .notEmpty().withMessage('请提供套餐有效期')
    .isInt().withMessage('套餐有效期必须为整数')
    .isInt({ min: 1 }).withMessage('套餐有效期必须大于0'),
  body('features')
    .notEmpty().withMessage('请提供套餐功能列表')
    .isArray().withMessage('套餐功能列表必须为数组')
    .custom((value) => {
      if (value.length === 0) {
        throw new Error('套餐功能列表不能为空数组');
      }
      return true;
    }),
  body('features.*')
    .isString().withMessage('套餐功能必须为字符串'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('套餐状态必须为布尔值'),
  handleValidationErrors
];

// 更新套餐 - 验证规则
const updatePlanValidation = [
  param('id')
    .notEmpty().withMessage('请提供套餐ID')
    .isString().withMessage('套餐ID必须为字符串'),
  body('name')
    .optional()
    .isString().withMessage('套餐名称必须为字符串')
    .isLength({ min: 1, max: 50 }).withMessage('套餐名称长度必须为1-50个字符'),
  body('description')
    .optional()
    .isString().withMessage('套餐描述必须为字符串')
    .isLength({ max: 200 }).withMessage('套餐描述长度不能超过200个字符'),
  body('price')
    .optional()
    .isNumeric().withMessage('套餐价格必须为数字')
    .isFloat({ min: 0 }).withMessage('套餐价格不能为负数'),
  body('discountPrice')
    .optional()
    .isNumeric().withMessage('折扣价格必须为数字')
    .isFloat({ min: 0 }).withMessage('折扣价格不能为负数'),
  body('duration')
    .optional()
    .isInt().withMessage('套餐有效期必须为整数')
    .isInt({ min: 1 }).withMessage('套餐有效期必须大于0'),
  body('features')
    .optional()
    .isArray().withMessage('套餐功能列表必须为数组')
    .custom((value) => {
      if (value && value.length === 0) {
        throw new Error('套餐功能列表不能为空数组');
      }
      return true;
    }),
  body('features.*')
    .optional()
    .isString().withMessage('套餐功能必须为字符串'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('套餐状态必须为布尔值'),
  handleValidationErrors
];

// 删除套餐 - 验证规则
const deletePlanValidation = [
  param('id')
    .notEmpty().withMessage('请提供套餐ID')
    .isString().withMessage('套餐ID必须为字符串'),
  handleValidationErrors
];

// 切换套餐状态 - 验证规则
const togglePlanStatusValidation = [
  param('id')
    .notEmpty().withMessage('请提供套餐ID')
    .isString().withMessage('套餐ID必须为字符串'),
  body('isActive')
    .notEmpty().withMessage('请提供套餐状态')
    .isBoolean().withMessage('套餐状态必须为布尔值'),
  handleValidationErrors
];

// 获取所有可用套餐（用户端）
router.get('/', authMiddleware, planController.getAvailablePlans);

// 获取所有套餐（管理员端）
router.get('/admin/plans', authMiddleware, planController.getAllPlans);

// 添加新套餐（管理员端）
router.post('/admin/plans', authMiddleware, addPlanValidation, planController.addPlan);

// 更新套餐（管理员端）
router.put('/admin/plans/:id', authMiddleware, updatePlanValidation, planController.updatePlan);

// 删除套餐（管理员端）
router.delete('/admin/plans/:id', authMiddleware, deletePlanValidation, planController.deletePlan);

// 切换套餐状态（管理员端）
router.patch('/admin/plans/:id/status', authMiddleware, togglePlanStatusValidation, planController.togglePlanStatus);

module.exports = router;
