/**
 * WebSocket服务
 * 封装WebSocket通知功能
 */

let io = null;
let socketConnections = null;
let isProduction = process.env.NODE_ENV === 'production';
let messageQueue = new Map(); // 消息队列，按用户ID分组
let messagePriorities = {
  'task_error': 1,           // 最高优先级
  'subtask_error': 1,
  'function_error': 1,        // 函数执行错误
  'task_complete': 2,
  'subtask_complete': 2,
  'task_update': 3,
  'task_ready_for_subtask': 3,
  'tool_execution_start': 3, // 工具执行开始通知
  'record_created': 4,
  'record_updated': 4,
  'record_deleted': 4,
  'batch_task_complete': 5,  // 最低优先级
};
let maxRetries = 3; // 最大重试次数
let retryDelay = 1000; // 重试延迟（毫秒）

// 消息优先级排序函数
const sortMessagesByPriority = (messages) => {
  return messages.sort((a, b) => {
    const priorityA = messagePriorities[a.event] || 999;
    const priorityB = messagePriorities[b.event] || 999;
    return priorityA - priorityB;
  });
};

// 初始化WebSocket服务
const initWebSocketService = (serverIo, connections) => {
  io = serverIo;
  socketConnections = connections;
  
  // 设置生产环境日志级别
  if (!isProduction) {
    console.log('WebSocket服务初始化完成');
  }
  
  // 监听服务器状态
  if (io) {
    io.on('error', (error) => {
      console.error('WebSocket服务器错误:', error);
    });
    
    io.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error);
    });
  }
};

// 通用发送通知函数
const sendNotification = async (userId, event, data, logMessage) => {
  if (!io || !socketConnections) {
    if (!isProduction) {
      console.warn('WebSocket服务未初始化，无法发送通知');
    }
    return false;
  }

  const userIdStr = typeof userId === 'string' ? userId : userId.toString();
  
  // 尝试发送消息，支持重试
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const socketId = socketConnections.get(userIdStr);
    
    if (socketId) {
      try {
        io.to(socketId).emit(event, {
          ...data,
          timestamp: data.timestamp || new Date()
        });
        
        if (!isProduction && logMessage) {
          console.log(`已发送${logMessage}给用户 ${userIdStr} (尝试 ${attempt}/${maxRetries})`);
        }
        return true;
      } catch (error) {
        console.error(`发送WebSocket通知失败 (尝试 ${attempt}/${maxRetries}):`, error);
        
        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // 所有重试都失败，将消息加入队列
          queueMessage(userIdStr, event, data, logMessage);
          return false;
        }
      }
    } else {
      if (!isProduction) {
        console.warn('未找到用户的socketId，将消息加入队列:', { userId: userIdStr });
      }
      // 未找到socketId，将消息加入队列
      queueMessage(userIdStr, event, data, logMessage);
      return false;
    }
  }
};

// 将消息加入队列
const queueMessage = (userIdStr, event, data, logMessage) => {
  if (!messageQueue.has(userIdStr)) {
    messageQueue.set(userIdStr, []);
  }
  
  const userQueue = messageQueue.get(userIdStr);
  userQueue.push({ event, data, logMessage, timestamp: new Date() });
  
  // 按优先级排序队列
  const sortedQueue = sortMessagesByPriority(userQueue);
  messageQueue.set(userIdStr, sortedQueue);
  
  if (!isProduction) {
    console.log(`消息已加入队列，用户 ${userIdStr} 的队列长度: ${sortedQueue.length}`);
  }
};

// 处理用户队列中的消息
const processUserQueue = async (userIdStr) => {
  const userQueue = messageQueue.get(userIdStr);
  if (!userQueue || userQueue.length === 0) return;
  
  const socketId = socketConnections.get(userIdStr);
  if (!socketId) return;
  
  // 按优先级顺序处理消息
  const sortedQueue = sortMessagesByPriority(userQueue);
  
  for (let i = 0; i < sortedQueue.length; i++) {
    const message = sortedQueue[i];
    try {
      io.to(socketId).emit(message.event, {
        ...message.data,
        timestamp: message.data.timestamp || new Date()
      });
      
      if (!isProduction && message.logMessage) {
        console.log(`已从队列发送${message.logMessage}给用户 ${userIdStr}`);
      }
      
      // 从队列中移除已发送的消息
      userQueue.shift();
    } catch (error) {
      console.error(`处理队列消息失败:`, error);
      break; // 停止处理队列，避免连续失败
    }
  }
  
  // 更新队列状态
  if (userQueue.length === 0) {
    messageQueue.delete(userIdStr);
  } else {
    messageQueue.set(userIdStr, userQueue);
  }
};

// 处理所有队列中的消息
const processAllQueues = () => {
  for (const userIdStr of messageQueue.keys()) {
    processUserQueue(userIdStr);
  }
};

// 发送任务状态更新通知
const sendTaskStatusUpdate = async (userId, task) => {
  return await sendNotification(userId, 'task_status_update', {
    taskId: task._id,
    status: task.status,
    progress: task.progress,
    title: task.title,
    updatedAt: task.updatedAt
  }, `任务状态更新通知: ${task.status}`);
};

// 发送任务执行结果通知
const sendTaskExecutionResult = async (userId, task, result) => {
  return await sendNotification(userId, 'task_execution_result', {
    taskId: task._id,
    status: task.status,
    title: task.title,
    result,
    updatedAt: task.updatedAt
  }, '任务执行结果通知');
};

