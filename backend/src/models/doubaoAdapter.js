/**
 * 豆包模型适配器
 * 实现抽象模型接口，适配豆包模型的API
 */
const axios = require('axios');
const FormData = require('form-data');
const AbstractModel = require('./abstractModel');

class DoubaoAdapter extends AbstractModel {
  /**
   * 构造函数
   * @param {Object} config - 模型配置
   */
  constructor(config) {
    super(config);
    this.model = config.model || 'doubao-seed-1-8-251228';
    this.apiKey = config.apiKey;
    this.temperature = config.temperature || 0.8;
    this.topP = config.topP || 0.95;
    this.chatBaseUrl = config.chatBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
    this.responsesBaseUrl = config.responsesBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    this.filesBaseUrl = config.filesBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3/files';
    // 上下文ID管理
    this.contextIds = new Map(); // 存储用户ID对应的上下文ID
  }

  /**
   * 添加上下文ID
   * @param {string} userId - 用户ID
   * @param {string} contextId - 上下文ID
   */
  addContextId(userId, contextId) {
    this.contextIds.set(userId, contextId);
  }

  /**
   * 获取上下文ID
   * @param {string} userId - 用户ID
   * @returns {string|null} 上下文ID
   */
  getContextId(userId) {
    return this.contextIds.get(userId) || null;
  }

  /**
   * 移除上下文ID
   * @param {string} userId - 用户ID
   */
  removeContextId(userId) {
    this.contextIds.delete(userId);
  }

  /**
   * 清理过期上下文
   */
  cleanupContextIds() {
    // 这里可以添加清理逻辑，比如清理长时间未使用的上下文ID
  }

