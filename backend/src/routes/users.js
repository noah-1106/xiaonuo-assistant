const express = require('express');
const { body, query, param } = require('express-validator');
const userController = require('../controllers/userController');
const { handleValidationErrors } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取用户列表 - 验证规则
const getUsersValidation = [
  query('role')
    .optional()
    .isString().withMessage('角色必须为字符串'),
  query('status')
    .optional()
    .isString().withMessage('状态必须为字符串'),
  handleValidationErrors
];

// 获取用户详情 - 验证规则
const getUserDetailValidation = [
  param('id')
    .notEmpty().withMessage('请提供用户ID')
    .isMongoId().withMessage('用户ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 修改用户套餐 - 验证规则
const updateUserPlanValidation = [
  param('id')
    .notEmpty().withMessage('请提供用户ID')
    .isMongoId().withMessage('用户ID必须为有效的MongoDB ID'),
  body('plan')
    .optional()
    .isString().withMessage('套餐必须为字符串'),
  body('status')
    .optional()
    .isString().withMessage('状态必须为字符串'),
  body('startDate')
    .optional()
    .isISO8601().withMessage('开始日期必须为有效的ISO8601格式'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('结束日期必须为有效的ISO8601格式'),
  handleValidationErrors
];

// 删除用户 - 验证规则
const deleteUserValidation = [
  param('id')
    .notEmpty().withMessage('请提供用户ID')
    .isMongoId().withMessage('用户ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 修改用户角色 - 验证规则
const updateUserRoleValidation = [
  param('id')
    .notEmpty().withMessage('请提供用户ID')
    .isMongoId().withMessage('用户ID必须为有效的MongoDB ID'),
  body('role')
    .notEmpty().withMessage('请提供角色')
    .isString().withMessage('角色必须为字符串')
    .isIn(['user', 'admin']).withMessage('角色必须是user或admin'),
  handleValidationErrors
];

// 获取用户列表
router.get('/', authMiddleware, getUsersValidation, userController.getUsers);

// 获取用户详情
router.get('/:id', authMiddleware, getUserDetailValidation, userController.getUserDetail);

// 修改用户套餐
router.put('/:id/plan', authMiddleware, updateUserPlanValidation, userController.updateUserPlan);

// 删除用户
router.delete('/:id', authMiddleware, deleteUserValidation, userController.deleteUser);

// 修改用户角色
router.put('/:id/role', authMiddleware, updateUserRoleValidation, userController.updateUserRole);

module.exports = router;
