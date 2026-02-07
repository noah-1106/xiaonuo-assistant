const Order = require('../models/Order');
const Plan = require('../models/Plan');
const User = require('../models/User');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const paymentService = require('../services/paymentService');

/**
 * 生成订单编号
 * @returns {string} 生成的订单编号
 */
const generateOrderId = () => {
  return 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

/**
 * 获取订单列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getOrders = async (req, res) => {
  const { userId, status } = req.query;
  const query = {};
  
  if (userId) {
    query.userId = userId;
  }
  if (status) {
    query.status = status;
  }
  
  const orders = await Order.find(query)
    .populate('planId', 'name duration originalPrice actualPrice')
    .sort({ createdAt: -1 });
  
  res.json({
    status: 'ok',
    message: '获取订单列表成功',
    data: orders
  });
};

/**
 * 获取订单详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('planId', 'name duration originalPrice actualPrice')
    .populate('userId', 'username phone email');
  
  if (!order) {
    throw new NotFoundError('订单不存在');
  }
  
  res.json({
    status: 'ok',
    message: '获取订单详情成功',
    data: order
  });
};

/**
 * 创建订单
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.createOrder = async (req, res) => {
  const { planId, paymentMethod, quantity = 1 } = req.body;
  const userId = req.user._id;
  
  // 验证套餐是否存在
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new NotFoundError('套餐不存在');
  }
  
  // 验证购买数量
  if (quantity < 1 || !Number.isInteger(quantity)) {
    throw new BadRequestError('购买数量必须是大于0的整数');
  }
  
  // 计算总金额
  const actualPrice = plan.discountPrice || plan.price;
  const totalAmount = actualPrice * quantity;
  
  // 生成订单
  const order = new Order({
    userId,
    planId,
    orderId: generateOrderId(),
    amount: totalAmount,
    quantity,
    paymentMethod: paymentMethod || 'manual',
    status: 'pending'
  });
  
  await order.save();
  
  res.json({
    status: 'ok',
    message: '创建订单成功',
    data: order
  });
};

/**
 * 更新订单状态
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateOrderStatus = async (req, res) => {
  const { status, paymentTime } = req.body;
  
  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new NotFoundError('订单不存在');
  }
  
  // 如果订单状态更新为已支付，计算套餐有效期
  if (status === 'paid' && order.status !== 'paid') {
    // 获取套餐信息
    const plan = await Plan.findById(order.planId);
    if (plan) {
      const now = new Date();
      let planStartDate = now;
      let planEndDate = new Date(now);
      
      // 获取用户当前套餐信息
      const user = await User.findById(order.userId);
      
      // 计算总时长（天）
      const totalDuration = plan.duration * order.quantity;
      
      // 如果用户已有有效套餐，叠加时长
      if (user.subscription && user.subscription.endDate && user.subscription.endDate > now) {
        // 以现有结束日期为基础，叠加新套餐时长
        planStartDate = new Date(user.subscription.startDate);
        planEndDate = new Date(user.subscription.endDate);
        planEndDate.setDate(planEndDate.getDate() + totalDuration);
      } else {
        // 新套餐从当前时间开始
        planEndDate.setDate(planEndDate.getDate() + totalDuration);
      }
      
      // 更新订单信息
      order.status = status;
      order.paymentTime = paymentTime || now;
      order.planStartDate = planStartDate;
      order.planEndDate = planEndDate;
      
      // 更新用户的套餐信息
      await User.findByIdAndUpdate(order.userId, {
        subscription: {
          status: 'subscribed',
          startDate: planStartDate,
          endDate: planEndDate,
          plan: plan.name
        }
      });
    }
  } else {
    order.status = status;
    if (paymentTime) {
      order.paymentTime = paymentTime;
    }
  }
  
  await order.save();
  
  res.json({
    status: 'ok',
    message: '更新订单状态成功',
    data: order
  });
};

/**
 * 删除订单
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.deleteOrder = async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    throw new NotFoundError('订单不存在');
  }
  
  res.json({
    status: 'ok',
    message: '删除订单成功',
    data: order
  });
};

/**
 * 生成微信支付二维码
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.generateWechatQR = async (req, res) => {
  const { id } = req.params;
  
  // 查找订单
  const order = await Order.findById(id).populate('planId');
  if (!order) {
    throw new NotFoundError('订单不存在');
  }
  
  // 验证订单状态
  if (order.status !== 'pending') {
    throw new BadRequestError('订单状态不正确，只有待支付订单可以生成支付二维码');
  }
  
  try {
    // 生成商户订单号
    const outTradeNo = order.orderId;
    
    // 转换金额为分
    const totalAmount = Math.round(order.amount * 100);
    
    // 构建支付参数
    const paymentParams = {
      out_trade_no: outTradeNo,
      total: totalAmount,
      description: `购买${order.planId.name}套餐${order.quantity}份`,
      attach: JSON.stringify({ orderId: order._id })
    };
    
    // 生成微信支付二维码
    const paymentResult = await paymentService.generateWechatNativeQR(paymentParams);
    
    // 更新订单的支付信息
    order.outTradeNo = outTradeNo;
    await order.save();
    
    res.json({
      status: 'ok',
      message: '生成微信支付二维码成功',
      data: {
        orderId: order._id,
        outTradeNo: paymentResult.out_trade_no,
        codeUrl: paymentResult.code_url,
        expireTime: paymentResult.expire_time,
        totalAmount: order.amount
      }
    });
  } catch (error) {
    console.error('生成微信支付二维码失败:', error);
    res.status(500).json({
      status: 'error',
      message: '生成微信支付二维码失败',
      data: null
    });
  }
};

/**
 * 查询支付状态
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.queryPaymentStatus = async (req, res) => {
  const { id } = req.params;
  
  // 查找订单
  const order = await Order.findById(id);
  if (!order) {
    throw new NotFoundError('订单不存在');
  }
  
  // 如果订单状态不是待支付，直接返回
  if (order.status !== 'pending') {
    return res.json({
      status: 'ok',
      message: '查询支付状态成功',
      data: {
        orderId: order._id,
        status: order.status,
        paymentTime: order.paymentTime
      }
    });
  }
  
  try {
    // 查询微信支付状态
    const paymentStatus = await paymentService.queryPaymentStatus(order.outTradeNo || order.orderId);
    
    // 如果支付成功，更新订单状态
    if (paymentStatus.status === 'SUCCESS') {
      const now = new Date();
      
      // 获取套餐信息
      const plan = await Plan.findById(order.planId);
      if (plan) {
        let planStartDate = now;
        let planEndDate = new Date(now);
        
        // 获取用户当前套餐信息
        const user = await User.findById(order.userId);
        
        // 计算总时长（天）
        const totalDuration = plan.duration * order.quantity;
        
        // 如果用户已有有效套餐，叠加时长
        if (user.subscription && user.subscription.endDate && user.subscription.endDate > now) {
          planStartDate = new Date(user.subscription.startDate);
          planEndDate = new Date(user.subscription.endDate);
          planEndDate.setDate(planEndDate.getDate() + totalDuration);
        } else {
          planEndDate.setDate(planEndDate.getDate() + totalDuration);
        }
        
        // 更新订单信息
        order.status = 'paid';
        order.paymentTime = paymentStatus.paid_time || now;
        order.planStartDate = planStartDate;
        order.planEndDate = planEndDate;
        
        // 更新用户的套餐信息
        await User.findByIdAndUpdate(order.userId, {
          subscription: {
            status: 'subscribed',
            startDate: planStartDate,
            endDate: planEndDate,
            plan: plan._id
          }
        });
        
        await order.save();
      }
      
      // 发送更新后的状态给客户端
      res.json({
        status: 'ok',
        message: '查询支付状态成功',
        data: {
          orderId: order._id,
          status: 'paid',
          paymentTime: order.paymentTime
        }
      });
    } else {
      res.json({
        status: 'ok',
        message: '查询支付状态成功',
        data: {
          orderId: order._id,
          status: paymentStatus.status,
          transactionId: paymentStatus.transaction_id
        }
      });
    }
  } catch (error) {
    console.error('查询支付状态失败:', error);
    res.status(500).json({
      status: 'error',
      message: '查询支付状态失败',
      data: null
    });
  }
};
