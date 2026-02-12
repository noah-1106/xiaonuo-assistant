/**
 * 豆包模型适配器
 * 实现抽象模型接口，适配豆包模型的Responses API
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
    this.responsesBaseUrl = config.responsesBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    this.filesBaseUrl = config.filesBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3/files';
    // 上下文ID管理
    this.contextIds = new Map(); // 存储用户ID+会话ID对应的上下文ID
    // File API文件管理
    this.uploadedFiles = new Map(); // 存储file_id和创建时间
    // 启动定期清理任务
    this.startCleanupTask();
  }

  /**
   * 添加上下文ID
   * @param {string} userId - 用户ID
   * @param {string} contextId - 上下文ID
   * @param {string} sessionId - 会话ID
   */
  addContextId(userId, contextId, sessionId = null) {
    // 1. 更新内存存储
    const key = sessionId ? `${userId}_${sessionId}` : userId;
    this.contextIds.set(key, contextId);
    console.log(`添加上下文ID成功: ${key} -> ${contextId}`);
  }

  /**
   * 获取上下文ID
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   * @returns {string|null} 上下文ID
   */
  async getContextId(userId, sessionId = null) {
    const key = sessionId ? `${userId}_${sessionId}` : userId;
    
    // 1. 先尝试从内存获取
    let contextId = this.contextIds.get(key) || null;
    console.log(`从内存获取上下文ID: ${key} -> ${contextId}`);
    
    // 2. 如果内存中没有，从数据库获取
    if (!contextId && sessionId) {
      try {
        const ChatMessage = require('./ChatMessage');
        // 查找该会话的最新消息
        const latestMessage = await ChatMessage.findOne(
          { userId, sessionId },
          { responseId: 1 },
          { sort: { timestamp: -1 } }
        );
        
        if (latestMessage && latestMessage.responseId) {
          contextId = latestMessage.responseId;
          // 更新到内存
          this.contextIds.set(key, contextId);
          console.log(`从数据库获取上下文ID: ${key} -> ${contextId}`);
        } else {
          console.log(`数据库中未找到上下文ID: ${key}`);
        }
      } catch (dbError) {
        console.error('从数据库获取上下文ID失败:', dbError.message);
        // 继续执行，不因为数据库错误而中断
      }
    }
    
    return contextId;
  }

  /**
   * 移除上下文ID
   * @param {string} userId - 用户ID
   * @param {string} sessionId - 会话ID
   */
  removeContextId(userId, sessionId = null) {
    const key = sessionId ? `${userId}_${sessionId}` : userId;
    this.contextIds.delete(key);
    console.log(`移除上下文ID成功: ${key}`);
  }

  /**
   * 清理过期上下文
   */
  cleanupContextIds() {
    // 这里可以添加清理逻辑，比如清理长时间未使用的上下文ID
    console.log(`清理上下文ID，当前数量: ${this.contextIds.size}`);
  }

  /**
   * 记录上传的文件
   * @param {string} fileId - 文件ID
   */
  recordUploadedFile(fileId) {
    this.uploadedFiles.set(fileId, Date.now());
    console.log(`记录上传的文件: ${fileId}`);
  }

  /**
   * 启动定期清理任务
   */
  startCleanupTask() {
    // 每24小时清理一次过期文件
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 24 * 60 * 60 * 1000);
    console.log('File API文件清理任务已启动');
  }

  /**
   * 清理过期文件
   */
  async cleanupExpiredFiles() {
    try {
      const now = Date.now();
      const expiredFiles = [];
      const expiryTime = 24 * 60 * 60 * 1000; // 24小时过期

      // 找出过期的文件
      for (const [fileId, timestamp] of this.uploadedFiles.entries()) {
        if (now - timestamp > expiryTime) {
          expiredFiles.push(fileId);
        }
      }

      console.log(`开始清理过期文件，数量: ${expiredFiles.length}`);

      // 删除过期文件
      for (const fileId of expiredFiles) {
        try {
          await this.deleteFile(fileId);
          this.uploadedFiles.delete(fileId);
          console.log(`清理过期文件成功: ${fileId}`);
        } catch (error) {
          console.error(`清理过期文件失败: ${fileId}`, error.message);
          // 即使删除失败，也从记录中移除
          this.uploadedFiles.delete(fileId);
        }
      }

      console.log(`文件清理完成，清理数量: ${expiredFiles.length}`);
    } catch (error) {
      console.error('清理过期文件时发生错误:', error.message);
    }
  }

  /**
   * 删除File API文件
   * @param {string} fileId - 文件ID
   * @returns {Promise<void>}
   */
  async deleteFile(fileId) {
    try {
      await axios.delete(`${this.filesBaseUrl}/${fileId}`, {
        headers: this.getHeaders(),
        timeout: 30000
      });
    } catch (error) {
      throw new Error(`删除File API文件失败: ${error.message}`);
    }
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
   * @param {string} previousResponseId - 上下文ID
   * @returns {Promise<Object>} 处理结果
   */
  async processText(text, context = [], functions = [], userId = null, previousResponseId = null) {
    console.log('=== 开始文本处理 ===');
    console.log('文本内容:', text ? text.substring(0, 100) + '...' : '无');
    console.log('上下文消息数量:', context.length);
    console.log('函数数量:', functions.length);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    // 构建 input 消息（Responses API 格式）
    const inputMessages = [];
    
    // 提取并添加系统提示词（从 context 中提取 role='system' 的消息）
    if (!previousResponseId && context && Array.isArray(context)) {
      const systemMessages = context.filter(msg => msg.role === 'system');
      if (systemMessages.length > 0) {
        systemMessages.forEach(msg => {
          inputMessages.push({
            type: 'message',
            role: 'system',
            content: msg.content
          });
          console.log('添加系统消息，长度:', msg.content.length);
        });
      }
    }
    
    // 构建输入消息
    if (!previousResponseId) {
      // 首次请求：添加用户消息
      inputMessages.push({
        type: 'message',
        role: 'user',
        content: text || ''
      });
      console.log('首次请求，添加用户消息');
    } else if (context && Array.isArray(context)) {
      // 后续请求：检查 context 中是否有工具结果消息
      const toolMessages = context.filter(msg => msg.role === 'tool');
      if (toolMessages.length > 0) {
        // 使用最后一个工具结果消息
        const lastToolMessage = toolMessages[toolMessages.length - 1];
        inputMessages.push({
          type: 'function_call_output',
          call_id: lastToolMessage.tool_call_id || 'tool_' + Date.now(),
          output: lastToolMessage.content
        });
        console.log('后续请求，添加工具结果消息');
      } else {
        // 后续请求：检查是否有用户消息
        const userMessages = context.filter(msg => msg.role === 'user');
        if (userMessages.length > 0) {
          // 使用最后一个用户消息
          const lastUserMessage = userMessages[userMessages.length - 1];
          inputMessages.push({
            type: 'message',
            role: 'user',
            content: lastUserMessage.content
          });
          console.log('后续请求，添加用户消息');
        } else {
          // 后续请求：添加空的function_call_output作为占位符
          // 确保input参数不为空，满足API要求
          inputMessages.push({
            type: 'function_call_output',
            call_id: 'placeholder_' + Date.now(),
            output: ''
          });
          console.log('后续请求，添加占位符消息');
        }
      }
    }

    // 兜底：如果 inputMessages 为空，确保至少有一个消息
    if (inputMessages.length === 0) {
      if (!previousResponseId) {
        // 首次请求：添加用户消息
        inputMessages.push({
          type: 'message',
          role: 'user',
          content: text || ''
        });
      } else {
        // 后续请求：添加空的function_call_output作为占位符
        inputMessages.push({
          type: 'function_call_output',
          call_id: 'placeholder_' + Date.now(),
          output: ''
        });
      }
      console.log('兜底处理，添加默认消息');
    }

    // 构建请求体（Responses API 格式）
    const body = {
      model: this.model,
      input: inputMessages,
      stream: true,
      reasoning: {
        effort: "medium"
      },
      max_output_tokens: 4096
    };

    // 如果有上一轮的 responseId，添加 previous_response_id
    if (previousResponseId) {
      body.previous_response_id = previousResponseId;
      console.log('添加previous_response_id:', previousResponseId);
    }

    // 只有在首次请求时才构建工具列表
    if (!previousResponseId) {
      const tools = [];
      
      // 添加内置工具
      tools.push({
        type: 'web_search',
        max_keyword: 3,  // 限制单轮搜索中可使用的最大关键词数量
        limit: 10,       // 限制单次搜索操作返回的最大结果条数
        sources: ['douyin', 'moji', 'toutiao']  // 额外的内容源
      });
      
      // 添加自定义工具
      if (functions && functions.length > 0) {
        functions.forEach(func => {
          tools.push({
            type: 'function',
            name: func.name,
            description: func.description,
            parameters: func.parameters
          });
        });
        console.log('添加自定义工具数量:', functions.length);
      }
      
      // 如果有工具，添加到请求体
      if (tools.length > 0) {
        body.tools = tools;
        console.log('添加工具列表到请求体');
      }
    } else {
      console.log('后续请求，不添加工具列表');
    }

    // 添加重试逻辑
    let lastError;
    const maxRetries = 2;
    const retryDelay = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 流式传输处理
        console.log('=== 发送API请求 ===');
        console.log('请求URL:', this.responsesBaseUrl);
        console.log('请求体长度:', JSON.stringify(body).length);
        console.log('请求体内容:', JSON.stringify(body, null, 2));
        
        const response = await axios.post(this.responsesBaseUrl, body, {
          headers: this.getHeaders(),
          timeout: 180000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          responseType: 'stream'
        });

        console.log('=== API请求成功 ===');
        console.log('响应状态码:', response.status);
        
        // 处理流式响应
        const result = await this.handleResponsesStream(response, userId);

        console.log('=== 文本处理完成 ===');
        return result;
      } catch (error) {
        lastError = error;
        
        // 打印详细的错误信息
        console.error('=== API请求失败 ===');
        console.error('错误代码:', error.code);
        console.error('错误消息:', error.message);
        console.error('错误响应:', error.response ? error.response.data : '无响应数据');
        console.error('错误状态码:', error.response ? error.response.status : '无状态码');

        // 如果不是超时错误，直接抛出
        if (!error.code || error.code !== 'ECONNABORTED') {
          throw error;
        }
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          console.log(`等待${retryDelay}ms后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // 所有重试都失败，抛出最后一个错误
    throw lastError;
  }

  /**
   * 处理 Responses API 的流式响应
   * @param {Object} response - 流式响应对象
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 处理结果
   */
  async handleResponsesStream(response, userId) {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      let responseId = null;
      let finishReason = null;
      let toolCallBuffer = {};
      let reasoningContent = '';
      let buffer = ''; // 用于缓存不完整的行

      console.log('=== 开始处理流式响应 ===');

      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        buffer += chunkStr;
        
        // 分割完整的行
        const lines = buffer.split('\n');
        // 最后一行可能是不完整的，需要保留在buffer中
        buffer = lines.pop();

        lines.forEach(line => {
          line = line.trim();
          if (line === '' || line === 'data: [DONE]') return;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              // 只打印关键信息，不打印完整响应体数据
              if (data.type === 'response.created') {
                console.log('响应创建事件:', data.response?.id || '无响应ID');
              } else if (data.type === 'response.completed') {
                console.log('响应完成事件:', data.response?.id || '无响应ID');
              }

              // 提取 response ID
              if (!responseId) {
                // 首先检查根级别
                if (data.id) {
                  responseId = data.id;
                  console.log('从 data.id 提取 responseId:', responseId);
                } else if (data.response && data.response.id) {
                  // 然后检查 response 对象
                  responseId = data.response.id;
                  console.log('从 data.response.id 提取 responseId:', responseId);
                }
              }

              // 处理新格式：Responses API 事件
              if (data.type) {
                // 特别处理 response.created 事件，确保获取到 responseId
                if (data.type === 'response.created' && data.response && data.response.id) {
                  responseId = data.response.id;
                  console.log('从 response.created 事件提取 responseId:', responseId);
                }
                
                // 处理文本增量
                if (data.type === 'response.output_text.delta' && data.delta) {
                  fullContent += data.delta;
                }

                // 处理文本完成
                if (data.type === 'response.output_text.done' && data.text) {
                  // 使用完整文本覆盖增量内容，确保获取到完整内容
                  fullContent = data.text;
                }

                // 处理思考过程增量
                if (data.type === 'response.reasoning_summary_text.delta' && data.delta) {
                  reasoningContent += data.delta;
                }

                // 处理思考过程完成
                if (data.type === 'response.reasoning_summary_text.done' && data.text) {
                  reasoningContent = data.text;
                }

                // 处理工具调用
                if (data.type === 'response.function_call_arguments.delta' && data.delta) {
                  if (!toolCallBuffer.arguments) {
                    toolCallBuffer.arguments = '';
                  }
                  toolCallBuffer.arguments += data.delta;
                }

                // 处理工具调用完成
                if (data.type === 'response.function_call_arguments.done' && data.arguments) {
                  toolCallBuffer.arguments = data.arguments;
                }

                // 处理工具调用信息
                if (data.type === 'response.output_item.added' && data.item && data.item.type === 'function_call') {
                  toolCallBuffer.name = data.item.name;
                  toolCallBuffer.call_id = data.item.id;
                }

                // 提取 finish reason
                if (data.type === 'response.completed') {
                  finishReason = 'stop';
                  // 作为保底，从完成事件中提取 responseId
                  if (!responseId && data.response && data.response.id) {
                    responseId = data.response.id;
                    console.log('从 response.completed 事件提取 responseId:', responseId);
                  }
                  // 从完成事件中提取完整响应内容作为备用
                  if (data.response && data.response.output) {
                    const messageResponse = data.response.output.find(item => item.type === 'message');
                    if (messageResponse && messageResponse.content) {
                      let content = '';
                      if (Array.isArray(messageResponse.content)) {
                        messageResponse.content.forEach(item => {
                          if (item.type === 'output_text' && item.text) {
                            content += item.text;
                          }
                        });
                      }
                      if (content) {
                        fullContent = content;
                      }
                    }
                  }
                }
              }
            } catch (error) {
              // 静默处理解析错误
              console.warn('解析流式数据错误:', error.message);
            }
          }
        });
      });

      response.data.on('end', () => {
        console.log('=== 流式响应结束 ===');
        // 存储 responseId 用于下一轮对话
        if (userId && responseId) {
          // 注意：这里只存储userId对应的responseId，会话级别的管理在aiService中处理
          this.addContextId(userId, responseId);
        }

        // 打印思考内容（如果有）
        if (reasoningContent) {
          console.log('=== 大模型思考过程 ===');
          console.log(reasoningContent);
          console.log('====================');
        }

        // 构建响应结果
        let result;

        // 检查fullContent是否是包含tool_calls的JSON字符串
        let hasToolCallsInContent = false;
        let parsedContent = null;
        if (fullContent && typeof fullContent === 'string') {
          try {
            parsedContent = JSON.parse(fullContent);
            if (parsedContent.choices && Array.isArray(parsedContent.choices)) {
              const firstChoice = parsedContent.choices[0];
              if (firstChoice.message && firstChoice.message.tool_calls && Array.isArray(firstChoice.message.tool_calls)) {
                hasToolCallsInContent = true;
              }
            }
          } catch (e) {
            // 不是有效的JSON，忽略
          }
        }

        if (Object.keys(toolCallBuffer).length > 0 && toolCallBuffer.name && toolCallBuffer.arguments) {
          // 工具调用
          try {
            const args = JSON.parse(toolCallBuffer.arguments);
            result = {
              type: 'function_call',
              functionName: toolCallBuffer.name,
              functionArgs: args,
              content: fullContent,
              reasoning: reasoningContent,
              finishReason: 'tool_calls',
              responseId: responseId
            };
            console.log('构建工具调用响应:', toolCallBuffer.name);
          } catch (error) {
            console.error('解析工具调用参数失败:', error.message);
            result = {
              type: 'error',
              content: '解析工具调用参数失败',
              reasoning: reasoningContent,
              finishReason: finishReason,
              responseId: responseId
            };
          }
        } else if (hasToolCallsInContent && parsedContent) {
          // 从content中提取工具调用
          try {
            const firstChoice = parsedContent.choices[0];
            const toolCall = firstChoice.message.tool_calls[0];
            const functionName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            result = {
              type: 'function_call',
              functionName: functionName,
              functionArgs: args,
              content: firstChoice.message.content,
              reasoning: reasoningContent,
              finishReason: 'tool_calls',
              responseId: responseId
            };
            console.log('从content中提取工具调用响应:', functionName);
          } catch (error) {
            console.error('解析content中的工具调用失败:', error.message);
            // 回退到普通文本响应
            result = {
              type: 'text',
              content: fullContent,
              reasoning: reasoningContent,
              finishReason: finishReason || 'stop',
              responseId: responseId
            };
            console.log('回退到普通文本响应，内容长度:', fullContent.length);
          }
        } else {
          // 普通文本响应
          result = {
            type: 'text',
            content: fullContent,
            reasoning: reasoningContent,
            finishReason: finishReason || 'stop',
            responseId: responseId
          };
          console.log('构建普通文本响应，内容长度:', fullContent.length);
        }

        console.log('=== 流式响应处理完成 ===');
        resolve(result);
      });

      response.data.on('error', (error) => {
        console.error('流式响应错误:', error.message);
        reject(error);
      });
    });
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
   * 验证文件类型是否为File API允许的类型
   * @param {string} fileType - 文件类型
   * @returns {boolean} 是否允许
   */
  isAllowedFileType(fileType) {
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
  }

  /**
   * 图片处理
   * @param {string} imageUrl - 图片URL
   * @param {string} prompt - 提示词
   * @param {string} userId - 用户ID
   * @param {string} previousResponseId - 上下文ID
   * @returns {Promise<Object>} 处理结果
   */
  async processImage(imageUrl, prompt = '', userId = null, previousResponseId = null) {
    console.log('=== 开始图片处理 ===');
    console.log('图片URL:', imageUrl);
    console.log('提示词:', prompt);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    try {
      // 验证图片URL
      if (!this.validateFileUrl(imageUrl)) {
        throw new Error(`无效的图片URL: ${imageUrl}`);
      }
      
      // 解析文件名和类型
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const fileType = 'image/' + fileExtension;
      
      // 验证文件类型
      if (!this.isAllowedFileType(fileType)) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      console.log('尝试使用File API处理图片');
      // 从TOS下载并上传到File API
      const uploadResult = await this.uploadTosFileToFileApi(imageUrl, fileName, fileType);
      
      // 使用File API的file_id构建消息，按照官方文档格式
      const inputMessages = [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt ? `${prompt} 请分析这张图片的内容。原始文件链接: ${imageUrl}` : `请分析这张图片的内容。原始文件链接: ${imageUrl}`
            },
            {
              type: 'input_image',
              file_id: uploadResult.file_id
            }
          ]
        }
      ];
      console.log('构建图片处理消息成功');
      
      const body = {
        model: this.model,
        input: inputMessages,
        stream: true,
        reasoning: {
          effort: "medium"
        },
        max_output_tokens: 4096
      };

      // 如果有上一轮的 responseId，添加 previous_response_id
      if (previousResponseId) {
        body.previous_response_id = previousResponseId;
      }

      // 流式传输处理
      console.log('发送图片处理请求');
      const response = await axios.post(this.responsesBaseUrl, body, {
        headers: this.getHeaders(),
        timeout: 180000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        responseType: 'stream'
      });

      // 处理流式响应
      const result = await this.handleResponsesStream(response, userId);
      console.log('=== 图片处理完成 ===');
      return result;
    } catch (error) {
      // 打印详细错误信息
      console.error('图片处理详细错误:', error);
      if (error.response) {
        console.error('错误响应状态:', error.response.status);
        console.error('错误响应数据:', error.response.data);
      }
      // 抛出更友好的错误信息
      if (error.code === 'ECONNABORTED') {
        throw new Error('图片处理超时，请稍后重试');
      } else if (error.response && error.response.status === 401) {
        throw new Error('API密钥无效或已过期');
      } else if (error.response && error.response.status === 429) {
        throw new Error('API调用过于频繁，请稍后重试');
      } else if (error.response && error.response.status === 400) {
        throw new Error(`图片处理失败: 请求参数错误 - ${error.response.data?.error?.message || error.message}`);
      } else {
        throw new Error(`图片处理失败: ${error.message}`);
      }
    }
  }

  /**
   * 视频处理
   * @param {string} videoUrl - 视频URL
   * @param {string} prompt - 提示词
   * @param {string} userId - 用户ID
   * @param {string} previousResponseId - 上下文ID
   * @returns {Promise<Object>} 处理结果
   */
  async processVideo(videoUrl, prompt = '', userId = null, previousResponseId = null) {
    console.log('=== 开始视频处理 ===');
    console.log('视频URL:', videoUrl);
    console.log('提示词:', prompt);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    try {
      // 验证视频URL
      if (!this.validateFileUrl(videoUrl)) {
        throw new Error(`无效的视频URL: ${videoUrl}`);
      }
      
      // 解析文件名和类型
      const urlParts = videoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const fileExtension = fileName.split('.').pop().toLowerCase();
      const fileType = 'video/' + fileExtension;
      
      // 验证文件类型
      if (!this.isAllowedFileType(fileType)) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      console.log('尝试使用File API处理视频');
      // 从TOS下载并上传到File API
      const uploadResult = await this.uploadTosFileToFileApi(videoUrl, fileName, fileType);
      
      // 使用File API的file_id构建消息
      const inputMessages = [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt ? `${prompt} 请分析这个视频的内容。原始文件链接: ${videoUrl}` : `请分析这个视频的内容。原始文件链接: ${videoUrl}`
            },
            {
              type: 'image_url',
              image_url: {
                url: uploadResult.file_url
              }
            }
          ]
        }
      ];

      const body = {
        model: this.model,
        input: inputMessages,
        stream: true,
        reasoning: {
          effort: "medium"
        },
        max_output_tokens: 4096
      };

      // 如果有上一轮的 responseId，添加 previous_response_id
      if (previousResponseId) {
        body.previous_response_id = previousResponseId;
      }

      // 流式传输处理
      console.log('发送视频处理请求');
      const response = await axios.post(this.responsesBaseUrl, body, {
        headers: this.getHeaders(),
        timeout: 180000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        responseType: 'stream'
      });

      // 处理流式响应
      const result = await this.handleResponsesStream(response, userId);
      console.log('=== 视频处理完成 ===');
      return result;
    } catch (error) {
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
      console.log(`开始上传文件到File API: ${fileName}, 类型: ${fileType}`);
      console.log(`File API端点: ${this.filesBaseUrl}`);
      
      const formData = new FormData();
      console.log(`创建FormData，准备添加文件`);
      formData.append('file', fileData, {
        filename: fileName,
        contentType: fileType
      });
      // 添加purpose参数，根据官方文档要求
      formData.append('purpose', 'user_data');
      console.log(`文件和purpose参数已添加到FormData`);

      console.log(`开始调用File API上传，超时设置: 90秒`);
      
      const response = await axios.post(this.filesBaseUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 90000 // 90秒超时
      });

      // 检查返回数据是否有效
      if (!response.data || !response.data.id) {
        console.error(`File API返回无效数据:`, response.data);
        throw new Error('File API返回无效数据: 缺少id');
      }
      
      console.log(`File API上传成功，返回file ID: ${response.data.id}, 状态: ${response.data.status}`);
      
      // 构建文件URL，使用File API的标准格式
      const fileUrl = `https://ark.cn-beijing.volces.com/api/v3/files/${response.data.id}`;
      console.log(`构建的文件URL: ${fileUrl}`);
      
      return {
        file_id: response.data.id,  // 保持file_id字段以兼容现有代码
        file_url: fileUrl           // 使用构建的URL
      };
    } catch (error) {
      console.error(`文件上传失败: ${error.message}`);
      console.error(`错误详情:`, error);
      // 抛出更友好的错误信息
      if (error.code === 'ECONNABORTED') {
        console.error(`上传超时，可能的原因: 网络慢、文件过大、API响应慢`);
        throw new Error('文件上传超时，请稍后重试');
      } else if (error.response && error.response.status === 401) {
        console.error(`API密钥无效或已过期`);
        throw new Error('API密钥无效或已过期');
      } else if (error.response && error.response.status === 413) {
        console.error(`文件大小超过限制`);
        throw new Error('文件大小超过限制');
      } else if (error.response) {
        console.error(`API返回错误状态: ${error.response.status}`);
        console.error(`API返回错误数据:`, error.response.data);
        throw new Error(`文件上传失败: ${error.response.data.message || error.message}`);
      } else {
        throw new Error(`文件上传失败: ${error.message}`);
      }
    }
  }

  /**
   * 文件处理
   * @param {string} fileUrl - 文件URL
   * @param {string} prompt - 提示词
   * @param {string} userId - 用户ID
   * @param {string} previousResponseId - 上下文ID
   * @returns {Promise<Object>} 处理结果
   */
  async processFile(fileUrl, prompt = '', userId = null, previousResponseId = null) {
    console.log('=== 开始文件处理 ===');
    console.log('文件URL:', fileUrl);
    console.log('提示词:', prompt);
    console.log('用户ID:', userId);
    console.log('上一轮responseId:', previousResponseId);

    try {
      // 验证文件URL
      if (!this.validateFileUrl(fileUrl)) {
        throw new Error(`无效的文件URL: ${fileUrl}`);
      }
      
      // 解析文件名和类型
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const fileExtension = fileName.split('.').pop().toLowerCase();
      let fileType;
      
      // 根据扩展名确定文件类型
      if (['pdf'].includes(fileExtension)) {
        fileType = 'application/pdf';
      } else if (['txt', 'csv'].includes(fileExtension)) {
        fileType = `text/${fileExtension}`;
      } else if (['mp3', 'wav', 'm4a'].includes(fileExtension)) {
        fileType = `audio/${fileExtension}`;
      } else {
        fileType = 'application/octet-stream';
      }
      
      // 验证文件类型
      if (!this.isAllowedFileType(fileType)) {
        throw new Error(`不支持的文件类型: ${fileType}`);
      }
      
      console.log('尝试使用File API处理文件');
      // 从TOS下载并上传到File API
      const uploadResult = await this.uploadTosFileToFileApi(fileUrl, fileName, fileType);
      
      // 使用File API的file_url构建消息
      const inputMessages = [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt ? `${prompt} 请分析这个文件的内容。原始文件链接: ${fileUrl}` : `请分析这个文件的内容。原始文件链接: ${fileUrl}`
            },
            {
              type: 'image_url',
              image_url: {
                url: uploadResult.file_url
              }
            }
          ]
        }
      ];

      const body = {
        model: this.model,
        input: inputMessages,
        stream: true,
        reasoning: {
          effort: "medium"
        },
        max_output_tokens: 4096
      };

      // 如果有上一轮的 responseId，添加 previous_response_id
      if (previousResponseId) {
        body.previous_response_id = previousResponseId;
      }

      // 流式传输处理
      console.log('发送文件处理请求');
      const response = await axios.post(this.responsesBaseUrl, body, {
        headers: this.getHeaders(),
        timeout: 180000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        responseType: 'stream'
      });

      // 处理流式响应
      const result = await this.handleResponsesStream(response, userId);
      console.log('=== 文件处理完成 ===');
      return result;
    } catch (error) {
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
      throw error;
    }
  }

  /**
   * 从TOS下载文件
   * @param {string} tosUrl - TOS预签名URL
   * @returns {Promise<Stream>} 文件流
   */
  async downloadFileFromTos(tosUrl) {
    try {
      console.log(`开始从TOS下载文件，URL: ${tosUrl.substring(0, 100)}...`);
      const response = await axios.get(tosUrl, {
        responseType: 'stream',
        timeout: 60000 // 60秒超时
      });
      console.log(`从TOS下载文件成功，获取到流对象`);
      
      // 增加流错误处理和日志
      const fileStream = response.data;
      fileStream.on('error', (error) => {
        console.error('文件流错误:', error.message);
      });
      
      return fileStream;
    } catch (error) {
      console.error(`从TOS下载文件失败: ${error.message}`);
      console.error(`错误详情:`, error);
      if (error.code === 'ECONNABORTED') {
        throw new Error('从TOS下载文件超时，请稍后重试');
      }
      throw new Error(`从TOS下载文件失败: ${error.message}`);
    }
  }

  /**
   * 从TOS下载并上传到File API
   * @param {string} tosUrl - TOS预签名URL
   * @param {string} fileName - 文件名
   * @param {string} fileType - 文件类型
   * @returns {Promise<Object>} File API上传结果
   */
  async uploadTosFileToFileApi(tosUrl, fileName, fileType) {
    try {
      console.log(`================ 开始处理文件: ${fileName} ================`);
      console.log(`文件类型: ${fileType}`);
      console.log(`TOS URL: ${tosUrl.substring(0, 100)}...`);
      
      // 从TOS下载文件
      console.log(`步骤1: 从TOS下载文件`);
      const fileStream = await this.downloadFileFromTos(tosUrl);
      console.log(`步骤1完成: 成功获取文件流`);
      
      // 上传到File API
      console.log(`步骤2: 上传文件到File API`);
      const uploadResult = await this.uploadFile(
        fileStream,
        fileName,
        fileType
      );
      
      console.log(`步骤2完成: 文件上传成功`);
      console.log(`上传结果: file_id=${uploadResult.file_id}, file_url=${uploadResult.file_url.substring(0, 100)}...`);
      
      // 记录上传的文件，以便后续清理
      console.log(`步骤3: 记录上传的文件`);
      this.recordUploadedFile(uploadResult.file_id);
      console.log(`步骤3完成: 文件记录成功`);
      
      console.log(`================ 文件处理完成: ${fileName} ================`);
      return uploadResult;
    } catch (error) {
      console.error(`================ 文件处理失败: ${fileName} ================`);
      console.error(`失败原因: ${error.message}`);
      console.error(`错误堆栈:`, error.stack);
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
    // 如果已经是解析过的对象，直接返回
    if (response.type && response.content !== undefined) {
      return response;
    }
    
    // 处理Responses API响应
    if (response.output && Array.isArray(response.output)) {
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
        try {
          return {
            type: 'function_call',
            functionName: functionCall.name,
            functionArgs: JSON.parse(functionCall.arguments),
            content: ''
          };
        } catch (error) {
          return {
            type: 'error',
            content: '解析函数参数失败'
          };
        }
      }
    }
    
    // 处理其他可能的响应格式
    if (response.message) {
      return {
        type: 'text',
        content: response.message
      };
    }
    
    if (response.content) {
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

  /**
   * 获取模型能力
   * @returns {Object} 模型能力
   */
  getCapabilities() {
    return {
      text: true,
      image: true,
      video: true,
      file: true,
      tools: true,
      streaming: true
    };
  }
}

module.exports = DoubaoAdapter;