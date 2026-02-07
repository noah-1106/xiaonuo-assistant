/**
 * 抽象模型接口
 * 定义所有模型适配器都需要实现的方法
 */
class AbstractModel {
  /**
   * 构造函数
   * @param {Object} config - 模型配置
   */
  constructor(config) {
    this.config = config || {};
  }

  /**
   * 文本处理
   * @param {string} text - 文本内容
   * @param {Array} context - 上下文消息
   * @returns {Promise<Object>} 处理结果
   */
  async processText(text, context = []) {
    throw new Error('Subclass must implement processText method');
  }

  /**
   * 图片处理
   * @param {string} imageUrl - 图片URL
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 处理结果
   */
  async processImage(imageUrl, prompt = '') {
    throw new Error('Subclass must implement processImage method');
  }

  /**
   * 视频处理
   * @param {string} videoUrl - 视频URL
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 处理结果
   */
  async processVideo(videoUrl, prompt = '') {
    throw new Error('Subclass must implement processVideo method');
  }

  /**
   * 文件处理
   * @param {string} fileUrl - 文件URL
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>} 处理结果
   */
  async processFile(fileUrl, prompt = '') {
    throw new Error('Subclass must implement processFile method');
  }

  /**
   * 上传文件
   * @param {Buffer|Stream} fileData - 文件数据
   * @param {string} fileName - 文件名
   * @param {string} fileType - 文件类型
   * @returns {Promise<Object>} 上传结果
   */
  async uploadFile(fileData, fileName, fileType) {
    throw new Error('Subclass must implement uploadFile method');
  }

  /**
   * 工具调用
   * @param {string} toolName - 工具名称
   * @param {Object} params - 工具参数
   * @returns {Promise<Object>} 工具调用结果
   */
  async callTool(toolName, params = {}) {
    throw new Error('Subclass must implement callTool method');
  }

  /**
   * 获取模型能力
   * @returns {Object} 模型能力描述
   */
  getCapabilities() {
    return {
      text: true,
      image: false,
      video: false,
      file: false,
      tools: []
    };
  }

  /**
   * 检查模型是否支持指定能力
   * @param {string} capability - 能力名称
   * @returns {boolean} 是否支持
   */
  supports(capability) {
    const capabilities = this.getCapabilities();
    return capabilities[capability] || false;
  }
}

module.exports = AbstractModel;