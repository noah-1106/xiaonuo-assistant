const axios = require('axios');
const { ai: aiConfig } = require('../config');

class ContextCacheService {
  constructor() {
    this.contextCacheBaseUrl = 'https://ark.cn-beijing.volces.com/api/v3/context';
    this.aiConfig = aiConfig;
    this.cacheMap = new Map(); // 本地缓存，存储sessionId到contextId的映射
    this.contextCacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      total: 0
    };
    
    // 使用配置文件中的endpointId作为Endpoint ID，优先使用endpointId，其次使用modelId，最后使用model
    this.modelId = this.aiConfig.endpointId || this.aiConfig.modelId || this.aiConfig.model || 'doubao-seed-1-8-251228';
    this.defaultTTL = 3600; // 默认TTL：1小时
    this.minContextMessages = 2; // 最小消息数才使用上下文缓存
    this.maxContextAge = 24 * 60 * 60 * 1000; // 最大上下文年龄：24小时
    
    console.log('上下文缓存服务初始化完成', {
      baseUrl: this.contextCacheBaseUrl,
      modelId: this.modelId,
      useContextCache: this.aiConfig.useContextCache,
      defaultTTL: this.defaultTTL,
      minContextMessages: this.minContextMessages,
      maxContextAge: this.maxContextAge
    });
  }

  /**
   * 创建上下文缓存
   * @param {string} sessionId - 会话ID
   * @param {Array} messages - 消息历史
   * @param {Object} options - 配置选项
   * @returns {Promise<string>} 上下文缓存ID
   */
  async createContext(sessionId, messages, options = {}) {
    try {
      // 检查消息数量，只有达到最小消息数才创建上下文缓存
      if (messages.length < this.minContextMessages) {
        console.log('消息数量不足，跳过创建上下文缓存', {
          sessionId,
          messageCount: messages.length,
          minRequired: this.minContextMessages
        });
        throw new Error('消息数量不足，跳过创建上下文缓存');
      }

      const url = `${this.contextCacheBaseUrl}/create`;
      console.log('开始创建上下文缓存', {
        url,
        sessionId,
        modelId: this.modelId,
        messageCount: messages.length,
        hasApiKey: !!this.aiConfig.apiKey
      });

      // 验证配置
      if (!this.modelId || this.modelId === 'ep-20260131184445-7xqvs') {
        console.warn('模型ID未配置或使用默认值，上下文缓存可能失败:', {
          modelId: this.modelId
        });
        throw new Error('模型ID未配置或无效，上下文缓存功能不可用');
      }

      // 构建请求配置
      const requestConfig = {
        method: 'POST',
        url: url,
        data: {
          model: this.modelId,
          messages,
          mode: options.mode || 'session',
          ttl: options.ttl || this.defaultTTL
          // 移除truncation_strategy配置，让模型使用默认策略
        },
        headers: {
          'Authorization': `Bearer ${this.aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000, // 30秒超时
        validateStatus: (status) => {
          console.log('API响应状态码:', status);
          return true; // 总是解析响应，无论状态码
        }
      };

      console.log('发送API请求:', {
        method: requestConfig.method,
        url: requestConfig.url,
        headers: {
          'Authorization': 'Bearer ***', // 隐藏敏感信息
          'Content-Type': requestConfig.headers['Content-Type']
        },
        data: {
          model: requestConfig.data.model,
          messageCount: requestConfig.data.messages.length,
          mode: requestConfig.data.mode,
          ttl: requestConfig.data.ttl,
          hasTruncationStrategy: 'truncation_strategy' in requestConfig.data
        }
      });
      
      console.log('完整请求数据:', {
        ...requestConfig.data,
        messages: requestConfig.data.messages.map(msg => ({
          role: msg.role,
          content: msg.content ? msg.content.substring(0, 50) + '...' : msg.content,
          hasToolCalls: !!msg.tool_calls
        }))
      });

      const response = await axios(requestConfig);

      console.log('API响应:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });

      if (response.status === 404 || response.data?.error?.code === 'ResourceNotFound') {
        console.error('创建上下文缓存API错误:', {
          url,
          status: response.status,
          error: response.data?.error,
          modelId: this.modelId
        });
        throw new Error(`API调用失败: ${response.status} - ${response.data?.error?.message || '资源未找到'}`);
      }

      if (response.status !== 200) {
        console.error('创建上下文缓存失败:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        throw new Error(`API调用失败: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`);
      }

      const contextId = response.data.id;
      // 存储sessionId到contextId的映射
      this.cacheMap.set(sessionId, contextId);
      
      console.log('创建上下文缓存成功', {
        sessionId,
        contextId,
        model: response.data.model,
        mode: response.data.mode
      });

      return contextId;
    } catch (error) {
      console.error('创建上下文缓存失败:', {
        message: error.message,
        stack: error.stack,
        isAxiosError: error.isAxiosError,
        config: error.config ? {
          method: error.config.method,
          url: error.config.url,
          headers: error.config.headers ? {
            'Authorization': 'Bearer ***', // 隐藏敏感信息
            'Content-Type': error.config.headers['Content-Type']
          } : null
        } : null,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        } : null
      });
      throw error;
    }
  }

  /**
   * 使用上下文缓存进行对话
   * @param {string} sessionId - 会话ID
   * @param {Array} messages - 最新的消息（不需要包含历史消息）
   * @param {Object} options - 配置选项
   * @param {Array} functions - 可调用的函数列表
   * @returns {Promise<Object>} AI响应
   */
  async chatWithContext(sessionId, messages, options = {}, functions = []) {
    this.contextCacheStats.total++;
    
    try {
      // 验证配置
      if (!this.modelId || this.modelId === 'ep-20260131184445-7xqvs') {
        console.warn('模型ID未配置或使用默认值，上下文缓存功能不可用:', {
          modelId: this.modelId
        });
        this.contextCacheStats.misses++;
        throw new Error('模型ID未配置或无效，上下文缓存功能不可用');
      }

      // 检查消息数量，只有达到最小消息数才使用上下文缓存
      if (messages.length < this.minContextMessages) {
        console.log('消息数量不足，跳过使用上下文缓存', {
          sessionId,
          messageCount: messages.length,
          minRequired: this.minContextMessages
        });
        this.contextCacheStats.misses++;
        throw new Error('消息数量不足，跳过使用上下文缓存');
      }

      // 获取上下文缓存ID
      let contextId = this.cacheMap.get(sessionId);
      
      // 如果没有上下文缓存，创建一个
      if (!contextId) {
        try {
          contextId = await this.createContext(sessionId, messages);
        } catch (createError) {
          console.warn('创建上下文缓存失败，回退到普通调用:', createError.message);
          this.contextCacheStats.misses++;
          throw createError;
        }
      }

      const url = `${this.contextCacheBaseUrl}/chat/completions`;
      console.log('使用上下文缓存进行对话:', {
        url,
        sessionId,
        contextId,
        modelId: this.modelId,
        messageCount: messages.length
      });

      // 构建请求体
      const requestBody = {
        model: this.modelId,
        messages,
        context_id: contextId,
        stream: options.stream || false,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.7
      };

      // 如果提供了functions参数，添加到请求体中
      if (functions && functions.length > 0) {
        requestBody.tools = functions.map(func => ({
          type: 'function',
          function: {
            name: func.name,
            description: func.description,
            parameters: func.parameters
          }
        }));
        requestBody.tool_choice = 'auto';
      }

      const response = await axios.post(url, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        validateStatus: (status) => {
          console.log('对话API响应状态码:', status);
          return true;
        }
      });

      console.log('对话API响应:', {
        status: response.status,
        data: response.data
      });

      if (response.status !== 200) {
        console.error('使用上下文缓存对话失败:', {
          status: response.status,
          data: response.data
        });
        this.contextCacheStats.errors++;
        throw new Error(`对话API调用失败: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      console.log('使用上下文缓存对话成功', {
        sessionId,
        contextId,
        usage: response.data.usage
      });

      this.contextCacheStats.hits++;
      return response.data;
    } catch (error) {
      console.error('使用上下文缓存对话失败:', {
        message: error.message,
        stack: error.stack
      });
      this.contextCacheStats.errors++;
      throw error;
    }
  }

  /**
   * 获取上下文缓存信息
   * @param {string} contextId - 上下文缓存ID
   * @returns {Promise<Object>} 上下文缓存信息
   */
  async getContextInfo(contextId) {
    try {
      const response = await axios.get(`${this.contextCacheBaseUrl}/${contextId}`, {
        headers: {
          'Authorization': `Bearer ${this.aiConfig.apiKey}`
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('获取上下文缓存信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除上下文缓存
   * @param {string} sessionId - 会话ID
   */
  async deleteContext(sessionId) {
    try {
      const contextId = this.cacheMap.get(sessionId);
      if (contextId) {
        await axios.delete(`${this.contextCacheBaseUrl}/${contextId}`, {
          headers: {
            'Authorization': `Bearer ${this.aiConfig.apiKey}`
          },
          timeout: 30000
        });
        
        // 从本地缓存中删除
        this.cacheMap.delete(sessionId);
        
        console.log('删除上下文缓存成功', {
          sessionId,
          contextId
        });
      }
    } catch (error) {
      console.error('删除上下文缓存失败:', error.message);
      // 即使删除失败，也从本地缓存中删除
      this.cacheMap.delete(sessionId);
    }
  }

  /**
   * 清除所有上下文缓存
   */
  async clearAllContexts() {
    try {
      for (const [sessionId, contextId] of this.cacheMap.entries()) {
        await this.deleteContext(sessionId);
      }
    } catch (error) {
      console.error('清除所有上下文缓存失败:', error.message);
    }
  }

  /**
   * 获取本地缓存状态
   * @returns {Object} 本地缓存状态
   */
  getCacheStats() {
    const hitRate = this.contextCacheStats.total > 0 
      ? (this.contextCacheStats.hits / this.contextCacheStats.total * 100).toFixed(2)
      : '0.00';
    
    return {
      size: this.cacheMap.size,
      entries: Array.from(this.cacheMap.entries()),
      stats: this.contextCacheStats,
      hitRate: `${hitRate}%`,
      modelId: this.modelId,
      useContextCache: this.aiConfig.useContextCache
    };
  }

  /**
   * 清除本地缓存
   */
  clearLocalCache() {
    const size = this.cacheMap.size;
    this.cacheMap.clear();
    console.log(`本地缓存已清除，共清除 ${size} 个条目`);
  }

  /**
   * 刷新缓存配置
   */
  refreshConfig() {
    // 重新加载配置
    delete require.cache[require.resolve('../config')];
    const { ai: newConfig } = require('../config');
    this.aiConfig = newConfig;
    this.modelId = this.aiConfig.endpointId || this.aiConfig.modelId || this.aiConfig.model || 'doubao-seed-1-8-251228';
    
    console.log('缓存配置已刷新', {
      modelId: this.modelId,
      useContextCache: this.aiConfig.useContextCache,
      currentStats: this.contextCacheStats,
      cacheSize: this.cacheMap.size
    });
  }

  /**
   * 优化消息历史，用于创建上下文缓存
   * @param {Array} messages - 原始消息历史
   * @returns {Array} 优化后的消息历史
   */
  optimizeMessages(messages) {
    // 确保系统消息在最前面
    const systemMessage = messages.find(msg => msg.role === 'system');
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');

    const optimizedMessages = [];
    if (systemMessage) {
      optimizedMessages.push(systemMessage);
    }

    // 按顺序添加用户和助手消息，确保对话的连贯性
    for (let i = 0; i < Math.max(userMessages.length, assistantMessages.length); i++) {
      if (userMessages[i]) {
        optimizedMessages.push(userMessages[i]);
      }
      if (assistantMessages[i]) {
        optimizedMessages.push(assistantMessages[i]);
      }
    }

    console.log('消息历史优化完成', {
      originalCount: messages.length,
      optimizedCount: optimizedMessages.length,
      hasSystemMessage: !!systemMessage,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length
    });

    return optimizedMessages;
  }

  /**
   * 重置上下文缓存统计信息
   */
  resetStats() {
    this.contextCacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      total: 0
    };
    console.log('上下文缓存统计信息已重置');
  }
}

module.exports = new ContextCacheService();