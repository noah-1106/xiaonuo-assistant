const Task = require('../models/Task');
const Record = require('../models/Record');
const TaskFeedback = require('../models/TaskFeedback');
const aiService = require('./aiService');
const websocketService = require('./websocketService');
const { 
  TaskExecutionError, 
  TaskValidationError, 
  TaskNotFoundError, 
  TaskPermissionError 
} = require('../utils/customErrors');

class TaskService {
  constructor() {
    console.log('任务管理服务初始化完成');
  }

  /**
   * 创建任务
   * @param {ObjectId} userId - 用户ID
   * @param {Object} taskData - 任务数据
   * @returns {Promise<Object>} 创建的任务
   */
  async createTask(userId, taskData) {
    try {
      const task = await Task.createTask(userId, taskData);
      console.log(`任务创建成功: ${task.title}`);
      return task;
    } catch (error) {
      console.error('创建任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行任务
   * @param {ObjectId} taskId - 任务ID
   * @returns {Promise<Object>} 执行结果
   */
  async executeTask(taskId) {
    try {
      // 更新任务状态为执行中
      const task = await Task.executeTask(taskId);
      console.log(`开始执行任务: ${task.title}, 执行模式: ${task.executionMode}`);
      
      // 记录任务开始执行日志
      await Task.logExecution(taskId, 'started', `任务开始执行: ${task.title}`, {
        executionMode: task.executionMode,
        subtaskCount: task.subtasks ? task.subtasks.length : 0
      });
      
      // 推送任务开始执行消息
      await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', 0, {
        message: `任务开始执行: ${task.title}`
      });

      let result = {};

      // 执行子任务
      if (task.subtasks && task.subtasks.length > 0) {
        result.subtasks = [];
        let totalProgress = 0;
        const subtaskCount = task.subtasks.length;

        if (task.executionMode === 'auto') {
          // 自动执行模式：执行所有子任务
          await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', 0, {
            message: `任务开始执行，共 ${subtaskCount} 个子任务`,
            subtaskCount: subtaskCount
          });
          
          for (let i = 0; i < subtaskCount; i++) {
            const subtask = task.subtasks[i];
            try {
              // 更新当前子任务索引
              await Task.updateCurrentSubtaskIndex(taskId, i);
              
              // 发送子任务开始执行消息
              await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
                message: `开始执行子任务 ${i + 1}/${subtaskCount}: ${subtask.title}`,
                currentSubtask: i,
                subtaskTitle: subtask.title
              });
              
              // 记录子任务开始执行日志
              await Task.logExecution(taskId, 'subtask_started', `开始执行子任务 ${i + 1}/${subtaskCount}: ${subtask.title}`, {
                currentSubtask: i,
                subtaskTitle: subtask.title,
                subtaskCount: subtaskCount
              });
              
              // 执行子任务
              const subtaskResult = await this.executeSubtask(subtask);
              result.subtasks.push({
                index: i,
                title: subtask.title,
                result: subtaskResult,
                status: 'completed'
              });

              // 更新进度
              totalProgress = Math.round(((i + 1) / subtaskCount) * 100);
              await Task.updateProgress(taskId, totalProgress);
              await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
                message: `子任务 ${i + 1}/${subtaskCount}: ${subtask.title} 执行完成`,
                currentSubtask: i,
                subtaskTitle: subtask.title,
                progress: totalProgress
              });
              
              // 发送子任务完成通知
              await websocketService.sendSubtaskComplete(task.userId, taskId, i, subtaskResult);
              
              // 记录子任务完成执行日志
              await Task.logExecution(taskId, 'subtask_completed', `子任务 ${i + 1}/${subtaskCount}: ${subtask.title} 执行完成`, {
                currentSubtask: i,
                subtaskTitle: subtask.title,
                progress: totalProgress,
                subtaskCount: subtaskCount,
                subtaskResult: subtaskResult
              });
              
              // 如果还有更多子任务，发送准备执行下一个子任务的消息
              if (i < subtaskCount - 1) {
                await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
                  message: `准备执行下一个子任务 ${i + 2}/${subtaskCount}: ${task.subtasks[i + 1].title}`,
                  nextSubtask: i + 1,
                  nextSubtaskTitle: task.subtasks[i + 1].title
                });
              }
            } catch (error) {
              result.subtasks.push({
                index: i,
                title: subtask.title,
                error: error.message,
                status: 'failed'
              });
              
              // 发送子任务失败通知
              await websocketService.sendSubtaskError(task.userId, taskId, i, error.message);
              
              // 发送失败状态更新
              await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
                message: `子任务 ${i + 1}/${subtaskCount}: ${subtask.title} 执行失败: ${error.message}`,
                currentSubtask: i,
                subtaskTitle: subtask.title,
                error: error.message
              });
              
              // 记录子任务失败执行日志
              await Task.logExecution(taskId, 'subtask_failed', `子任务 ${i + 1}/${subtaskCount}: ${subtask.title} 执行失败`, {
                currentSubtask: i,
                subtaskTitle: subtask.title,
                error: error.message,
                subtaskCount: subtaskCount
              });
            }
          }
        } else {
          // 手动执行模式：只初始化任务，等待AI控制执行子任务
          await Task.updateCurrentSubtaskIndex(taskId, 0);
          totalProgress = Math.round((1 / subtaskCount) * 100);
          await Task.updateProgress(taskId, totalProgress);
          
          // 推送任务初始化完成消息，等待AI执行第一个子任务
          await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
            message: `任务已初始化，等待执行子任务 1/${subtaskCount}: ${task.subtasks[0].title}`,
            subtaskCount: subtaskCount,
            currentSubtask: 0,
            subtaskTitle: task.subtasks[0].title
          });
          await websocketService.sendTaskReadyForSubtask(task.userId, taskId, 0);
          
          return {
            status: 'ready_for_subtask',
            message: '任务已初始化，等待执行子任务',
            currentSubtaskIndex: 0,
            subtaskCount: subtaskCount
          };
        }
      } else {
        // 执行主任务逻辑
        await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', 0, {
          message: '开始执行主任务',
          taskTitle: task.title
        });
        
        result = await this.executeMainTask(task);
        
        await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', 100, {
          message: '主任务执行完成',
          taskTitle: task.title
        });
      }

      // 完成任务
      await Task.completeTask(taskId, result);
      console.log(`任务执行完成: ${task.title}`);
      
      // 记录任务完成执行日志
      await Task.logExecution(taskId, 'completed', `任务执行完成: ${task.title}`, {
        result: result,
        subtaskCount: task.subtasks ? task.subtasks.length : 0
      });
      
      // 推送任务执行完成消息
      await websocketService.sendTaskUpdate(task.userId, taskId, 'completed', 100, {
        message: `任务执行完成: ${task.title}`
      });
      await websocketService.sendTaskComplete(task.userId, taskId, result);
      
      return result;
    } catch (error) {
      console.error('执行任务失败:', error.message);
      // 标记任务为失败
      await Task.failTask(taskId, error.message);
      
      // 记录任务失败执行日志
      await Task.logExecution(taskId, 'failed', `任务执行失败: ${error.message}`, {
        error: error.message
      });
      
      // 推送任务执行失败消息
      const task = await Task.findById(taskId);
      if (task) {
        await websocketService.sendTaskUpdate(task.userId, taskId, 'failed', 0, {
          message: `任务执行失败: ${error.message}`
        });
        await websocketService.sendTaskError(task.userId, taskId, error.message);
      }
      
      throw error;
    }
  }

  /**
   * 执行下一个子任务
   * @param {ObjectId} taskId - 任务ID
   * @returns {Promise<Object>} 执行结果
   */
  async executeNextSubtask(taskId) {
    try {
      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }
      
      if (task.status !== 'in_progress') {
        throw new Error('任务状态不是执行中');
      }
      
      if (!task.subtasks || task.subtasks.length === 0) {
        throw new Error('任务没有子任务');
      }
      
      const currentIndex = task.currentSubtaskIndex;
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= task.subtasks.length) {
        // 所有子任务已执行完成
        const result = {
          subtasks: task.result?.subtasks || []
        };
        
        await Task.completeTask(taskId, result);
        console.log(`任务执行完成: ${task.title}`);
        
        // 推送任务执行完成消息
        websocketService.sendTaskUpdate(task.userId, taskId, 'completed', 100, {
          message: `任务执行完成: ${task.title}`
        });
        websocketService.sendTaskComplete(task.userId, taskId, result);
        
        return {
          status: 'completed',
          message: '所有子任务已执行完成',
          result: result
        };
      }
      
      // 执行下一个子任务
      const subtask = task.subtasks[nextIndex];
      const subtaskCount = task.subtasks.length;
      
      // 更新当前子任务索引
      await Task.updateCurrentSubtaskIndex(taskId, nextIndex);
      
      // 发送子任务开始执行消息
      await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', 0, {
        message: `开始执行子任务 ${nextIndex + 1}/${subtaskCount}: ${subtask.title}`,
        currentSubtask: nextIndex,
        subtaskTitle: subtask.title,
        subtaskCount: subtaskCount
      });
      
      // 记录子任务开始执行日志
      await Task.logExecution(taskId, 'subtask_started', `开始执行子任务 ${nextIndex + 1}/${subtaskCount}: ${subtask.title}`, {
        currentSubtask: nextIndex,
        subtaskTitle: subtask.title,
        subtaskCount: subtaskCount
      });
      
      try {
        // 执行子任务
        const subtaskResult = await this.executeSubtask(subtask);
        
        // 更新进度
        const totalProgress = Math.round(((nextIndex + 1) / subtaskCount) * 100);
        await Task.updateProgress(taskId, totalProgress);
        await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
          message: `子任务 ${nextIndex + 1}/${subtaskCount}: ${subtask.title} 执行完成`,
          currentSubtask: nextIndex,
          subtaskTitle: subtask.title,
          progress: totalProgress,
          subtaskCount: subtaskCount
        });
        
        // 发送子任务完成通知
        await websocketService.sendSubtaskComplete(task.userId, taskId, nextIndex, subtaskResult);
        
        // 记录子任务完成执行日志
        await Task.logExecution(taskId, 'subtask_completed', `子任务 ${nextIndex + 1}/${subtaskCount}: ${subtask.title} 执行完成`, {
          currentSubtask: nextIndex,
          subtaskTitle: subtask.title,
          progress: totalProgress,
          subtaskCount: subtaskCount,
          subtaskResult: subtaskResult
        });
        
        // 检查是否还有更多子任务
        if (nextIndex + 1 < subtaskCount) {
          // 通知AI可以执行下一个子任务
          await websocketService.sendTaskReadyForSubtask(task.userId, taskId, nextIndex + 1);
          
          // 发送准备执行下一个子任务的消息
          await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', totalProgress, {
            message: `准备执行下一个子任务 ${nextIndex + 2}/${subtaskCount}: ${task.subtasks[nextIndex + 1].title}`,
            nextSubtask: nextIndex + 1,
            nextSubtaskTitle: task.subtasks[nextIndex + 1].title,
            subtaskCount: subtaskCount
          });
        }
        
        return {
          status: 'completed',
          message: `子任务执行完成: ${subtask.title}`,
          result: subtaskResult,
          nextSubtaskIndex: nextIndex + 1 < subtaskCount ? nextIndex + 1 : null
        };
      } catch (error) {
        console.error('执行子任务失败:', error.message);
        
        // 发送子任务失败通知
        await websocketService.sendSubtaskError(task.userId, taskId, nextIndex, error.message);
        
        // 发送失败状态更新
        await websocketService.sendTaskUpdate(task.userId, taskId, 'in_progress', 0, {
          message: `子任务 ${nextIndex + 1}/${subtaskCount}: ${subtask.title} 执行失败: ${error.message}`,
          currentSubtask: nextIndex,
          subtaskTitle: subtask.title,
          error: error.message,
          subtaskCount: subtaskCount
        });
        
        // 记录子任务失败执行日志
        await Task.logExecution(taskId, 'subtask_failed', `子任务 ${nextIndex + 1}/${subtaskCount}: ${subtask.title} 执行失败`, {
          currentSubtask: nextIndex,
          subtaskTitle: subtask.title,
          error: error.message,
          subtaskCount: subtaskCount
        });
        
        return {
          status: 'failed',
          message: `子任务执行失败: ${error.message}`,
          error: error.message
        };
      }
    } catch (error) {
      console.error('执行下一个子任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 执行子任务
   * @param {Object} subtask - 子任务对象
   * @returns {Promise<Object>} 执行结果
   */
  async executeSubtask(subtask) {
    // 执行子任务逻辑
    // 支持工具调用
    if (subtask.toolCall) {
      return await this.executeToolCall(subtask.toolCall);
    } else if (subtask.functionCall) {
      return await this.executeFunctionCall(subtask.functionCall);
    } else {
      // 普通子任务逻辑
      return {
        status: 'completed',
        message: '子任务执行成功',
        data: subtask.params
      };
    }
  }

  /**
   * 执行主任务
   * @param {Object} task - 任务对象
   * @returns {Promise<Object>} 执行结果
   */
  async executeMainTask(task) {
    const { params } = task;
    
    // 主任务逻辑
    return {
      status: 'completed',
      message: '任务执行成功',
      data: params
    };
  }

  /**
   * 执行工具调用
   * @param {Object} toolCall - 工具调用对象
   * @returns {Promise<Object>} 执行结果
   */
  async executeToolCall(toolCall) {
    const { name, arguments: argsStr } = toolCall;
    
    try {
      const args = JSON.parse(argsStr);
      
      // 系统函数处理
      switch (name) {
        case 'getRecentRecords':
          return await this.executeGetRecentRecords(args);
        case 'createRecord':
          return await this.executeCreateRecord(args);
        case 'getRecordList':
          return await this.executeGetRecordList(args);
        case 'updateRecord':
          return await this.executeUpdateRecord(args);
        case 'deleteRecord':
          return await this.executeDeleteRecord(args);
        case 'searchRecords':
          return await this.executeSearchRecords(args);
        case 'createTask':
          return await this.executeCreateTask(args);
        case 'executeTask':
          return await this.executeExecuteTask(args);
        case 'getTaskList':
          return await this.executeGetTaskList(args);
        case 'getTask':
          return await this.executeGetTask(args);
        
        // 模型工具处理
        case 'web_search':
        case 'Web_Search':
          return await this.executeWebSearch(args);
        case 'image_process':
        case 'Image_Process':
          return await this.executeImageProcess(args);
        case 'video_process':
        case 'Video_Process':
          return await this.executeVideoProcess(args);
        case 'file_process':
        case 'File_Process':
          return await this.executeFileProcess(args);
        
        default:
          return {
            status: 'completed',
            message: `工具调用执行成功: ${name}`,
            result: args
          };
      }
    } catch (error) {
      return {
        status: 'failed',
        message: `工具调用执行失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行函数调用
   * @param {Object} functionCall - 函数调用对象
   * @returns {Promise<Object>} 执行结果
   */
  async executeFunctionCall(functionCall) {
    // 函数调用逻辑
    // 这里可以根据具体的函数名称执行不同的逻辑
    return {
      status: 'completed',
      message: `函数调用执行成功: ${functionCall.name}`,
      result: functionCall.result
    };
  }

  // ==================== 系统函数实现 ====================

  /**
   * 执行获取最近记录
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeGetRecentRecords(args) {
    try {
      const Record = require('../models/Record');
      const records = await Record.find({ userId: this.currentUserId })
        .sort({ createdAt: -1 })
        .limit(args.limit || 5)
        .exec();
      
      return {
        status: 'completed',
        message: '获取最近记录成功',
        result: {
          count: records.length,
          records: records.map(record => ({
            id: record._id,
            title: record.title || record.summary || '无标题',
            type: record.type,
            status: record.status,
            tags: record.tags,
            content: record.content,
            createdAt: record.createdAt
          }))
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `获取最近记录失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行创建记录
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeCreateRecord(args) {
    try {
      const Record = require('../models/Record');
      const record = new Record({
        userId: this.currentUserId,
        type: args.type,
        title: args.title,
        content: args.content,
        tags: args.tags || [],
        status: args.status || 'pending'
      });
      await record.save();
      
      return {
        status: 'completed',
        message: '创建记录成功',
        result: {
          recordId: record._id,
          title: record.title,
          type: record.type,
          status: record.status
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `创建记录失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行获取记录列表
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeGetRecordList(args) {
    try {
      const Record = require('../models/Record');
      const query = { userId: this.currentUserId };
      
      if (args.type) query.type = args.type;
      if (args.status) query.status = args.status;
      if (args.tags && args.tags.length > 0) query.tags = { $in: args.tags };
      
      const records = await Record.find(query)
        .sort({ createdAt: -1 })
        .skip(((args.page || 1) - 1) * (args.limit || 20))
        .limit(args.limit || 20)
        .exec();
      
      return {
        status: 'completed',
        message: '获取记录列表成功',
        result: {
          count: records.length,
          records: records.map(record => ({
            id: record._id,
            title: record.title || record.summary || '无标题',
            type: record.type,
            status: record.status,
            tags: record.tags,
            content: record.content,
            createdAt: record.createdAt
          }))
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `获取记录列表失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行更新记录
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeUpdateRecord(args) {
    try {
      const Record = require('../models/Record');
      const updateData = {};
      
      if (args.title) updateData.title = args.title;
      if (args.content) updateData.content = args.content;
      if (args.type) updateData.type = args.type;
      if (args.status) updateData.status = args.status;
      if (args.tags) updateData.tags = args.tags;
      if (args.link) updateData.link = args.link;
      
      const record = await Record.findOneAndUpdate(
        { _id: args.recordId, userId: this.currentUserId },
        updateData,
        { new: true }
      );
      
      if (!record) {
        return {
          status: 'failed',
          message: '记录不存在',
          error: '记录不存在'
        };
      }
      
      return {
        status: 'completed',
        message: '更新记录成功',
        result: {
          recordId: record._id,
          title: record.title,
          type: record.type,
          status: record.status
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `更新记录失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行删除记录
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeDeleteRecord(args) {
    try {
      const Record = require('../models/Record');
      const record = await Record.findOneAndDelete({
        _id: args.recordId,
        userId: this.currentUserId
      });
      
      if (!record) {
        return {
          status: 'failed',
          message: '记录不存在',
          error: '记录不存在'
        };
      }
      
      return {
        status: 'completed',
        message: '删除记录成功',
        result: {
          recordId: args.recordId
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `删除记录失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行搜索记录
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeSearchRecords(args) {
    try {
      const Record = require('../models/Record');
      const query = {
        userId: this.currentUserId,
        $or: [
          { title: { $regex: args.keyword, $options: 'i' } },
          { content: { $regex: args.keyword, $options: 'i' } },
          { tags: { $regex: args.keyword, $options: 'i' } }
        ]
      };
      
      const records = await Record.find(query)
        .sort({ createdAt: -1 })
        .limit(args.limit || 10)
        .exec();
      
      return {
        status: 'completed',
        message: '搜索记录成功',
        result: {
          count: records.length,
          records: records.map(record => ({
            id: record._id,
            title: record.title || record.summary || '无标题',
            type: record.type,
            status: record.status,
            tags: record.tags,
            content: record.content,
            createdAt: record.createdAt
          }))
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `搜索记录失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行创建任务
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeCreateTask(args) {
    try {
      const task = await this.createTask(this.currentUserId, {
        title: args.title,
        description: args.description,
        params: args.params || {},
        subtasks: args.subtasks || [],
        sessionId: args.sessionId
      });
      
      return {
        status: 'completed',
        message: '创建任务成功',
        result: {
          taskId: task._id,
          title: task.title,
          status: task.status
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `创建任务失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行执行任务
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeExecuteTask(args) {
    try {
      const taskQueueService = require('./taskQueueService');
      const queueResult = await taskQueueService.addTask(args.taskId);
      
      return {
        status: 'completed',
        message: '执行任务成功',
        result: {
          taskId: args.taskId,
          status: queueResult.status,
          queueLength: queueResult.queueLength
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `执行任务失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行获取任务列表
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeGetTaskList(args) {
    try {
      const tasks = await this.getUserTasks(this.currentUserId, {
        status: args.status,
        limit: args.limit || 20
      });
      
      return {
        status: 'completed',
        message: '获取任务列表成功',
        result: {
          count: tasks.length,
          tasks: tasks.map(task => ({
            id: task._id,
            title: task.title,
            status: task.status,
            progress: task.progress,
            createdAt: task.createdAt
          }))
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `获取任务列表失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行获取任务详情
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeGetTask(args) {
    try {
      const task = await this.getTaskDetail(args.taskId, this.currentUserId);
      
      if (!task) {
        return {
          status: 'failed',
          message: '任务不存在',
          error: '任务不存在'
        };
      }
      
      return {
        status: 'completed',
        message: '获取任务详情成功',
        result: {
          task: {
            id: task._id,
            title: task.title,
            status: task.status,
            progress: task.progress,
            description: task.description,
            subtasks: task.subtasks,
            result: task.result,
            error: task.error,
            createdAt: task.createdAt
          }
        }
      };
    } catch (error) {
      return {
        status: 'failed',
        message: `获取任务详情失败: ${error.message}`,
        error: error.message
      };
    }
  }

  // ==================== 模型工具实现 ====================

  /**
   * 执行网络搜索
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeWebSearch(args) {
    try {
      // 导入doubaoAdapter
      const DoubaoAdapter = require('../models/doubaoAdapter');
      const config = require('../config');
      const doubaoAdapter = new DoubaoAdapter(config.aiModels.doubao);
      
      // 执行真实的网络搜索
      const searchQuery = args.query;
      if (!searchQuery) {
        throw new Error('搜索查询不能为空');
      }
      
      console.log('执行真实网络搜索:', {
        query: searchQuery,
        limit: args.limit || 5
      });
      
      // 调用doubaoAdapter的webSearchWithContext方法
      const searchResult = await doubaoAdapter.webSearchWithContext(searchQuery);
      
      return {
        status: 'completed',
        message: '网络搜索执行成功',
        result: {
          query: searchQuery,
          limit: args.limit || 5,
          searchResult: searchResult,
          message: '网络搜索已通过豆包模型的原生搜索能力执行',
          note: '豆包1.8通过responses API原生支持网络搜索'
        }
      };
    } catch (error) {
      console.error('网络搜索失败:', error.message);
      return {
        status: 'failed',
        message: `网络搜索失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行图像处理
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeImageProcess(args) {
    try {
      // 导入doubaoAdapter
      const DoubaoAdapter = require('../models/doubaoAdapter');
      const config = require('../config');
      const doubaoAdapter = new DoubaoAdapter(config.aiModels.doubao);
      
      // 执行真实的图像处理
      const imageUrl = args.imageUrl;
      if (!imageUrl) {
        throw new Error('图片URL不能为空');
      }
      
      console.log('执行真实图像处理:', {
        imageUrl: imageUrl,
        task: args.task || 'content_recognition',
        detailLevel: args.detailLevel || 'high'
      });
      
      // 调用doubaoAdapter的processImage方法
      const imageResult = await doubaoAdapter.processImage(imageUrl, args.prompt || '');
      
      return {
        status: 'completed',
        message: '图像处理执行成功',
        result: {
          imageUrl: imageUrl,
          task: args.task || 'content_recognition',
          detailLevel: args.detailLevel || 'high',
          imageResult: imageResult,
          message: '图像处理已通过豆包模型的原生图像处理能力执行',
          note: '豆包1.8通过responses API原生支持图像处理'
        }
      };
    } catch (error) {
      console.error('图像处理失败:', error.message);
      return {
        status: 'failed',
        message: `图像处理失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行视频处理
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeVideoProcess(args) {
    try {
      // 导入doubaoAdapter
      const DoubaoAdapter = require('../models/doubaoAdapter');
      const config = require('../config');
      const doubaoAdapter = new DoubaoAdapter(config.aiModels.doubao);
      
      // 执行真实的视频处理
      const videoUrl = args.videoUrl;
      if (!videoUrl) {
        throw new Error('视频URL不能为空');
      }
      
      console.log('执行真实视频处理:', {
        videoUrl: videoUrl,
        task: args.task || 'content_recognition',
        detailLevel: args.detailLevel || 'high'
      });
      
      // 调用doubaoAdapter的processVideo方法
      const videoResult = await doubaoAdapter.processVideo(videoUrl, args.prompt || '');
      
      return {
        status: 'completed',
        message: '视频处理执行成功',
        result: {
          videoUrl: videoUrl,
          task: args.task || 'content_recognition',
          detailLevel: args.detailLevel || 'high',
          videoResult: videoResult,
          message: '视频处理已通过豆包模型的原生视频处理能力执行',
          note: '豆包1.8通过responses API原生支持视频处理'
        }
      };
    } catch (error) {
      console.error('视频处理失败:', error.message);
      return {
        status: 'failed',
        message: `视频处理失败: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 执行文件处理
   * @param {Object} args - 参数
   * @returns {Promise<Object>} 执行结果
   */
  async executeFileProcess(args) {
    try {
      // 导入doubaoAdapter
      const DoubaoAdapter = require('../models/doubaoAdapter');
      const config = require('../config');
      const doubaoAdapter = new DoubaoAdapter(config.aiModels.doubao);
      
      // 执行真实的文件处理
      const fileUrl = args.fileUrl;
      if (!fileUrl) {
        throw new Error('文件URL不能为空');
      }
      
      console.log('执行真实文件处理:', {
        fileUrl: fileUrl,
        task: args.task || 'content_extraction',
        detailLevel: args.detailLevel || 'high'
      });
      
      // 调用doubaoAdapter的processFile方法
      const fileResult = await doubaoAdapter.processFile(fileUrl, args.prompt || '');
      
      return {
        status: 'completed',
        message: '文件处理执行成功',
        result: {
          fileUrl: fileUrl,
          task: args.task || 'content_extraction',
          detailLevel: args.detailLevel || 'high',
          fileResult: fileResult,
          message: '文件处理已通过豆包模型的原生文件处理能力执行',
          note: '豆包1.8通过responses API原生支持文件处理'
        }
      };
    } catch (error) {
      console.error('文件处理失败:', error.message);
      return {
        status: 'failed',
        message: `文件处理失败: ${error.message}`,
        error: error.message
      };
    }
  }



  /**
   * 获取用户的任务列表
   * @param {ObjectId} userId - 用户ID
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 任务列表
   */
  async getUserTasks(userId, filters = {}) {
    try {
      const query = {
        userId
      };

      // 添加筛选条件
      if (filters.status) {
        query.status = filters.status;
      }

      // 执行查询
      const tasks = await Task.find(query)
        .populate('feedback')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);

      return tasks;
    } catch (error) {
      console.error('获取用户任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取任务详情
   * @param {ObjectId} taskId - 任务ID
   * @param {ObjectId} userId - 用户ID
   * @returns {Promise<Object>} 任务详情
   */
  async getTaskDetail(taskId, userId) {
    try {
      const task = await Task.findOne({ _id: taskId, userId }).populate('feedback');
      if (!task) {
        throw new TaskNotFoundError('任务不存在');
      }
      return task;
    } catch (error) {
      console.error('获取任务详情失败:', error.message);
      throw error;
    }
  }

  /**
   * 取消任务
   * @param {ObjectId} taskId - 任务ID
   * @param {ObjectId} userId - 用户ID
   * @returns {Promise<Object>} 取消结果
   */
  async cancelTask(taskId, userId) {
    try {
      // 验证任务存在且属于该用户
      const task = await Task.findOne({ _id: taskId, userId });
      if (!task) {
        throw new TaskNotFoundError('任务不存在');
      }

      // 只有待处理的任务可以取消
      if (task.status !== 'pending') {
        throw new TaskValidationError('只有待处理的任务可以取消');
      }

      // 取消任务
      await Task.cancelTask(taskId);
      return { success: true, message: '任务已取消' };
    } catch (error) {
      console.error('取消任务失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新用户反馈
   * @param {ObjectId} taskId - 任务ID
   * @param {ObjectId} userId - 用户ID
   * @param {Object} feedback - 反馈信息
   * @returns {Promise<Object>} 更新结果
   */
  async updateFeedback(taskId, userId, feedback) {
    try {
      // 验证任务存在且属于该用户
      const task = await Task.findOne({ _id: taskId, userId });
      if (!task) {
        throw new TaskNotFoundError('任务不存在');
      }

      // 只有已完成的任务可以添加反馈
      if (task.status !== 'completed') {
        throw new TaskValidationError('只有已完成的任务可以添加反馈');
      }

      // 验证反馈数据
      if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
        throw new TaskValidationError('评分必须在1-5之间');
      }

      // 创建新的反馈记录
      const newFeedback = new TaskFeedback({
        taskId,
        userId,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating,
        content: feedback.content,
        improvementSuggestions: feedback.improvementSuggestions,
        problemSolved: feedback.problemSolved
      });

      // 保存反馈记录
      const savedFeedback = await newFeedback.save();

      // 更新任务的反馈引用
      await Task.updateFeedback(taskId, savedFeedback._id);
      return { success: true, message: '反馈提交成功', data: savedFeedback };
    } catch (error) {
      console.error('更新反馈失败:', error.message);
      throw error;
    }
  }
}

module.exports = new TaskService();