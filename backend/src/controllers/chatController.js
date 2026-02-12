const aiService = require('../services/aiService');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const websocketService = require('../services/websocketService');
const { NotFoundError, ForbiddenError } = require('../utils/customErrors');
const mongoose = require('mongoose');
const Record = require('../models/Record');

/**
 * 执行 Function Tool
 * @param {string} functionName - 函数名
 * @param {Object} functionArgs - 函数参数
 * @param {Object} context - 上下文对象 { req, session }
 * @returns {Promise<Object>} 函数执行结果
 */
exports.executeFunctionTool = async function executeFunctionTool(functionName, functionArgs, context) {
  console.log('=== 开始执行函数工具 ===');
  console.log('函数名称:', functionName);
  console.log('函数参数:', JSON.stringify(functionArgs, null, 2));
  
  const { req, session } = context;
  
  try {
    switch (functionName) {
    case 'web_search': {
      // 处理web_search工具调用
      console.log('执行web_search工具:', functionArgs);
      
      // 调用模型适配器的callTool方法来处理web_search
      if (aiService.modelAdapter && aiService.modelAdapter.callTool) {
        const searchResult = await aiService.modelAdapter.callTool('web_search', functionArgs);
        console.log('web_search工具执行成功');
        return {
          type: 'web_search_result',
          success: true,
          searchResult: searchResult,
          action: 'web_search'
        };
      } else {
        throw new Error('模型适配器不支持web_search工具');
      }
    }
    
    case 'createRecord': {
      const recordData = functionArgs;
      
      // 检查用户订阅状态
      if (req.user.subscription?.status === 'expired') {
        throw new Error('您的订阅已过期，无法创建新简录。请续费以继续使用。');
      }
      
      // 验证简录类型
      const allowedRecordTypes = await aiService.getSessionRecordTypes(session.roles.enhancedRole);
      if (!allowedRecordTypes.includes(recordData.type)) {
        throw new Error(`不允许创建该类型的简录。当前角色允许的简录类型：${allowedRecordTypes.join(', ')}`);
      }

      // 创建简录
      const record = new Record({
        userId: req.user._id,
        content: recordData.content,
        title: recordData.title,
        type: recordData.type,
        status: recordData.status || 'pending',
        tags: recordData.tags || [],
        summary: recordData.summary || recordData.title || recordData.content.substring(0, 100) + (recordData.content.length > 100 ? '...' : '')
      });
      
      await record.save();
      websocketService.sendRecordCreated(req.user._id, record);
      
      return {
        type: 'create_result',
        success: true,
        recordId: record._id,
        recordTitle: recordData.title || '无标题',
        recordType: recordData.type,
        action: 'create_record'
      };
    }
    
    case 'getRecordList': {
      const { type, status, tags, startDate, endDate, page = 1, limit = 20 } = functionArgs;
      
      const query = { userId: req.user._id };
      if (type) query.type = type;
      if (status) query.status = status;
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagsArray };
      }
      if (startDate) query.createdAt = { $gte: new Date(startDate) };
      if (endDate) {
        if (!query.createdAt) query.createdAt = {};
        query.createdAt.$lte = new Date(endDate);
      }
      
      const offset = (page - 1) * limit;
      const [records, total] = await Promise.all([
        Record.find(query).sort({ createdAt: -1 }).skip(offset).limit(Number(limit)),
        Record.countDocuments(query)
      ]);
      
      return {
        type: 'record_list_result',
        success: true,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        records: records.map(r => ({
          recordId: r._id,
          title: r.title || r.summary || '无标题',
          type: r.type,
          status: r.status,
          tags: r.tags,
          createdAt: r.createdAt
        })),
        filters: { type, status, tags, startDate, endDate },
        action: 'get_record_list'
      };
    }
    
    case 'getRecord': {
      const { recordId } = functionArgs;
      
      // 验证recordId格式
      if (!mongoose.Types.ObjectId.isValid(recordId)) {
        throw new Error('无效的简录ID格式，请使用正确的MongoDB ObjectId格式，例如：6989f97596364cb06f83abf7');
      }
      
      const record = await Record.findOne({ _id: recordId, userId: req.user._id });
      
      if (!record) throw new Error('简录不存在');
      
      return {
        type: 'record_detail_result',
        success: true,
        record: {
          recordId: record._id,
          title: record.title || record.summary || '无标题',
          type: record.type,
          status: record.status,
          tags: record.tags,
          content: record.content,
          link: record.link,
          createdAt: record.createdAt
        },
        action: 'get_record'
      };
    }
    
    case 'updateRecord': {
      const { recordId, title, content, type, status, tags, link } = functionArgs;
      
      // 验证recordId格式
      if (!mongoose.Types.ObjectId.isValid(recordId)) {
        throw new Error('无效的简录ID格式，请使用正确的MongoDB ObjectId格式，例如：6989f97596364cb06f83abf7');
      }
      
      const record = await Record.findOne({ _id: recordId, userId: req.user._id });
      
      if (!record) throw new Error('简录不存在');
      
      if (title !== undefined) record.title = title;
      if (content !== undefined) {
        record.content = content;
        record.summary = content.substring(0, 100) + (content.length > 100 ? '...' : '');
      }
      if (type !== undefined) {
        const allowedRecordTypes = await aiService.getSessionRecordTypes(session.roles.enhancedRole);
        if (!allowedRecordTypes.includes(type)) {
          throw new Error(`不允许使用该类型的简录。当前角色允许的简录类型：${allowedRecordTypes.join(', ')}`);
        }
        record.type = type;
      }
      if (status !== undefined) record.status = status;
      if (tags !== undefined) record.tags = tags;
      if (link !== undefined) record.link = link;
      
      await record.save();
      websocketService.sendRecordUpdated(req.user._id, record);
      
      return {
        type: 'update_result',
        success: true,
        recordId: recordId,
        recordTitle: record.title || record.summary || '无标题',
        updatedFields: { title: title !== undefined, content: content !== undefined, type: type !== undefined, status: status !== undefined, tags: tags !== undefined, link: link !== undefined },
        action: 'update_record'
      };
    }
    
    case 'deleteRecord': {
      const { recordId } = functionArgs;
      
      // 验证recordId格式
      if (!mongoose.Types.ObjectId.isValid(recordId)) {
        throw new Error('无效的简录ID格式，请使用正确的MongoDB ObjectId格式，例如：6989f97596364cb06f83abf7');
      }
      
      const record = await Record.findOne({ _id: recordId, userId: req.user._id });
      
      if (!record) throw new Error('简录不存在');
      
      await Record.deleteOne({ _id: recordId });
      websocketService.sendRecordDeleted(req.user._id, recordId);
      
      return {
        type: 'delete_result',
        success: true,
        recordId,
        recordTitle: record.title || record.summary || '无标题',
        action: 'delete_record'
      };
    }
    
    case 'getRecentRecords': {
      const { limit = 5, type } = functionArgs;
      const query = { userId: req.user._id };
      if (type) query.type = type;
      
      const records = await Record.find(query).sort({ createdAt: -1 }).limit(Number(limit));
      
      return {
        type: 'recent_records_result',
        success: true,
        count: records.length,
        limit: Number(limit),
        recordType: type,
        records: records.map(r => ({
          recordId: r._id,
          title: r.title || r.summary || '无标题',
          type: r.type,
          status: r.status,
          tags: r.tags,
          createdAt: r.createdAt
        })),
        action: 'get_recent_records'
      };
    }
    
    case 'searchRecords': {
      const { keyword, limit = 10 } = functionArgs;
      const query = {
        userId: req.user._id,
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } },
          { summary: { $regex: keyword, $options: 'i' } }
        ]
      };
      
      const records = await Record.find(query).sort({ createdAt: -1 }).limit(Number(limit));
      
      return {
        type: 'search_result',
        success: true,
        keyword,
        count: records.length,
        records: records.map(r => ({
          recordId: r._id,
          title: r.title || r.summary || '无标题',
          type: r.type,
          status: r.status,
          tags: r.tags,
          createdAt: r.createdAt
        })),
        action: 'search_records'
      };
    }
    
    default:
      throw new Error(`未知的函数：${functionName}`);
    }
  } catch (error) {
    console.error('执行函数工具失败:', error.message);
    console.error('错误堆栈:', error.stack);
    throw error;
  } finally {
    console.log('=== 函数工具执行完成 ===');
  }
}

