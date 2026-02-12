const axios = require('axios');
const { ai: aiConfig } = require('../config');
const ModelFactory = require('../models/modelFactory');

class AIService {
  constructor() {
    this.modelAdapter = null;
    this.aiConfig = aiConfig;
    
    console.log('AI服务初始化完成');
  }

  /**
   * 初始化模型适配器
   * @param {Object} aiSetting - 数据库中的AI设置
   */
  async initModelAdapter(aiSetting = null) {
    this.modelAdapter = ModelFactory.createModelFromConfig(aiSetting, this.aiConfig);
    console.log('模型适配器初始化完成', {
      model: this.modelAdapter.model,
      capabilities: this.modelAdapter.getCapabilities()
    });
  }

  // 设置模型参数
  setParams(params) {
    if (this.modelAdapter) {
      // 模型适配器已经初始化，更新配置
      const newConfig = {
        ...this.aiConfig,
        ...params
      };
      this.initModelAdapter(null, newConfig);
    } else {
      // 模型适配器未初始化，更新配置对象
      this.aiConfig = {
        ...this.aiConfig,
        ...params
      };
    }
  }

  // 获取基础提示词（系统提示词+效率助理提示词）
  async getBasePrompt() {
    const AISetting = require('../models/AISetting');
    let aiSetting = await AISetting.findOne();
    
    if (!aiSetting) {
      // 如果没有AI设置，使用默认提示词
      return '你是一个智能助手，叫做小诺，你需要帮助用户完成各种任务，包括创建记录、回答问题等。';
    }
    
    // 1. 获取系统提示词
    let basePrompt = aiSetting.systemPrompt || '';
    
    // 2. 获取效率助理提示词
    if (aiSetting.efficiencyAssistant && aiSetting.efficiencyAssistant.prompt) {
      basePrompt += `\n\n${aiSetting.efficiencyAssistant.prompt}`;
    }
    
    return basePrompt.trim();
  }

  // 获取增强角色提示词
  async getEnhancedRolePrompt(enhancedRoleId) {
    if (!enhancedRoleId) {
      return '';
    }
    
    const AISetting = require('../models/AISetting');
    let aiSetting = await AISetting.findOne();
    
    if (!aiSetting) {
      return '';
    }
    
    // 获取增强角色提示词
    const enhancedRole = aiSetting.enhancedRoles.find(role => role.id === enhancedRoleId && role.isEnabled);
    if (enhancedRole) {
      return enhancedRole.prompt.trim();
    }
    
    return '';
  }

  // 获取会话可用的记录类型
  async getSessionRecordTypes(enhancedRoleId = null) {
    const AISetting = require('../models/AISetting');
    let aiSetting = await AISetting.findOne();
    
    if (!aiSetting) {
      // 如果没有AI设置，使用默认记录类型
      return ['todo', 'article', 'inspiration', 'other'];
    }
    
    // 1. 获取效率助理记录类型
    let baseTypes = [];
    if (aiSetting.efficiencyAssistant && aiSetting.efficiencyAssistant.recordTypes) {
      if (Array.isArray(aiSetting.efficiencyAssistant.recordTypes)) {
        // 如果是对象数组，提取id
        baseTypes = aiSetting.efficiencyAssistant.recordTypes.map(type => typeof type === 'object' ? type.id : type);
      } else if (typeof aiSetting.efficiencyAssistant.recordTypes === 'string') {
        // 如果是字符串，按逗号分割
        baseTypes = aiSetting.efficiencyAssistant.recordTypes.split(',').map(type => type.trim());
      }
    }
    
    // 2. 如果有增强角色，添加其增强记录类型
    const enhancedTypes = [];
    if (enhancedRoleId) {
      const enhancedRole = aiSetting.enhancedRoles.find(role => role.id === enhancedRoleId && role.isEnabled);
      if (enhancedRole && enhancedRole.enhancedRecordTypes) {
        if (Array.isArray(enhancedRole.enhancedRecordTypes)) {
          // 处理数组情况
          enhancedRole.enhancedRecordTypes.forEach(type => {
            if (typeof type === 'object' && type.id) {
              // 如果是对象，提取id
              enhancedTypes.push(type.id);
            } else if (typeof type === 'string') {
              // 如果是字符串，直接使用
              enhancedTypes.push(type);
            }
          });
        } else if (typeof enhancedRole.enhancedRecordTypes === 'string') {
          // 如果是字符串，按逗号分割
          enhancedTypes.push(...enhancedRole.enhancedRecordTypes.split(',').map(type => type.trim()));
        }
      }
    }
    
    // 3. 合并去重
    return [...new Set([...baseTypes, ...enhancedTypes])];
  }

