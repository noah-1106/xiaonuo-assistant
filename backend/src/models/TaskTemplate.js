/**
 * 任务模板模型
 * 用于存储和管理任务模板，供管理员维护
 */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskTemplateSchema = new Schema({
  // 模板名称
  name: {
    type: String,
    required: [true, '模板名称不能为空'],
    unique: true
  },
  
  // 模板描述
  description: {
    type: String
  },
  
  // 任务类型
  taskType: {
    type: String,
    required: [true, '任务类型不能为空'],
    enum: ['record_create', 'record_update', 'record_delete', 'record_query', 'custom']
  },
  
  // 任务参数模板
  paramsTemplate: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // 模板状态
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // 创建者ID
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 更新者ID
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // 使用次数
  usageCount: {
    type: Number,
    default: 0
  }
});

// 自动更新updatedAt字段
TaskTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：创建任务模板
TaskTemplateSchema.statics.createTemplate = async function(templateData) {
  const template = new this(templateData);
  return await template.save();
};

// 静态方法：获取所有任务模板
TaskTemplateSchema.statics.getAllTemplates = async function(filters = {}) {
  const query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.taskType) {
    query.taskType = filters.taskType;
  }
  
  return await this.find(query)
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email')
    .sort({ createdAt: -1 });
};

// 静态方法：获取任务模板详情
TaskTemplateSchema.statics.getTemplateById = async function(templateId) {
  return await this.findById(templateId)
    .populate('createdBy', 'username email')
    .populate('updatedBy', 'username email');
};

// 静态方法：更新任务模板
TaskTemplateSchema.statics.updateTemplate = async function(templateId, updateData) {
  return await this.findByIdAndUpdate(templateId, updateData, { new: true });
};

// 静态方法：删除任务模板
TaskTemplateSchema.statics.deleteTemplate = async function(templateId) {
  return await this.findByIdAndDelete(templateId);
};

// 静态方法：增加使用次数
TaskTemplateSchema.statics.incrementUsage = async function(templateId) {
  return await this.findByIdAndUpdate(
    templateId,
    { $inc: { usageCount: 1 } },
    { new: true }
  );
};

const TaskTemplate = mongoose.model('TaskTemplate', TaskTemplateSchema);

module.exports = TaskTemplate;