/**
 * 处理 Function Calling 循环
 * @param {Object} initialParsedResponse - 初始解析的 AI 响应
 * @param {Object} context - 上下文对象 { req, session, formattedMessages, functions }
 * @returns {Promise<string>} 最终回复内容
 */
async function handleFunctionCallLoop(initialParsedResponse, context) {
  const { req, session, formattedMessages, functions } = context;
  let finalReply = '';
  let functionCallCount = 0;
  const maxFunctionCalls = 10; // 防止无限循环

  console.log('=== 开始处理函数调用循环 ===');
  console.log('初始响应类型:', initialParsedResponse.type);
  console.log('初始响应内容:', initialParsedResponse.content);
  console.log('初始响应finishReason:', initialParsedResponse.finishReason);

  // 使用传入的 formattedMessages 作为消息历史基础
  let messageHistory = [...formattedMessages];
  let currentParsedResponse = initialParsedResponse;

  // 遵循官方工具调用流程：发起请求 → 执行工具 → 回填结果 → 再次发起请求（如果需要）
  while ((currentParsedResponse.type === 'function_call' || currentParsedResponse.finishReason === 'tool_calls') && functionCallCount < maxFunctionCalls) {
    functionCallCount++;
    console.log(`=== 执行函数调用第 ${functionCallCount} 次 ===`);

    try {
      // 步骤1：处理当前的工具调用
      const functionName = currentParsedResponse.functionName;
      const functionArgs = currentParsedResponse.functionArgs;
      const toolCallId = `tool_call_${Date.now()}_${functionCallCount}`;

      console.log('函数调用名称:', functionName);
      console.log('函数调用参数:', JSON.stringify(functionArgs, null, 2));

      // 添加 assistant 的完整消息到消息历史
      messageHistory.push({
        role: 'assistant',
        content: currentParsedResponse.content || '',
        tool_calls: [{
          function: {
            name: functionName,
            arguments: JSON.stringify(functionArgs)
          },
          id: toolCallId
        }]
      });

      // 保存 function_call 消息到数据库
      try {
        const functionCallMessage = new ChatMessage({
          userId: req.user._id,
          sessionId: session.sessionId,
          content: currentParsedResponse.content || `[FUNCTION_CALL]${functionName}(${JSON.stringify(functionArgs)})[/FUNCTION_CALL]`,
          sender: 'bot',
          type: 'function_call',
          responseId: currentParsedResponse.responseId,
          previousResponseId: currentParsedResponse.previousResponseId || null
        });
        await functionCallMessage.save();
        console.log('函数调用消息保存成功');
      } catch (dbError) {
        console.error('函数调用消息保存失败:', dbError.message);
        // 继续执行，不因为数据库错误而中断
      }

      // 步骤2：执行工具调用
      console.log('开始执行工具调用:', functionName);
      let functionResult;
      let toolContent;
      try {
        functionResult = await exports.executeFunctionTool(
          functionName,
          functionArgs,
          { req, session }
        );
        console.log('工具调用执行成功:', functionName);

        // 步骤3：回填工具结果（将结果告诉大模型）
        // 直接返回函数执行结果的字符串表示，符合官方文档要求
        if (typeof functionResult === 'string') {
          toolContent = functionResult;
        } else if (functionResult.success) {
          // 构建简洁的工具执行结果，符合官方示例格式
          switch (functionResult.type) {
            case 'web_search_result':
              // 处理web搜索结果
              if (functionResult.searchResult && functionResult.searchResult.type === 'text') {
                // 如果搜索结果已经是处理好的文本
                toolContent = functionResult.searchResult.content;
              } else {
                // 构建搜索结果摘要
                toolContent = `搜索结果：\n`;
                if (functionResult.searchResult.search_results && Array.isArray(functionResult.searchResult.search_results)) {
                  functionResult.searchResult.search_results.slice(0, 3).forEach((result, index) => {
                    toolContent += `${index + 1}. ${result.title} (${result.url})\n${result.content}\n\n`;
                  });
                } else {
                  toolContent += `搜索完成，获取到相关信息。`;
                }
              }
              break;
            case 'create_result':
              toolContent = `已成功创建简录：${functionResult.recordTitle}\n- recordID：${functionResult.recordId}\n- 简录类型：${functionResult.recordType}`;
              break;
            case 'update_result':
              toolContent = `已成功更新简录：${functionResult.recordTitle}\n- recordID：${functionResult.recordId}`;
              break;
            case 'delete_result':
              toolContent = `已成功删除简录：${functionResult.recordTitle}\n- recordID：${functionResult.recordId}`;
              break;
            case 'record_list_result':
              toolContent = `已获取${functionResult.total}条简录，当前显示第${functionResult.page}页\n`;
              if (functionResult.records && functionResult.records.length > 0) {
                toolContent += `前${Math.min(3, functionResult.records.length)}条简录：\n`;
                functionResult.records.slice(0, 3).forEach((record, index) => {
                  toolContent += `${index + 1}. ${record.title} (recordID: ${record.recordId}, 类型: ${record.type})\n`;
                });
              }
              break;
            case 'record_detail_result':
              toolContent = `已获取简录详情：${functionResult.record.title}\n- recordID：${functionResult.record.recordId}\n- 简录类型：${functionResult.record.type}\n- 状态：${functionResult.record.status}`;
              break;
            case 'recent_records_result':
              toolContent = `已获取${functionResult.count}条最近简录\n`;
              if (functionResult.records && functionResult.records.length > 0) {
                toolContent += `前${Math.min(3, functionResult.records.length)}条简录：\n`;
                functionResult.records.slice(0, 3).forEach((record, index) => {
                  toolContent += `${index + 1}. ${record.title} (recordID: ${record.recordId}, 类型: ${record.type})\n`;
                });
              }
              break;
            case 'search_result':
              toolContent = `已搜索到${functionResult.count}条匹配简录\n`;
              if (functionResult.records && functionResult.records.length > 0) {
                toolContent += `前${Math.min(3, functionResult.records.length)}条匹配简录：\n`;
                functionResult.records.slice(0, 3).forEach((record, index) => {
                  toolContent += `${index + 1}. ${record.title} (recordID: ${record.recordId}, 类型: ${record.type})\n`;
                });
              }
              break;
            default:
              toolContent = `操作成功：${functionResult.type}`;
          }
        } else {
          // 错误消息
          toolContent = `❌ 操作失败\n- 失败原因：${functionResult.error || '未知错误'}\n\n尝试理解错误原因，并根据错误尝试解决问题。`;
        }
      } catch (toolError) {
        console.error('工具执行失败:', toolError.message);
        // 将错误信息作为tool消息内容
        toolContent = `❌ 操作失败\n- 失败原因：${toolError.message}\n\n尝试理解错误原因，并根据错误尝试解决问题。`;
        functionResult = {
          success: false,
          error: toolError.message
        };
      }
      
      const toolMessage = {
        role: 'tool',
        content: toolContent,
        tool_call_id: toolCallId
      };
      messageHistory.push(toolMessage);

      console.log('系统回复大模型（工具执行结果）:', toolContent);

      // 保存 function_result 消息到数据库
      try {
        const functionResultMessage = new ChatMessage({
          userId: req.user._id,
          sessionId: session.sessionId,
          content: JSON.stringify(functionResult),
          sender: 'tool',
          type: 'function_result',
          toolCallId: toolCallId,
          responseId: currentParsedResponse.responseId,
          previousResponseId: currentParsedResponse.previousResponseId || null
        });
        await functionResultMessage.save();
        console.log('函数执行结果消息保存成功');
      } catch (dbError) {
        console.error('函数执行结果消息保存失败:', dbError.message);
        // 继续执行，不因为数据库错误而中断
      }

      // 步骤4：再次发起模型请求，检查是否还有工具调用意愿
      console.log('开始再次发起模型请求');
      
      // 只传递工具执行结果消息，不传递完整的消息历史
      // 这样可以确保大模型只收到必要的工具执行结果，避免收到混乱的消息
      const toolResultMessages = [toolMessage];
      
      const aiResponse = await aiService.callAI(
        toolResultMessages,
        [], // 不传递工具列表
        false,
        session.roles.enhancedRole,
        session.sessionId,
        req.user._id.toString()
      );
      console.log('模型请求成功，获取响应');

      currentParsedResponse = aiService.parseAIResponse(aiResponse);
      
      console.log('解析后的响应类型:', currentParsedResponse.type);
      console.log('解析后的响应内容:', currentParsedResponse.content);
      console.log('解析后的响应finishReason:', currentParsedResponse.finishReason);

    } catch (error) {
      console.error(`Function calling 循环出错:`, error.message);
      console.error(`错误堆栈:`, error.stack);
      finalReply = `操作失败：${error.message}`;
      break;
    }
  }

  console.log(`=== 函数调用循环结束 ===`);
  console.log('函数调用次数:', functionCallCount);
  console.log('最终回复内容:', finalReply || currentParsedResponse.content);

  // 如果模型不再返回工具调用，使用最后的响应作为最终回复
  if (!finalReply && currentParsedResponse.content) {
    finalReply = currentParsedResponse.content;
  }

  // 如果达到最大循环次数，返回提示
  if (functionCallCount >= maxFunctionCalls && !finalReply) {
    finalReply = '操作步骤过多，请简化您的需求。';
  }

  return finalReply;
}