  // 调用AI模型
  async callAI(messages, functions = [], useTools = false, enhancedRoleId = null, sessionId = null, userId = null) {
    console.log('=== 开始调用AI模型 ===');
    console.log('消息数量:', messages.length);
    console.log('函数数量:', functions.length);
    console.log('使用工具:', useTools);
    console.log('增强角色ID:', enhancedRoleId);
    console.log('会话ID:', sessionId);
    console.log('用户ID:', userId);
    
    try {
      // 确保模型适配器已初始化
      if (!this.modelAdapter) {
        console.log('模型适配器未初始化，开始初始化');
        const AISetting = require('../models/AISetting');
        let aiSetting;
        try {
          aiSetting = await AISetting.findOne();
          console.log('获取AI设置成功');
        } catch (dbError) {
          console.error('获取AI设置失败:', dbError.message);
          aiSetting = null;
        }
        
        try {
          await this.initModelAdapter(aiSetting);
          console.log('模型适配器初始化成功');
        } catch (initError) {
          console.error('模型适配器初始化失败:', initError.message);
          throw new Error('模型适配器初始化失败');
        }
      }

      // 获取上一轮的 responseId（用于 Responses API 多轮对话）
      let previousResponseId = null;
      if (userId && sessionId && this.modelAdapter.getContextId) {
        try {
          previousResponseId = await this.modelAdapter.getContextId(userId, sessionId);
          console.log('获取上一轮responseId:', previousResponseId);
        } catch (contextError) {
          console.error('获取上下文ID失败:', contextError.message);
          previousResponseId = null;
        }
      }

      // 构建上下文消息
      let contextMessages = [];
      let userMessageContent = null;

      // 判断是否为首次请求（没有 previousResponseId）
      if (!previousResponseId) {
        console.log('首次请求，使用完整系统提示词');
        // 首次请求：发送完整的系统提示词
        const systemMessage = messages.find(msg => msg.role === 'system');
        if (systemMessage) {
          contextMessages = [systemMessage];
        }
        
        // 构建用户消息内容 - 找到最新的用户消息（最后一个）
        const userMessages = messages.filter(msg => msg.role === 'user');
        if (userMessages.length === 0) {
          console.error('没有用户消息');
          throw new Error('没有用户消息');
        }
        // 使用最后一个用户消息（最新的）
        const userMessage = userMessages[userMessages.length - 1];
        userMessageContent = userMessage.content;
        console.log('用户消息内容:', userMessageContent ? userMessageContent.substring(0, 100) + '...' : '无');
      } else {
        console.log('后续请求，检查是否有工具执行结果消息');
        // 后续请求：如果有工具执行结果消息，传递给模型适配器
        const toolMessages = messages.filter(msg => msg.role === 'tool');
        if (toolMessages.length > 0) {
          console.log('发现工具执行结果消息，传递给模型适配器');
          contextMessages = toolMessages;
        } else {
          console.log('没有工具执行结果消息，传递最新的用户消息');
          // 找到最新的用户消息
          const userMessages = messages.filter(msg => msg.role === 'user');
          if (userMessages.length > 0) {
            // 使用最后一个用户消息
            const lastUserMessage = userMessages[userMessages.length - 1];
            contextMessages = [lastUserMessage];
            userMessageContent = lastUserMessage.content;
          } else {
            contextMessages = [];
            userMessageContent = '';
          }
        }
        console.log('后续请求：传递用户消息内容长度:', userMessageContent ? userMessageContent.length : 0);
      }

      console.log('上下文消息数量:', contextMessages.length);
      console.log('开始调用模型适配器处理文本');
      
      // 只有在首次请求时才传递工具列表
      let functionsList = [];
      if (!previousResponseId) {
        // 首次请求：传递完整的工具列表
        functionsList = functions;
        console.log('首次请求，传递工具列表长度:', functionsList.length);
      } else {
        // 后续请求：不传递工具列表，让模型根据上下文决定
        functionsList = [];
        console.log('后续请求，不传递工具列表');
      }

      // 使用模型适配器处理文本，传递 userId 和 previousResponseId
      let result;
      try {
        result = await this.modelAdapter.processText(
          userMessageContent,
          contextMessages,
          functionsList,
          userId,
          previousResponseId
        );
        console.log('模型适配器处理成功');
        console.log('处理结果类型:', result.type);
        console.log('处理结果内容长度:', result.content ? result.content.length : 0);
        console.log('处理结果responseId:', result.responseId);
      } catch (processError) {
        console.error('模型适配器处理失败:', processError.message);
        console.error('模型适配器错误堆栈:', processError.stack);
        throw new Error(`模型处理失败: ${processError.message}`);
      }

      // 存储 responseId（如果响应中包含）
      if (userId && sessionId && result.responseId && this.modelAdapter.addContextId) {
        try {
          this.modelAdapter.addContextId(userId, result.responseId, sessionId);
          console.log('存储responseId成功:', result.responseId);
        } catch (storeError) {
          console.error('存储responseId失败:', storeError.message);
          // 继续执行，不因为存储失败而中断
        }
      }

      console.log('=== AI模型调用完成 ===');
      return result;
    } catch (error) {
      console.error('AI模型调用失败:', error.message);
      console.error('AI模型调用错误堆栈:', error.stack);
      throw error;
    }
  }

