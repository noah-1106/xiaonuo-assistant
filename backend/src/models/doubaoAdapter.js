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
              // 静默处理解析错误
            }
          }
        });
      });
      
      response.data.on('end', () => {
        // 存储上下文ID
        if (userId && contextId) {
          this.addContextId(userId, contextId);
        }
        
        // 构建响应对象
        let result;
        
        // 处理工具调用
        const toolCalls = Object.values(toolCallBuffer);
        if (toolCalls.length > 0) {
          const toolCall = toolCalls[0]; // 只处理第一个工具调用
          
          if (toolCall.function) {
            if (toolCall.function.arguments) {
              const parseResult = tryParseArguments(toolCall.function.arguments);
              if (parseResult.success) {
                result = {
                  type: 'function_call',
                  functionName: toolCall.function.name,
                  functionArgs: parseResult.data,
                  content: fullContent,
                  finishReason: finishReason,
                  contextId: contextId
                };
              } else {
                result = {
                  type: 'error',
                  content: '解析工具调用参数失败',
                  finishReason: finishReason,
                  contextId: contextId
                };
              }
            } else {
              result = {
                type: 'error',
                content: '工具调用参数为空',
                finishReason: finishReason,
                contextId: contextId
              };
            }
          } else {
            result = {
              type: 'text',
              content: fullContent,
              finishReason: finishReason,
              contextId: contextId
            };
          }
        } else {
          // 普通文本响应
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
  async processText(text, context = [], functions = [], userId = null, previousResponseId = null) {
    // 检查是否需要使用web搜索
    if (this.needsWebSearch(text)) {
      return this.webSearchWithContext(text, context);
    }

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
        });
      }
    }
    
    // 构建输入消息
    if (!previousResponseId) {
      // 首次请求：添加用户消息
      inputMessages.push({
        type: 'message',
        role: 'user',
        content: text
      });
    } else if (context && Array.isArray(context)) {
      // 后续请求：检查 context 中是否有工具结果消息
      const toolMessages = context.filter(msg => msg.role === 'tool');
      if (toolMessages.length > 0) {
        // 使用最后一个工具结果消息
        const lastToolMessage = toolMessages[toolMessages.length - 1];
        inputMessages.push({
          type: 'function_call_output',
          call_id: lastToolMessage.tool_call_id,
          output: lastToolMessage.content
        });
      } else {
        // 如果没有工具结果消息，添加一个空的用户消息
        // 确保 input 字段不为空，避免 400 错误
        inputMessages.push({
          type: 'message',
          role: 'user',
          content: ''
        });
      }
    } else {
      // 兜底：确保 input 字段不为空
      inputMessages.push({
        type: 'message',
        role: 'user',
        content: text || ''
      });
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
    }

    // 如果提供了functions参数，添加到 tools
    if (functions && functions.length > 0) {
      body.tools = functions.map(func => ({
        type: 'function',
        name: func.name,
        description: func.description,
        parameters: func.parameters
      }));
    }

    // 添加重试逻辑
    let lastError;
    const maxRetries = 2;
    const retryDelay = 500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 流式传输处理
        const response = await axios.post(this.responsesBaseUrl, body, {
          headers: this.getHeaders(),
          timeout: 180000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          responseType: 'stream'
        });

        // 处理流式响应
        const result = await this.handleResponsesStream(response, userId);

        return result;
      } catch (error) {
        lastError = error;

        // 如果不是超时错误，直接抛出
        if (!error.code || error.code !== 'ECONNABORTED') {
          throw error;
        }
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
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
      throw error;
    }
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

      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        const lines = chunkStr.split('\n');

        lines.forEach(line => {
          line = line.trim();
          if (line === '' || line === 'data: [DONE]') return;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              // 提取 response ID
              if (!responseId) {
                // 首先检查根级别
                if (data.id) {
                  responseId = data.id;
                  console.log('从 data.id 提取 responseId:', responseId);
                }
                // 然后检查 response 对象
                else if (data.response && data.response.id) {
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
              } else if (data.choices) {
                // 处理旧格式：Chat Completions API 响应
                // 这是一个完整的响应，不是流式事件
                if (data.choices && data.choices.length > 0) {
                  const choice = data.choices[0];
                  if (choice.message) {
                    // 提取内容
                    if (choice.message.content) {
                      fullContent = choice.message.content;
                    }
                    
                    // 处理工具调用
                    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                      const toolCall = choice.message.tool_calls[0];
                      if (toolCall.function) {
                        toolCallBuffer.name = toolCall.function.name;
                        toolCallBuffer.arguments = toolCall.function.arguments;
                        toolCallBuffer.call_id = toolCall.id;
                      }
                    }
                  }
                  
                  if (choice.finish_reason) {
                    finishReason = choice.finish_reason;
                  }
                }
              }
            } catch (error) {
              // 尝试提取原始响应中的错误信息
              if (line.includes('error')) {
                try {
                  // 尝试从错误信息中提取有用的内容
                  const errorData = JSON.parse(line.substring(6));
                  if (errorData.error && errorData.error.message) {
                    fullContent = `抱歉，我在处理您的请求时遇到了错误：${errorData.error.message}`;
                  }
                } catch (e) {
                  // 如果无法解析错误信息，使用默认错误消息
                  if (!fullContent) {
                    fullContent = '抱歉，我在处理您的请求时遇到了错误，请稍后重试。';
                  }
                }
              }
            }
          }
        });
      });

      response.data.on('end', () => {
        // 存储 responseId 用于下一轮对话
        if (userId && responseId) {
          this.addContextId(userId, responseId);
        }

        // 确保内容不为空
        // 暂时注释掉错误处理，避免工具调用时产生错误消息
        /*
        if (!fullContent.trim()) {
          fullContent = '抱歉，我在处理您的请求时遇到了问题，请稍后重试。';
        }
        */

        // 构建响应结果
        let result;

        // 打印思考内容（如果有）
        if (reasoningContent) {
          console.log('=== 大模型思考过程 ===');
          console.log(reasoningContent);
          console.log('====================');
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
          } catch (error) {
            result = {
              type: 'error',
              content: '解析工具调用参数失败',
              reasoning: reasoningContent,
              finishReason: finishReason,
              responseId: responseId
            };
          }
        } else {
          // 检查content是否为包含tool_calls的JSON字符串
          let isToolCall = false;
          let functionName = '';
          let functionArgs = {};
          let toolContent = fullContent;
          
          try {
            // 尝试解析content作为JSON
            const parsedContent = JSON.parse(fullContent);
            if (parsedContent.choices && parsedContent.choices.length > 0) {
              const choice = parsedContent.choices[0];
              if (choice.message && choice.message.tool_calls && choice.message.tool_calls.length > 0) {
                // 发现tool_calls，处理为函数调用
                isToolCall = true;
                const toolCall = choice.message.tool_calls[0];
                if (toolCall.function) {
                  functionName = toolCall.function.name;
                  functionArgs = JSON.parse(toolCall.function.arguments);
                  toolContent = choice.message.content || '';
                }
              }
            }
          } catch (error) {
            // 解析失败，继续处理为普通文本
          }
          
          if (isToolCall) {
            // 构建函数调用响应
            result = {
              type: 'function_call',
              functionName: functionName,
              functionArgs: functionArgs,
              content: toolContent,
              reasoning: reasoningContent,
              finishReason: 'tool_calls',
              responseId: responseId
            };
          } else {
            // 普通文本响应
            result = {
              type: 'text',
              content: fullContent,
              reasoning: reasoningContent,
              finishReason: finishReason || 'stop',
              responseId: responseId
            };
          }
        }

        resolve(result);
      });

      response.data.on('error', (error) => {
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

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.chatBaseUrl, body, { 
          headers: this.getHeaders(),
          timeout: 90000 // 增加超时时间到90秒
        });
      });

      const result = this.parseAIResponse(response.data);
      return result;
    } catch (error) {
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

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.chatBaseUrl, body, { 
          headers: this.getHeaders(),
          timeout: 90000 // 90秒超时
        });
      });

      const result = this.parseAIResponse(response.data);
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
      const formData = new FormData();
      formData.append('file', fileData, {
        filename: fileName,
        contentType: fileType
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

      return {
        file_id: response.data.file_id,
        file_url: response.data.file_url
      };
    } catch (error) {
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

      const response = await this.retryApiCall(async () => {
        return await axios.post(this.chatBaseUrl, body, { 
          headers: this.getHeaders(),
          timeout: 90000 // 90秒超时
        });
      });

      const result = this.parseAIResponse(response.data);
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
    
    // 处理Chat Completions API响应
    if (response.choices && response.choices.length > 0) {
      const choice = response.choices[0];
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        // 处理工具调用响应（豆包模型格式）
        const toolCall = choice.message.tool_calls[0];
        if (toolCall.function) {
          try {
            return {
              type: 'function_call',
              functionName: toolCall.function.name,
              functionArgs: JSON.parse(toolCall.function.arguments),
              content: choice.message.content,
              finishReason: choice.finish_reason
            };
          } catch (error) {
            return {
              type: 'error',
              content: '解析函数参数失败'
            };
          }
        }
      } else if (choice.message.function_call) {
        // 处理函数调用响应（旧格式）
        try {
          return {
            type: 'function_call',
            functionName: choice.message.function_call.name,
            functionArgs: JSON.parse(choice.message.function_call.arguments),
            content: choice.message.content
          };
        } catch (error) {
          return {
            type: 'error',
            content: '解析函数参数失败'
          };
        }
      } else {
        // 普通文本响应
        const content = choice.message.content || '默认响应内容';
        return {
          type: 'text',
          content: content
        };
      }
    }
    
    // 处理Responses API响应
    if (response.output && Array.isArray(response.output)) {
      // 查找消息类型的响应
      const messageResponse = response.output.find(item => item.type === 'message');
      if (messageResponse && messageResponse.content) {
        // 处理Responses API的文本响应
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
    
    // 处理空响应
    if (!response || Object.keys(response).length === 0) {
      return {
        type: 'text',
        content: '默认响应内容'
      };
    }
    
    // 未知响应格式
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