const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const authController = require('../controllers/authController');

// 发送验证码 - 验证规则
const sendCodeValidation = [
  body('contact')
    .notEmpty().withMessage('请提供联系方式'),
  body('contact').custom((value) => {
    // 验证联系方式是有效的手机号码或邮箱地址
    const isPhone = /^1[3-9]\d{9}$/.test(value);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isPhone && !isEmail) {
      throw new Error('请提供有效的手机号码或邮箱地址');
    }
    return true;
  }),
  handleValidationErrors
];

// 验证码登录/注册 - 验证规则
const loginWithCodeValidation = [
  body('contact')
    .notEmpty().withMessage('请提供联系方式'),
  body('contact').custom((value) => {
    // 验证联系方式是有效的手机号码或邮箱地址
    const isPhone = /^1[3-9]\d{9}$/.test(value);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isPhone && !isEmail) {
      throw new Error('请提供有效的手机号码或邮箱地址');
    }
    return true;
  }),
  body('code')
    .notEmpty().withMessage('请提供验证码')
    .isLength({ min: 6, max: 6 }).withMessage('验证码长度必须为6位')
    .isNumeric().withMessage('验证码必须为数字'),
  handleValidationErrors
];

// 用户名密码登录 - 验证规则
const loginWithPasswordValidation = [
  body('username')
    .notEmpty().withMessage('请提供用户名'),
  body('password')
    .notEmpty().withMessage('请提供密码')
    .isLength({ min: 6 }).withMessage('密码长度不能少于6位'),
  handleValidationErrors
];

// 更新用户信息 - 验证规则
const updateProfileValidation = [
  body('nickname')
    .optional()
    .isLength({ min: 2, max: 20 }).withMessage('昵称长度必须在2-20个字符之间'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('密码长度不能少于6位'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_@.-]+$/).withMessage('用户名只能包含字母、数字、下划线、@符号、点和连字符'),
  body('email')
    .optional()
    .isEmail().withMessage('请提供有效的邮箱地址'),
  handleValidationErrors
];

// 修改密码 - 验证规则
const updatePasswordValidation = [
  body('oldPassword')
    .optional()
    .isLength({ min: 6 }).withMessage('旧密码长度不能少于6位'),
  body('newPassword')
    .notEmpty().withMessage('请提供新密码')
    .isLength({ min: 6 }).withMessage('新密码长度不能少于6位'),
  handleValidationErrors
];

// 发送验证码
router.post('/send-code', sendCodeValidation, authController.sendCode);

// 验证码登录/注册
router.post('/login-with-code', loginWithCodeValidation, authController.loginWithCode);

// 用户名密码登录
router.post('/login-with-password', loginWithPasswordValidation, authController.loginWithPassword);

// 获取当前用户信息
router.get('/me', authMiddleware, authController.getMe);

// 发送验证码（用于修改敏感信息）
router.post('/send-verification-code', authMiddleware, authController.sendVerificationCode);

// 验证验证码（用于修改敏感信息）
router.post('/verify-code', authMiddleware, authController.verifyCode);

// 更新用户信息
router.put('/update-profile', authMiddleware, updateProfileValidation, authController.updateProfile);

// 修改密码
router.put('/update-password', authMiddleware, updatePasswordValidation, authController.updatePassword);

module.exports = router;
