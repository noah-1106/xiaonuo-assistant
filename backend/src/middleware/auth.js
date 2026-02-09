const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError, ForbiddenError } = require('../utils/customErrors');
const config = require('../config');


/**
 * 认证中间件
 * 验证用户是否已登录，解析JWT token并将用户信息添加到req.user
 * 所有环境下都使用真实用户认证，不再使用模拟用户
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从Authorization头获取token
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      throw new UnauthorizedError('未提供认证token');
    }
    
    // 提取token（Bearer <token>）
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('无效的token格式');
    }
    
    // 验证token
    const decoded = jwt.verify(token, config.server.secret || 'xiaonuo_secret_key');
    
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError('无效的token');
    }
    
    // 查询用户
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }
    
    // 检查并更新订阅状态
    const now = new Date();
    if (user.subscription.endDate < now && user.subscription.status !== 'expired') {
      user.subscription.status = 'expired';
      await user.save();
    }
    
    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员权限检查中间件
 * 检查用户是否为管理员角色
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // 确保用户已认证
    if (!req.user) {
      throw new UnauthorizedError('请先登录');
    }

    // 检查用户是否为管理员
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('您没有权限访问此资源');
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
