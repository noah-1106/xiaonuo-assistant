/**
 * 任务模板路由
 * 定义任务模板相关的API路由
 */
const express = require('express');
const router = express.Router();
const taskTemplateController = require('../controllers/taskTemplateController');
const { authMiddleware } = require('../middleware/auth');

// 验证管理员权限的中间件
const requireAdmin = (req, res, next) => {
  // 这里可以根据实际的权限系统进行调整
  // 暂时使用简单的验证方式
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: '需要管理员权限',
      errorCode: 'FORBIDDEN'
    });
  }
  next();
};

// 应用认证中间件
router.use(authMiddleware);

/**
 * @route GET /api/task-templates
 * @desc 获取任务模板列表
 * @access 管理员
 */
router.get('/', requireAdmin, taskTemplateController.getTemplates);

/**
 * @route GET /api/task-templates/:templateId
 * @desc 获取任务模板详情
 * @access 管理员
 */
router.get('/:templateId', requireAdmin, taskTemplateController.getTemplateById);

/**
 * @route POST /api/task-templates
 * @desc 创建任务模板
 * @access 管理员
 */
router.post('/', requireAdmin, taskTemplateController.createTemplate);

/**
 * @route PUT /api/task-templates/:templateId
 * @desc 更新任务模板
 * @access 管理员
 */
router.put('/:templateId', requireAdmin, taskTemplateController.updateTemplate);

/**
 * @route DELETE /api/task-templates/:templateId
 * @desc 删除任务模板
 * @access 管理员
 */
router.delete('/:templateId', requireAdmin, taskTemplateController.deleteTemplate);

/**
 * @route POST /api/task-templates/:templateId/create-task
 * @desc 根据模板创建任务
 * @access 管理员
 */
router.post('/:templateId/create-task', requireAdmin, taskTemplateController.createTaskFromTemplate);

module.exports = router;