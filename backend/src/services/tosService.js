// 火山方舟TOS服务工具类
const TosClient = require('@volcengine/tos-sdk').TosClient;
const fs = require('fs');
const tosConfig = require('../config/tos');
const { BadRequestError, InternalServerError } = require('../utils/customErrors');

// 初始化TOS客户端
let tosClient = null;

// 预签名URL缓存，用于频繁访问的文件
const presignedUrlCache = new Map();

// 缓存过期检查间隔（毫秒）
const CACHE_CHECK_INTERVAL = 60000; // 1分钟

// 启动缓存过期检查
setInterval(() => {
  const now = Date.now();
  for (const [key, { url, timestamp, expires }] of presignedUrlCache.entries()) {
    // 检查缓存是否过期（过期时间的90%）
    const cacheExpiry = timestamp + (expires * 1000 * 0.9);
    if (now > cacheExpiry) {
      presignedUrlCache.delete(key);
    }
  }
}, CACHE_CHECK_INTERVAL);

try {
  // 移除endpoint中的协议前缀，TOS SDK会自动处理
  const endpoint = tosConfig.endpoint.replace(/^https?:\/\//, '');
  tosClient = new TosClient({
    endpoint: endpoint,
    accessKeyId: tosConfig.accessKeyId,
    accessKeySecret: tosConfig.accessKeySecret,
    region: tosConfig.region,
    // forcePathStyle可能导致路径访问权限问题，根据TOS SDK最佳实践移除
  });
  console.log('TOS客户端初始化成功');
} catch (error) {
  console.error('TOS客户端初始化失败:', error);
  // 初始化失败时，tosClient为null，但服务不会崩溃
}

class TosService {
  /**
   * 构建TOS文件存储路径
   * @param {string} fileType - 文件类型
   * @param {string} userId - 用户ID
   * @param {string} relatedId - 关联ID
   * @param {string} fileName - 文件名
   * @returns {string} - 完整的TOS文件key
   */
  static buildFilePath(fileType = 'other', userId = 'system', relatedId = '', fileName) {
    let key = `${tosConfig.filePrefix}`;
    
    switch (fileType) {
      case 'avatar':
        key += `user/avatars/${userId}/`;
        break;
      case 'record':
        key += `user/records/${userId}/${relatedId || 'general'}/`;
        break;
      case 'chat':
        key += `user/chat/${userId}/${relatedId || 'general'}/`;
        break;
      case 'captcha':
        key += `system/captcha/`;
        break;
      default:
        key += `user/other/${userId}/`;
    }
    
    // 对文件名进行编码处理，确保非ASCII字符能正确处理
    const encodedFileName = encodeURIComponent(fileName).replace(/[!'()*]/g, (c) => {
      return '%' + c.charCodeAt(0).toString(16);
    });
    
    key += `${Date.now()}-${encodedFileName}`;
    return key;
  }
  
  /**
   * 上传文件到TOS（统一方法）
   * @param {string|Stream} source - 本地文件路径或文件流
   * @param {string} fileName - 存储到TOS的文件名
   * @param {string} fileType - 文件类型（avatar/record/chat/captcha）
   * @param {string} userId - 用户ID（可选）
   * @param {string} relatedId - 关联ID（如recordId/sessionId，可选）
   * @returns {Promise<string>} - 文件在TOS上的URL
   */
  static async upload(source, fileName, fileType = 'other', userId = 'system', relatedId = '') {
    try {
      if (!tosClient) {
        throw new InternalServerError('TOS服务未初始化');
      }
      
      const key = this.buildFilePath(fileType, userId, relatedId, fileName);
      
      // 根据source类型决定使用哪种上传方式
      const body = typeof source === 'string' ? fs.createReadStream(source) : source;
      
      await tosClient.putObject({
        bucket: tosConfig.bucket,
        key: key,
        body: body,
      });
      
      // 返回文件的预签名URL，确保前端可以直接访问
      return this.getPreSignedUrl(key);
    } catch (error) {
      console.error('TOS文件上传失败:', error);
      throw new InternalServerError('文件上传失败');
    }
  }
  
  /**
   * 上传文件到TOS（兼容旧方法名）
   * @param {string} filePath - 本地文件路径
   * @param {string} fileName - 存储到TOS的文件名
   * @param {string} fileType - 文件类型（avatar/record/chat/captcha）
   * @param {string} userId - 用户ID（可选）
   * @param {string} relatedId - 关联ID（如recordId/sessionId，可选）
   * @returns {Promise<string>} - 文件在TOS上的URL
   */
  static async uploadFile(filePath, fileName, fileType = 'other', userId = 'system', relatedId = '') {
    return this.upload(filePath, fileName, fileType, userId, relatedId);
  }

  /**
   * 上传文件流到TOS（兼容旧方法名）
   * @param {Stream} fileStream - 文件流
   * @param {string} fileName - 存储到TOS的文件名
   * @param {string} fileType - 文件类型（avatar/record/chat/captcha）
   * @param {string} userId - 用户ID（可选）
   * @param {string} relatedId - 关联ID（如recordId/sessionId，可选）
   * @returns {Promise<string>} - 文件在TOS上的URL
   */
  static async uploadFileStream(fileStream, fileName, fileType = 'other', userId = 'system', relatedId = '') {
    return this.upload(fileStream, fileName, fileType, userId, relatedId);
  }

  /**
   * 从TOS下载文件
   * @param {string} fileUrl - TOS上的文件完整URL
   * @param {string} downloadPath - 本地下载路径
   * @returns {Promise<void>}
   */
  static async downloadFile(fileUrl, downloadPath) {
    try {
      if (!tosClient) {
        throw new InternalServerError('TOS服务未初始化');
      }
      
      const key = this.extractKeyFromUrl(fileUrl);
      
      const result = await tosClient.getObject({
        bucket: tosConfig.bucket,
        key: key,
      });
      
      // 将文件流写入本地文件
      const writeStream = fs.createWriteStream(downloadPath);
      await new Promise((resolve, reject) => {
        result.body.pipe(writeStream);
        result.body.on('end', resolve);
        result.body.on('error', reject);
      });
    } catch (error) {
      console.error('TOS文件下载失败:', error);
      throw new InternalServerError('文件下载失败');
    }
  }

  /**
   * 删除TOS上的文件
   * @param {string} fileUrl - TOS上的文件完整URL
   * @returns {Promise<void>}
   */
  static async deleteFile(fileUrl) {
    try {
      if (!tosClient) {
        throw new InternalServerError('TOS服务未初始化');
      }
      
      const key = this.extractKeyFromUrl(fileUrl);
      
      await tosClient.deleteObject({
        bucket: tosConfig.bucket,
        key: key,
      });
    } catch (error) {
      console.error('TOS文件删除失败:', error);
      throw new InternalServerError('文件删除失败');
    }
  }

  /**
   * 获取TOS文件的预签名URL
   * @param {string} key - TOS上的文件完整key
   * @param {number} expires - URL过期时间（秒），默认3600秒（1小时）
   * @returns {string} - 文件的预签名访问URL
   */
  static getPreSignedUrl(key, expires = 3600) {
    try {
      if (!tosClient) {
        throw new InternalServerError('TOS服务未初始化');
      }
      
      // 检查缓存中是否有未过期的预签名URL
      const cachedUrl = presignedUrlCache.get(key);
      const now = Date.now();
      
      if (cachedUrl) {
        const { url, timestamp, expires: cachedExpires } = cachedUrl;
        // 检查缓存是否在有效期内（使用90%的过期时间作为缓存有效期）
        const cacheExpiry = timestamp + (cachedExpires * 1000 * 0.9);
        
        if (now < cacheExpiry) {
          console.log(`使用缓存的预签名URL for key: ${key}`);
          return url;
        }
        // 缓存过期，删除
        presignedUrlCache.delete(key);
      }
      
      // 生成新的预签名URL
      const url = tosClient.getPreSignedUrl({
        bucket: tosConfig.bucket,
        key: key,
        method: 'GET',
        expires: expires
      });
      
      // 缓存预签名URL
      presignedUrlCache.set(key, {
        url: url,
        timestamp: now,
        expires: expires
      });
      
      console.log(`生成并缓存新的预签名URL for key: ${key}`);
      return url;
    } catch (error) {
      console.error('生成TOS预签名URL失败:', error);
      throw new InternalServerError('生成文件访问URL失败');
    }
  }

  /**
   * 获取TOS文件的访问URL（兼容旧方法，使用预签名URL）
   * @param {string} key - TOS上的文件完整key
   * @returns {Promise<string>} - 文件的访问URL
   */
  static getFileUrl(key) {
    // 注意：这个方法现在应该返回预签名URL，但为了兼容同步调用，保留旧格式
    // 实际使用时应调用getPreSignedUrl获取预签名URL
    const endpointParts = tosConfig.endpoint.split('//');
    const protocol = endpointParts[0];
    const host = endpointParts[1];
    return `${protocol}//${tosConfig.bucket}.${host}/${key}`;
  }

  /**
   * 列出TOS存储桶中的文件
   * @param {string} prefix - 文件前缀，用于过滤文件
   * @returns {Promise<Array>} - 文件列表
   */
  static async listFiles(prefix = '') {
    try {
      if (!tosClient) {
        throw new InternalServerError('TOS服务未初始化');
      }
      
      const result = await tosClient.listObjects({
        bucket: tosConfig.bucket,
        prefix: `${tosConfig.filePrefix}${prefix}`,
      });
      
      return result.contents || [];
    } catch (error) {
      console.error('TOS文件列表获取失败:', error);
      throw new InternalServerError('文件列表获取失败');
    }
  }

  /**
   * 从URL中提取文件key
   * @param {string} fileUrl - TOS上的文件完整URL
   * @returns {string} - 文件key
   */
  static extractKeyFromUrl(fileUrl) {
    const urlParts = fileUrl.split('/');
    const bucketIndex = urlParts.indexOf(tosConfig.bucket);
    if (bucketIndex === -1) {
      throw new BadRequestError('无效的TOS文件URL');
    }
    
    return urlParts.slice(bucketIndex + 1).join('/');
  }
}

module.exports = TosService;
