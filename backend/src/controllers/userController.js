/**
 * 用户管理控制器
 * 处理用户管理相关的逻辑，包括获取用户列表、修改用户套餐、删除用户等
 */
const User = require('../models/User');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

/**
 * 获取用户列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getUsers = async (req, res) => {
  const { role, status } = req.query;
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (status) {
    query['subscription.status'] = status;
  }
  
  const users = await User.find(query, {
    password: 0, // 不返回密码
    __v: 0 // 不返回版本号
  }).sort({ createdAt: -1 });
  
  res.json({
    status: 'ok',
    message: '获取用户列表成功',
    data: users
  });
};

/**
 * 获取用户详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getUserDetail = async (req, res) => {
  const user = await User.findById(req.params.id, {
    password: 0, // 不返回密码
    __v: 0 // 不返回版本号
  });
  
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  
  res.json({
    status: 'ok',
    message: '获取用户详情成功',
    data: user
  });
};

/**
 * 修改用户套餐
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateUserPlan = async (req, res) => {
  const { plan, status, startDate, endDate } = req.body;
  const { id } = req.params;
  
  // 查找用户
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  
  // 构建更新数据
  const updateData = {
    subscription: {
      ...user.subscription,
      plan: plan || user.subscription.plan,
      status: status || user.subscription.status,
      startDate: startDate ? new Date(startDate) : user.subscription.startDate,
      endDate: endDate ? new Date(endDate) : user.subscription.endDate
    }
  };
  
  // 更新用户信息
  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    select: { password: 0, __v: 0 }
  });
  
  res.json({
    status: 'ok',
    message: '修改用户套餐成功',
    data: updatedUser
  });
};

/**
 * 删除用户
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  
  // 查找用户
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  
  res.json({
    status: 'ok',
    message: '删除用户成功',
    data: {
      userId: user._id,
      nickname: user.nickname,
      phone: user.phone
    }
  });
};

/**
 * 修改用户角色
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateUserRole = async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;
  
  // 验证角色
  if (!role || !['user', 'admin'].includes(role)) {
    throw new BadRequestError('角色必须是user或admin');
  }
  
  // 查找用户
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  
  // 更新角色
  user.role = role;
  await user.save();
  
  res.json({
    status: 'ok',
    message: '修改用户角色成功',
    data: {
      userId: user._id,
      nickname: user.nickname,
      role: user.role
    }
  });
};
