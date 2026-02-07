const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { BadRequestError, ConflictError, UnauthorizedError, NotFoundError } = require('../utils/customErrors');

// 存储验证码的临时缓存（实际项目中应该使用Redis或其他持久化存储）
const verificationCodeCache = new Map();

/**
 * 发送验证码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.sendCode = async (req, res, next) => {
  try {
    const { phone, email, contact, type } = req.body;
    
    // 确定联系方式
    let contactInfo = contact || phone || email;
    if (!contactInfo) {
      throw new BadRequestError('请提供手机号码或邮箱');
    }
    
    // 确定联系方式类型
    let contactType = type;
    if (!contactType) {
      contactType = /^1[3-9]\d{9}$/.test(contactInfo) ? 'sms' : 'email';
    }
    
    // 使用通知服务发送验证码
    const result = await notificationService.sendVerificationCode(contactInfo, contactType);
    
    res.json({
      status: 'ok',
      message: result.message,
      data: {
        contact: contactInfo,
        contactType: result.contactType,
        code: result.code
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 发送验证码（用于修改敏感信息）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.sendVerificationCode = async (req, res, next) => {
  try {
    const { type, contact } = req.body;
    const userId = req.user._id;
    
    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    
    // 发送验证码
    if (type === 'phone') {
      // 使用前端传递的新手机号或用户当前手机号
      const phone = contact || user.phone;
      if (!phone) {
        throw new BadRequestError('请先设置手机号');
      }
      
      // 生成验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const cacheKey = `${userId}_${type}`;
      
      // 存储验证码，有效期5分钟
      verificationCodeCache.set(cacheKey, {
        code,
        expireAt: Date.now() + 5 * 60 * 1000
      });
      
      // 发送短信验证码
      await notificationService.sendSmsVerificationCode(phone, code);
      
      res.json({
        status: 'ok',
        message: '验证码已发送到您的手机',
        code: process.env.NODE_ENV === 'development' ? code : undefined
      });
    } else if (type === 'email') {
      // 使用前端传递的新邮箱或用户当前邮箱
      const email = contact || user.email;
      if (!email) {
        throw new BadRequestError('请先设置邮箱');
      }
      
      // 生成验证码
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const cacheKey = `${userId}_${type}`;
      
      // 存储验证码，有效期5分钟
      verificationCodeCache.set(cacheKey, {
        code,
        expireAt: Date.now() + 5 * 60 * 1000
      });
      
      // 发送邮箱验证码
      await notificationService.sendEmailVerificationCode(email, code);
      
      res.json({
        status: 'ok',
        message: '验证码已发送到您的邮箱',
        code: process.env.NODE_ENV === 'development' ? code : undefined
      });
    } else {
      throw new BadRequestError('请选择正确的验证码类型');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 验证验证码（用于修改敏感信息）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.verifyCode = async (req, res, next) => {
  try {
    const { type, code } = req.body;
    const userId = req.user._id;
    const cacheKey = `${userId}_${type}`;
    
    // 查找验证码
    const storedCode = verificationCodeCache.get(cacheKey);
    if (!storedCode) {
      throw new BadRequestError('验证码不存在或已过期');
    }
    
    // 检查验证码是否过期
    if (Date.now() > storedCode.expireAt) {
      verificationCodeCache.delete(cacheKey);
      throw new BadRequestError('验证码已过期');
    }
    
    // 检查验证码是否正确
    if (storedCode.code !== code) {
      throw new BadRequestError('验证码错误');
    }
    
    // 验证码正确，删除已使用的验证码
    verificationCodeCache.delete(cacheKey);
    
    // 生成验证令牌，有效期10分钟
    const verifyToken = jwt.sign(
      { userId, type, verified: true },
      process.env.JWT_SECRET || 'xiaonuo_secret_key',
      { expiresIn: '10m' }
    );
    
    res.json({
      status: 'ok',
      message: '验证码验证成功',
      data: {
        verifyToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 验证码登录/注册
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.loginWithCode = async (req, res, next) => {
  try {
    const { phone, email, contact, code } = req.body;
    
    // 确定联系方式
    let contactInfo = contact || phone || email;
    if (!contactInfo || !code) {
      throw new BadRequestError('请提供联系方式和验证码');
    }
    
    // 测试账号支持 - 无需真实短信验证
    const testAccounts = [
      { contact: '13800138000', code: '123456' },
      { contact: '13900139000', code: '654321' },
      { contact: '13700137000', code: '000000' },
      { contact: 'test@example.com', code: '123456' },
      { contact: 'newuser@example.com', code: '123456' },
      { contact: '13812345678', code: '123456' }
    ];
    
    const isTestAccount = testAccounts.some(account => 
      account.contact === contactInfo && account.code === code
    );
    
    // 非测试账号需要验证验证码
    if (!isTestAccount) {
      // 使用通知服务验证验证码
      const verifyResult = notificationService.verifyVerificationCode(contactInfo, code);
      if (!verifyResult.valid) {
        throw new BadRequestError(verifyResult.message);
      }
    }
    
    // 确定联系方式类型
    const isPhone = /^1[3-9]\d{9}$/.test(contactInfo);
    const query = isPhone ? { phone: contactInfo } : { email: contactInfo };
    
    // 查找或创建用户
    let user = await User.findOne(query);
    
    if (!user) {
      // 创建新用户
      const userData = {
        nickname: isPhone ? `用户${contactInfo.slice(-4)}` : `用户${contactInfo.split('@')[0]}`,
        role: 'user',
        username: contactInfo // 使用联系方式作为默认用户名
      };
      
      if (isPhone) {
        userData.phone = contactInfo;
      } else {
        userData.email = contactInfo;
      }
      
      user = await User.create(userData);
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'xiaonuo_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      status: 'ok',
      message: '登录成功',
      data: {
        token,
        user: {
          userId: user._id,
          nickname: user.nickname,
          phone: user.phone,
          email: user.email,
          avatar: user.avatar,
          subscription: user.subscription,
          recordCount: user.recordCount,
          role: user.role || 'user',
          theme: user.theme
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取当前用户信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.getMe = async (req, res, next) => {
  try {
    // 使用authMiddleware验证后，req.user中已经有用户信息
    const user = req.user;
    
    // 获取关联的Plan详情
    let planDetails = null;
    if (user.subscription.plan) {
      try {
        const Plan = require('../models/Plan');
        const plan = await Plan.findById(user.subscription.plan);
        if (plan) {
          planDetails = {
            _id: plan._id,
            name: plan.name,
            price: plan.price,
            duration: plan.duration,
            isSystem: plan.isSystem
          };
        }
      } catch (error) {
        console.error('获取Plan详情失败:', error.message);
      }
    }
    
    res.json({
      status: 'ok',
      message: '获取用户信息成功',
      data: {
        userId: user._id,
        nickname: user.nickname,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        username: user.username,
        subscription: user.subscription,
        planDetails: planDetails,
        recordCount: user.recordCount,
        role: user.role || 'user',
        theme: user.theme,
        hasPassword: !!user.password
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 更新用户信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { nickname, password, username, email, theme, avatar, phone, verifyToken } = req.body;
    
    // 构建更新数据
    const updateData = {};
    
    if (nickname !== undefined) {
      updateData.nickname = nickname;
    }
    
    if (password) {
      // 修改密码需要验证
      if (!verifyToken) {
        throw new BadRequestError('修改密码需要验证码验证');
      }
      
      // 验证令牌
      try {
        const decoded = jwt.verify(verifyToken, process.env.JWT_SECRET || 'xiaonuo_secret_key');
        if (!decoded || decoded.userId !== userId.toString() || !decoded.verified) {
          throw new BadRequestError('验证码验证失败');
        }
      } catch (error) {
        throw new BadRequestError('验证码验证失败');
      }
      
      updateData.password = password;
    }
    
    if (username) {
      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) {
        throw new ConflictError('用户名已存在');
      }
      updateData.username = username;
    }
    
    if (email) {
      // 修改邮箱需要验证
      if (!verifyToken) {
        throw new BadRequestError('修改邮箱需要验证码验证');
      }
      
      // 验证令牌
      try {
        const decoded = jwt.verify(verifyToken, process.env.JWT_SECRET || 'xiaonuo_secret_key');
        if (!decoded || decoded.userId !== userId.toString() || !decoded.verified) {
          throw new BadRequestError('验证码验证失败');
        }
      } catch (error) {
        throw new BadRequestError('验证码验证失败');
      }
      
      // 检查邮箱是否已存在
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw new ConflictError('邮箱已存在');
      }
      updateData.email = email;
    }
    
    if (theme !== undefined) {
      updateData.theme = theme;
    }
    
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }
    
    if (phone !== undefined) {
      // 修改手机号需要验证
      if (!verifyToken) {
        throw new BadRequestError('修改手机号需要验证码验证');
      }
      
      // 验证令牌
      try {
        const decoded = jwt.verify(verifyToken, process.env.JWT_SECRET || 'xiaonuo_secret_key');
        if (!decoded || decoded.userId !== userId.toString() || !decoded.verified) {
          throw new BadRequestError('验证码验证失败');
        }
      } catch (error) {
        throw new BadRequestError('验证码验证失败');
      }
      
      // 检查手机号是否已存在
      const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingUser) {
        throw new ConflictError('手机号已存在');
      }
      updateData.phone = phone;
    }
    
    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    
    res.json({
      status: 'ok',
      message: '更新用户信息成功',
      data: {
        userId: updatedUser._id,
        nickname: updatedUser.nickname,
        phone: updatedUser.phone,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        username: updatedUser.username,
        subscription: updatedUser.subscription,
        recordCount: updatedUser.recordCount,
        role: updatedUser.role || 'user',
        theme: updatedUser.theme,
        hasPassword: !!updatedUser.password
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 修改密码
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;
    
    if (!newPassword) {
      throw new BadRequestError('请提供新密码');
    }
    
    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    
    // 验证旧密码（如果提供了）
    if (oldPassword) {
      if (!await user.comparePassword(oldPassword)) {
        throw new BadRequestError('旧密码错误');
      }
    } else {
      // 如果没有提供旧密码，检查用户是否有密码
      if (user.password) {
        throw new BadRequestError('请提供旧密码');
      }
      // 如果用户没有密码（通过验证码注册），直接设置新密码
    }
    
    // 设置新密码
    user.password = newPassword;
    await user.save();
    
    res.json({
      status: 'ok',
      message: '密码修改成功'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 用户名密码登录
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 中间件next函数
 * @returns {Promise<void>}
 */
exports.loginWithPassword = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new BadRequestError('请提供用户名和密码');
    }
    
    // 查找用户 - 支持用户名、手机号或邮箱登录
    const user = await User.findOne({
      $or: [
        { username },
        { phone: username },
        { email: username }
      ]
    });
    
    if (!user || !await user.comparePassword(password)) {
      throw new UnauthorizedError('用户名或密码错误');
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'xiaonuo_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      status: 'ok',
      message: '登录成功',
      data: {
        token,
        user: {
          userId: user._id,
          nickname: user.nickname,
          phone: user.phone,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          subscription: user.subscription,
          recordCount: user.recordCount,
          role: user.role || 'user',
          theme: user.theme
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
