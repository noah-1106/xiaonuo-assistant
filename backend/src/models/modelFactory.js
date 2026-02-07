/**
 * 模型工厂
 * 根据配置动态创建模型适配器实例
 */
const DoubaoAdapter = require('./doubaoAdapter');

class ModelFactory {
  /**
   * 创建模型适配器实例
   * @param {string} modelType - 模型类型
   * @param {Object} config - 模型配置
   * @returns {Object} 模型适配器实例
   */
  static createModel(modelType, config) {
    switch (modelType) {
      case 'doubao':
        return new DoubaoAdapter(config);
      // 将来可以添加其他模型适配器
      // case 'gpt':
      //   return new GptAdapter(config);
      // case 'claude':
      //   return new ClaudeAdapter(config);
      default:
        // 默认使用豆包模型
        console.warn(`未知的模型类型: ${modelType}，默认使用豆包模型`);
        return new DoubaoAdapter(config);
    }
  }

  /**
   * 从数据库配置创建模型适配器
   * @param {Object} aiSetting - 数据库中的AI设置
   * @param {Object} envConfig - 环境变量配置
   * @returns {Object} 模型适配器实例
   */
  static createModelFromConfig(aiSetting, envConfig) {
    // 构建完整的模型配置
    const apiBaseUrl = aiSetting?.apiBaseUrl || envConfig?.apiBaseUrl || 'https://ark.cn-beijing.volces.com/api/v3';
    
    const modelConfig = {
      model: aiSetting?.model || envConfig?.model || 'doubao-seed-1-8-251228',
      apiKey: aiSetting?.apiKey || envConfig?.apiKey,
      apiBaseUrl: apiBaseUrl,
      temperature: aiSetting?.temperature ? aiSetting.temperature / 100 : (envConfig?.temperature || 0.8),
      topP: aiSetting?.topP || (envConfig?.topP || 0.95),
      chatBaseUrl: envConfig?.chatBaseUrl || `${apiBaseUrl}/chat/completions`,
      responsesBaseUrl: envConfig?.responsesBaseUrl || `${apiBaseUrl}/responses`
    };

    // 确定模型类型
    const modelType = this.getModelType(modelConfig.model);

    return this.createModel(modelType, modelConfig);
  }

  /**
   * 根据模型名称推断模型类型
   * @param {string} modelName - 模型名称
   * @returns {string} 模型类型
   */
  static getModelType(modelName) {
    if (modelName.includes('doubao')) {
      return 'doubao';
    } else if (modelName.includes('gpt')) {
      return 'gpt';
    } else if (modelName.includes('claude')) {
      return 'claude';
    } else {
      return 'doubao'; // 默认返回豆包
    }
  }

  /**
   * 获取支持的模型类型列表
   * @returns {Array} 支持的模型类型
   */
  static getSupportedModelTypes() {
    return [
      { value: 'doubao', label: '豆包模型' },
      // 将来可以添加其他模型类型
      // { value: 'gpt', label: 'GPT模型' },
      // { value: 'claude', label: 'Claude模型' }
    ];
  }

  /**
   * 获取模型配置模板
   * @param {string} modelType - 模型类型
   * @returns {Object} 模型配置模板
   */
  static getModelConfigTemplate(modelType) {
    switch (modelType) {
      case 'doubao':
        return {
          model: 'doubao-seed-1-8-251228',
          apiKey: '',
          temperature: 80,
          topP: 0.95,
          capabilities: ['text', 'image', 'video', 'file', 'web_search']
        };
      default:
        return {
          model: 'doubao-seed-1-8-251228',
          apiKey: '',
          temperature: 80,
          topP: 0.95,
          capabilities: ['text', 'image', 'video', 'file', 'web_search']
        };
    }
  }
}

module.exports = ModelFactory;