  /**
   * 处理流式响应
   * @param {Object} response - 流式响应对象
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 处理结果
   */
  async handleStreamResponse(response, userId) {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      let contextId = null;
      let finishReason = null;
      let toolCallBuffer = {}; // 按index聚合工具调用
      
      // 智能合并工具调用参数
      const mergeToolCallParameters = (index, newChunk) => {
        // 初始化缓存
        if (!toolCallBuffer[index]) {
          toolCallBuffer[index] = {
            id: newChunk.id,
            type: newChunk.type,
            function: {
              name: newChunk.function?.name || '',
              arguments: newChunk.function?.arguments || ''
            },
            metadata: {
              receivedChunks: 0,
              lastUpdate: Date.now()
            }
          };
        } else {
          // 更新基本信息
          if (newChunk.id) toolCallBuffer[index].id = newChunk.id;
          if (newChunk.type) toolCallBuffer[index].type = newChunk.type;
          if (newChunk.function?.name) toolCallBuffer[index].function.name = newChunk.function.name;
          
          // 智能合并参数
          if (newChunk.function?.arguments) {
            toolCallBuffer[index].function.arguments += newChunk.function.arguments;
            toolCallBuffer[index].metadata.receivedChunks++;
            toolCallBuffer[index].metadata.lastUpdate = Date.now();
          }
        }
        
        return toolCallBuffer[index];
      };
      
      // 尝试解析参数
      const tryParseArguments = (argumentsStr) => {
        try {
          return {
            success: true,
            data: JSON.parse(argumentsStr)
          };
        } catch (error) {
          return {
            success: false,
            error: error.message,
            partial: argumentsStr
          };
        }
      };
      
      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n');
        
        lines.forEach(line => {
          line = line.trim();
          if (line === '') return;
          if (line === 'data: [DONE]') return;
          
          if (line.startsWith('data: ')) {
            line = line.substring(6);
            
            // 只在调试模式下记录原始chunk数据
            if (process.env.NODE_ENV === 'development') {
              console.log('原始AI返回chunk:', line);
            }
            
            try {
              const data = JSON.parse(line);
              
              // 提取内容
              if (data.choices && data.choices.length > 0) {
                const choice = data.choices[0];
                if (choice.delta && choice.delta.content) {
                  fullContent += choice.delta.content;
                }
                
                // 处理工具调用
                if (choice.delta && choice.delta.tool_calls) {
                  // 只在调试模式下记录完整的tool_calls
                  if (process.env.NODE_ENV === 'development') {
                    console.log('AI返回的tool_calls:', JSON.stringify(choice.delta.tool_calls, null, 2));
                  }
                  
                  choice.delta.tool_calls.forEach(tc => {
                    const index = tc.index;
                    mergeToolCallParameters(index, tc);
                  });
                }
                
                if (choice.finish_reason) {
                  finishReason = choice.finish_reason;
                }
              }
              
              // 提取上下文ID（豆包原生上下文）
              if (data.id) {
                // 豆包可能在根级别返回对话ID，可作为上下文ID
                contextId = data.id;
              } else if (data.context && data.context.id) {
                // 标准上下文ID格式
                contextId = data.context.id;
              }
            } catch (error) {
              console.error('解析流式响应失败:', error.message);
              console.error('原始数据:', line); // 记录解析失败的原始数据
            }
          }
        });
      });
      
      response.data.on('end', () => {
        // 存储上下文ID
        if (userId && contextId) {
          this.addContextId(userId, contextId);
          console.log('豆包原生上下文ID存储成功:', { userId, contextId });
        }
        
        // 构建响应对象
        let result;
        
        // 处理工具调用
        const toolCalls = Object.values(toolCallBuffer);
        if (toolCalls.length > 0) {
          const toolCall = toolCalls[0]; // 只处理第一个工具调用
          
          // 只在调试模式下记录工具调用详情
          if (process.env.NODE_ENV === 'development') {
            console.log('处理工具调用:', { toolCall });
          }
          
          if (toolCall.function) {
            if (process.env.NODE_ENV === 'development') {
              console.log('工具调用函数名称:', toolCall.function.name);
              console.log('工具调用参数:', toolCall.function.arguments);
            }
            
            if (toolCall.function.arguments) {
              const parseResult = tryParseArguments(toolCall.function.arguments);
              if (parseResult.success) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('解析后的工具调用参数:', parseResult.data);
                }
                result = {
                  type: 'function_call',
                  functionName: toolCall.function.name,
                  functionArgs: parseResult.data,
                  content: fullContent,
                  finishReason: finishReason,
                  contextId: contextId
                };
              } else {
                console.error('解析工具调用参数失败:', parseResult.error);
                console.error('工具调用参数:', toolCall.function.arguments);
                result = {
                  type: 'error',
                  content: '解析工具调用参数失败',
                  finishReason: finishReason,
                  contextId: contextId
                };
              }
            } else {
              console.error('工具调用参数为空或未定义');
              result = {
                type: 'error',
                content: '工具调用参数为空',
                finishReason: finishReason,
                contextId: contextId
              };
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('工具调用没有function属性，返回普通文本响应');
            }
            result = {
              type: 'text',
              content: fullContent,
              finishReason: finishReason,
              contextId: contextId
            };
          }
        } else {
          // 普通文本响应
          if (process.env.NODE_ENV === 'development') {
            console.log('没有工具调用，返回普通文本响应:', { contentLength: fullContent.length, finishReason });
          }
          result = {
            type: 'text',
            content: fullContent,
            finishReason: finishReason,
            contextId: contextId
          };
        }
        
        resolve(result);
      });
      
      response.data.on('error', (error) => {
        reject(error);
      });
      
      response.data.on('close', () => {
        // 连接关闭
      });
    });
  }

  /**
   * 生成API请求headers
   * @returns {Object} 请求headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 文本处理
   * @param {string} text - 文本内容
   * @param {Array} context - 上下文消息
   * @param {Array} functions - 函数列表
   * @param {string} userId - 用户ID
   * @param {string} contextId - 上下文ID
   * @returns {Promise<Object>} 处理结果
   */
  async processText(text, context = [], functions = [], userId = null, contextId = null) {
    console.log('开始处理文本:', {
      userId,
      contextId,
      textLength: text.length,
      contextLength: context.length,
      hasFunctions: functions && functions.length > 0
    });
    
    // 检查是否需要使用web搜索
    if (this.needsWebSearch(text)) {
      console.log('需要web搜索，调用webSearchWithContext');
      return this.webSearchWithContext(text, context);
    }
    
    const messages = [];
    
    // 添加上下文消息
    if (context && Array.isArray(context)) {
      console.log('添加上下文消息:', { contextCount: context.length });
      context.forEach((msg, index) => {
        console.log(`上下文消息 ${index}:`, { role: msg.role, contentLength: msg.content?.length || 0 });
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // 添加用户消息
    console.log('添加用户消息:', { contentLength: text.length });
    messages.push({
      role: 'user',
      content: text
    });

    const body = {
      model: this.model,
      messages: messages,
      temperature: this.temperature,
      top_p: this.topP,
      stream: true, // 启用流式传输
    };

    // 如果提供了上下文ID，添加到请求体中
    if (contextId) {
      console.log('添加上下文ID:', contextId);
      body.context = {
        id: contextId
      };
    }

    // 如果提供了functions参数，添加到请求体中
    if (functions && functions.length > 0) {
      console.log('添加functions参数:', { functionCount: functions.length });
      body.tools = functions.map(func => ({
        type: 'function',
        function: {
          name: func.name,
          description: func.description,
          parameters: func.parameters
        }
      }));
      body.tool_choice = 'auto'; // 让模型自动决定是否调用工具
    }

    console.log('准备发送API请求:', {
      url: this.chatBaseUrl,
      model: this.model,
      messageCount: messages.length,
      hasContextId: !!contextId,
      hasTools: !!body.tools
    });
    
    // 打印完整的请求体内容，用于调试
    console.log('完整API请求体:');
    console.log(JSON.stringify(body, null, 2));
    
    // 计算请求大小
    const requestSize = JSON.stringify(body).length;
    console.log(`请求大小: ${requestSize} 字符 (${Math.round(requestSize / 1024 * 100) / 100} KB)`);

    // 添加重试逻辑
    let lastError;
    const maxRetries = 2; // 减少重试次数到2次
    const retryDelay = 500; // 减少重试等待时间到500ms
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`发送API请求 (尝试 ${attempt}/${maxRetries})`);
        // 流式传输处理
        const response = await axios.post(this.chatBaseUrl, body, {
          headers: this.getHeaders(),
          timeout: 180000, // 进一步增加超时时间到180秒
          maxBodyLength: Infinity, // 允许更大的请求体
          maxContentLength: Infinity, // 允许更大的响应体
          responseType: 'stream' // 启用流式响应
        });
        
        console.log('API请求成功，开始处理流式响应');
        // 处理流式响应
        const result = await this.handleStreamResponse(response, userId);
        
        console.log('流式响应处理完成:', {
          contentLength: result.content?.length || 0,
          hasContextId: !!result.contextId,
          finishReason: result.finishReason
        });
        
        return result;
      } catch (error) {
        lastError = error;
        console.error(`豆包模型文本处理失败 (${attempt}/${maxRetries}):`, {
          message: error.message,
          code: error.code,
          isAxiosError: error.isAxiosError,
          response: error.response?.data
        });
        
        // 如果不是超时错误，直接抛出
        if (!error.code || error.code !== 'ECONNABORTED') {
          throw error;
        }
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // 所有重试都失败，抛出最后一个错误
    throw lastError;
  }

  /**
   * 检查是否需要web搜索
   * @param {string} text - 用户输入文本
   * @returns {boolean} 是否需要web搜索
   */
  needsWebSearch(text) {
    const searchKeywords = [
      '搜索', '查询', '查找', '搜索一下', '帮我搜索',
      '百度', '谷歌', 'bing', '搜索', '网络搜索',
      '最近', '最新', '今天', '昨天', '现在',
      '天气', '新闻', '股价', '比赛结果', '当前',
      'can you search', 'search for', 'find', 'look up',
      'what is the', 'what are the', 'who is', 'when is'
    ];
    
    const lowerText = text.toLowerCase();
    return searchKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * 带上下文的web搜索
   * @param {string} text - 搜索查询
   * @param {Array} context - 上下文消息
   * @returns {Promise<Object>} 搜索结果
   */
  async webSearchWithContext(text, context = []) {
    // 使用Responses API进行网页搜索
    const inputMessages = [];
    
    // 添加上下文消息
    if (context && Array.isArray(context)) {
      context.forEach(msg => {
        inputMessages.push({
          type: 'message',
          role: msg.role,
          content: msg.content
        });
      });
    }
    
    // 添加用户消息
    inputMessages.push({
      type: 'message',
      role: 'user',
      content: text
    });

    const body = {
      model: this.model,
      store: true,
      input: inputMessages,
      tools: [{ type: 'web_search' }]
    };

    try {
      const firstResponse = await axios.post(this.responsesBaseUrl, body, { headers: this.getHeaders() });
      
      // 检查是否需要工具调用
      if (firstResponse.data.output && Array.isArray(firstResponse.data.output)) {
        const functionCall = firstResponse.data.output.find(item => item.type === 'function_call');
        if (functionCall) {
          // 执行工具调用
          const toolResult = await this.executeToolCall(functionCall);
          
          // 第二轮请求：返回结果并生成最终响应
          const secondBody = {
            model: this.model,
            previous_response_id: firstResponse.data.id,
            input: [
              {
                type: 'function_call_output',
                call_id: functionCall.call_id,
                output: JSON.stringify(toolResult)
              }
            ]
          };
          
          const secondResponse = await axios.post(this.responsesBaseUrl, secondBody, { headers: this.getHeaders() });
          return this.parseAIResponse(secondResponse.data);
        }
      }
      
      return this.parseAIResponse(firstResponse.data);
    } catch (error) {
      console.error('网页搜索失败:', error.message);
      throw error;
    }
  }

  /**
   * 验证文件URL的有效性
   * @param {string} url - 文件URL
   * @returns {boolean} URL是否有效
   */
  validateFileUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * 带重试机制的API调用
   * @param {Function} apiCall - API调用函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} retryDelay - 重试延迟（毫秒）
   * @returns {Promise<any>} API调用结果
   */
  async retryApiCall(apiCall, maxRetries = 2, retryDelay = 500) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.warn(`API调用失败，正在重试(${i + 1}/${maxRetries}):`, error.message);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 图片处理
   * @param {string} imageUrl - 图片URL
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 处理结果
   */
  async processImage(imageUrl, prompt = '') {
    try {
      // 验证图片URL
      if (!this.validateFileUrl(imageUrl)) {
        throw new Error(`无效的图片URL: ${imageUrl}`);
      }
      
      // 豆包1.8支持通过text类型传递图片URL，使用多模态API处理图片
      const messages = [
        {
          role: 'user',
          content: prompt || `请分析这张图片的内容：${imageUrl}`
        }
      ];

      const body = {
        model: this.model,
        messages: messages,
        temperature: this.temperature,
        top_p: this.topP,
        stream: false,
      };

      console.log('开始处理图片:', {
        imageUrl: imageUrl,
        prompt: prompt,
        model: this.model
      });

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.chatBaseUrl, body, { 
          headers: this.getHeaders(),
          timeout: 90000 // 增加超时时间到90秒
        });
      });

      console.log('图片处理API调用成功');
      const result = this.parseAIResponse(response.data);
      console.log('图片处理结果:', result);
      return result;
    } catch (error) {
      console.error('豆包模型图片处理失败:', {
        message: error.message,
        imageUrl: imageUrl,
        stack: error.stack
      });
      
      // 抛出更友好的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('图片处理超时，请稍后重试');
      } else if (error.response && error.response.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response && error.response.status === 429) {
        throw new Error('API调用过于频繁，请稍后重试');
      } else {
        throw new Error(`图片处理失败: ${error.message}`);
      }
    }
  }

  /**
   * 视频处理
   * @param {string} videoUrl - 视频URL
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 处理结果
   */
  async processVideo(videoUrl, prompt = '') {
    try {
      // 验证视频URL
      if (!this.validateFileUrl(videoUrl)) {
        throw new Error(`无效的视频URL: ${videoUrl}`);
      }
      
      // 豆包1.8支持通过text类型传递视频URL，使用多模态API处理视频
      const messages = [
        {
          role: 'user',
          content: prompt || `请分析这个视频的内容：${videoUrl}`
        }
      ];

      const body = {
        model: this.model,
        messages: messages,
        temperature: this.temperature,
        top_p: this.topP,
        stream: false,
      };

      console.log('开始处理视频:', {
        videoUrl: videoUrl,
        prompt: prompt,
        model: this.model
      });

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.chatBaseUrl, body, { 
          headers: this.getHeaders(),
          timeout: 90000 // 90秒超时
        });
      });

      console.log('视频处理API调用成功');
      const result = this.parseAIResponse(response.data);
      console.log('视频处理结果:', result);
      return result;
    } catch (error) {
      console.error('豆包模型视频处理失败:', {
        message: error.message,
        videoUrl: videoUrl,
        stack: error.stack
      });
      
      // 抛出更友好的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('视频处理超时，请稍后重试');
      } else if (error.response && error.response.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response && error.response.status === 429) {
        throw new Error('API调用过于频繁，请稍后重试');
      } else {
        throw new Error(`视频处理失败: ${error.message}`);
      }
    }
  }

  /**
   * 文件上传
   * @param {Buffer|Stream} fileData - 文件数据
   * @param {string} fileName - 文件名
   * @param {string} fileType - 文件类型
   * @returns {Promise<Object>} 上传结果，包含file_id和file_url
   */
  async uploadFile(fileData, fileName, fileType) {
    // 使用火山方舟的filesAPI上传文件
    try {
      const formData = new FormData();
      formData.append('file', fileData, {
        filename: fileName,
        contentType: fileType
      });

      console.log('开始上传文件:', {
        fileName: fileName,
        fileType: fileType
      });

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.filesBaseUrl, formData, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 90000 // 90秒超时
        });
      });

      console.log('文件上传成功:', {
        fileId: response.data.file_id,
        fileUrl: response.data.file_url
      });

      return {
        file_id: response.data.file_id,
        file_url: response.data.file_url
      };
    } catch (error) {
      console.error('文件上传失败:', {
        message: error.message,
        fileName: fileName,
        stack: error.stack
      });
      
      // 抛出更友好的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('文件上传超时，请稍后重试');
      } else if (error.response && error.response.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response && error.response.status === 413) {
        throw new Error('文件大小超过限制');
      } else {
        throw new Error(`文件上传失败: ${error.message}`);
      }
    }
  }

  /**
   * 文件处理
   * @param {string} fileUrl - 文件URL
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 处理结果
   */
  async processFile(fileUrl, prompt = '') {
    try {
      // 验证文件URL
      if (!this.validateFileUrl(fileUrl)) {
        throw new Error(`无效的文件URL: ${fileUrl}`);
      }
      
      // 豆包1.8支持通过text类型传递文件URL，使用多模态API处理文件
      const messages = [
        {
          role: 'user',
          content: prompt || `请分析这个文件的内容：${fileUrl}`
        }
      ];

      const body = {
        model: this.model,
        messages: messages,
        temperature: this.temperature,
        top_p: this.topP,
        stream: false,
      };

      console.log('开始处理文件:', {
        fileUrl: fileUrl,
        prompt: prompt,
        model: this.model
      });

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.chatBaseUrl, body, { 
          headers: this.getHeaders(),
          timeout: 90000 // 90秒超时
        });
      });

      console.log('文件处理API调用成功');
      const result = this.parseAIResponse(response.data);
      console.log('文件处理结果:', result);
      return result;
    } catch (error) {
      console.error('豆包模型文件处理失败:', {
        message: error.message,
        fileUrl: fileUrl,
        stack: error.stack
      });
      
      // 抛出更友好的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('文件处理超时，请稍后重试');
      } else if (error.response && error.response.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response && error.response.status === 429) {
        throw new Error('API调用过于频繁，请稍后重试');
      } else {
        throw new Error(`文件处理失败: ${error.message}`);
      }
    }
  }

  /**
   * 工具调用
   * @param {string} toolName - 工具名称
   * @param {Object} params - 工具参数
   * @returns {Promise<Object>} 工具调用结果
   */
  async callTool(toolName, params = {}) {
    switch (toolName) {
      case 'web_search':
        return this.webSearch(params.query);
      default:
        throw new Error(`不支持的工具: ${toolName}`);
    }
  }

  /**
   * 网页搜索
   * @param {string} query - 搜索查询
   * @returns {Promise<Object>} 搜索结果
   */
  async webSearch(query) {
    // 使用Responses API进行网页搜索
    const inputMessages = [
      {
        type: 'message',
        role: 'user',
        content: query
      }
    ];

    const body = {
      model: this.model,
      store: true,
      input: inputMessages,
      tools: [{ type: 'web_search' }]
    };

    try {
      const firstResponse = await axios.post(this.responsesBaseUrl, body, { headers: this.getHeaders() });
      
      // 检查是否需要工具调用
      if (firstResponse.data.output && Array.isArray(firstResponse.data.output)) {
        const functionCall = firstResponse.data.output.find(item => item.type === 'function_call');
        if (functionCall) {
          // 执行工具调用
          const toolResult = await this.executeToolCall(functionCall);
          
          // 第二轮请求：返回结果并生成最终响应
          const secondBody = {
            model: this.model,
            previous_response_id: firstResponse.data.id,
            input: [
              {
                type: 'function_call_output',
                call_id: functionCall.call_id,
                output: JSON.stringify(toolResult)
              }
            ]
          };
          
          const secondResponse = await axios.post(this.responsesBaseUrl, secondBody, { headers: this.getHeaders() });
          return this.parseAIResponse(secondResponse.data);
        }
      }
      
      return this.parseAIResponse(firstResponse.data);
    } catch (error) {
      console.error('网页搜索失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行工具调用
   * @param {Object} functionCall - 函数调用对象
   * @returns {Promise<Object>} 工具调用结果
   */
  async executeToolCall(functionCall) {
    const toolName = functionCall.name;
    const args = JSON.parse(functionCall.arguments);
    
    switch (toolName) {
      case 'web_search':
        return {
          search_results: [
            {
              title: '示例搜索结果1',
              url: 'https://example.com/1',
              content: '这是示例搜索结果1的内容摘要。'
            },
            {
              title: '示例搜索结果2',
              url: 'https://example.com/2',
              content: '这是示例搜索结果2的内容摘要。'
            }
          ]
        };
      default:
        return {
          error: `未知工具: ${toolName}`
        };
    }
  }

  /**
   * 解析AI响应
   * @param {Object} response - AI响应数据
   * @returns {Object} 解析后的结果
   */
  parseAIResponse(response) {
    // 打印完整的响应，用于调试
    console.log('开始解析豆包AI响应:');
    console.log(JSON.stringify(response, null, 2));
    
    // 如果已经是解析过的对象，直接返回
    if (response.type && response.content !== undefined) {
      console.log('响应已经是解析过的对象，直接返回');
      return response;
    }
    
    // 处理Chat Completions API响应
    if (response.choices && response.choices.length > 0) {
      console.log('处理Chat Completions API响应');
      console.log('Choices数组长度:', response.choices.length);
      
      for (let i = 0; i < response.choices.length; i++) {
        console.log(`Choice ${i}:`, JSON.stringify(response.choices[i], null, 2));
      }
      
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
              content: choice.message.content
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
        const content = choice.message.content || '默认响应内容';
        console.log('处理普通文本响应:', { content });
        return {
          type: 'text',
          content: content
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
          content: content || '默认响应内容'
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
    
    // 处理空响应
    if (!response || Object.keys(response).length === 0) {
      console.log('处理空响应');
      return {
        type: 'text',
        content: '默认响应内容'
      };
    }
    
    // 未知响应格式
    console.error('未知的响应格式:');
    console.error(JSON.stringify(response, null, 2));
    return {
      type: 'error',
      content: 'AI响应解析失败'
    };
  }

  /**
   * 获取模型能力
   * @returns {Object} 模型能力描述
   */
  getCapabilities() {
    return {
      text: true,
      image: true,
      video: true,
      file: true,
      tools: ['web_search']
    };
  }
}

module.exports = DoubaoAdapter;