import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Message, UploadedFile, UploadedRecord } from '../types'
import { useRecord } from './RecordContext'
import { API_BASE_URL } from '../utils/env'
import websocketService from '../services/websocketService'

// 定义错误类型
interface ChatError {
  code: string
  message: string
}

// 会话类型定义
export interface ChatSession {
  sessionId: string
  title: string
  lastMessage: string
  messageCount: number
  isActive: boolean
  roles: {
    baseRole: string
    enhancedRole: string | null
  }
  createdAt: string
  updatedAt: string
}

interface ChatContextType {
  // 消息相关
  messages: Message[]
  inputValue: string
  isLoading: boolean
  uploadedFiles: UploadedFile[]
  uploadedRecords: UploadedRecord[]
  error: ChatError | null
  setInputValue: (value: string) => void
  setUploadedFiles: (files: UploadedFile[]) => void
  setUploadedRecords: (records: UploadedRecord[]) => void
  sendMessage: () => Promise<void>
  createRecordFromChat: (messageId: string) => void
  clearError: () => void
  // 会话管理相关
  sessions: ChatSession[]
  currentSession: ChatSession | null
  isFetchingSessions: boolean
  fetchSessions: () => Promise<void>
  fetchSessionMessages: (sessionId: string) => Promise<void>
  createSession: (title?: string, enhancedRole?: string) => Promise<void>
  switchSession: (session: ChatSession) => void
  updateSessionEnhancedRole: (sessionId: string, enhancedRole: string | null) => Promise<void>
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  // 提醒相关
  checkAndShowReminder: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// 缓存键
const SESSIONS_CACHE_KEY = 'chat_sessions_cache'
const MESSAGES_CACHE_PREFIX = 'chat_messages_'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 从缓存获取数据
 */
function getFromCache<T>(key: string): T | null {
  try {
    const cache = localStorage.getItem(key)
    if (cache) {
      const { data, timestamp } = JSON.parse(cache)
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data as T
      }
    }
  } catch (error) {
    console.error(`从缓存获取数据失败 (${key}):`, error)
  }
  return null
}

/**
 * 将数据存入缓存
 */
function saveToCache<T>(key: string, data: T): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    console.error(`将数据存入缓存失败 (${key}):`, error)
  }
}

/**
 * 清除缓存
 */
function clearCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`清除缓存失败 (${key}):`, error)
  }
}

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addRecord } = useRecord()
  
  // 消息状态
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', content: '你好！我是小诺，有什么可以帮助你的吗？', sender: 'bot', timestamp: new Date() }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadedRecords, setUploadedRecords] = useState<UploadedRecord[]>([])
  const [error, setError] = useState<ChatError | null>(null)
  
  // 会话状态
  const [sessions, setSessions] = useState<ChatSession[]>(() => getFromCache<ChatSession[]>(SESSIONS_CACHE_KEY) || [])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isFetchingSessions, setIsFetchingSessions] = useState(false)

  // 从聊天消息创建记录
  const createRecordFromChat = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return false

    // 从消息内容创建记录
    const record = {
      title: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      content: message.content,
      summary: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
      type: 'inspiration' as const,
      status: 'pending' as const,
      tags: [],
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1))
    }

    try {
      await addRecord(record)
      return true
    } catch (err) {
      console.error('创建记录失败:', err)
      return false
    }
  }, [messages, addRecord])

  // 获取会话历史消息
  const fetchSessionMessages = useCallback(async (sessionId: string) => {
    // 先尝试从缓存获取消息
    const cachedMessages = getFromCache<Message[]>(`${MESSAGES_CACHE_PREFIX}${sessionId}`)
    if (cachedMessages) {
      setMessages(cachedMessages)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 禁用浏览器缓存
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        throw new Error(errorData.message || '获取会话历史消息失败')
      }

      const data = await response.json()
      
      if (data.data.messages && Array.isArray(data.data.messages)) {
        // 如果有历史消息，使用它们；否则使用默认消息
        const processedMessages = data.data.messages.length > 0 
          ? data.data.messages.map((msg: {
              _id?: string;
              id?: string;
              content: string;
              sender: 'user' | 'bot';
              timestamp: string | Date;
              type?: string;
              taskInfo?: any;
              files?: Array<{
                name: string;
                type: string;
                url: string;
              }>;
            }) => ({
              id: msg._id || msg.id || Math.random().toString(36).substr(2, 9),
              content: msg.content,
              sender: msg.sender,
              type: msg.type,
              taskInfo: msg.taskInfo,
              timestamp: new Date(msg.timestamp),
              files: msg.files || []
            }))
          : [
              { id: '1', content: '你好！我是小诺，有什么可以帮助你的吗？', sender: 'bot', timestamp: new Date() }
            ]
        
        setMessages(processedMessages)
        // 保存到缓存
        saveToCache(`${MESSAGES_CACHE_PREFIX}${sessionId}`, processedMessages)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取会话历史消息失败'
      setError({
        code: 'FETCH_MESSAGES_FAILED',
        message: errorMessage
      })
      
      console.error('获取会话历史消息失败:', err)
      // 使用默认消息作为fallback
      const defaultMessages: Message[] = [
        { id: '1', content: '你好！我是小诺，有什么可以帮助你的吗？', sender: 'bot', timestamp: new Date() }
      ]
      setMessages(defaultMessages)
      saveToCache(`${MESSAGES_CACHE_PREFIX}${sessionId}`, defaultMessages)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 获取会话列表
  const fetchSessions = useCallback(async () => {
    setIsFetchingSessions(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 禁用浏览器缓存
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        throw new Error(errorData.message || '获取会话列表失败')
      }

      const data = await response.json()
      setSessions(data.data)
      
      // 保存到缓存
      saveToCache(SESSIONS_CACHE_KEY, data.data)
      
      // 从localStorage获取上次的会话ID
      const lastSessionId = localStorage.getItem('currentSessionId')
      if (lastSessionId) {
        // 查找对应的会话
        const lastSession = data.data.find((session: ChatSession) => session.sessionId === lastSessionId)
        if (lastSession) {
          setCurrentSession(lastSession)
          // 获取上次会话的历史消息
          await fetchSessionMessages(lastSession.sessionId)
        } else if (data.data.length > 0) {
          // 如果上次会话不存在，使用第一个会话
          setCurrentSession(data.data[0])
          localStorage.setItem('currentSessionId', data.data[0].sessionId)
          // 获取第一个会话的历史消息
          await fetchSessionMessages(data.data[0].sessionId)
        }
      } else if (data.data.length > 0) {
        // 如果没有保存的会话ID，使用第一个会话
        setCurrentSession(data.data[0])
        localStorage.setItem('currentSessionId', data.data[0].sessionId)
        // 获取第一个会话的历史消息
        await fetchSessionMessages(data.data[0].sessionId)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取会话列表失败'
      setError({
        code: 'FETCH_SESSIONS_FAILED',
        message: errorMessage
      })
      
      console.error('获取会话列表失败:', err)
      // 使用缓存的会话作为fallback
      const cachedSessions = getFromCache<ChatSession[]>(SESSIONS_CACHE_KEY)
      if (cachedSessions && cachedSessions.length > 0) {
        setSessions(cachedSessions)
      } else {
        setSessions([])
      }
    } finally {
      setIsFetchingSessions(false)
    }
  }, [fetchSessionMessages])

  // 创建新会话
  const createSession = useCallback(async (title?: string, enhancedRole?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          enhancedRole
        })
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        throw new Error(errorData.message || '创建会话失败')
      }

      const data = await response.json()
      
      const updatedSessions = [data.data, ...sessions]
      setSessions(updatedSessions)
      setCurrentSession(data.data)
      
      // 保存当前会话ID到localStorage
      localStorage.setItem('currentSessionId', data.data.sessionId)
      // 保存到缓存
      saveToCache(SESSIONS_CACHE_KEY, updatedSessions)
      
      // 清空当前消息列表
      const defaultMessages: Message[] = [
        { id: '1', content: '你好！我是小诺，有什么可以帮助你的吗？', sender: 'bot', timestamp: new Date() }
      ]
      setMessages(defaultMessages)
      saveToCache(`${MESSAGES_CACHE_PREFIX}${data.data.sessionId}`, defaultMessages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建会话失败'
      setError({
        code: 'CREATE_SESSION_FAILED',
        message: errorMessage
      })
      console.error('创建会话失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [sessions])

  // 切换会话
  const switchSession = useCallback((session: ChatSession) => {
    if (session) {
      setCurrentSession(session)
      // 保存当前会话ID到localStorage
      localStorage.setItem('currentSessionId', session.sessionId)
      // 获取会话历史消息
      fetchSessionMessages(session.sessionId)
    }
  }, [fetchSessionMessages])

  // 更新会话的增强角色
  const updateSessionEnhancedRole = useCallback(async (sessionId: string, enhancedRole: string | null) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/enhanced-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enhancedRole
        })
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        throw new Error(errorData.message || '更新会话增强角色失败')
      }

      const data = await response.json()
      // 更新会话列表中的会话
      const updatedSessions = sessions.map(session => 
        session.sessionId === sessionId ? data.data : session
      )
      setSessions(updatedSessions)
      // 保存到缓存
      saveToCache(SESSIONS_CACHE_KEY, updatedSessions)
      // 如果是当前会话，也更新当前会话
      if (currentSession?.sessionId === sessionId) {
        setCurrentSession(data.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新会话增强角色失败'
      setError({
        code: 'UPDATE_ROLE_FAILED',
        message: errorMessage
      })
      console.error('更新会话增强角色失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentSession, sessions])

  // 更新会话标题
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title
        })
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        throw new Error(errorData.message || '更新会话标题失败')
      }

      const data = await response.json()
      // 更新会话列表中的会话
      const updatedSessions = sessions.map(session => 
        session.sessionId === sessionId ? data.data : session
      )
      setSessions(updatedSessions)
      // 保存到缓存
      saveToCache(SESSIONS_CACHE_KEY, updatedSessions)
      // 如果是当前会话，也更新当前会话
      if (currentSession?.sessionId === sessionId) {
        setCurrentSession(data.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新会话标题失败'
      setError({
        code: 'UPDATE_TITLE_FAILED',
        message: errorMessage
      })
      console.error('更新会话标题失败:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentSession, sessions])

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    console.log('开始删除会话:', { sessionId })
    setIsLoading(true)
    setError(null)

    try {
      console.log('构建删除会话的API请求:', {
        url: `${API_BASE_URL}/chat/sessions/${sessionId}`,
        method: 'DELETE',
        hasToken: !!localStorage.getItem('token')
      })
      
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('删除会话的API响应:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        console.error('删除会话API失败:', { errorData })
        throw new Error(errorData.message || '删除会话失败')
      }

      // 如果删除的是当前会话，从localStorage中移除该会话ID
      if (currentSession?.sessionId === sessionId) {
        console.log('删除的是当前会话，从localStorage中移除会话ID')
        localStorage.removeItem('currentSessionId')
      }
      
      // 清除会话列表缓存，确保不会使用旧的缓存数据
      console.log('清除会话列表缓存')
      clearCache(SESSIONS_CACHE_KEY)
      
      // 从后端重新获取会话列表，确保删除操作生效
      console.log('从后端重新获取会话列表')
      await fetchSessions()
      
      // 清除该会话的消息缓存
      console.log('清除被删除会话的消息缓存')
      clearCache(`${MESSAGES_CACHE_PREFIX}${sessionId}`)
      
      console.log('会话删除成功')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除会话失败'
      console.error('删除会话失败:', err)
      setError({
        code: 'DELETE_SESSION_FAILED',
        message: errorMessage
      })
      throw err
    } finally {
      console.log('删除会话操作完成')
      setIsLoading(false)
    }
  }, [currentSession, fetchSessions, fetchSessionMessages])

  // 发送消息到后端API
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0 && uploadedRecords.length === 0) return

    // 添加用户消息到消息列表
    let messageContent = inputValue
    let recordContent = ''
    
    // 如果有上传的记录，将记录信息添加到消息内容中
    if (uploadedRecords.length > 0) {
      // 构建记录信息对象
      const recordInfo = {
        recordId: uploadedRecords[0].recordId,
        title: uploadedRecords[0].title,
        content: uploadedRecords[0].content,
        type: uploadedRecords[0].type,
        status: uploadedRecords[0].status,
        createdAt: uploadedRecords[0].createdAt || new Date().toISOString()
      }
      
      // 将记录信息转换为JSON字符串
      recordContent = JSON.stringify(recordInfo)
      
      // 如果输入框为空，直接使用记录信息作为内容
      if (!inputValue.trim()) {
        messageContent = recordContent
      } else {
        // 如果输入框不为空，将记录信息添加到内容末尾
        messageContent = `${inputValue}\n\n${recordContent}`
      }
    }
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      files: uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        url: file.url || file.preview || ''
      }))
    }
    
    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setUploadedFiles([])
    setUploadedRecords([])
    setIsLoading(true)
    setError(null)

    try {
      // 统一使用JSON发送消息，包括文件信息、记录信息和聊天历史
      const messageData = {
        message: messageContent,
        files: uploadedFiles.map(file => ({
          name: file.name,
          type: file.file?.type || 'application/octet-stream', // 使用原始文件的MIME类型
          url: file.url || file.preview || '' // 优先使用file.url字段
        })),
        sessionId: currentSession?.sessionId,
        history: messages // 只发送历史消息，不包含新消息
      }

      const response = await fetch(`${API_BASE_URL}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(messageData)
      })

      // 无论状态码如何，先解析响应数据
      const data = await response.json().catch(() => {
        throw new Error('发送消息失败')
      })

      let finalMessages: Message[]

      if (!response.ok || data.status === 'subscription_expired') {
        // 处理错误情况，包括订阅过期
        const errorMessage = data.message || '发送消息失败'
        // 添加友好的错误提示消息
        const errorBotMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: errorMessage,
          sender: 'bot',
          timestamp: new Date()
        }
        finalMessages = [...updatedMessages, errorBotMessage]
        setMessages(finalMessages)
      } else {
        // 处理正常AI响应
        const botReply: Message = {
          id: (Date.now() + 1).toString(),
          content: data.data?.reply || '抱歉，我暂时无法回答这个问题。',
          sender: 'bot',
          type: data.data?.type,
          taskInfo: data.data?.taskInfo,
          timestamp: new Date()
        }
        finalMessages = [...updatedMessages, botReply]
        setMessages(finalMessages)
        
        // 处理函数调用（仅在正常响应时）
        if (data.data?.type === 'function_call' && data.data?.functionCall) {
          // 后端已经处理了函数调用并返回了完整回复
          // 前端只需要显示后端的回复即可，不需要再执行函数调用
          console.log('AI请求函数调用:', data.data.functionCall)
          // 函数调用已由后端处理，无需前端重复执行
        }
      }
      
      // 保存到缓存
      if (currentSession?.sessionId) {
        saveToCache(`${MESSAGES_CACHE_PREFIX}${currentSession.sessionId}`, finalMessages)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送消息失败'
      setError({
        code: 'SEND_MESSAGE_FAILED',
        message: errorMessage
      })
      console.error('发送消息失败:', err)
      
      // 添加错误消息
      const errorMessageObj: Message = {
        id: (Date.now() + 2).toString(),
        content: '发送消息失败，请稍后重试',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessageObj])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, uploadedFiles, uploadedRecords, createRecordFromChat, currentSession, messages])

  // 检查并显示提醒
  const checkAndShowReminder = useCallback(async () => {
    try {
      // 检查上次提醒时间
      const lastReminderTime = localStorage.getItem('lastReminderTime')
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000
      
      // 如果上次提醒时间在24小时内，不显示提醒
      if (lastReminderTime && (now - parseInt(lastReminderTime)) < twentyFourHours) {
        return
      }
      
      // 获取用户未整理记录数量
      const response = await fetch(`${API_BASE_URL}/records/pending-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response || !response.ok) {
        throw new Error('获取未整理记录数量失败')
      }
      
      const data = await response.json()
      const pendingCount = data.data.pendingCount
      
      // 如果有未整理的记录，显示提醒
      if (pendingCount > 0) {
        // 创建提醒消息
        const reminderMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: `您目前有 ${pendingCount} 条记录尚未完成，是否要进行整理？<a href="/records" target="_blank">点击此处 ></a>`,
          sender: 'bot',
          timestamp: new Date()
        }
        
        // 将提醒消息添加到聊天历史中
        setMessages(prev => [...prev, reminderMessage])
        
        // 更新上次提醒时间
        localStorage.setItem('lastReminderTime', now.toString())
      }
    } catch (error) {
      console.error('检查提醒失败:', error)
    }
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始化时获取会话列表
  useEffect(() => {
    const initApp = async () => {
      // 检查用户是否已登录，只有在登录状态下才获取会话列表
      const token = localStorage.getItem('token')
      if (token) {
        await fetchSessions()
      }
    }
    
    // 监听添加上传记录的事件
    const handleAddUploadedRecord = (event: CustomEvent) => {
      const record = event.detail
      setUploadedRecords(prev => [...prev, record])
    }
    
    window.addEventListener('addUploadedRecord', handleAddUploadedRecord as EventListener)
    initApp()
    
    return () => {
      window.removeEventListener('addUploadedRecord', handleAddUploadedRecord as EventListener)
    }
  }, [fetchSessions])

  // 设置WebSocket监听器，处理任务执行状态的实时更新
  useEffect(() => {
    // 监听任务状态更新
    const handleTaskUpdate = (data: any) => {
      console.log('接收到任务状态更新:', data)
      // 查找对应的任务消息并更新其状态
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.taskInfo?.taskId === data.taskId) {
            return {
              ...message,
              taskInfo: {
                ...message.taskInfo,
                status: data.status,
                progress: data.progress
              }
            } as Message
          }
          return message
        })
      })
    }

    // 监听子任务完成
    const handleSubtaskComplete = (data: any) => {
      console.log('接收到子任务完成通知:', data)
      // 查找对应的任务消息并更新其状态
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.taskInfo?.taskId === data.taskId) {
            return {
              ...message,
              taskInfo: {
                ...message.taskInfo,
                status: 'in_progress',
                progress: Math.round(((data.subtaskIndex + 1) / (message.taskInfo?.subtaskCount || 1)) * 100)
              }
            } as Message
          }
          return message
        })
      })
    }

    // 监听子任务失败
    const handleSubtaskError = (data: any) => {
      console.log('接收到子任务失败通知:', data)
      // 查找对应的任务消息并更新其状态
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.taskInfo?.taskId === data.taskId) {
            return {
              ...message,
              taskInfo: {
                ...message.taskInfo,
                status: 'failed',
                error: data.error
              }
            } as Message
          }
          return message
        })
      })
    }

    // 监听任务准备执行子任务
    const handleTaskReadyForSubtask = (data: any) => {
      console.log('接收到任务准备执行子任务通知:', data)
      // 查找对应的任务消息并更新其状态
      setMessages(prevMessages => {
        return prevMessages.map(message => {
          if (message.taskInfo?.taskId === data.taskId) {
            return {
              ...message,
              taskInfo: {
                ...message.taskInfo,
                status: 'in_progress',
                currentSubtaskIndex: data.subtaskIndex
              }
            } as Message
          }
          return message
        })
      })
    }

    // 监听新聊天消息
    const handleNewChatMessage = (data: any) => {
      console.log('接收到新聊天消息通知:', data)
      // 如果新消息的会话ID与当前会话ID相同，更新消息列表
      if (data.sessionId === currentSession?.sessionId) {
        fetchSessionMessages(data.sessionId)
      }
    }

    // 监听工具执行开始
    const handleToolExecutionStart = (data: any) => {
      console.log('接收到工具执行开始通知:', data)
      // 如果通知的会话ID与当前会话ID相同，添加执行开始的消息
      if (data.sessionId === currentSession?.sessionId) {
        const executionStartMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `任务开始执行：${data.functionName}`,
          sender: 'bot',
          type: 'tool_execution_start',
          timestamp: new Date()
        }
        setMessages(prevMessages => [...prevMessages, executionStartMessage])
      }
    }

    // 监听函数执行错误
    const handleFunctionError = (data: any) => {
      console.log('接收到函数执行错误通知:', data)
      // 创建友好的错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `抱歉😭，小诺执行错误，请给小诺一些成长时间。下次执行一定没问题~\n\n错误详情：${data.error}`,
        sender: 'bot',
        type: 'function_error',
        timestamp: new Date()
      }
      setMessages(prevMessages => [...prevMessages, errorMessage])
    }

    // 注册监听器
    websocketService.on('task_update', handleTaskUpdate)
    websocketService.on('subtask_complete', handleSubtaskComplete)
    websocketService.on('subtask_error', handleSubtaskError)
    websocketService.on('task_ready_for_subtask', handleTaskReadyForSubtask)
    websocketService.on('new_chat_message', handleNewChatMessage)
    websocketService.on('tool_execution_start', handleToolExecutionStart)
    websocketService.on('function_error', handleFunctionError)

    // 清理监听器
    return () => {
      websocketService.off('task_update', handleTaskUpdate)
      websocketService.off('subtask_complete', handleSubtaskComplete)
      websocketService.off('subtask_error', handleSubtaskError)
      websocketService.off('task_ready_for_subtask', handleTaskReadyForSubtask)
      websocketService.off('new_chat_message', handleNewChatMessage)
      websocketService.off('tool_execution_start', handleToolExecutionStart)
      websocketService.off('function_error', handleFunctionError)
    }
  }, [])



  const contextValue = useMemo(() => ({
    messages,
    inputValue,
    isLoading,
    uploadedFiles,
    uploadedRecords,
    error,
    sessions,
    currentSession,
    isFetchingSessions,
    setInputValue,
    setUploadedFiles,
    setUploadedRecords,
    sendMessage,
    createRecordFromChat,
    clearError,
    fetchSessions,
    fetchSessionMessages,
    createSession,
    switchSession,
    updateSessionEnhancedRole,
    updateSessionTitle,
    deleteSession
  }), [
    messages, inputValue, isLoading, uploadedFiles, uploadedRecords, error, sessions, currentSession, isFetchingSessions,
    sendMessage, createRecordFromChat, clearError, fetchSessions, fetchSessionMessages,
    createSession, switchSession, updateSessionEnhancedRole, updateSessionTitle, deleteSession
  ])

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}

// 自定义hook
export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