  // 解析AI响应
  parseAIResponse(response) {
    console.log('=== 开始解析AI响应 ===');
    console.log('响应类型:', typeof response);
    
    // 如果已经是解析过的对象，直接返回
    if (response.type && response.content !== undefined) {
      console.log('响应已经是解析过的对象，直接返回');
      return response;
    }

    // 如果模型适配器已初始化，使用模型适配器的解析方法
    if (this.modelAdapter && this.modelAdapter.parseAIResponse) {
      console.log('使用模型适配器的解析方法');
      return this.modelAdapter.parseAIResponse(response);
    }

    // 处理Responses API响应
    if (response.output && Array.isArray(response.output)) {
      console.log('处理Responses API响应');
      // 查找消息类型的响应
      const messageResponse = response.output.find(item => item.type === 'message');
      if (messageResponse && messageResponse.content) {
        // 处理Responses API的文本响应
        let content = '';
        if (Array.isArray(messageResponse.content)) {
          messageResponse.content.forEach(item => {
            if (item.type === 'output_text' && item.text) {
              content += item.text;
            }
          });
        } else if (typeof messageResponse.content === 'string') {
          // 直接字符串内容
          content = messageResponse.content;
        }
        
        return {
          type: 'text',
          content: content
        };
      }
      
      // 查找函数调用响应
      const functionCall = response.output.find(item => item.type === 'function_call');
      if (functionCall) {
        console.log('处理Responses API的函数调用响应');
        try {
          return {
            type: 'function_call',
            functionName: functionCall.name,
            functionArgs: JSON.parse(functionCall.arguments),
            content: '',
            finishReason: 'tool_calls'
          };
        } catch (error) {
          console.error('解析函数参数失败:', error.message);
          return {
            type: 'error',
            content: '解析函数参数失败'
          };
        }
      }
    }
    
    // 处理其他可能的响应格式
    if (response.message) {
      console.log('处理message字段响应');
      return {
        type: 'text',
        content: response.message
      };
    }
    
    if (response.content) {
      console.log('处理content字段响应');
      return {
        type: 'text',
        content: response.content
      };
    }
    
    // 未知响应格式
    console.error('未知的响应格式:', { response });
    return {
      type: 'error',
      content: 'AI响应解析失败'
    };
  }

  // 处理图片消息
  async processImageMessage(imageUrl, prompt = '', userId = null, previousResponseId = null) {
    console.log('=== 开始处理图片消息 ===');
    console.log('图片URL:', imageUrl);
    console.log('提示词:', prompt);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    try {
      console.log('开始处理图片');
      const result = await this.modelAdapter.processImage(imageUrl, prompt, userId, previousResponseId);
      console.log('图片处理成功');
      return result;
    } catch (error) {
      console.error('图片消息处理失败:', error.message);
      throw error;
    }
  }

  // 处理文件消息
  async processFileMessage(fileUrl, prompt = '', userId = null, previousResponseId = null) {
    console.log('=== 开始处理文件消息 ===');
    console.log('文件URL:', fileUrl);
    console.log('提示词:', prompt);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理文件，传递用户ID和上下文ID
    return await this.modelAdapter.processFile(fileUrl, prompt, userId, previousResponseId);
  }

  // 处理视频消息
  async processVideoMessage(videoUrl, prompt = '', userId = null, previousResponseId = null) {
    console.log('=== 开始处理视频消息 ===');
    console.log('视频URL:', videoUrl);
    console.log('提示词:', prompt);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理视频，传递用户ID和上下文ID
    return await this.modelAdapter.processVideo(videoUrl, prompt, userId, previousResponseId);
  }

  // 上传文件
  async uploadFile(fileData, fileName, fileType) {
    console.log('=== 开始上传文件 ===');
    console.log('文件名:', fileName);
    console.log('文件类型:', fileType);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器上传文件
    return await this.modelAdapter.uploadFile(fileData, fileName, fileType);
  }

  // 调用工具
  async callTool(toolName, params = {}) {
    console.log('=== 开始调用工具 ===');
    console.log('工具名称:', toolName);
    console.log('工具参数:', params);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器调用工具
    return await this.modelAdapter.callTool(toolName, params);
  }

  // 格式化消息历史
  formatMessages(history) {
    return history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      name: msg.sender === 'user' ? 'user' : 'assistant'
    }));
  }

  // 处理链接消息
  async processLinkMessage(link) {
    console.log('=== 开始处理链接消息 ===');
    console.log('链接:', link);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理链接（通过文本处理，包含链接信息）
    return await this.modelAdapter.processText(`请分析这个链接的内容：${link}`);
  }

  // 处理附件消息
  async processAttachmentMessage(attachment) {
    console.log('=== 开始处理附件消息 ===');
    console.log('附件名称:', attachment.name);

    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      console.log('模型适配器未初始化，开始初始化');
      const AISetting = require('../models/AISetting');
      let aiSetting;
      try {
        aiSetting = await AISetting.findOne();
      } catch (dbError) {
        console.error('获取AI设置失败:', dbError.message);
        aiSetting = null;
      }
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理附件（通过文本处理，包含附件信息）
    return await this.modelAdapter.processText(`请分析这个附件的内容：${attachment.name}`);
  }
}

module.exports = new AIService();