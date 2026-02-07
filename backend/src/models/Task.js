const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * 任务模型
 * 用于存储和管理不同类型的任务
 */
const TaskSchema = new Schema({
  // 用户ID
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 子任务列表
  subtasks: {
    type: [Schema.Types.Mixed],
    default: []
  },
  
  // 任务状态
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled']
  },
  
  // 任务标题
  title: {
    type: String,
    required: true
  },
  
  // 任务描述
  description: {
    type: String
  },
  
  // 任务参数
  params: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // 执行模式: auto (自动执行所有子任务), manual (AI手动控制子任务执行)
  executionMode: {
    type: String,
    default: 'auto',
    enum: ['auto', 'manual']
  },
  
  // 当前执行的子任务索引
  currentSubtaskIndex: {
    type: Number,
    default: -1
  },
  
  // 任务进度
  progress: {
    type: Number,
    default: 0
  },
  
  // 任务结果
  result: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // 错误信息
  error: {
    type: String
  },
  
  // 相关会话ID
  sessionId: {
    type: String
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
  
  // 完成时间
  completedAt: {
    type: Date
  },
  
  // 用户反馈引用
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskFeedback'
  },
  
  // 执行日志
  executionLog: {
    type: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String
      },
      message: {
        type: String
      },
      details: {
        type: Schema.Types.Mixed
      }
    }],
    default: []
  }
});

// 自动更新updatedAt字段
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：创建任务
TaskSchema.statics.createTask = async function(userId, taskData) {
  const task = new this({
    userId,
    status: 'pending',
    ...taskData
  });
  return await task.save();
};

// 静态方法：执行任务
TaskSchema.statics.executeTask = async function(taskId) {
  // 验证任务ID格式
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new Error('任务ID的格式不符合系统要求，系统需要的是MongoDB ObjectId格式的任务ID（通常是24位的十六进制字符串），而不是当前使用的类似时间戳的字符串');
  }
  
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.status = 'in_progress';
  task.progress = 0;
  await task.save();
  
  return task;
};

// 静态方法：完成任务
TaskSchema.statics.completeTask = async function(taskId, result) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.status = 'completed';
  task.progress = 100;
  task.result = result;
  task.completedAt = new Date();
  await task.save();
  
  return task;
};

// 静态方法：失败任务
TaskSchema.statics.failTask = async function(taskId, error) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.status = 'failed';
  task.error = error;
  await task.save();
  
  return task;
};

// 静态方法：取消任务
TaskSchema.statics.cancelTask = async function(taskId) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.status = 'cancelled';
  await task.save();
  
  return task;
};

// 静态方法：更新任务进度
TaskSchema.statics.updateProgress = async function(taskId, progress) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.progress = progress;
  await task.save();
  
  return task;
};

// 静态方法：更新用户反馈引用
TaskSchema.statics.updateFeedback = async function(taskId, feedbackId) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.feedback = feedbackId;
  await task.save();
  
  return task;
};

// 静态方法：更新当前子任务索引
TaskSchema.statics.updateCurrentSubtaskIndex = async function(taskId, index) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.currentSubtaskIndex = index;
  await task.save();
  
  return task;
};

// 静态方法：更新子任务状态
TaskSchema.statics.updateSubtaskStatus = async function(taskId, subtaskIndex, status, result = null, error = null) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  if (subtaskIndex < 0 || subtaskIndex >= task.subtasks.length) {
    throw new Error('子任务索引超出范围');
  }
  
  // 更新子任务状态
  task.subtasks[subtaskIndex] = {
    ...task.subtasks[subtaskIndex],
    status,
    result: result || task.subtasks[subtaskIndex].result,
    error: error || task.subtasks[subtaskIndex].error,
    updatedAt: new Date()
  };
  
  // 计算任务整体进度
  if (task.subtasks.length > 0) {
    const completedSubtasks = task.subtasks.filter(subtask => 
      subtask.status === 'completed'
    ).length;
    task.progress = Math.round((completedSubtasks / task.subtasks.length) * 100);
  }
  
  // 如果所有子任务都完成，更新任务状态为完成
  if (task.subtasks.length > 0 && 
      task.subtasks.every(subtask => subtask.status === 'completed')) {
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date();
  }
  // 如果有子任务失败，更新任务状态为失败
  else if (task.subtasks.some(subtask => subtask.status === 'failed')) {
    task.status = 'failed';
  }
  
  await task.save();
  
  return task;
};

// 静态方法：获取子任务状态
TaskSchema.statics.getSubtaskStatus = async function(taskId, subtaskIndex) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  if (subtaskIndex < 0 || subtaskIndex >= task.subtasks.length) {
    throw new Error('子任务索引超出范围');
  }
  
  return task.subtasks[subtaskIndex].status || 'pending';
};

// 静态方法：初始化子任务状态
TaskSchema.statics.initSubtaskStatuses = async function(taskId) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  // 为每个子任务初始化状态
  task.subtasks = task.subtasks.map(subtask => ({
    ...subtask,
    status: subtask.status || 'pending',
    result: subtask.result || null,
    error: subtask.error || null,
    createdAt: subtask.createdAt || new Date(),
    updatedAt: new Date()
  }));
  
  await task.save();
  
  return task;
};

// 静态方法：记录执行日志
TaskSchema.statics.logExecution = async function(taskId, status, message, details = {}) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  task.executionLog.push({
    timestamp: new Date(),
    status,
    message,
    details
  });
  await task.save();
  
  return task;
};

// 静态方法：获取执行日志
TaskSchema.statics.getExecutionLog = async function(taskId) {
  const task = await this.findById(taskId);
  if (!task) {
    throw new Error('任务不存在');
  }
  
  return task.executionLog;
};

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;