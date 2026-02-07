/**
 * 任务模板控制器
 * 处理任务模板的API请求
 */
const taskTemplateService = require('../services/taskTemplateService');
const logger = require('../utils/logger');

/**
 * 创建任务模板
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
exports.createTemplate = async (req, res, next) => {
  try {
    const { name, description, taskType, paramsTemplate, status } = req.body;
    
    const templateData = {
      name,
      description,
      taskType,
      paramsTemplate,
      status: status || 'active'
    };

    const template = await taskTemplateService.createTemplate(templateData, req.user);
    
    logger.info('创建任务模板成功', {
      templateId: template._id,
      templateName: template.name,
      userId: req.user._id
    });

    res.status(201).json({
      status: 'success',
      message: '任务模板创建成功',
      data: template
    });
  } catch (error) {
    logger.error('创建任务模板失败:', error.message);
    next(error);
  }
};

/**
 * 获取任务模板列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
exports.getTemplates = async (req, res, next) => {
  try {
    const { status, taskType } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (taskType) filters.taskType = taskType;

    const templates = await taskTemplateService.getAllTemplates(filters);
    
    res.status(200).json({
      status: 'success',
      message: '获取任务模板列表成功',
      data: templates
    });
  } catch (error) {
    logger.error('获取任务模板列表失败:', error.message);
    next(error);
  }
};

/**
 * 获取任务模板详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
exports.getTemplateById = async (req, res, next) => {
  try {
    const { templateId } = req.params;

    const template = await taskTemplateService.getTemplateById(templateId);
    
    res.status(200).json({
      status: 'success',
      message: '获取任务模板详情成功',
      data: template
    });
  } catch (error) {
    logger.error('获取任务模板详情失败:', error.message);
    next(error);
  }
};

/**
 * 更新任务模板
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
exports.updateTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const { name, description, taskType, paramsTemplate, status } = req.body;
    
    const updateData = {
      name,
      description,
      taskType,
      paramsTemplate,
      status
    };

    // 移除undefined字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedTemplate = await taskTemplateService.updateTemplate(templateId, updateData, req.user);
    
    logger.info('更新任务模板成功', {
      templateId: updatedTemplate._id,
      templateName: updatedTemplate.name,
      userId: req.user._id
    });

    res.status(200).json({
      status: 'success',
      message: '任务模板更新成功',
      data: updatedTemplate
    });
  } catch (error) {
    logger.error('更新任务模板失败:', error.message);
    next(error);
  }
};

/**
 * 删除任务模板
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
exports.deleteTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;

    const result = await taskTemplateService.deleteTemplate(templateId);
    
    logger.info('删除任务模板成功', {
      templateId,
      userId: req.user._id
    });

    res.status(200).json({
      status: 'success',
      message: '任务模板删除成功',
      data: result
    });
  } catch (error) {
    logger.error('删除任务模板失败:', error.message);
    next(error);
  }
};

/**
 * 根据模板创建任务
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一步函数
 */
exports.createTaskFromTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const { title, description, params } = req.body;
    
    const taskData = {
      title,
      description,
      params
    };

    const task = await taskTemplateService.createTaskFromTemplate(templateId, taskData, req.user);
    
    logger.info('根据模板创建任务成功', {
      templateId,
      taskTitle: task.title,
      userId: req.user._id
    });

    res.status(200).json({
      status: 'success',
      message: '根据模板创建任务成功',
      data: task
    });
  } catch (error) {
    logger.error('根据模板创建任务失败:', error.message);
    next(error);
  }
};