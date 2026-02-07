const express = require('express');
const router = express.Router();
const { query, body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const filesController = require('../controllers/filesController');
const { handleValidationErrors } = require('../middleware/validation');

// 获取文件URL - 验证规则
const getFileUrlValidation = [
  query('key')
    .notEmpty().withMessage('请提供文件key')
    .isString().withMessage('文件key必须为字符串'),
  handleValidationErrors
];

// 删除文件 - 验证规则
const deleteFileValidation = [
  body('fileUrl')
    .notEmpty().withMessage('请提供文件URL')
    .isURL().withMessage('请提供有效的文件URL'),
  handleValidationErrors
];

// 列出文件 - 验证规则
const listFilesValidation = [
  query('prefix')
    .optional()
    .isString().withMessage('前缀必须为字符串'),
  handleValidationErrors
];

/**
 * @route POST /api/files/upload
 * @desc 上传文件到TOS
 * @access Private
 */
router.post('/upload', authMiddleware, filesController.upload.single('file'), filesController.uploadFile);

/**
 * @route GET /api/files/url
 * @desc 获取文件的访问URL
 * @access Private
 */
router.get('/url', authMiddleware, getFileUrlValidation, filesController.getFileUrl);

/**
 * @route DELETE /api/files
 * @desc 从TOS删除文件
 * @access Private
 */
router.delete('/', authMiddleware, deleteFileValidation, filesController.deleteFile);

/**
 * @route GET /api/files
 * @desc 列出TOS存储桶中的文件
 * @access Private
 */
router.get('/', authMiddleware, listFilesValidation, filesController.listFiles);

/**
 * @route POST /api/files/upload-ark
 * @desc 上传文件到火山方舟filesAPI，用于AI模型直接处理
 * @access Private
 */
router.post('/upload-ark', authMiddleware, filesController.upload.single('file'), filesController.uploadFileToArk);

module.exports = router;
