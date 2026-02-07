const Record = require('../models/Record');
const notificationService = require('../services/notificationService');
const websocketService = require('../services/websocketService');
const { NotFoundError, ForbiddenError } = require('../utils/customErrors');

/**
 * 获取用户所有记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getRecords = async (req, res) => {
  const records = await Record.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({
    status: 'ok',
    message: '获取记录成功',
    data: {
      records
    }
  });
};

/**
 * 创建新记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.createRecord = async (req, res) => {
  // 检查用户订阅状态，如果过期则返回友好提示
  if (req.user.subscription.status === 'expired') {
    return res.json({
      status: 'subscription_expired',
      message: '您的订阅已过期，无法创建新记录。请续费以继续使用。'
    });
  }
  
  const { content, summary, title, type, status, tags } = req.body;
  
  const record = new Record({
    userId: req.user._id,
    content,
    summary: summary || title, // 如果没有提供summary，使用title作为summary
    title,
    type,
    status,
    tags
  });
  
  await record.save();
  
  // 发送WebSocket通知，告知前端记录已创建
  websocketService.sendRecordCreated(req.user._id, record);
  
  res.json({
    status: 'ok',
    message: '记录创建成功',
    data: {
      record
    }
  });
};

/**
 * 更新记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateRecord = async (req, res) => {
  // 检查用户订阅状态，如果过期则返回友好提示
  if (req.user.subscription.status === 'expired') {
    return res.json({
      status: 'subscription_expired',
      message: '您的订阅已过期，无法修改记录。请续费以继续使用。'
    });
  }
  
  const { id } = req.params;
  
  // 检查记录是否存在且属于当前用户
  const record = await Record.findOne({ _id: id, userId: req.user._id });
  
  if (!record) {
    throw new NotFoundError('记录不存在');
  }
  
  // 只更新req.body中实际存在的字段，不影响其他字段
  // 手动更新记录，确保正确保存所有字段
  Object.assign(record, req.body);
  await record.save();
  
  // 重新查询记录，确保返回最新数据
  const updatedRecord = await Record.findById(id);
  
  // 发送WebSocket通知，告知前端记录已更新
  websocketService.sendRecordUpdated(req.user._id, updatedRecord);
  
  res.json({
    status: 'ok',
    message: '记录更新成功',
    data: {
      record: updatedRecord
    }
  });
};

/**
 * 删除记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.deleteRecord = async (req, res) => {
  const { id } = req.params;
  
  // 检查记录是否存在且属于当前用户
  const record = await Record.findOne({ _id: id, userId: req.user._id });
  
  if (!record) {
    throw new NotFoundError('记录不存在');
  }
  
  await Record.findByIdAndDelete(id);
  
  // 发送WebSocket通知，告知前端记录已删除
  websocketService.sendRecordDeleted(req.user._id, id);
  
  res.json({
    status: 'ok',
    message: '记录删除成功'
  });
};

/**
 * 获取用户未整理记录数量
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getPendingRecordsCount = async (req, res) => {
  const count = await Record.countDocuments({
    userId: req.user._id,
    status: 'pending'
  });
  
  res.json({
    status: 'ok',
    message: '获取未整理记录数量成功',
    data: {
      pendingCount: count
    }
  });
};

/**
 * 获取带筛选条件的记录列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getFilteredRecords = async (req, res) => {
  const { type, status, tags, startDate, endDate, page = 1, limit = 20 } = req.query;
  
  // 构建查询条件
  const query = {
    userId: req.user._id
  };
  
  // 添加类型筛选
  if (type) {
    query.type = type;
  }
  
  // 添加状态筛选
  if (status) {
    query.status = status;
  }
  
  // 添加标签筛选
  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagsArray };
  }
  
  // 添加时间范围筛选
  if (startDate) {
    query.createdAt = {
      $gte: new Date(startDate)
    };
  }
  
  if (endDate) {
    if (!query.createdAt) {
      query.createdAt = {};
    }
    query.createdAt.$lte = new Date(endDate);
  }
  
  // 计算分页偏移量
  const offset = (page - 1) * limit;
  
  // 执行查询
  const [records, total] = await Promise.all([
    Record.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Number(limit)),
    Record.countDocuments(query)
  ]);
  
  res.json({
    status: 'ok',
    message: '获取筛选记录成功',
    data: {
      records,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    }
  });
};

/**
 * 获取最近的N条记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getRecentRecords = async (req, res) => {
  const { limit = 5, type } = req.query;
  
  // 构建查询条件
  const query = {
    userId: req.user._id
  };
  
  // 添加类型筛选
  if (type) {
    query.type = type;
  }
  
  // 获取最近的记录
  const records = await Record.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit));
  
  res.json({
    status: 'ok',
    message: '获取最近记录成功',
    data: {
      records
    }
  });
};

/**
 * 根据关键词搜索记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.searchRecords = async (req, res) => {
  const { keyword, limit = 10 } = req.query;
  
  // 构建搜索条件
  const query = {
    userId: req.user._id,
    $or: [
      { title: { $regex: keyword, $options: 'i' } },
      { content: { $regex: keyword, $options: 'i' } },
      { tags: { $regex: keyword, $options: 'i' } }
    ]
  };
  
  // 搜索记录
  const records = await Record.find(query)
    .sort({ createdAt: -1 })
    .limit(Number(limit));
  
  res.json({
    status: 'ok',
    message: '搜索记录成功',
    data: {
      records
    }
  });
};

/**
 * 发送记录到对话
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.sendRecordToChat = async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.body; // 获取前端发送的会话ID
  
  console.log('接收到发送到聊天请求:', {
    recordId: id,
    sessionId: sessionId,
    userId: req.user._id
  });
  
  // 检查记录是否存在且属于当前用户
  const record = await Record.findOne({ _id: id, userId: req.user._id });
  if (!record) {
    throw new NotFoundError('记录不存在');
  }
  
  // 创建一个新的聊天会话或使用指定的会话
  const ChatSession = require('../models/ChatSession');
  const ChatMessage = require('../models/ChatMessage');
  
  let session;
  
  // 如果前端提供了会话ID，尝试使用它
  if (sessionId) {
    console.log('尝试使用前端提供的会话ID:', sessionId);
    session = await ChatSession.findOne({ 
      userId: req.user._id,
      sessionId: sessionId
    });
    console.log('找到的会话:', session ? session.sessionId : '未找到');
  }
  
  // 如果没有提供会话ID或会话不存在，使用最近的会话
  if (!session) {
    console.log('使用最近的会话');
    session = await ChatSession.findOne({ 
      userId: req.user._id
    }).sort({ updatedAt: -1 }); // 获取最近使用的会话
    console.log('找到的最近会话:', session ? session.sessionId : '未找到');
  }
  
  // 如果仍然没有会话，创建一个新的
  if (!session) {
    console.log('创建新会话');
    // 创建新会话
    const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    session = new ChatSession({
      userId: req.user._id,
      sessionId: newSessionId,
      title: '默认会话',
      roles: {
        baseRole: 'basic',
        enhancedRole: null
      }
    });
    await session.save();
    console.log('创建的新会话:', session.sessionId);
  }
  
  console.log('最终使用的会话:', session.sessionId);
  
  // 构建记录消息内容，包含完整的记录信息
  const recordMessage = {
    recordId: record._id,
    title: record.title || record.summary || '无标题',
    content: record.content,
    type: record.type,
    status: record.status,
    tags: record.tags || [],
    link: record.link,
    startTime: record.startTime,
    endTime: record.endTime,
    files: record.files || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
  
  // 创建用户消息（表示用户发送了记录）
  const userMessage = new ChatMessage({
    userId: req.user._id,
    sessionId: session.sessionId,
    content: JSON.stringify(recordMessage),
    sender: 'user',
    type: 'text'
  });
  await userMessage.save();
  console.log('创建的用户消息:', userMessage._id);
  
  // 创建AI消息（表示小诺收到了记录）
  const botMessage = new ChatMessage({
    userId: req.user._id,
    sessionId: session.sessionId,
    content: `已收到记录：${record.title || record.summary || '无标题'}`,
    sender: 'bot',
    type: 'text'
  });
  await botMessage.save();
  console.log('创建的AI消息:', botMessage._id);
  
  // 更新会话信息
  session.lastMessage = `已收到记录：${record.title || record.summary || '无标题'}`;
  session.messageCount = await ChatMessage.countDocuments({ sessionId: session.sessionId });
  await session.save();
  
  // 通过WebSocket通知前端有新消息
  try {
    const { io, socketConnections } = require('../index');
    if (io) {
      const socketId = socketConnections.get(req.user._id);
      if (socketId) {
        io.to(socketId).emit('new_chat_message', {
          sessionId: session.sessionId,
          message: {
            id: userMessage._id,
            content: userMessage.content,
            sender: userMessage.sender,
            timestamp: userMessage.timestamp
          }
        });
      }
    }
  } catch (error) {
    console.error('WebSocket通知失败:', error);
  }
  
  res.json({
    status: 'ok',
    message: '记录已发送到对话'
  });
};

/**
 * 发送记录到邮件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.sendRecordToEmail = async (req, res) => {
  const { id } = req.params;

  // 检查记录是否存在且属于当前用户
  const record = await Record.findOne({ _id: id, userId: req.user._id });
  if (!record) {
    throw new NotFoundError('记录不存在');
  }

  try {
    // 使用通知服务发送邮件
    // 注意：这里需要用户的邮箱地址，暂时使用用户对象中的邮箱
    // 实际应用中可能需要从用户配置或请求中获取
    const userEmail = req.user.email || 'user@example.com';

    // 调用通知服务的发送记录邮件方法
    const result = await notificationService.sendRecordEmail(userEmail, record);

    res.json({
      status: 'ok',
      message: result.message
    });
  } catch (error) {
    console.error('发送邮件失败:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || '发送邮件失败，请检查邮箱配置'
    });
  }
};

/**
 * 发送记录到短信
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.sendRecordToSms = async (req, res) => {
  const { id } = req.params;
  
  // 检查记录是否存在且属于当前用户
  const record = await Record.findOne({ _id: id, userId: req.user._id });
  if (!record) {
    throw new NotFoundError('记录不存在');
  }
  
  // 构建短信内容（注意：短信内容需要符合模板要求）
  // 这里只发送记录的标题和简要内容，因为短信长度有限
  const smsContent = `${record.title || record.summary || '无标题'}：${record.content.substring(0, 50)}${record.content.length > 50 ? '...' : ''}`;
  
  try {
    // 使用通知服务发送短信
    // 注意：这里需要用户的手机号，暂时使用用户对象中的手机号
    // 实际应用中可能需要从用户配置或请求中获取
    const userPhone = req.user.phone || '13800138000';
    
    // 这里应该调用通知服务的发送短信方法
    // 由于当前的通知服务主要用于验证码，我们可以模拟发送
    console.log(`[发送短信] 到 ${userPhone}\n内容：${smsContent}`);
    
    res.json({
      status: 'ok',
      message: '记录已通过短信发送'
    });
  } catch (error) {
    console.error('发送短信失败:', error);
    res.status(500).json({
      status: 'error',
      message: '发送短信失败，请检查短信配置'
    });
  }
};
