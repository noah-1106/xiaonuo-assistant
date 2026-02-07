/**
 * 任务队列服务
 * 实现异步任务处理，解决长时间运行任务的超时问题
 */
const Task = require('../models/Task');
const websocketService = require('./websocketService');

class TaskQueueService {
  constructor() {
    this.queue = []; // 任务队列
    this.processing = false; // 是否正在处理任务
    this.concurrency = 2; // 并发处理数
    this.processingTasks = new Set(); // 正在处理的任务ID集合
    this.taskTimeouts = new Map(); // 存储任务超时定时器
    this.asyncTimeout = 200000; // 异步任务超时时间：200秒
    
    console.log('任务队列服务初始化完成', {
      asyncTimeout: this.asyncTimeout
    });
  }

  /**
   * 添加任务到队列
   * @param {ObjectId} taskId - 任务ID
   * @returns {Promise<Object>} 任务添加结果
   */
  async addTask(taskId) {
    try {
      // 检查任务是否已在队列中
      if (this.queue.includes(taskId) || this.processingTasks.has(taskId)) {
        return {
          success: false,
          message: '任务已在队列中或正在处理',
          status: 'queued'
        };
      }

      // 添加任务到队列
      this.queue.push(taskId);
      console.log(`任务已添加到队列: ${taskId}`);

      // 启动任务处理
      this.processQueue();

      return {
        success: true,
        message: '任务已添加到队列',
        status: 'queued',
        queueLength: this.queue.length
      };
    } catch (error) {
      console.error('添加任务到队列失败:', error.message);
      throw error;
    }
  }

  /**
   * 处理任务队列
   */
  async processQueue() {
    // 如果已经在处理或者队列为空，直接返回
    if (this.processing || this.queue.length === 0) {
      return;
    }

    // 如果正在处理的任务数达到并发限制，直接返回
    if (this.processingTasks.size >= this.concurrency) {
      return;
    }

    this.processing = true;

    try {
      // 从队列中取出一个任务
      const taskId = this.queue.shift();
      
      // 标记任务为正在处理
      this.processingTasks.add(taskId);
      console.log(`开始处理任务: ${taskId}, 队列长度: ${this.queue.length}`);

      // 执行任务
      await this.executeTask(taskId);
    } catch (error) {
      console.error('处理任务队列失败:', error.message);
    } finally {
      this.processing = false;
      // 继续处理下一个任务
      this.processQueue();
    }
  }

  /**
   * 执行单个任务
   * @param {ObjectId} taskId - 任务ID
   */
  async executeTask(taskId) {
    try {
      // 设置任务超时定时器
      const timeoutId = setTimeout(async () => {
        console.error(`任务执行超时: ${taskId}`);
        
        // 更新任务状态为失败
        try {
          const task = await Task.findById(taskId);
          if (task) {
            await Task.failTask(taskId, `任务执行超时（超过${this.asyncTimeout/1000}秒）`);
            
            // 推送任务失败消息
            websocketService.sendTaskUpdate(task.userId, taskId, 'failed', 0, {
              message: `任务执行超时: 超过${this.asyncTimeout/1000}秒`
            });
            websocketService.sendTaskError(task.userId, taskId, `任务执行超时（超过${this.asyncTimeout/1000}秒）`);
          }
        } catch (updateError) {
          console.error('更新任务超时状态失败:', updateError.message);
        } finally {
          // 清理资源
          this.processingTasks.delete(taskId);
          this.taskTimeouts.delete(taskId);
          this.processQueue();
        }
      }, this.asyncTimeout);
      
      // 存储超时定时器ID
      this.taskTimeouts.set(taskId, timeoutId);
      
      const taskService = require('./taskService');
      
      // 执行任务
      await taskService.executeTask(taskId);
    } catch (error) {
      console.error(`执行任务失败 ${taskId}:`, error.message);
      
      // 更新任务状态为失败
      try {
        const task = await Task.findById(taskId);
        if (task) {
          await Task.failTask(taskId, error.message);
          
          // 推送任务失败消息
          websocketService.sendTaskUpdate(task.userId, taskId, 'failed', 0, {
            message: `任务执行失败: ${error.message}`
          });
          websocketService.sendTaskError(task.userId, taskId, error.message);
        }
      } catch (updateError) {
        console.error('更新任务失败状态失败:', updateError.message);
      }
    } finally {
      // 清除超时定时器
      const timeoutId = this.taskTimeouts.get(taskId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.taskTimeouts.delete(taskId);
      }
      
      // 从正在处理的任务集合中移除
      this.processingTasks.delete(taskId);
      console.log(`任务处理完成: ${taskId}`);
      
      // 继续处理下一个任务
      this.processQueue();
    }
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processingCount: this.processingTasks.size,
      concurrency: this.concurrency,
      queue: this.queue.slice(),
      processingTasks: Array.from(this.processingTasks),
      asyncTimeout: this.asyncTimeout,
      taskTimeouts: Array.from(this.taskTimeouts.keys())
    };
  }

  /**
   * 移除任务
   * @param {ObjectId} taskId - 任务ID
   * @returns {boolean} 是否成功移除
   */
  removeTask(taskId) {
    const index = this.queue.indexOf(taskId);
    if (index > -1) {
      this.queue.splice(index, 1);
      console.log(`任务已从队列中移除: ${taskId}`);
      return true;
    }
    
    // 检查是否是正在处理的任务
    if (this.processingTasks.has(taskId)) {
      // 清除超时定时器
      const timeoutId = this.taskTimeouts.get(taskId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.taskTimeouts.delete(taskId);
      }
      this.processingTasks.delete(taskId);
      console.log(`任务已从处理中移除: ${taskId}`);
      return true;
    }
    
    return false;
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.queue = [];
    
    // 清除所有处理中任务的超时定时器
    for (const [taskId, timeoutId] of this.taskTimeouts.entries()) {
      clearTimeout(timeoutId);
      console.log(`清除任务超时定时器: ${taskId}`);
    }
    
    this.taskTimeouts.clear();
    this.processingTasks.clear();
    
    console.log('任务队列已清空');
  }

  /**
   * 设置并发数
   * @param {number} concurrency - 并发数
   */
  setConcurrency(concurrency) {
    if (concurrency > 0) {
      this.concurrency = concurrency;
      console.log(`并发数已设置为: ${concurrency}`);
      
      // 重新开始处理队列
      this.processQueue();
    }
  }
}

module.exports = new TaskQueueService();