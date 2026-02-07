/**
 * 任务模板服务
 * 处理任务模板的业务逻辑
 */
const TaskTemplate = require('../models/TaskTemplate');
const { TaskValidationError, TaskTemplateError } = require('../utils/customErrors');

class TaskTemplateService {
  /**
   * 创建任务模板
   * @param {Object} templateData - 模板数据
   * @param {Object} user - 当前用户
   * @returns {Promise<Object>} 创建的模板
   */
  async createTemplate(templateData, user) {
    try {
      // 验证必填字段
      if (!templateData.name || !templateData.taskType) {
        throw new TaskValidationError('模板名称和任务类型不能为空');
      }

      // 检查模板名称是否已存在
      const existingTemplate = await TaskTemplate.findOne({ name: templateData.name });
      if (existingTemplate) {
        throw new TaskValidationError('模板名称已存在');
      }

      // 添加创建者和更新者信息
      const template = await TaskTemplate.createTemplate({
        ...templateData,
        createdBy: user._id,
        updatedBy: user._id
      });

      console.log('任务模板创建成功', {
        templateId: template._id,
        templateName: template.name,
        userId: user._id
      });

      return template;
    } catch (error) {
      console.error('创建任务模板失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取所有任务模板
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 模板列表
   */
  async getAllTemplates(filters = {}) {
    try {
      const templates = await TaskTemplate.getAllTemplates(filters);
      return templates;
    } catch (error) {
      console.error('获取任务模板列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取任务模板详情
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object>} 模板详情
   */
  async getTemplateById(templateId) {
    try {
      const template = await TaskTemplate.getTemplateById(templateId);
      if (!template) {
        throw new TaskTemplateError('任务模板不存在');
      }
      return template;
    } catch (error) {
      console.error('获取任务模板详情失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新任务模板
   * @param {string} templateId - 模板ID
   * @param {Object} updateData - 更新数据
   * @param {Object} user - 当前用户
   * @returns {Promise<Object>} 更新后的模板
   */
  async updateTemplate(templateId, updateData, user) {
    try {
      // 检查模板是否存在
      const template = await TaskTemplate.getTemplateById(templateId);
      if (!template) {
        throw new TaskTemplateError('任务模板不存在');
      }

      // 如果更新模板名称，检查是否已存在
      if (updateData.name && updateData.name !== template.name) {
        const existingTemplate = await TaskTemplate.findOne({ name: updateData.name });
        if (existingTemplate) {
          throw new TaskValidationError('模板名称已存在');
        }
      }

      // 添加更新者信息
      const updatedTemplate = await TaskTemplate.updateTemplate(templateId, {
        ...updateData,
        updatedBy: user._id
      });

      console.log('任务模板更新成功', {
        templateId: updatedTemplate._id,
        templateName: updatedTemplate.name,
        userId: user._id
      });

      return updatedTemplate;
    } catch (error) {
      console.error('更新任务模板失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除任务模板
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteTemplate(templateId) {
    try {
      // 检查模板是否存在
      const template = await TaskTemplate.getTemplateById(templateId);
      if (!template) {
        throw new TaskTemplateError('任务模板不存在');
      }

      // 删除模板
      await TaskTemplate.deleteTemplate(templateId);

      console.log('任务模板删除成功', {
        templateId,
        templateName: template.name
      });

      return { success: true, message: '任务模板删除成功' };
    } catch (error) {
      console.error('删除任务模板失败:', error.message);
      throw error;
    }
  }

  /**
   * 增加模板使用次数
   * @param {string} templateId - 模板ID
   * @returns {Promise<Object>} 更新后的模板
   */
  async incrementUsage(templateId) {
    try {
      const template = await TaskTemplate.incrementUsage(templateId);
      return template;
    } catch (error) {
      console.error('增加模板使用次数失败:', error.message);
      // 此操作失败不应该影响主流程，所以不抛出错误
      return null;
    }
  }

  /**
   * 根据模板创建任务
   * @param {string} templateId - 模板ID
   * @param {Object} taskData - 任务数据（会覆盖模板中的对应字段）
   * @param {Object} user - 当前用户
   * @returns {Promise<Object>} 任务数据
   */
  async createTaskFromTemplate(templateId, taskData = {}, user) {
    try {
      const template = await this.getTemplateById(templateId);
      
      // 增加使用次数
      await this.incrementUsage(templateId);

      // 构建任务数据
      const task = {
        title: taskData.title || template.name,
        description: taskData.description || template.description,
        type: template.taskType,
        params: {
          ...template.paramsTemplate,
          ...taskData.params
        },
        userId: user._id
      };

      return task;
    } catch (error) {
      console.error('根据模板创建任务失败:', error.message);
      throw error;
    }
  }
}

module.exports = new TaskTemplateService();