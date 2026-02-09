const axios = require('axios');
const { ai: aiConfig } = require('../config');
const ModelFactory = require('../models/modelFactory');
const contextCacheService = require('./contextCacheService');

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

  // 获取合并后的角色提示词（兼容旧接口）
  async getCombinedPrompt(baseRoleId, enhancedRoleId = null) {
    const basePrompt = await this.getBasePrompt();
    const enhancedPrompt = await this.getEnhancedRolePrompt(enhancedRoleId);
    
    if (enhancedPrompt) {
      return `${basePrompt}\n\n${enhancedPrompt}`.trim();
    }
    
    return basePrompt;
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
      if (enhancedRole) {
        enhancedTypes.push(...enhancedRole.enhancedRecordTypes.map(type => type.id));
      }
    }
    
    // 3. 合并去重
    return [...new Set([...baseTypes, ...enhancedTypes])];
  }

  // 调用AI模型
  async callAI(messages, functions = [], useTools = false, enhancedRoleId = null, sessionId = null, userId = null) {
    // 禁用上下文缓存服务，直接使用豆包原生上下文功能
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 获取上一轮的 responseId（用于 Responses API 多轮对话）
    let previousResponseId = null;
    if (userId && this.modelAdapter.getContextId) {
      previousResponseId = this.modelAdapter.getContextId(userId);
    }

    // 构建完整的消息历史，包括所有角色的消息（对应官方的 messages 数组）
    let fullMessageHistory = [];
    
    // 找到系统消息
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      fullMessageHistory.push(systemMessage);
    }
    
    // 找到所有非系统消息（用户、助手、工具）
    const nonSystemMessages = messages.filter(msg => msg.role !== 'system');
    fullMessageHistory.push(...nonSystemMessages);

    // 构建用户消息内容 - 找到最新的用户消息（最后一个）
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) {
      throw new Error('没有用户消息');
    }
    // 使用最后一个用户消息（最新的）
    const userMessage = userMessages[userMessages.length - 1];

    // 构建上下文消息
    let contextMessages = [];

    // 判断是否为首次请求（没有 previousResponseId）
    if (!previousResponseId) {
      // 首次请求：发送完整的系统提示词
      if (systemMessage) {
        contextMessages = [systemMessage];
      }
    } else {
      // 后续请求：使用完整的消息历史（包括工具结果）
      // 移除系统消息，因为系统消息已经在首次请求中发送过
      contextMessages = fullMessageHistory.filter(msg => msg.role !== 'system');
    }

    // 使用模型适配器处理文本，传递 userId 和 previousResponseId
    const result = await this.modelAdapter.processText(userMessage.content, contextMessages, functions, userId, previousResponseId);

    // 存储 responseId（如果响应中包含）
    if (userId && result.responseId && this.modelAdapter.addContextId) {
      this.modelAdapter.addContextId(userId, result.responseId);
    }

    return result;
  }

  // 使用Responses API调用AI模型，支持工具调用（保留接口兼容性）
  async callAIWithTools(messages, functions = [], enhancedRoleId = null) {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 构建用户消息内容 - 找到最新的用户消息（最后一个）
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) {
      throw new Error('没有用户消息');
    }
    // 使用最后一个用户消息（最新的）
    const userMessage = userMessages[userMessages.length - 1];

    // 提取上下文消息 - 所有非用户消息，包括系统提示和助手回复
    const contextMessages = messages.filter(msg => msg.role !== 'user');
    // 确保上下文消息中不包含当前用户消息之前的用户消息
    // 我们已经在轮次处理中处理了这个问题，所以这里只需要确保上下文消息是正确的

    // 使用模型适配器处理文本
    return await this.modelAdapter.processText(userMessage.content, contextMessages);
  }

  // 使用普通的Chat Completions API（简化版）（保留接口兼容性）
  async callAIWithoutTools(messages, functions = []) {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 构建用户消息内容 - 找到最新的用户消息（最后一个）
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) {
      throw new Error('没有用户消息');
    }
    // 使用最后一个用户消息（最新的）
    const userMessage = userMessages[userMessages.length - 1];

    // 提取上下文消息 - 所有非用户消息，包括系统提示和助手回复
    const contextMessages = messages.filter(msg => msg.role !== 'user');
    // 确保上下文消息中不包含当前用户消息之前的用户消息
    // 我们已经在轮次处理中处理了这个问题，所以这里只需要确保上下文消息是正确的

    // 使用模型适配器处理文本
    return await this.modelAdapter.processText(userMessage.content, contextMessages);
  }

  // 解析AI响应（保留接口兼容性）
  parseAIResponse(response) {
    // 打印完整的响应，用于调试
    console.log('开始解析AI响应:', { response });
    
    // 如果已经是解析过的对象，直接返回
    if (response.type && response.content) {
      console.log('响应已经是解析过的对象，直接返回');
      return response;
    }

    // 如果模型适配器已初始化，使用模型适配器的解析方法
    if (this.modelAdapter && this.modelAdapter.parseAIResponse) {
      console.log('使用模型适配器的解析方法');
      return this.modelAdapter.parseAIResponse(response);
    }

    // 处理Chat Completions API响应
    if (response.choices && response.choices.length > 0) {
      console.log('处理Chat Completions API响应');
      const choice = response.choices[0];
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // 处理工具调用响应（豆包模型格式）
        const toolCall = choice.message.tool_calls[0];
        if (toolCall.function) {
          console.log('处理工具调用响应:', { toolCall });
          console.log('\n📋 AI调用函数的具体JSON格式:');
          console.log(JSON.stringify({
            tool_calls: [
              {
                function: {
                  name: toolCall.function.name,
                  arguments: toolCall.function.arguments
                }
              }
            ]
          }, null, 2));
          
          try {
            return {
              type: 'function_call',
              functionName: toolCall.function.name,
              functionArgs: JSON.parse(toolCall.function.arguments),
              content: choice.message.content,
              finishReason: choice.finish_reason
            };
          } catch (error) {
            console.error('解析函数参数失败:', error.message);
            console.error('函数参数:', toolCall.function.arguments);
            return {
              type: 'error',
              content: '解析函数参数失败'
            };
          }
        }
      } else if (choice.message.function_call) {
        // 处理函数调用响应（旧格式）
        console.log('处理函数调用响应:', { function_call: choice.message.function_call });
        console.log('\n📋 AI调用函数的具体JSON格式:');
        console.log(JSON.stringify({
          function_call: {
            name: choice.message.function_call.name,
            arguments: choice.message.function_call.arguments
          }
        }, null, 2));
        
        try {
          return {
            type: 'function_call',
            functionName: choice.message.function_call.name,
            functionArgs: JSON.parse(choice.message.function_call.arguments),
            content: choice.message.content
          };
        } catch (error) {
          console.error('解析函数参数失败:', error.message);
          console.error('函数参数:', choice.message.function_call.arguments);
          return {
            type: 'error',
            content: '解析函数参数失败'
          };
        }
      } else {
        // 普通文本响应
        console.log('处理普通文本响应:', { content: choice.message.content });
        return {
          type: 'text',
          content: choice.message.content
        };
      }
    }
    
    // 处理Responses API响应
    if (response.output && Array.isArray(response.output)) {
      console.log('处理Responses API响应:', { output: response.output });
      // 查找消息类型的响应
      const messageResponse = response.output.find(item => item.type === 'message');
      if (messageResponse && messageResponse.content) {
        // 处理Responses API的文本响应
        console.log('处理Responses API的文本响应:', { messageResponse });
        let content = '';
        if (Array.isArray(messageResponse.content)) {
          // 处理内容数组
          messageResponse.content.forEach(item => {
            if (item.type === 'output_text') {
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
        console.log('处理Responses API的函数调用响应:', { functionCall });
        console.log('\n📋 AI调用函数的具体JSON格式:');
        console.log(JSON.stringify({
          function_call: {
            name: functionCall.name,
            arguments: functionCall.arguments
          }
        }, null, 2));
        
        try {
          return {
            type: 'function_call',
            functionName: functionCall.name,
            functionArgs: JSON.parse(functionCall.arguments),
            content: ''
          };
        } catch (error) {
          console.error('解析函数参数失败:', error.message);
          console.error('函数参数:', functionCall.arguments);
          return {
            type: 'error',
            content: '解析函数参数失败'
          };
        }
      }
    }
    
    // 处理其他可能的响应格式
    if (response.message) {
      console.log('处理message字段响应:', { message: response.message });
      return {
        type: 'text',
        content: response.message
      };
    }
    
    if (response.content) {
      console.log('处理content字段响应:', { content: response.content });
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
  async processImageMessage(imageUrl) {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理图片
    return await this.modelAdapter.processImage(imageUrl);
  }

  // 处理文件消息
  async processFileMessage(fileUrl, prompt = '') {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理文件
    return await this.modelAdapter.processFile(fileUrl, prompt);
  }

  // 处理视频消息
  async processVideoMessage(videoUrl, prompt = '') {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理视频
    return await this.modelAdapter.processVideo(videoUrl, prompt);
  }

  // 上传文件
  async uploadFile(fileData, fileName, fileType) {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器上传文件
    return await this.modelAdapter.uploadFile(fileData, fileName, fileType);
  }

  // 调用工具
  async callTool(toolName, params = {}) {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
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
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理链接（通过文本处理，包含链接信息）
    return await this.modelAdapter.processText(`请分析这个链接的内容：${link}`);
  }

  // 处理附件消息
  async processAttachmentMessage(attachment) {
    // 确保模型适配器已初始化
    if (!this.modelAdapter) {
      const AISetting = require('../models/AISetting');
      let aiSetting = await AISetting.findOne();
      await this.initModelAdapter(aiSetting);
    }

    // 使用模型适配器处理附件（通过文本处理，包含附件信息）
    return await this.modelAdapter.processText(`请分析这个附件的内容：${attachment.name}`);
  }
}

module.exports = new AIService();