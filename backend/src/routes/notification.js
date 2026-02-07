const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// 验证规则
const sendCodeValidation = [
  body('contact')
    .notEmpty().withMessage('请提供联系方式'),
  body('type')
    .optional()
    .isIn(['sms', 'email', 'auto']).withMessage('不支持的联系方式类型'),
  handleValidationErrors
];

const verifyCodeValidation = [
  body('contact')
    .notEmpty().withMessage('请提供联系方式'),
  body('code')
    .notEmpty().withMessage('请提供验证码')
    .isNumeric().withMessage('验证码必须为数字'),
  handleValidationErrors
];

const testSmsValidation = [
  body('phone')
    .notEmpty().withMessage('请提供手机号码')
    .isMobilePhone('zh-CN').withMessage('请提供有效的手机号码'),
  body('code')
    .optional()
    .isNumeric().withMessage('验证码必须为数字'),
  handleValidationErrors
];

const testEmailValidation = [
  body('email')
    .notEmpty().withMessage('请提供邮箱地址')
    .isEmail().withMessage('请提供有效的邮箱地址'),
  body('code')
    .optional()
    .isNumeric().withMessage('验证码必须为数字'),
  handleValidationErrors
];

// 公开路由 - 验证码相关
router.post('/send-code', sendCodeValidation, notificationController.sendVerificationCode);
router.post('/verify-code', verifyCodeValidation, notificationController.verifyVerificationCode);

// 需要登录的路由
router.use(authMiddleware);

// 通知服务状态
router.get('/status', notificationController.getServiceStatus);

// 管理员路由 - 需要管理员权限
router.use(notificationController.checkAdmin);

// 通知配置管理
router.get('/config', notificationController.getCurrentConfig);
router.put('/config', notificationController.updateConfig);
router.post('/config/reset', notificationController.resetConfig);

// 测试发送
router.post('/test/sms', testSmsValidation, notificationController.testSms);
router.post('/test/email', testEmailValidation, notificationController.testEmail);

module.exports = router;