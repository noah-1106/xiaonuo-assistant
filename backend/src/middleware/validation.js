/**
 * 验证中间件
 */
const { validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/customErrors');

/**
 * 处理验证结果
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 输出详细的验证错误信息到日志
    console.error('验证失败:', errors.array());
    // 创建验证错误对象，包含所有验证失败信息
    const validationError = new BadRequestError('验证失败');
    validationError.errors = errors.array();
    // 直接返回错误响应，包含详细的错误信息
    return res.status(400).json({
      status: 'error',
      message: '验证失败',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  handleValidationErrors
};
