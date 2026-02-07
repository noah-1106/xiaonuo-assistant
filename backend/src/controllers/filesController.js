const multer = require('multer');
const path = require('path');
const fs = require('fs');
const TosService = require('../services/tosService');
const aiService = require('../services/aiService');
const { BadRequestError } = require('../utils/customErrors');

// 配置multer，用于临时存储上传的文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../tmp'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

exports.upload = multer({ storage: storage });

// 确保tmp目录存在
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

/**
 * 上传文件到TOS
 * @route POST /api/files/upload
 * @desc 上传文件到TOS
 * @access Private
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<void>}
 */
exports.uploadFile = async (req, res, next) => {
  console.log('收到文件上传请求');
  
  if (!req.file) {
    console.error('未收到文件');
    return next(new BadRequestError('请选择要上传的文件'));
  }

  const file = req.file;
  console.log('收到的文件:', file);
  
  const { fileType, relatedId, userId: requestUserId } = req.body;
  // 优先使用请求体中的userId，否则使用登录用户ID，最后使用anonymous
  const userId = requestUserId || (req.user ? req.user._id : 'anonymous');
  console.log('文件类型:', fileType, '相关ID:', relatedId, '用户ID:', userId);
  
  try {
    // 上传文件到TOS，根据文件类型、用户ID和相关ID构建存储路径
    console.log('开始上传文件到TOS，本地路径:', file.path);
    const fileUrl = await TosService.uploadFile(
      file.path, 
      file.originalname, 
      fileType || 'other', 
      userId,
      relatedId
    );
    
    console.log('TOS文件上传成功，URL:', fileUrl);
    
    // 删除临时文件
    console.log('删除临时文件:', file.path);
    fs.unlinkSync(file.path);
    
    res.json({
      status: 'ok',
      message: '文件上传成功',
      data: {
        url: fileUrl,
        name: file.originalname,
        size: file.size,
        type: file.mimetype
      }
    });
  } catch (error) {
    console.error('文件上传处理失败:', error);
    
    // 无论如何都要删除临时文件
    try {
      if (fs.existsSync(file.path)) {
        console.log('删除临时文件:', file.path);
        fs.unlinkSync(file.path);
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError);
    }
    
    // 将错误传递给Express错误处理中间件
    next(error);
  }
};

/**
 * 获取文件的访问URL（预签名）
 * @route GET /api/files/url
 * @desc 获取文件的最新预签名URL，确保前端可以长期访问
 * @access Private
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 错误处理函数
 * @returns {Promise<void>}
 */
exports.getFileUrl = async (req, res, next) => {
  const { key } = req.query;
  if (!key) {
    return next(new BadRequestError('请提供文件key'));
  }
  
  try {
    // 验证用户权限：检查文件key中的userId是否与当前登录用户匹配
    const userId = req.user ? req.user._id : 'anonymous';
    // 检查key中是否包含用户ID，确保用户只能访问自己的文件
    if (!key.includes(userId) && !key.includes('system')) {
      return next(new BadRequestError('无权访问此文件'));
    }
    
    // 生成预签名URL，过期时间1小时
    const fileUrl = TosService.getPreSignedUrl(key);
    
    // 记录文件访问日志
    console.log(`用户 ${userId} 访问文件: ${key}`);
    
    res.json({
      status: 'ok',
      message: '获取文件URL成功',
      data: {
        url: fileUrl,
        expires: 3600 // 过期时间（秒）
      }
    });
  } catch (error) {
    console.error('获取文件URL失败:', error);
    next(error);
  }
};

/**
 * 从TOS删除文件
 * @route DELETE /api/files
 * @desc 从TOS删除文件
 * @access Private
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 错误处理函数
 * @returns {Promise<void>}
 */
exports.deleteFile = async (req, res, next) => {
  const { fileUrl } = req.body;
  if (!fileUrl) {
    return next(new BadRequestError('请提供文件URL'));
  }
  
  try {
    await TosService.deleteFile(fileUrl);
    
    res.json({
      status: 'ok',
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('文件删除处理失败:', error);
    next(error);
  }
};

/**
 * 列出TOS存储桶中的文件
 * @route GET /api/files
 * @desc 列出TOS存储桶中的文件
 * @access Private
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 错误处理函数
 * @returns {Promise<void>}
 */
exports.listFiles = async (req, res, next) => {
  const prefix = req.query.prefix || '';
  
  try {
    const files = await TosService.listFiles(prefix);
    
    res.json({
      status: 'ok',
      message: '获取文件列表成功',
      data: {
        files: files
      }
    });
  } catch (error) {
    console.error('文件列表获取处理失败:', error);
    next(error);
  }
};

/**
 * 上传文件到火山方舟filesAPI
 * @route POST /api/files/upload-ark
 * @desc 上传文件到火山方舟filesAPI，用于AI模型直接处理
 * @access Private
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @returns {Promise<void>}
 */
exports.uploadFileToArk = async (req, res, next) => {
  console.log('收到文件上传到火山方舟的请求');
  
  if (!req.file) {
    console.error('未收到文件');
    return next(new BadRequestError('请选择要上传的文件'));
  }

  const file = req.file;
  console.log('收到的文件:', file);
  
  // 读取文件数据
  const fileData = fs.createReadStream(file.path);
  
  try {
    // 上传文件到火山方舟filesAPI
    console.log('开始上传文件到火山方舟filesAPI');
    const uploadResult = await aiService.uploadFile(
      fileData,
      file.originalname,
      file.mimetype
    );
    
    console.log('火山方舟文件上传成功，结果:', uploadResult);
    
    // 删除临时文件
    console.log('删除临时文件:', file.path);
    fs.unlinkSync(file.path);
    
    res.json({
      status: 'ok',
      message: '文件上传到火山方舟成功',
      data: uploadResult
    });
  } catch (error) {
    console.error('火山方舟文件上传失败:', error);
    
    // 无论如何都要删除临时文件
    try {
      if (fs.existsSync(file.path)) {
        console.log('删除临时文件:', file.path);
        fs.unlinkSync(file.path);
      }
    } catch (cleanupError) {
      console.error('清理临时文件失败:', cleanupError);
    }
    
    next(new BadRequestError('文件上传到火山方舟失败'));
  }
};
