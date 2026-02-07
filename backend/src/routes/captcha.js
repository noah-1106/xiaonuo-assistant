const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const captchaController = require('../controllers/captchaController');
const { handleValidationErrors } = require('../middleware/validation');

// 验证验证码 - 验证规则
const verifyCaptchaValidation = [
  body('code')
    .notEmpty().withMessage('请提供验证码')
    .isLength({ min: 4, max: 6 }).withMessage('验证码长度必须为4-6位')
    .isString().withMessage('验证码必须为字符串'),
  body('id')
    .notEmpty().withMessage('请提供验证码ID')
    .isString().withMessage('验证码ID必须为字符串'),
  handleValidationErrors
];

// 获取验证码
router.get('/', captchaController.getCaptcha);

// 验证验证码
router.post('/verify', verifyCaptchaValidation, captchaController.verifyCaptcha);

module.exports = router;