// 发送批量任务执行完成通知
const sendBatchTaskComplete = async (userId, results) => {
  return await sendNotification(userId, 'batch_task_complete', {
    results,
    completedAt: new Date()
  }, '批量任务执行完成通知');
};

// 发送任务更新通知（兼容taskService.js中的调用）
const sendTaskUpdate = async (userId, taskId, status, progress, data) => {
  return await sendNotification(userId, 'task_update', {
    taskId,
    status,
    progress,
    data
  }, `任务更新通知: ${status} ${progress}`);
};

// 发送任务完成通知（兼容taskService.js中的调用）
const sendTaskComplete = async (userId, taskId, result) => {
  return await sendNotification(userId, 'task_complete', {
    taskId,
    result
  }, '任务完成通知');
};

// 发送子任务完成通知
const sendSubtaskComplete = async (userId, taskId, subtaskIndex, result) => {
  return await sendNotification(userId, 'subtask_complete', {
    taskId,
    subtaskIndex,
    result
  }, `子任务完成通知: 子任务 ${subtaskIndex}`);
};

// 发送子任务失败通知
const sendSubtaskError = async (userId, taskId, subtaskIndex, error) => {
  return await sendNotification(userId, 'subtask_error', {
    taskId,
    subtaskIndex,
    error
  }, `子任务失败通知: 子任务 ${subtaskIndex}`);
};

// 发送任务准备执行子任务通知
const sendTaskReadyForSubtask = async (userId, taskId, subtaskIndex) => {
  return await sendNotification(userId, 'task_ready_for_subtask', {
    taskId,
    subtaskIndex
  }, `任务准备执行子任务通知: 子任务 ${subtaskIndex}`);
};

// 发送任务错误通知（兼容taskService.js中的调用）
const sendTaskError = async (userId, taskId, errorMessage) => {
  return await sendNotification(userId, 'task_error', {
    taskId,
    error: errorMessage
  }, '任务错误通知');
};

// 发送记录创建通知
const sendRecordCreated = async (userId, record) => {
  return await sendNotification(userId, 'record_created', {
    record: {
      id: record._id,
      title: record.title,
      type: record.type,
      status: record.status,
      tags: record.tags,
      summary: record.summary,
      createdAt: record.createdAt
    }
  }, `记录创建通知: ${record.title}`);
};

// 发送记录更新通知
const sendRecordUpdated = async (userId, record) => {
  return await sendNotification(userId, 'record_updated', {
    record: {
      id: record._id,
      title: record.title,
      type: record.type,
      status: record.status,
      tags: record.tags,
      summary: record.summary,
      updatedAt: record.updatedAt
    }
  }, `记录更新通知: ${record.title}`);
};

// 发送记录删除通知
const sendRecordDeleted = async (userId, recordId) => {
  return await sendNotification(userId, 'record_deleted', {
    recordId
  }, `记录删除通知: ${recordId}`);
};

// 发送工具执行开始通知
const sendToolExecutionStart = async (userId, toolData) => {
  return await sendNotification(userId, 'tool_execution_start', {
    functionName: toolData.functionName,
    functionArgs: toolData.functionArgs,
    sessionId: toolData.sessionId,
    timestamp: new Date()
  }, `工具执行开始通知: ${toolData.functionName}`);
};

// 发送函数执行错误通知
const sendFunctionErrorNotification = async (userId, functionName, errorMessage) => {
  return await sendNotification(userId, 'function_error', {
    functionName,
    error: errorMessage,
    timestamp: new Date()
  }, `函数执行错误通知: ${functionName}`);
};

// 获取当前连接状态
const getConnectionStatus = () => {
  return {
    initialized: !!io && !!socketConnections,
    connectionCount: socketConnections ? socketConnections.size : 0,
    messageQueueSize: messageQueue.size,
    totalQueuedMessages: Array.from(messageQueue.values()).reduce((total, queue) => total + queue.length, 0)
  };
};

// 清理断开的连接
const cleanupConnections = () => {
  if (!socketConnections) return;
  
  // 处理所有队列中的消息
  processAllQueues();
  
  // 清理过期的消息队列（超过5分钟的队列）
  const now = new Date();
  const maxQueueAge = 5 * 60 * 1000; // 5分钟
  
  for (const [userIdStr, queue] of messageQueue.entries()) {
    if (queue.length > 0) {
      const oldestMessage = queue[0];
      if (now - oldestMessage.timestamp > maxQueueAge) {
        messageQueue.delete(userIdStr);
        if (!isProduction) {
          console.log(`清理过期的消息队列: ${userIdStr}`);
        }
      }
    } else {
      messageQueue.delete(userIdStr);
    }
  }
  
  if (!isProduction) {
    console.log(`当前WebSocket连接数: ${socketConnections.size}`);
    console.log(`当前消息队列数: ${messageQueue.size}`);
  }
};

module.exports = {
  initWebSocketService,
  sendTaskStatusUpdate,
  sendTaskExecutionResult,
  sendBatchTaskComplete,
  sendTaskUpdate,
  sendTaskComplete,
  sendTaskError,
  sendSubtaskComplete,
  sendSubtaskError,
  sendTaskReadyForSubtask,
  sendRecordCreated,
  sendRecordUpdated,
  sendRecordDeleted,
  sendToolExecutionStart,
  sendFunctionErrorNotification,
  getConnectionStatus,
  cleanupConnections,
  processUserQueue,
  processAllQueues,
  getMessageQueueSize: () => messageQueue.size,
  getTotalQueuedMessages: () => Array.from(messageQueue.values()).reduce((total, queue) => total + queue.length, 0)
};

