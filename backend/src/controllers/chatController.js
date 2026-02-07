const aiService = require('../services/aiService');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Task = require('../models/Task');
const taskService = require('../services/taskService');
const websocketService = require('../services/websocketService');
const { NotFoundError, ForbiddenError } = require('../utils/customErrors');

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
 * 发送消息路由 - 支持角色提示词和AI自动创建记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.sendChatMessage = async (req, res, next) => {
  try {
    // 检查用户订阅状态，如果过期则返回友好提示
    if (req.user.subscription.status === 'expired') {
      return res.json({
        status: 'subscription_expired',
        message: '您的订阅已过期，无法使用AI聊天功能。请续费以继续使用。'
      });
    }
      
    let { message, files = [], sessionId, history = [] } = req.body;

    console.log('接收到的原始files:', files);
    console.log('files类型:', typeof files);

    // 确保files是一个数组
    let processedFiles = [];

    if (files) {
      // 首先检查是否为数组格式
      if (Array.isArray(files)) {
        console.log('files已经是数组，长度:', files.length);
        
        // 处理数组中的每个元素
        processedFiles = files.map((file, index) => {
          if (typeof file === 'object' && file !== null) {
            console.log('数组元素已经是对象:', index, file.name);
            return file;
          }
          return null;
        }).filter(Boolean);
      } else if (typeof files === 'object' && files !== null) {
        // 处理单个文件对象的情况
        console.log('files是单个对象:', files);
        processedFiles = [files];
      } else {
        // 处理字符串格式或其他格式
        const filesStr = String(files);
        console.log('处理前的files字符串:', filesStr.substring(0, 200) + '...');
        
        // 首先尝试清理模板字符串语法
        let cleanedFilesStr = filesStr;
        
        // 移除前后的引号
        cleanedFilesStr = cleanedFilesStr.replace(/^"|"$/g, '');
        cleanedFilesStr = cleanedFilesStr.replace(/^'|'$/g, '');
        
        // 清理模板字符串连接符
        cleanedFilesStr = cleanedFilesStr.replace(/\s*\+\s*/g, '');
        
        // 清理转义字符
        cleanedFilesStr = cleanedFilesStr.replace(/\\n/g, '');
        cleanedFilesStr = cleanedFilesStr.replace(/\\r/g, '');
        cleanedFilesStr = cleanedFilesStr.replace(/\\t/g, '');
        cleanedFilesStr = cleanedFilesStr.replace(/\\'/g, "'");
        cleanedFilesStr = cleanedFilesStr.replace(/\"/g, '"');
        
        console.log('清理后的files字符串:', cleanedFilesStr.substring(0, 200) + '...');
        
        // 尝试JSON.parse
        try {
          const parsedFiles = JSON.parse(cleanedFilesStr);
          
          if (Array.isArray(parsedFiles)) {
            processedFiles = parsedFiles;
            console.log('成功解析为JSON数组');
          } else if (typeof parsedFiles === 'object') {
            processedFiles = [parsedFiles];
            console.log('成功解析为JSON对象');
          }
        } catch (parseError) {
          console.log('JSON解析失败，尝试字符串处理:', parseError.message);
          
          // 尝试使用正则表达式提取文件信息
          try {
            // 提取文件名
            const nameRegex = /name\s*[:=]\s*['"]([^'"]+)['"]/;
            const nameMatch = cleanedFilesStr.match(nameRegex);
            const name = nameMatch ? nameMatch[1] : '未知文件';
            
            // 提取文件类型
            const typeRegex = /type\s*[:=]\s*['"]([^'"]+)['"]/;
            const typeMatch = cleanedFilesStr.match(typeRegex);
            const type = typeMatch ? typeMatch[1] : 'application/octet-stream';
            
            // 提取文件URL
            const urlRegex = /url\s*[:=]\s*['"]([^'"]+)['"]/;
            const urlMatch = cleanedFilesStr.match(urlRegex);
            const url = urlMatch ? urlMatch[1] : '';
            
            console.log('提取结果 - name:', name);
            console.log('提取结果 - type:', type);
            console.log('提取结果 - url:', url);
            
            if (url) {
              processedFiles.push({
                name: name,
                type: type,
                url: url
              });
              console.log('成功提取文件信息');
            }
          } catch (regexError) {
            console.error('正则表达式提取失败:', regexError.message);
          }
        }
        
        if (processedFiles.length === 0) {
          console.log('所有方法都失败，返回空数组');
        }
      }
      
      console.log('提取到的文件数量:', processedFiles.length);
      console.log('提取的文件信息:', processedFiles);
    }
    
    // 验证并标准化文件对象格式
    processedFiles = processedFiles.map(file => {
      if (typeof file === 'object' && file !== null) {
        return {
          name: file.name || '未知文件',
          type: file.type || 'application/octet-stream',
          url: file.url || file.path || ''
        };
      }
      return null;
    }).filter(Boolean);
    
    // 使用处理后的files
    files = processedFiles;
    console.log('最终使用的files:', files);
    
    // 1. 确保会话存在，如果不存在则创建
    let session = await ChatSession.findOne({ 
      sessionId: sessionId, 
      userId: req.user._id 
    });
    
    // 如果没有提供sessionId或会话不存在，创建新会话
    if (!session) {
      const newSessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
    }
    
    // 初始化任务信息变量
    let taskInfo = null;
    
    // 2. 获取合并后的角色提示词
    const combinedPrompt = await aiService.getCombinedPrompt(
      session.roles.baseRole,
      session.roles.enhancedRole
    );
    
    // 3. 消息格式化
    const formattedMessages = [];
    
    // 准备用户信息变量，供管理员在提示词中引用
    const userInfo = {
      nickname: req.user.nickname,
      username: req.user.username,
      plan: req.user.plan,
      subscription: req.user.subscription
    };
    
    // 替换提示词中的用户信息变量
    let processedPrompt = combinedPrompt;
    
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
    
    // 添加当前日期信息到系统提示词
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 在系统提示词末尾添加当前日期信息
    const systemPromptWithDate = `${processedPrompt}\n\n【当前日期】\n${formattedDate}`;
    
    // 添加系统提示词（已处理用户信息变量引用和日期信息）
    formattedMessages.push({
      role: 'system',
      content: systemPromptWithDate
    });
    
    // 添加历史消息（如果有）
    if (history && Array.isArray(history) && history.length > 0) {
      // 只保留最近5轮对话（每轮包含一条用户消息和一条助手回复）
      // 5轮对话 = 10条消息
      const maxRounds = 5;
      const recentHistory = history.slice(-(maxRounds * 2));
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
    
    // 5. 根据输入类型调用相应的处理方法
    let aiResponse;
    let messageType = 'text';
    
    // 检查是否有文件上传
    if (files && files.length > 0) {
      // 处理文件上传
      const file = files[0];
      const fileUrl = file.url || file.path;
      
      if (file.type && file.type.startsWith('image/')) {
        // 图片处理
        aiResponse = await aiService.processImageMessage(fileUrl);
        messageType = 'image';
      } else if (file.type && file.type.startsWith('video/')) {
        // 视频处理
        aiResponse = await aiService.processVideoMessage(fileUrl, message);
        messageType = 'video';
      } else {
        // 其他文件处理
        aiResponse = await aiService.processFileMessage(fileUrl, message);
        messageType = 'file';
      }
    } else if (message && (message.startsWith('http://') || message.startsWith('https://'))) {
      // 链接处理
      aiResponse = await aiService.processLinkMessage(message);
      messageType = 'link';
    } else {
      // 文本处理
      // 定义可调用的函数列表
      const functions = [
        {
          name: 'createRecord',
          description: '自动从对话中创建记录',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: '记录类型'
              },
              title: {
                type: 'string',
                description: '记录标题'
              },
              content: {
                type: 'string',
                description: '记录内容'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '记录标签'
              }
            },
            required: ['type', 'title', 'content']
          }
        },
        {
          name: 'getRecordList',
          description: '获取记录列表，支持筛选条件',
          parameters: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: '记录类型'
              },
              status: {
                type: 'string',
                description: '记录状态'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '记录标签'
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
          description: '获取单个记录详情',
          parameters: {
            type: 'object',
            properties: {
              recordId: {
                type: 'string',
                description: '记录ID'
              }
            },
            required: ['recordId']
          }
        },
        {
          name: 'updateRecord',
          description: '更新记录',
          parameters: {
            type: 'object',
            properties: {
              recordId: {
                type: 'string',
                description: '记录ID'
              },
              title: {
                type: 'string',
                description: '记录标题'
              },
              content: {
                type: 'string',
                description: '记录内容'
              },
              type: {
                type: 'string',
                description: '记录类型'
              },
              status: {
                type: 'string',
                description: '记录状态'
              },
              tags: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: '记录标签'
              },
              link: {
                type: 'string',
                description: '记录链接'
              }
            },
            required: ['recordId']
          }
        },
        {
          name: 'deleteRecord',
          description: '删除记录',
          parameters: {
            type: 'object',
            properties: {
              recordId: {
                type: 'string',
                description: '记录ID'
              }
            },
            required: ['recordId']
          }
        },
        {
          name: 'createTask',
          description: '创建任务',
          parameters: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: '任务标题'
              },
              description: {
                type: 'string',
                description: '任务描述'
              },
              params: {
                type: 'object',
                description: '任务参数'
              },
              subtasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: '子任务标题'
                    },
                    description: {
                      type: 'string',
                      description: '子任务描述'
                    },
                    toolCall: {
                      type: 'object',
                      description: '工具调用配置（推荐使用）',
                      properties: {
                        name: {
                          type: 'string',
                          description: '工具名称，支持系统函数和模型工具'
                        },
                        arguments: {
                          type: 'string',
                          description: '工具参数JSON字符串'
                        }
                      },
                      required: ['name', 'arguments']
                    },
                    functionCall: {
                      type: 'object',
                      description: '函数调用配置（向后兼容）',
                      properties: {
                        name: {
                          type: 'string',
                          description: '函数名称'
                        },
                        arguments: {
                          type: 'string',
                          description: '函数参数JSON字符串'
                        }
                      },
                      required: ['name', 'arguments']
                    },
                    params: {
                      type: 'object',
                      description: '子任务参数'
                    }
                  }
                },
                description: '子任务列表（推荐使用toolCall格式）'
              }
            },
            required: ['title']
          }
        },
        {
          name: 'executeTask',
          description: '执行任务',
          parameters: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: '任务ID'
              }
            },
            required: ['taskId']
          }
        },
        {
          name: 'getTaskList',
          description: '获取任务列表，支持筛选条件',
          parameters: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                description: '任务状态'
              },
              limit: {
                type: 'integer',
                description: '限制数量，默认20'
              }
            },
            required: []
          }
        },
        {
          name: 'getTask',
          description: '获取任务详情',
          parameters: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: '任务ID'
              }
            },
            required: ['taskId']
          }
        },
        {
          name: 'getRecentRecords',
          description: '获取最近的N条记录',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'integer',
                description: '返回记录数量，默认5条'
              },
              type: {
                type: 'string',
                description: '记录类型，可选'
              }
            },
            required: []
          }
        },
        {
          name: 'searchRecords',
          description: '根据关键词搜索记录',
          parameters: {
            type: 'object',
            properties: {
              keyword: {
                type: 'string',
                description: '搜索关键词'
              },
              limit: {
                type: 'integer',
                description: '返回记录数量，默认10条'
              }
            },
            required: ['keyword']
          }
        }
      ];
      
      // 调用AI服务（使用合并后的角色提示词和工具调用）
      try {
        aiResponse = await aiService.callAI(
          formattedMessages, 
          functions, 
          true, // 使用工具调用，支持Web Search
          session.roles.enhancedRole, // 传递增强角色ID，用于获取角色级Web Search配置
          session.sessionId, // 传递会话ID，用于上下文缓存
          req.user._id.toString() // 传递用户ID，用于上下文ID管理
        );
      } catch (error) {
        console.error('AI服务调用失败:', error);
        // 返回友好的错误信息，避免前端超时
        return res.status(200).json({
          success: false,
          message: 'AI服务暂时无法响应，请稍后重试',
          error: error.message || 'AI服务调用失败'
        });
      }
    }
    
    // 7. 解析AI响应
    const parsedResponse = aiService.parseAIResponse(aiResponse);
    
    let finalReply = parsedResponse.content;
    
    // 如果AI返回工具调用且content为空，设置默认响应
    if (parsedResponse.finishReason === 'tool_calls' && !finalReply) {
      finalReply = '记录已创建~';
    }
    
    // 8. 处理AI函数调用 - 支持记录操作和任务管理
    if (parsedResponse.type === 'function_call') {
      const Record = require('../models/Record');
      
      try {
        // 发送WebSocket通知，告知前端工具开始执行
        await websocketService.sendToolExecutionStart(req.user._id, {
          functionName: parsedResponse.functionName,
          functionArgs: parsedResponse.functionArgs,
          sessionId: session.sessionId
        });
        
        switch (parsedResponse.functionName) {
          case 'createRecord': {
            const recordData = parsedResponse.functionArgs;
            
            // 检查用户订阅状态，如果过期则返回友好提示
            if (req.user.subscription.status === 'expired') {
              throw new Error('您的订阅已过期，无法创建新记录。请续费以继续使用。');
            }
            
            // 验证记录类型是否在该会话允许的类型列表中
            const allowedRecordTypes = await aiService.getSessionRecordTypes(session.roles.enhancedRole);
            if (!allowedRecordTypes.includes(recordData.type)) {
              throw new Error(`不允许创建该类型的记录。当前角色允许的记录类型：${allowedRecordTypes.join(', ')}`);
            }
            
            // 创建记录
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
            
            // 发送WebSocket通知，告知前端记录已创建
            websocketService.sendRecordCreated(req.user._id, record);
            
            // 构建结构化创建结果数据，让AI生成自然回复
            const createResult = {
              type: 'create_result',
              success: true,
              recordId: record._id,
              recordTitle: recordData.title || '无标题',
              recordType: recordData.type,
              action: 'create_record'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]createRecord(${JSON.stringify(recordData)})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(createResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'getRecordList': {
            const { type, status, tags, startDate, endDate, page = 1, limit = 20 } = parsedResponse.functionArgs;
            
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
            
            // 格式化记录数据
            const formattedRecords = records.map(record => ({
              id: record._id,
              title: record.title || record.summary || '无标题',
              type: record.type,
              status: record.status,
              tags: record.tags,
              createdAt: record.createdAt
            }));
            
            // 构建结构化记录列表数据，让AI生成自然回复
            const recordListResult = {
              type: 'record_list_result',
              success: true,
              total: total,
              page: Number(page),
              limit: Number(limit),
              totalPages: Math.ceil(total / limit),
              records: formattedRecords,
              filters: {
                type: type,
                status: status,
                tags: tags,
                startDate: startDate,
                endDate: endDate
              },
              action: 'get_record_list'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]getRecordList(${JSON.stringify(parsedResponse.functionArgs)})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(recordListResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'getRecord': {
            const { recordId } = parsedResponse.functionArgs;
            
            // 查找记录
            const record = await Record.findOne({ _id: recordId, userId: req.user._id });
            
            if (!record) {
              throw new Error('记录不存在');
            }
            
            // 格式化记录数据
            const recordDetailResult = {
              type: 'record_detail_result',
              success: true,
              record: {
                id: record._id,
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
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]getRecord(${JSON.stringify({ recordId })})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(recordDetailResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'updateRecord': {
            const { recordId, title, content, type, status, tags, link } = parsedResponse.functionArgs;
            
            // 查找记录
            const record = await Record.findOne({ _id: recordId, userId: req.user._id });
            
            if (!record) {
              throw new Error('记录不存在');
            }
            
            // 更新记录字段
            if (title !== undefined) {
              record.title = title;
            }
            if (content !== undefined) {
              record.content = content;
              record.summary = content.substring(0, 100) + (content.length > 100 ? '...' : '');
            }
            if (type !== undefined) {
              // 验证记录类型是否在该会话允许的类型列表中
              const allowedRecordTypes = await aiService.getSessionRecordTypes(session.roles.enhancedRole);
              if (!allowedRecordTypes.includes(type)) {
                throw new Error(`不允许使用该类型的记录。当前角色允许的记录类型：${allowedRecordTypes.join(', ')}`);
              }
              record.type = type;
            }
            if (status !== undefined) {
              record.status = status;
            }
            if (tags !== undefined) {
              record.tags = tags;
            }
            if (link !== undefined) {
              record.link = link;
            }
            
            // 保存更新
            await record.save();
            
            // 发送WebSocket通知，告知前端记录已更新
            websocketService.sendRecordUpdated(req.user._id, record);
            
            // 构建结构化更新结果数据，让AI生成自然回复
            const updateResult = {
              type: 'update_result',
              success: true,
              recordId: recordId,
              recordTitle: record.title || record.summary || '无标题',
              updatedFields: {
                title: title !== undefined,
                content: content !== undefined,
                type: type !== undefined,
                status: status !== undefined,
                tags: tags !== undefined,
                link: link !== undefined
              },
              action: 'update_record'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]updateRecord(${JSON.stringify(parsedResponse.functionArgs)})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(updateResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'deleteRecord': {
            const { recordId } = parsedResponse.functionArgs;
            
            // 查找记录
            const record = await Record.findOne({ _id: recordId, userId: req.user._id });
            
            if (!record) {
              throw new Error('记录不存在');
            }
            
            // 删除记录
            await Record.findByIdAndDelete(recordId);
            
            // 发送WebSocket通知，告知前端记录已删除
            websocketService.sendRecordDeleted(req.user._id, recordId);
            
            // 构建结构化删除结果数据，让AI生成自然回复
            const deleteResult = {
              type: 'delete_result',
              success: true,
              recordId: recordId,
              recordTitle: record.title || record.summary || '无标题',
              action: 'delete_record'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]deleteRecord(${JSON.stringify({ recordId })})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(deleteResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'createTask': {
            const taskData = parsedResponse.functionArgs;
            
            // 创建任务
            const task = await taskService.createTask(req.user._id, {
              title: taskData.title,
              description: taskData.description,
              params: taskData.params || {},
              subtasks: taskData.subtasks || [],
              sessionId: session.sessionId
            });
            
            // 设置任务执行消息类型和信息
            messageType = 'task_execution';
            taskInfo = {
              taskId: task._id,
              status: task.status,
              progress: task.progress,
              title: task.title,
              description: task.description,
              subtasks: task.subtasks || []
            };
            
            try {
              // 构建消息让AI生成自然回复
              const aiResponseMessages = [
                { role: 'system', content: systemPromptWithDate },
                { role: 'user', content: message },
                { role: 'assistant', content: `[FUNCTION_CALL]createTask(${JSON.stringify(taskData)})[/FUNCTION_CALL]` },
                { role: 'user', content: `[FUNCTION_RESULT]{"success": true, "taskId": "${task._id}", "title": "${task.title}", "status": "${task.status}"}[/FUNCTION_RESULT]` },
                { role: 'system', content: `创建任务成功！任务ID是：${task._id}，任务标题是：${task.title}。当用户回复"执行吧"或类似确认执行的语句时，你需要执行这个任务。请使用任务ID ${task._id} 来调用executeTask函数。这个任务ID是一个有效的MongoDB ObjectId格式，包含24个十六进制字符。执行任务时会将任务添加到队列中异步处理，不会阻塞对话。` }
              ];
              
              // 调用AI服务生成自然回复
              const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
              const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
              finalReply = parsedNaturalResponse.content;
            } catch (aiError) {
              console.error('AI生成自然回复失败:', aiError);
              // 即使AI调用失败，也确保返回任务创建成功的消息
              finalReply = `任务创建成功！任务ID是：${task._id}，任务标题是：${task.title}。当你回复"执行吧"或类似确认执行的语句时，我会开始执行这个任务。`;
            }
            break;
          }
          
          case 'executeTask': {
            const { taskId } = parsedResponse.functionArgs;
            
            // 获取任务详情
            const task = await taskService.getTaskDetail(taskId, req.user._id);
            if (!task) {
              throw new Error('任务不存在');
            }
            
            // 添加任务到队列
            const taskQueueService = require('../services/taskQueueService');
            const queueResult = await taskQueueService.addTask(taskId);
            
            // 设置任务执行消息类型和信息
            messageType = 'task_execution';
            taskInfo = {
              taskId: taskId,
              status: queueResult.status,
              progress: 0,
              title: task.title,
              description: task.description,
              queueLength: queueResult.queueLength,
              subtasks: task.subtasks || []
            };
            
            try {
              // 构建消息让AI生成自然回复
              const aiResponseMessages = [
                { role: 'system', content: systemPromptWithDate },
                { role: 'user', content: message },
                { role: 'assistant', content: `[FUNCTION_CALL]executeTask(${JSON.stringify({ taskId })})[/FUNCTION_CALL]` },
                { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify({
                  success: queueResult.success,
                  message: queueResult.message,
                  status: queueResult.status,
                  queueLength: queueResult.queueLength,
                  taskId: taskId
                })}[/FUNCTION_RESULT]` },
                { role: 'system', content: `任务已添加到执行队列，状态：${queueResult.status}，队列长度：${queueResult.queueLength}。任务将在后台异步执行，执行进度和结果会通过WebSocket实时通知用户。` }
              ];
              
              // 调用AI服务生成自然回复
              const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
              const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
              finalReply = parsedNaturalResponse.content;
            } catch (aiError) {
              console.error('AI生成自然回复失败:', aiError);
              // 即使AI调用失败，也确保返回任务执行的消息
              finalReply = `任务已添加到执行队列，状态：${queueResult.status}，队列长度：${queueResult.queueLength}。任务将在后台异步执行，执行进度和结果会通过WebSocket实时通知你。`;
            }
            break;
          }
          
          case 'getTaskList': {
            const { status, limit = 20 } = parsedResponse.functionArgs;
            
            // 获取任务列表
            const tasks = await taskService.getUserTasks(req.user._id, {
              status,
              limit
            });
            
            // 构建结构化任务列表结果数据
            const taskListResult = {
              type: 'task_list_result',
              success: true,
              count: tasks.length,
              tasks: tasks.map(task => ({
                id: task._id,
                title: task.title,
                status: task.status,
                progress: task.progress,
                createdAt: task.createdAt
              })),
              action: 'get_task_list'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]getTaskList(${JSON.stringify(parsedResponse.functionArgs)})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(taskListResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'getTask': {
            const { taskId } = parsedResponse.functionArgs;
            
            // 获取任务详情
            const task = await taskService.getTaskDetail(taskId, req.user._id);
            
            if (!task) {
              throw new Error('任务不存在');
            }
            
            // 构建结构化任务详情结果数据
            const taskDetailResult = {
              type: 'task_detail_result',
              success: true,
              task: {
                id: task._id,
                title: task.title,
                status: task.status,
                progress: task.progress,
                description: task.description,
                subtasks: task.subtasks,
                result: task.result,
                error: task.error,
                createdAt: task.createdAt
              },
              action: 'get_task'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]getTask(${JSON.stringify({ taskId })})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(taskDetailResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'getRecentRecords': {
            const { limit = 5, type } = parsedResponse.functionArgs;
            
            // 构建查询条件
            const query = {
              userId: req.user._id
            };
            
            if (type) {
              query.type = type;
            }
            
            // 获取最近的记录
            const records = await Record.find(query)
              .sort({ createdAt: -1 })
              .limit(Number(limit));
            
            // 格式化记录数据
            const formattedRecords = records.map(record => ({
              id: record._id,
              title: record.title || record.summary || '无标题',
              type: record.type,
              status: record.status,
              tags: record.tags,
              createdAt: record.createdAt
            }));
            
            // 构建结构化最近记录结果数据，让AI生成自然回复
            const recentRecordsResult = {
              type: 'recent_records_result',
              success: true,
              count: records.length,
              limit: Number(limit),
              recordType: type,
              records: formattedRecords,
              action: 'get_recent_records'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]getRecentRecords(${JSON.stringify(parsedResponse.functionArgs)})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(recentRecordsResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            break;
          }
          
          case 'searchRecords': {
            const { keyword, limit = 10 } = parsedResponse.functionArgs;
            
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
            
            // 格式化记录数据
            const formattedRecords = records.map(record => ({
              id: record._id,
              title: record.title || record.summary || '无标题',
              type: record.type,
              status: record.status,
              createdAt: record.createdAt
            }));
            
            // 构建结构化搜索结果数据，让AI生成自然回复
            const searchResult = {
              type: 'search_result',
              keyword: keyword,
              count: records.length,
              records: formattedRecords,
              action: 'search_records'
            };
            
            // 构建消息让AI生成自然回复
            const aiResponseMessages = [
              { role: 'system', content: systemPromptWithDate },
              { role: 'user', content: message },
              { role: 'assistant', content: `[FUNCTION_CALL]searchRecords(${JSON.stringify(parsedResponse.functionArgs)})[/FUNCTION_CALL]` },
              { role: 'user', content: `[FUNCTION_RESULT]${JSON.stringify(searchResult)}[/FUNCTION_RESULT]` }
            ];
            
            // 调用AI服务生成自然回复
            const aiNaturalResponse = await aiService.callAI(aiResponseMessages, [], false, session.roles.enhancedRole, session.sessionId);
            const parsedNaturalResponse = aiService.parseAIResponse(aiNaturalResponse);
            finalReply = parsedNaturalResponse.content;
            
            // 确保AI能够获取到记录ID以便执行删除操作
            console.log('搜索到的记录ID:', formattedRecords.map(r => r.id));
            break;
          }
          
          default:
            finalReply = `不支持的函数调用：${parsedResponse.functionName}`;
        }
      } catch (error) {
        console.error('处理操作失败:', error.message);
        
        // 直接发送友好的错误消息给用户，而不是先告诉AI再通知用户
        finalReply = `抱歉😭，小诺执行错误，请给小诺一些成长时间。下次执行一定没问题~\n\n错误详情：${error.message}`;
        
        // 发送WebSocket错误通知
        try {
          await websocketService.sendFunctionErrorNotification(req.user._id, parsedResponse.functionName, error.message);
        } catch (wsError) {
          console.error('发送错误通知失败:', wsError.message);
        }
      }
    }
    
    // 9. 存储用户消息到数据库
    // 确保message不为空
    const finalMessageContent = message || '（仅上传文件）';
    
    // 最终验证：确保files是对象数组
    if (!Array.isArray(files)) {
      files = [];
    }
    
    console.warn('最终处理后的files:', files);
    
    const userMessage = new ChatMessage({
      userId: req.user._id,
      sessionId: session.sessionId,
      content: finalMessageContent,
      sender: 'user',
      type: 'text',
      files: files
    });
    await userMessage.save();
    
    // 10. 存储AI响应到数据库
    const botMessage = new ChatMessage({
      userId: req.user._id,
      sessionId: session.sessionId,
      content: finalReply,
      sender: 'bot',
      type: messageType,
      taskInfo: taskInfo
    });
    await botMessage.save();
    
    // 11. 更新会话信息
    session.lastMessage = finalReply;
    session.messageCount = await ChatMessage.countDocuments({ sessionId: session.sessionId });
    await session.save();
    
    // 12. 自动清理旧消息，只保留最近20轮对话（每轮2条消息）
    const messageCount = await ChatMessage.countDocuments({ sessionId: session.sessionId });
    if (messageCount > 40) { // 20轮 * 2条消息/轮 = 40条
      // 获取要保留的消息ID
      const messagesToKeep = await ChatMessage.find({ sessionId: session.sessionId }) 
        .sort({ timestamp: -1 })
        .limit(40)
        .select('_id');
      
      // 提取要保留的消息ID数组
      const messageIdsToKeep = messagesToKeep.map(msg => msg._id);
      
      // 删除超过限制的旧消息
      await ChatMessage.deleteMany({ 
        sessionId: session.sessionId, 
        _id: { $nin: messageIdsToKeep } 
      });
      
      // 更新会话消息计数
      session.messageCount = await ChatMessage.countDocuments({ sessionId: session.sessionId });
      await session.save();
    }
    
    // 13. 返回响应
    res.json({
      status: 'ok',
      message: '发送消息成功',
      data: {
        reply: finalReply,
        type: messageType,
        taskInfo: taskInfo,
        functionCall: parsedResponse.type === 'function_call' ? {
          name: parsedResponse.functionName,
          args: parsedResponse.functionArgs
        } : null,
        sessionId: session.sessionId
      }
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    next(error);
  }
};
