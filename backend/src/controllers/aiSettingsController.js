const AISetting = require('../models/AISetting');
const aiService = require('../services/aiService');

/**
 * 获取AI设置
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getAISettings = async (req, res) => {
  let setting = await AISetting.findOne();
  
  // 如果没有设置，创建默认设置
  if (!setting) {
    setting = new AISetting();
    await setting.save();
  }
  
  res.json({
    status: 'ok',
    message: '获取AI设置成功',
    data: {
      setting
    }
  });
};

/**
 * 更新AI设置
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.updateAISettings = async (req, res) => {
  const updateData = req.body;

  // 查找现有设置
  let setting = await AISetting.findOne();

  // 检查是否更新了系统提示词或效率助理提示词
  const isPromptUpdated = setting && (
    (updateData.systemPrompt !== undefined && updateData.systemPrompt !== setting.systemPrompt) ||
    (updateData.efficiencyAssistant?.prompt !== undefined &&
     updateData.efficiencyAssistant?.prompt !== setting.efficiencyAssistant?.prompt)
  );

  if (setting) {
    // 更新现有设置
    setting = await AISetting.findOneAndUpdate({}, updateData, { new: true });
  } else {
    // 创建新设置
    setting = new AISetting(updateData);
    await setting.save();
  }

  // 如果提示词被更新，清除所有用户的上下文ID
  if (isPromptUpdated && aiService.modelAdapter && aiService.modelAdapter.clearAllContextIds) {
    aiService.modelAdapter.clearAllContextIds();
  }

  res.json({
    status: 'ok',
    message: '更新AI设置成功',
    data: {
      setting
    }
  });
};

/**
 * 重置AI设置为默认值
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.resetAISettings = async (req, res) => {
  // 删除现有设置
  await AISetting.deleteMany({});
  
  // 创建默认设置
  const defaultSetting = new AISetting();
  await defaultSetting.save();
  
  res.json({
    status: 'ok',
    message: '重置AI设置成功',
    data: {
      setting: defaultSetting
    }
  });
};

/**
 * 获取增强角色列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getEnhancedRoles = async (req, res) => {
  let setting = await AISetting.findOne();
  
  // 如果没有设置，返回空列表
  if (!setting) {
    return res.json({
      status: 'ok',
      data: [],
      message: '获取增强角色列表成功'
    });
  }
  
  // 返回所有启用的增强角色
  const enhancedRoles = setting.enhancedRoles.filter(role => role.isEnabled);
  
  res.json({
    status: 'ok',
    data: enhancedRoles,
    message: '获取增强角色列表成功'
  });
};

/**
 * 获取记录类型列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @returns {Promise<void>}
 */
exports.getRecordTypes = async (req, res) => {
  let setting = await AISetting.findOne();
  
  // 如果没有设置或没有效率助理配置，返回默认记录类型
  if (!setting || !setting.efficiencyAssistant || !setting.efficiencyAssistant.recordTypes) {
    return res.json({
      status: 'ok',
      data: [
        { id: 'article', name: '文章', description: '文章类型' },
        { id: 'todo', name: '待办', description: '待办事项类型' },
        { id: 'inspiration', name: '灵感闪现', description: '灵感闪现类型' },
        { id: 'other', name: '其他', description: '其他类型' }
      ],
      message: '获取记录类型列表成功'
    });
  }
  
  // 返回效率助理的记录类型
  res.json({
    status: 'ok',
    data: setting.efficiencyAssistant.recordTypes,
    message: '获取记录类型列表成功'
  });
};
