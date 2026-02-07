// 使用数据库存储套餐数据
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/customErrors');
const Plan = require('../models/Plan');


/**
 * 获取所有可用套餐（用户端）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * @returns {Promise<void>}
 */
exports.getAvailablePlans = async (req, res, next) => {
  try {
    // 排除系统默认套餐，只返回用户可购买的套餐
    const availablePlans = await Plan.find({ isActive: true, isSystem: false }).sort({ price: 1 });
    res.json({
      status: 'ok',
      message: '获取套餐列表成功',
      data: availablePlans
    });
  } catch (error) {
    console.error('获取可用套餐列表失败:', error);
    next(error);
  }
};

/**
 * 获取所有套餐（管理员端）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * @returns {Promise<void>}
 */
exports.getAllPlans = async (req, res, next) => {
  try {
    // 只有管理员才能访问
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('您没有权限访问此资源');
    }
    
    const allPlans = await Plan.find().sort({ createdAt: -1 });
    res.json({
      status: 'ok',
      message: '获取套餐列表成功',
      data: allPlans
    });
  } catch (error) {
    console.error('获取所有套餐列表失败:', error);
    next(error);
  }
};

/**
 * 添加新套餐（管理员端）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * @returns {Promise<void>}
 */
exports.addPlan = async (req, res, next) => {
  try {
    // 只有管理员才能访问
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('您没有权限访问此资源');
    }
    
    const { name, description, price, discountPrice, duration, features, isActive } = req.body;
    
    // 验证必填字段
    if (!name || !description || !price || !duration || !features) {
      throw new BadRequestError('请提供完整的套餐信息');
    }
    
    // 创建新套餐
    const newPlan = new Plan({
      name,
      description,
      price,
      discountPrice,
      duration,
      features,
      isActive: isActive || true
    });
    
    // 保存到数据库
    await newPlan.save();
    
    res.json({
      status: 'ok',
      message: '添加套餐成功',
      data: newPlan
    });
  } catch (error) {
    // 捕获并处理错误，避免服务器崩溃
    console.error('添加套餐失败:', error);
    next(error);
  }
};

/**
 * 更新套餐（管理员端）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * @returns {Promise<void>}
 */
exports.updatePlan = async (req, res, next) => {
  try {
    // 只有管理员才能访问
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('您没有权限访问此资源');
    }
    
    const { id } = req.params;
    const { name, description, price, discountPrice, duration, features, isActive } = req.body;
    
    // 查找套餐
    const plan = await Plan.findById(id);
    if (!plan) {
      throw new NotFoundError('套餐不存在');
    }
    
    // 构建更新对象
    const updateData = {};
    
    // 系统默认套餐的保护
    if (plan.isSystem) {
      // 允许修改描述和功能
      if (description) updateData.description = description;
      if (features) updateData.features = features;
      // 禁止修改关键字段
      // 保持价格为0，时长为7天
    } else {
      // 普通套餐可以修改所有字段
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (discountPrice !== undefined) updateData.discountPrice = discountPrice;
      if (duration !== undefined) updateData.duration = duration;
      if (features) updateData.features = features;
      if (isActive !== undefined) updateData.isActive = isActive;
    }
    
    // 更新套餐信息
    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    res.json({
      status: 'ok',
      message: '更新套餐成功',
      data: updatedPlan
    });
  } catch (error) {
    console.error('更新套餐失败:', error);
    next(error);
  }
};

/**
 * 删除套餐（管理员端）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * @returns {Promise<void>}
 */
exports.deletePlan = async (req, res, next) => {
  try {
    // 只有管理员才能访问
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('您没有权限访问此资源');
    }
    
    const { id } = req.params;
    
    // 查找套餐
    const plan = await Plan.findById(id);
    if (!plan) {
      throw new NotFoundError('套餐不存在');
    }
    
    // 禁止删除系统默认套餐
    if (plan.isSystem) {
      throw new ForbiddenError('系统默认套餐无法删除');
    }
    
    // 删除套餐
    await Plan.findByIdAndDelete(id);
    
    res.json({
      status: 'ok',
      message: '删除套餐成功'
    });
  } catch (error) {
    console.error('删除套餐失败:', error);
    next(error);
  }
};

/**
 * 切换套餐状态（管理员端）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 * @returns {Promise<void>}
 */
exports.togglePlanStatus = async (req, res, next) => {
  try {
    // 只有管理员才能访问
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('您没有权限访问此资源');
    }
    
    const { id } = req.params;
    const { isActive } = req.body;
    
    // 查找套餐
    const plan = await Plan.findById(id);
    if (!plan) {
      throw new NotFoundError('套餐不存在');
    }
    
    // 禁止禁用系统默认套餐
    if (plan.isSystem && !isActive) {
      throw new ForbiddenError('系统默认套餐无法禁用');
    }
    
    // 更新套餐状态
    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    
    res.json({
      status: 'ok',
      message: '更新套餐状态成功',
      data: updatedPlan
    });
  } catch (error) {
    console.error('更新套餐状态失败:', error);
    next(error);
  }
};
