const express = require('express');
const { body, query, param } = require('express-validator');
const orderController = require('../controllers/orderController');
const { handleValidationErrors } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取订单列表 - 验证规则
const getOrdersValidation = [
  query('userId')
    .optional()
    .isMongoId().withMessage('用户ID必须为有效的MongoDB ID'),
  query('status')
    .optional()
    .isString().withMessage('订单状态必须为字符串'),
  handleValidationErrors
];

// 获取订单详情 - 验证规则
const getOrderDetailValidation = [
  param('id')
    .notEmpty().withMessage('请提供订单ID')
    .isMongoId().withMessage('订单ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 创建订单 - 验证规则
const createOrderValidation = [
  body('planId')
    .notEmpty().withMessage('请提供套餐ID')
    .isMongoId().withMessage('套餐ID必须为有效的MongoDB ID'),
  body('paymentMethod')
    .optional()
    .isString().withMessage('支付方式必须为字符串'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('购买数量必须为大于0的整数'),
  handleValidationErrors
];

// 更新订单状态 - 验证规则
const updateOrderStatusValidation = [
  param('id')
    .notEmpty().withMessage('请提供订单ID')
    .isMongoId().withMessage('订单ID必须为有效的MongoDB ID'),
  body('status')
    .notEmpty().withMessage('请提供订单状态')
    .isString().withMessage('订单状态必须为字符串'),
  body('paymentTime')
    .optional()
    .isISO8601().withMessage('支付时间必须为有效的ISO8601格式'),
  handleValidationErrors
];

// 删除订单 - 验证规则
const deleteOrderValidation = [
  param('id')
    .notEmpty().withMessage('请提供订单ID')
    .isMongoId().withMessage('订单ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 生成微信支付二维码 - 验证规则
const generateWechatQRValidation = [
  param('id')
    .notEmpty().withMessage('请提供订单ID')
    .isMongoId().withMessage('订单ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 查询支付状态 - 验证规则
const queryPaymentStatusValidation = [
  param('id')
    .notEmpty().withMessage('请提供订单ID')
    .isMongoId().withMessage('订单ID必须为有效的MongoDB ID'),
  handleValidationErrors
];

// 获取订单列表
router.get('/', authMiddleware, getOrdersValidation, orderController.getOrders);

// 获取订单详情
router.get('/:id', authMiddleware, getOrderDetailValidation, orderController.getOrderDetail);

// 创建订单
router.post('/', authMiddleware, createOrderValidation, orderController.createOrder);

// 更新订单状态
router.put('/:id/status', authMiddleware, updateOrderStatusValidation, orderController.updateOrderStatus);

// 删除订单
router.delete('/:id', authMiddleware, deleteOrderValidation, orderController.deleteOrder);

// 生成微信支付二维码
router.post('/:id/wechat/qr', authMiddleware, generateWechatQRValidation, orderController.generateWechatQR);

// 查询支付状态
router.get('/:id/pay-status', authMiddleware, queryPaymentStatusValidation, orderController.queryPaymentStatus);

module.exports = router;
