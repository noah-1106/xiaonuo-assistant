/**
 * WebSocket服务
 * 封装WebSocket连接和消息处理功能
 */

import { io, Socket } from 'socket.io-client'

class WebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false
  private messageHandlers: Map<string, Array<(data: any) => void>> = new Map()
  private userId: string | null = null
  private token: string | null = null

  /**
   * 初始化WebSocket连接
   */
  init(userId: string, token: string): void {
    this.userId = userId
    this.token = token
    this.connect()
  }

  /**
   * 建立WebSocket连接
   */
  private connect(): void {
    if (this.socket && this.isConnected) {
      return
    }

    try {
      // 使用socket.io-client连接后端socket.io服务器
      // 根据环境变量动态构建WebSocket连接地址
      let wsUrl = ''
      
      if (import.meta.env.VITE_API_BASE_URL) {
        // 从API基础URL中提取WebSocket服务器地址
        const apiUrl = import.meta.env.VITE_API_BASE_URL
        if (apiUrl.startsWith('http')) {
          // 如果API基础URL是完整URL，直接使用（去掉/api路径）
          wsUrl = apiUrl.replace('/api', '')
        } else {
          // 如果是相对路径，使用当前域名和协议，不硬编码端口
          // 这样在生产环境中会通过Nginx代理到后端
          const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
          const host = window.location.host
          wsUrl = `${protocol}//${host}`
        }
      } else {
        // 默认使用本地开发地址
        wsUrl = 'http://localhost:3001'
      }
      
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        reconnection: false, // 禁用自动重连，使用自定义重连逻辑
        path: '/socket.io', // 指定socket.io路径
        withCredentials: true // 允许携带凭证
      })

      this.socket.on('connect', () => {
        console.log('WebSocket连接已建立')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.authenticate()
      })

      this.socket.on('message', (data) => {
        this.handleMessage(data)
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket连接已关闭')
        this.isConnected = false
        this.attemptReconnect()
      })

      this.socket.on('error', (error) => {
        console.error('WebSocket错误:', error)
        this.isConnected = false
      })

      this.socket.on('authenticated', () => {
        console.log('WebSocket认证成功')
      })

      this.socket.on('authentication_error', (data) => {
        console.error('WebSocket认证失败:', data.message)
      })

      this.socket.on('task_update', (data) => {
        this.notifyHandlers('task_update', data)
      })

      this.socket.on('task_complete', (data) => {
        this.notifyHandlers('task_complete', data)
      })

      this.socket.on('task_error', (data) => {
        this.notifyHandlers('task_error', data)
      })

      this.socket.on('task_status_update', (data) => {
        this.notifyHandlers('task_status_update', data)
      })

      this.socket.on('task_execution_result', (data) => {
        this.notifyHandlers('task_execution_result', data)
      })

      this.socket.on('batch_task_complete', (data) => {
        this.notifyHandlers('batch_task_complete', data)
      })

      // 子任务相关事件
      this.socket.on('subtask_complete', (data) => {
        this.notifyHandlers('subtask_complete', data)
      })

      this.socket.on('subtask_error', (data) => {
        this.notifyHandlers('subtask_error', data)
      })

      this.socket.on('task_ready_for_subtask', (data) => {
        this.notifyHandlers('task_ready_for_subtask', data)
      })

      // 记录相关事件
      this.socket.on('record_created', (data) => {
        this.notifyHandlers('record_created', data)
      })

      this.socket.on('record_updated', (data) => {
        this.notifyHandlers('record_updated', data)
      })

      this.socket.on('record_deleted', (data) => {
        this.notifyHandlers('record_deleted', data)
      })

      // 聊天消息相关事件
      this.socket.on('new_chat_message', (data) => {
        this.notifyHandlers('new_chat_message', data)
      })

      // 工具执行开始事件
      this.socket.on('tool_execution_start', (data) => {
        this.notifyHandlers('tool_execution_start', data)
      })

      // 函数执行错误事件
      this.socket.on('function_error', (data) => {
        this.notifyHandlers('function_error', data)
      })
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.attemptReconnect()
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重连... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)) // 指数退避
    } else {
      console.error('WebSocket重连失败，已达到最大尝试次数')
    }
  }

  /**
   * 发送认证消息
   */
  private authenticate(): void {
    if (this.socket && this.isConnected && this.userId && this.token) {
      this.socket.emit('authenticate', {
        userId: this.userId,
        token: this.token
      })
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(data: any): void {
    try {
      console.log('接收到WebSocket消息:', data)
    } catch (error) {
      console.error('处理WebSocket消息失败:', error)
    }
  }

  /**
   * 注册消息处理器
   */
  on(event: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, [])
    }
    this.messageHandlers.get(event)?.push(handler)
  }

  /**
   * 移除消息处理器
   */
  off(event: string, handler: (data: any) => void): void {
    const handlers = this.messageHandlers.get(event)
    if (handlers) {
      this.messageHandlers.set(event, handlers.filter(h => h !== handler))
    }
  }

  /**
   * 通知所有处理器
   */
  private notifyHandlers(event: string, data: any): void {
    const handlers = this.messageHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`处理${event}消息失败:`, error)
        }
      })
    }
  }

  /**
   * 发送消息
   */
  send(type: string, data: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit(type, data)
    } else {
      console.error('WebSocket未连接，无法发送消息')
    }
  }

  /**
   * 关闭WebSocket连接
   */
  close(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.reconnectAttempts = 0
      console.log('WebSocket连接已手动关闭')
    }
  }

  /**
   * 检查WebSocket连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// 导出单例
const websocketService = new WebSocketService()
export default websocketService