/**
 * 获取聊天会话列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getChatSessions = async (req, res) => {
  const sessions = await ChatSession.find({ userId: req.user._id }) 
    .sort({ updatedAt: -1 });
  
  res.json({
    status: 'ok',
    message: '获取聊天会话列表成功',
    data: sessions
  });
};

/**
 * 创建聊天会话 - 支持可选增强角色
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.createChatSession = async (req, res) => {
  const sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const { title, enhancedRole } = req.body;
  
  // 验证增强角色是否存在且启用
  let validatedEnhancedRole = null;
  if (enhancedRole) {
    const AISetting = require('../models/AISetting');
    const aiSetting = await AISetting.findOne();
    if (aiSetting) {
      const roleExists = aiSetting.enhancedRoles.some(role => role.id === enhancedRole && role.isEnabled);
      if (roleExists) {
        validatedEnhancedRole = enhancedRole;
      }
    }
  }
  
  const session = new ChatSession({
    userId: req.user._id,
    sessionId: sessionId,
    title: title || '新会话',
    roles: {
      baseRole: 'basic',
      enhancedRole: validatedEnhancedRole
    }
  });
  
  await session.save();
  
  res.json({
    status: 'ok',
    message: '创建聊天会话成功',
    data: session
  });
};

/**
 * 切换会话的增强角色
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.switchEnhancedRole = async (req, res) => {
  const { id } = req.params;
  const { enhancedRole } = req.body;
  
  // 查找会话并验证权限
  const session = await ChatSession.findOne({
    sessionId: id,
    userId: req.user._id
  });
  
  if (!session) {
    throw new NotFoundError('会话不存在');
  }
  
  // 验证增强角色是否存在且启用
  let validatedEnhancedRole = null;
  if (enhancedRole) {
    const AISetting = require('../models/AISetting');
    const aiSetting = await AISetting.findOne();
    if (aiSetting) {
      const roleExists = aiSetting.enhancedRoles.some(role => role.id === enhancedRole && role.isEnabled);
      if (roleExists) {
        validatedEnhancedRole = enhancedRole;
      }
    }
  }
  
  // 更新会话的增强角色
  session.roles.enhancedRole = validatedEnhancedRole;
  await session.save();
  
  res.json({
    status: 'ok',
    message: '切换增强角色成功',
    data: session
  });
};

/**
 * 获取聊天会话详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getChatSessionDetail = async (req, res) => {
  const session = await ChatSession.findOne({ 
    sessionId: req.params.id, 
    userId: req.user._id 
  });
  
  if (!session) {
    throw new NotFoundError('会话不存在');
  }
  
  // 获取会话的消息历史（最近20轮对话，每轮2条消息）
  const messages = await ChatMessage.find({ sessionId: req.params.id }) 
    .sort({ timestamp: -1 })
    .limit(40) // 20轮 * 2条消息/轮
    .sort({ timestamp: 1 });
  
  res.json({
    status: 'ok',
    message: '获取聊天会话详情成功',
    data: {
      session,
      messages
    }
  });
};

/**
 * 更新聊天会话
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateChatSession = async (req, res) => {
  const session = await ChatSession.findOneAndUpdate(
    { sessionId: req.params.id, userId: req.user._id },
    req.body,
    { new: true }
  );
  
  if (!session) {
    throw new NotFoundError('会话不存在');
  }
  
  res.json({
    status: 'ok',
    message: '更新聊天会话成功',
    data: session
  });
};

/**
 * 删除聊天会话
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.deleteChatSession = async (req, res) => {
  console.log('开始删除会话:', {
    sessionId: req.params.id,
    userId: req.user._id
  });
  
  try {
    // 删除会话
    const session = await ChatSession.findOneAndDelete({
      sessionId: req.params.id,
      userId: req.user._id
    });
    
    console.log('删除会话结果:', {
      found: !!session,
      sessionId: session?.sessionId
    });
    
    if (!session) {
      console.error('会话删除失败: 会话不存在', {
        sessionId: req.params.id,
        userId: req.user._id
      });
      throw new NotFoundError('会话不存在');
    }
    
    // 删除会话的所有消息
    console.log('开始删除会话消息:', {
      sessionId: req.params.id
    });
    
    const messageResult = await ChatMessage.deleteMany({ sessionId: req.params.id });
    
    console.log('删除会话消息结果:', {
      deletedCount: messageResult.deletedCount
    });
    
    console.log('会话删除成功:', {
      sessionId: session.sessionId
    });
    
    res.json({
      status: 'ok',
      message: '删除聊天会话成功'
    });
  } catch (error) {
    console.error('删除会话过程中发生错误:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * 发送消息路由 - 支持角色提示词和AI自动创建简录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.sendChatMessage = async (req, res, next) => {
  console.log('=== 开始处理聊天消息 ===');
  console.log('用户ID:', req.user._id);
  console.log('会话ID:', req.body.sessionId);
  console.log('用户消息:', req.body.message);
  console.log('文件数量:', req.body.files ? (Array.isArray(req.body.files) ? req.body.files.length : 1) : 0);
  
  try {
    // 检查用户订阅状态，如果过期则返回友好提示
    if (req.user.subscription.status === 'expired') {
      console.log('用户订阅已过期');
      return res.json({
        status: 'subscription_expired',
        message: '您的订阅已过期，无法使用AI聊天功能。请续费以继续使用。'
      });
    }
      
    let { message, files = [], sessionId, history = [] } = req.body;

    console.log('接收到的原始files:', files);
    console.log('files类型:', typeof files);

    // 重构files格式为数据库期望的格式
    function normalizeFiles(inputFiles) {
      if (!inputFiles) return [];
      
      // 标准化为数组
      const filesArray = Array.isArray(inputFiles) ? inputFiles : [inputFiles];
      
      // 过滤和重构每个文件对象
      return filesArray.filter(file => {
        // 只处理对象类型
        return typeof file === 'object' && file !== null;
      }).map(file => {
        // 重构为标准格式
        return {
          name: file.name || '未知文件',
          type: file.type || 'application/octet-stream',
          url: (file.url || file.path || '').replace(/`/g, ''),
          fileKey: file.fileKey || ''
        };
      });
    }
    
    // 使用重构后的函数处理files
    let processedFiles = normalizeFiles(files);
    console.log('重构后的文件数量:', processedFiles.length);
    console.log('重构后的文件信息:', processedFiles);
    
    // 验证文件类型是否为File API允许的类型
    const isAllowedFileType = (fileType) => {
      const allowedTypes = [
        // 图片类型
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
        // 视频类型
        'video/mp4', 'video/webm', 'video/avi', 'video/mov',
        // 文档类型
        'application/pdf', 'text/plain', 'text/csv',
        // 音频类型
        'audio/mp3', 'audio/wav', 'audio/m4a'
      ];
      return allowedTypes.includes(fileType.toLowerCase());
    };

    // 验证并标准化文件对象格式
    processedFiles = processedFiles.map(file => {
      if (typeof file === 'object' && file !== null) {
        const fileType = file.type || 'application/octet-stream';
        if (!isAllowedFileType(fileType)) {
          console.warn('不支持的文件类型，将被过滤:', fileType, file.name);
          return null;
        }
        return {
          name: file.name || '未知文件',
          type: fileType,
          url: (file.url || file.path || '').replace(/`/g, ''),
          fileKey: file.fileKey || ''
        };
      }
      return null;
    }).filter(Boolean);
    
    // 使用处理后的files
    files = processedFiles;
    console.log('最终使用的files:', files);
    
    // 1. 确保会话存在，如果不存在则创建
    let session;
    try {
      session = await ChatSession.findOne({ 
        sessionId: sessionId, 
        userId: req.user._id 
      });
      
      // 如果没有提供sessionId或会话不存在，创建新会话
      if (!session) {
        console.log('会话不存在，创建新会话');
        // 使用前端传入的sessionId（如果有的话），否则生成新的
        const newSessionId = sessionId || Date.now().toString() + Math.random().toString(36).substr(2, 9);
        session = new ChatSession({
          userId: req.user._id,
          sessionId: newSessionId,
          title: '新会话',
          roles: {
            baseRole: 'basic',
            enhancedRole: null
          }
        });
        await session.save();
        console.log('新会话创建成功:', newSessionId);
      } else {
        console.log('会话存在:', session.sessionId);
      }
    } catch (sessionError) {
      console.error('会话处理失败:', sessionError.message);
      return res.status(200).json({
        success: false,
        message: '会话处理失败，请稍后重试',
        error: sessionError.message
      });
    }
    
    // 2. 获取系统提示词和角色提示词
    let systemPrompt = '';
    let rolePrompts = [];
    const AISetting = require('../models/AISetting');
    const aiSetting = await AISetting.findOne();
    
    try {
      // 获取系统提示词
      if (aiSetting && aiSetting.systemPrompt) {
        systemPrompt = aiSetting.systemPrompt.trim();
      } else {
        systemPrompt = '你是一个智能助手，叫做小诺，你需要帮助用户完成各种任务，包括创建记录、回答问题等。';
      }
      console.log('获取系统提示词成功，长度:', systemPrompt.length);
      
      // 获取效率助理提示词
      if (aiSetting && aiSetting.efficiencyAssistant && aiSetting.efficiencyAssistant.prompt) {
        rolePrompts.push({
          name: '效率助理',
          prompt: aiSetting.efficiencyAssistant.prompt.trim()
        });
      }
      
      // 获取增强角色提示词
      if (aiSetting && session.roles.enhancedRole) {
        const enhancedRole = aiSetting.enhancedRoles.find(role => role.id === session.roles.enhancedRole && role.isEnabled);
        if (enhancedRole && enhancedRole.prompt) {
          rolePrompts.push({
            name: enhancedRole.name,
            prompt: enhancedRole.prompt.trim()
          });
        }
      }
      
      console.log('获取角色提示词成功，角色数量:', rolePrompts.length);
    } catch (promptError) {
      console.error('获取提示词失败:', promptError.message);
      return res.status(200).json({
        success: false,
        message: '提示词处理失败，请稍后重试',
        error: promptError.message
      });
    }
    
    // 3. 消息格式化
    const formattedMessages = [];
    
    // 准备用户信息变量，供管理员在提示词中引用
    console.log('用户信息:', {
      nickname: req.user.nickname,
      username: req.user.username,
      userId: req.user._id
    });
    
    const userInfo = {
      nickname: req.user.nickname,
      username: req.user.username,
      plan: req.user.plan,
      subscription: req.user.subscription
    };
    
    // 替换提示词中的用户信息变量
    function replaceUserInfoVariables(prompt) {
      let processedPrompt = prompt;
      
      // 替换基本用户信息变量
      processedPrompt = processedPrompt.replace(/\{nickname\}/g, userInfo.nickname || '');
      processedPrompt = processedPrompt.replace(/\{username\}/g, userInfo.username || '');
      
      // 替换套餐信息变量
      if (userInfo.plan) {
        processedPrompt = processedPrompt.replace(/\{plan.name\}/g, userInfo.plan.name || '');
        processedPrompt = processedPrompt.replace(/\{plan.endDate\}/g, userInfo.plan.endDate || '');
        processedPrompt = processedPrompt.replace(/\{plan.expiryDate\}/g, userInfo.plan.expiryDate || '');
      }
      
      // 替换订阅信息变量
      if (userInfo.subscription) {
        processedPrompt = processedPrompt.replace(/\{subscription.name\}/g, userInfo.subscription.name || '');
        processedPrompt = processedPrompt.replace(/\{subscription.endDate\}/g, userInfo.subscription.endDate || '');
        processedPrompt = processedPrompt.replace(/\{subscription.expiryDate\}/g, userInfo.subscription.expiryDate || '');
      }
      
      return processedPrompt;
    }
    
    // 处理系统提示词
    const processedSystemPrompt = replaceUserInfoVariables(systemPrompt);
    
    // 处理角色提示词
    const processedRolePrompts = rolePrompts.map(role => ({
      name: role.name,
      prompt: replaceUserInfoVariables(role.prompt)
    }));
    
    // 获取当前角色允许的记录类型及其名称
    const allowedRecordTypes = await aiService.getSessionRecordTypes(session.roles.enhancedRole);
    console.log('当前角色允许的记录类型:', allowedRecordTypes);
    
    // 构建记录类型显示格式（包含类型ID和类型名称）
    let formattedRecordTypes = [];
    if (aiSetting) {
      // 获取所有记录类型信息
      const allRecordTypes = [];
      
      // 从效率助理获取记录类型
      if (aiSetting.efficiencyAssistant && aiSetting.efficiencyAssistant.recordTypes) {
        if (Array.isArray(aiSetting.efficiencyAssistant.recordTypes)) {
          allRecordTypes.push(...aiSetting.efficiencyAssistant.recordTypes);
        }
      }
      
      // 从增强角色获取记录类型
      if (session.roles.enhancedRole) {
        const enhancedRole = aiSetting.enhancedRoles.find(role => role.id === session.roles.enhancedRole && role.isEnabled);
        if (enhancedRole && enhancedRole.enhancedRecordTypes) {
          allRecordTypes.push(...enhancedRole.enhancedRecordTypes);
        }
      }
      
      // 构建格式化的记录类型
      formattedRecordTypes = allowedRecordTypes.map(typeId => {
        const typeInfo = allRecordTypes.find(type => type.id === typeId);
        if (typeInfo && typeInfo.name) {
          return `${typeId}（${typeInfo.name}）`;
        } else {
          // 类型映射
          const typeMap = {
            'todo': '待办事项',
            'article': '文章资料',
            'inspiration': '灵感闪现',
            'other': '其他',
            'haohua': '新年祝福'
          };
          return `${typeId}（${typeMap[typeId] || typeId}）`;
        }
      });
    } else {
      // 类型映射
      const typeMap = {
        'todo': '待办事项',
        'article': '文章资料',
        'inspiration': '灵感闪现',
        'other': '其他',
        'haohua': '新年祝福'
      };
      formattedRecordTypes = allowedRecordTypes.map(typeId => `${typeId}（${typeMap[typeId] || typeId}）`);
    }
    console.log('格式化后的记录类型:', formattedRecordTypes);
    
    // 构建最终提示词（按照用户要求的格式）
    let finalPrompt = processedSystemPrompt; // 处理后的系统提示词
    
    // 添加角色提示词
    processedRolePrompts.forEach(role => {
      finalPrompt += `\n\n【角色能力】${role.name}\n${role.prompt}`;
    });
    
    // 添加允许的简录类型
    finalPrompt += `\n\n【当前允许的简录类型】\n${formattedRecordTypes.join(', ')}`;
    
    console.log('构建最终提示词成功，长度:', finalPrompt.length);
    
    // 添加系统提示词（已处理用户信息变量引用和允许的记录类型）
    formattedMessages.push({
      role: 'system',
      content: finalPrompt
    });
    
    // 添加历史消息（如果有）
    if (history && Array.isArray(history) && history.length > 0) {
      // 只保留最近5轮对话（每轮包含一条用户消息和一条助手回复）
      // 5轮对话 = 10条消息
      const maxRounds = 5;
      const recentHistory = history.slice(-(maxRounds * 2));
      console.log('添加历史消息数量:', recentHistory.length);
      recentHistory.forEach(msg => {
        formattedMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }
    
    // 始终添加当前用户消息
    let currentMessage = message;
    if (files.length > 0) {
      currentMessage += '\n\n文件：' + files.map(file => file.name).join(', ');
    }
    
    formattedMessages.push({
      role: 'user',
      content: currentMessage
    });
    
    console.log('消息格式化完成，总消息数:', formattedMessages.length);
    
    // 4. 根据输入类型调用相应的处理方法
    let aiResponse;
    let messageType = 'text';
    let functions = []; // 定义函数列表，用于Function Calling
    
    // 检查是否有文件上传
    if (files && files.length > 0) {
      // 处理文件上传
      console.log('处理文件上传');
      const file = files[0];
      const fileUrl = file.url || file.path;
      
      // 获取上一轮的responseId（用于Responses API多轮对话）
      let previousResponseId = null;
      try {
        // 尝试从aiService获取模型适配器并获取上下文ID
        if (aiService.modelAdapter && aiService.modelAdapter.getContextId) {
          previousResponseId = await aiService.modelAdapter.getContextId(req.user._id.toString(), session.sessionId);
          console.log('获取上一轮responseId:', previousResponseId);
        }
      } catch (contextError) {
        console.error('获取上下文ID失败:', contextError.message);
        previousResponseId = null;
      }
      
      if (file.type && file.type.startsWith('image/')) {
        // 图片处理
        console.log('处理图片文件:', file.name);
        try {
          aiResponse = await aiService.processImageMessage(fileUrl, message, req.user._id.toString(), previousResponseId);
          messageType = 'image';
          console.log('图片处理成功');
        } catch (imageError) {
          console.error('图片处理失败:', imageError.message);
          return res.status(200).json({
            success: false,
            message: '图片处理失败，请稍后重试',
            error: imageError.message
          });
        }
      } else if (file.type && file.type.startsWith('video/')) {
        // 视频处理
        console.log('处理视频文件:', file.name);
        try {
          aiResponse = await aiService.processVideoMessage(fileUrl, message, req.user._id.toString(), previousResponseId);
          messageType = 'video';
          console.log('视频处理成功');
        } catch (videoError) {
          console.error('视频处理失败:', videoError.message);
          return res.status(200).json({
            success: false,
            message: '视频处理失败，请稍后重试',
            error: videoError.message
          });
        }
      } else {
        // 其他文件处理
        console.log('处理其他文件:', file.name);
        try {
          aiResponse = await aiService.processFileMessage(fileUrl, message, req.user._id.toString(), previousResponseId);
          messageType = 'file';
          console.log('文件处理成功');
        } catch (fileError) {
          console.error('文件处理失败:', fileError.message);
          return res.status(200).json({
            success: false,
            message: '文件处理失败，请稍后重试',
            error: fileError.message
          });
        }
      }
    } else if (message && (message.startsWith('http://') || message.startsWith('https://'))) {
      // 链接处理
      console.log('处理链接:', message.substring(0, 100) + '...');
      try {
        aiResponse = await aiService.processLinkMessage(message);
        messageType = 'link';
        console.log('链接处理成功');
      } catch (linkError) {
        console.error('链接处理失败:', linkError.message);
        return res.status(200).json({
          success: false,
          message: '链接处理失败，请稍后重试',
          error: linkError.message
        });
      }
    } else {
      // 文本处理
      console.log('处理文本消息');
      // 定义可调用的函数列表
      functions = [
        {
          name: 'createRecord',
          description: '当用户需要记录信息时，从对话中创建简录',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: '简录类型'
              },
              title: {
                type: 'string',
                description: '简录标题'
              },
              content: {
                type: 'string',
                description: '简录内容'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '简录标签'
              }
            },
            required: ['type', 'title', 'content']
          }
        },
        {
          name: 'getRecordList',
          description: '当用户需要查看简录列表时，获取简录列表，支持筛选条件',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: '简录类型'
              },
              status: {
                type: 'string',
                description: '简录状态'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '简录标签'
              },
              startDate: {
                type: 'string',
                description: '开始日期，格式：YYYY-MM-DD'
              },
              endDate: {
                type: 'string',
                description: '结束日期，格式：YYYY-MM-DD'
              },
              page: {
                type: 'integer',
                description: '页码，默认1'
              },
              limit: {
                type: 'integer',
                description: '每页数量，默认20'
              }
            },
            required: []
          }
        },
        {
          name: 'getRecord',
          description: '当用户需要查看特定简录详情时，当你需要根据简录ID获取详细信息时，获取单个简录详情',
          parameters: {
            type: 'object',
            properties: {
              recordId: {
                type: 'string',
                description: '简录ID'
              }
            },
            required: ['recordId']
          }
        },
        {
          name: 'updateRecord',
          description: '当用户需要更新简录时，更新指定简录的信息',
          parameters: {
            type: 'object',
            properties: {
              recordId: {
                type: 'string',
                description: '简录ID'
              },
              title: {
                type: 'string',
                description: '简录标题'
              },
              content: {
                type: 'string',
                description: '简录内容'
              },
              type: {
                type: 'string',
                description: '简录类型'
              },
              status: {
                type: 'string',
                description: '简录状态'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '简录标签'
              },
              link: {
                type: 'string',
                description: '简录链接'
              }
            },
            required: ['recordId']
          }
        },
        {
          name: 'deleteRecord',
          description: '当用户需要删除简录时，删除指定的简录',
          parameters: {
            type: 'object',
            properties: {
              recordId: {
                type: 'string',
                description: '简录ID'
              }
            },
            required: ['recordId']
          }
        },
        {
          name: 'getRecentRecords',
          description: '当用户提到上一条简录、最近X条的简录等上下文引用时，获取最近的简录列表',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'integer',
                description: '返回简录数量，默认5条'
              },
              type: {
                type: 'string',
                description: '简录类型，可选'
              }
            },
            required: []
          }
        },
        {
          name: 'searchRecords',
          description: '当用户提到关于XX的简录、XX的简录等需要搜索的情况时，当你需要根据关键词搜索相关简录时，根据关键词搜索简录',
          parameters: {
            type: 'object',
            properties: {
              keyword: {
                type: 'string',
                description: '搜索关键词'
              },
              limit: {
                type: 'integer',
                description: '返回简录数量，默认10条'
              }
            },
            required: ['keyword']
          }
        }
      ];

      console.log('函数列表长度:', functions.length);
      console.log('函数名称:', functions.map(f => f.name).join(', '));

      // 调用AI服务（使用合并后的角色提示词和工具调用）
      try {
        console.log('开始调用AI服务');
        console.log('是否使用工具调用:', true);
        console.log('增强角色:', session.roles.enhancedRole);
        console.log('会话ID:', session.sessionId);
        console.log('用户ID:', req.user._id.toString());
        
        aiResponse = await aiService.callAI(
          formattedMessages,
          functions,
          true, // 使用工具调用，支持Web Search
          session.roles.enhancedRole, // 传递增强角色ID，用于获取角色级Web Search配置
          session.sessionId, // 传递会话ID，用于上下文缓存
          req.user._id.toString() // 传递用户ID，用于上下文ID管理
        );
        console.log('AI服务调用成功');
        console.log('AI响应类型:', aiResponse.type);
        console.log('AI响应内容长度:', aiResponse.content ? aiResponse.content.length : 0);
      } catch (error) {
        console.error('AI服务调用失败:', error.message);
        console.error('AI服务错误堆栈:', error.stack);
        // 返回友好的错误信息，避免前端超时
        return res.status(200).json({
          success: false,
          message: 'AI服务暂时无法响应，请稍后重试',
          error: error.message || 'AI服务调用失败'
        });
      }
    }

    // 5. 解析AI响应
    console.log('开始解析AI响应');
    const parsedResponse = aiService.parseAIResponse(aiResponse);
    console.log('解析后的响应类型:', parsedResponse.type);
    console.log('解析后的响应内容:', parsedResponse.content);
    console.log('解析后的响应finishReason:', parsedResponse.finishReason);

    // 获取 Response ID（用于多轮对话）
    const responseId = aiResponse.responseId || null;
    console.log('获取到 Response ID:', responseId);

    let finalReply = parsedResponse.content;

    // 如果AI返回工具调用且content为空，设置默认响应
    if (parsedResponse.finishReason === 'tool_calls' && !finalReply) {
      finalReply = '简录已创建~';
      console.log('设置默认工具调用响应:', finalReply);
    }
    
    // 6. 处理AI函数调用 - 使用 while 循环支持多轮 Function Calling
    if (parsedResponse.type === 'function_call' || parsedResponse.finishReason === 'tool_calls') {
      console.log('开始处理函数调用');
      try {
        console.log('调用函数名称:', parsedResponse.functionName);
        console.log('调用函数参数:', JSON.stringify(parsedResponse.functionArgs, null, 2));
        
        finalReply = await handleFunctionCallLoop(parsedResponse, {
          req,
          session,
          formattedMessages,
          functions
        });
        
        console.log('函数调用循环处理成功');
        console.log('处理后的最终回复:', finalReply);
      } catch (error) {
        console.error('Function calling 循环失败:', error.message);
        console.error('Function calling 错误堆栈:', error.stack);
        finalReply = `操作失败：${error.message}`;
      }
    }
    
    // 7. 保存用户消息到数据库
    try {
      // 处理files字段，确保格式正确
      let processedFiles = [];
      if (files) {
        try {
          // 检查files是否为字符串，如果是则尝试解析为对象
          if (typeof files === 'string') {
            console.log('原始files字符串:', files);
            
            // 处理特殊格式的字符串
            let cleanedFilesString = files;
            
            // 移除字符串拼接标记
            cleanedFilesString = cleanedFilesString.replace(/\\n/g, '');
            cleanedFilesString = cleanedFilesString.replace(/' \+ '/g, '');
            cleanedFilesString = cleanedFilesString.replace(/^'/g, '');
            cleanedFilesString = cleanedFilesString.replace(/'$/g, '');
            
            // 移除反引号
            cleanedFilesString = cleanedFilesString.replace(/`/g, '');
            
            console.log('清理后的files字符串:', cleanedFilesString);
            
            // 尝试解析清理后的字符串
            // 首先尝试JSON.parse
            try {
              const parsedFiles = JSON.parse(cleanedFilesString);
              // 确保解析后的结果是数组
              if (Array.isArray(parsedFiles)) {
                processedFiles = parsedFiles;
              } else if (typeof parsedFiles === 'object') {
                // 如果是单个对象，转换为数组
                processedFiles = [parsedFiles];
              }
            } catch (jsonError) {
              // JSON.parse失败，尝试处理JavaScript对象字面量格式
              console.log('JSON.parse失败，尝试处理JavaScript对象字面量格式:', jsonError.message);
              
              // 提取对象内容
              const objectMatch = cleanedFilesString.match(/\[(.*?)\]/s);
              if (objectMatch) {
                const objectContent = objectMatch[1];
                
                // 尝试使用更宽松的解析方法
                // 移除所有换行和多余空格
                const normalizedContent = objectContent.replace(/\s+/g, ' ').trim();
                
                // 简单解析对象格式
                if (normalizedContent.includes('name:') && normalizedContent.includes('type:') && normalizedContent.includes('url:')) {
                  // 提取各个字段
                  const nameMatch = normalizedContent.match(/name:\s*['"]([^'"]+)['"]/);
                  const typeMatch = normalizedContent.match(/type:\s*['"]([^'"]+)['"]/);
                  const urlMatch = normalizedContent.match(/url:\s*['"]([^'"]+)['"]/);
                  
                  if (nameMatch && typeMatch && urlMatch) {
                    processedFiles = [{
                      name: nameMatch[1],
                      type: typeMatch[1],
                      url: urlMatch[1]
                    }];
                  }
                }
              }
            }
          } else if (Array.isArray(files)) {
            // 如果已经是数组，直接使用
            processedFiles = files;
          } else if (typeof files === 'object') {
            // 如果是单个对象，转换为数组
            processedFiles = [files];
          }
        } catch (parseError) {
          console.error('解析files字段失败:', parseError.message);
          // 解析失败时，使用空数组
          processedFiles = [];
        }
      }
      
      // 确保processedFiles是有效的数组
      if (!Array.isArray(processedFiles)) {
        processedFiles = [];
      }
      
      // 确保每个文件对象都有正确的格式
      processedFiles = processedFiles.map(file => {
        if (typeof file === 'object' && file !== null) {
          return {
            name: file.name || '未知文件',
            type: file.type || 'application/octet-stream',
            url: file.url || ''
          };
        }
        return null;
      }).filter(Boolean);
      
      console.log('处理后的files数组:', processedFiles);
      
      const userMessage = new ChatMessage({
        userId: req.user._id,
        sessionId: session.sessionId,
        content: message || '（仅包含文件）',
        sender: 'user',
        type: messageType,
        files: processedFiles
      });
      await userMessage.save();
      console.log('用户消息保存成功');
    } catch (dbError) {
      console.error('用户消息保存失败:', dbError.message);
      // 继续执行，不因为数据库错误而中断
    }

    // 8. 保存AI回复到数据库
    try {
      const aiMessage = new ChatMessage({
        userId: req.user._id,
        sessionId: session.sessionId,
        content: finalReply,
        sender: 'bot',
        type: 'text',
        responseId: responseId,
        previousResponseId: aiResponse.previousResponseId || null
      });
      await aiMessage.save();
      console.log('AI回复保存成功');
    } catch (dbError) {
      console.error('AI回复保存失败:', dbError.message);
      // 继续执行，不因为数据库错误而中断
    }

    // 9. 更新会话的最后活跃时间
    try {
      session.updatedAt = new Date();
      await session.save();
      console.log('会话更新成功');
    } catch (updateError) {
      console.error('会话更新失败:', updateError.message);
      // 继续执行，不因为数据库错误而中断
    }

    // 10. 返回响应
    console.log('=== 聊天消息处理完成 ===');
    console.log('最终回复:', finalReply);
    
    res.json({
      success: true,
      message: '消息发送成功',
      data: {
        reply: finalReply,
        responseId: responseId,
        sessionId: session.sessionId
      }
    });
  } catch (error) {
    console.error('处理聊天消息失败:', error.message);
    console.error('错误堆栈:', error.stack);
    return res.status(200).json({
      success: false,
      message: '消息处理失败，请稍后重试',
      error: error.message
    });
  }
}