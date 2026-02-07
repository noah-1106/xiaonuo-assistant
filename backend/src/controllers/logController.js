/**
 * 日志管理控制器
 * 用于处理系统日志的查询和管理操作
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * 获取日志文件列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
exports.getLogFiles = async (req, res, next) => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    
    // 检查日志目录是否存在
    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // 读取日志目录中的文件
    const files = fs.readdirSync(logsDir);
    
    // 过滤出日志文件并获取文件信息
    const logFiles = files
      .filter(file => file.endsWith('.log') || file.endsWith('.log.gz'))
      .map(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: stats.size,
          mtime: stats.mtime,
          isCompressed: file.endsWith('.gz')
        };
      })
      .sort((a, b) => b.mtime - a.mtime); // 按修改时间倒序排列
    
    res.status(200).json({
      success: true,
      data: logFiles
    });
  } catch (error) {
    logger.error('获取日志文件列表失败', { error: error.message });
    next(error);
  }
};

/**
 * 读取日志文件内容
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
exports.readLogFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const logsDir = path.join(__dirname, '../../logs');
    const filePath = path.join(logsDir, filename);
    
    // 验证文件路径安全性
    if (!filePath.startsWith(logsDir)) {
      return res.status(400).json({
        success: false,
        message: '无效的文件路径'
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '日志文件不存在'
      });
    }
    
    // 读取文件内容
    let content;
    if (filePath.endsWith('.gz')) {
      // 对于压缩文件，需要解压缩读取
      const zlib = require('zlib');
      const gunzip = zlib.createGunzip();
      const fileStream = fs.createReadStream(filePath);
      
      // 由于解压缩可能需要时间，这里使用Promise处理
      content = await new Promise((resolve, reject) => {
        let data = '';
        fileStream.pipe(gunzip)
          .on('data', chunk => data += chunk)
          .on('end', () => resolve(data))
          .on('error', reject);
      });
    } else {
      // 对于普通文件，直接读取
      content = fs.readFileSync(filePath, 'utf8');
    }
    
    // 限制返回的日志大小，防止内存溢出
    const maxSize = 1024 * 1024; // 1MB
    if (content.length > maxSize) {
      content = content.slice(-maxSize);
    }
    
    res.status(200).json({
      success: true,
      data: {
        filename,
        content
      }
    });
  } catch (error) {
    logger.error('读取日志文件失败', { error: error.message, filename: req.params.filename });
    next(error);
  }
};

/**
 * 删除日志文件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
exports.deleteLogFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const logsDir = path.join(__dirname, '../../logs');
    const filePath = path.join(logsDir, filename);
    
    // 验证文件路径安全性
    if (!filePath.startsWith(logsDir)) {
      return res.status(400).json({
        success: false,
        message: '无效的文件路径'
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '日志文件不存在'
      });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    logger.info('日志文件已删除', { filename });
    
    res.status(200).json({
      success: true,
      message: '日志文件已成功删除'
    });
  } catch (error) {
    logger.error('删除日志文件失败', { error: error.message, filename: req.params.filename });
    next(error);
  }
};

/**
 * 清理过期日志
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
exports.cleanupLogs = async (req, res, next) => {
  try {
    const logsDir = path.join(__dirname, '../../logs');
    
    // 检查日志目录是否存在
    if (!fs.existsSync(logsDir)) {
      return res.status(200).json({
        success: true,
        message: '日志目录不存在，无需清理'
      });
    }
    
    // 读取日志目录中的文件
    const files = fs.readdirSync(logsDir);
    let deletedCount = 0;
    
    // 清理30天前的日志文件
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    
    logger.info('清理过期日志完成', { deletedCount });
    
    res.status(200).json({
      success: true,
      message: `成功清理 ${deletedCount} 个过期日志文件`
    });
  } catch (error) {
    logger.error('清理过期日志失败', { error: error.message });
    next(error);
  }
};