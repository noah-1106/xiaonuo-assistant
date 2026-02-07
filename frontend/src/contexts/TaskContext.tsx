import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Task } from '../types'
import { API_BASE_URL } from '../utils/env'
import websocketService from '../services/websocketService'

// 定义错误类型
interface TaskError {
  code: string
  message: string
}

interface TaskContextType {
  tasks: Task[]
  isLoading: boolean
  error: TaskError | null
  createTask: (taskData: Partial<Task>) => Promise<Task>
  executeTask: (taskId: string) => Promise<any>
  cancelTask: (taskId: string) => Promise<void>
  fetchTasks: () => Promise<void>
  getTaskDetail: (taskId: string) => Promise<Task | null>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

// 缓存键和过期时间
const TASKS_CACHE_KEY = 'tasks_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

// 缓存工具函数
function getFromCache<T>(key: string): T | null {
  try {
    const cache = localStorage.getItem(key)
    if (cache) {
      const { data, timestamp } = JSON.parse(cache)
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
      // 移除过期缓存
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error('从缓存获取数据失败:', error)
  }
  return null
}

function setToCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('设置缓存失败:', error)
  }
}

function removeFromCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('移除缓存失败:', error)
  }
}

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TaskError | null>(null)

  // 从后端获取任务列表
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' // 禁用浏览器缓存
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '获取任务列表失败')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const fetchedTasks = data.data || []
      setTasks(fetchedTasks)
      // 缓存获取到的任务
      setToCache(TASKS_CACHE_KEY, fetchedTasks)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务列表失败'
      setError({
        code: 'FETCH_TASKS_FAILED',
        message: errorMessage
      })
      // 失败时尝试从缓存获取任务
      const cachedTasks = getFromCache<Task[]>(TASKS_CACHE_KEY)
      setTasks(cachedTasks || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化时获取任务列表
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchTasks()
    }
  }, [fetchTasks])

  // 设置WebSocket监听器
  useEffect(() => {
    // 监听任务状态更新
    const handleTaskUpdate = (data: any) => {
      console.log('接收到任务状态更新:', data)
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task._id === data.taskId) {
            return {
              ...task,
              status: data.status,
              progress: data.progress
            }
          }
          return task
        })
      })
    }

    // 监听任务执行完成
    const handleTaskComplete = (data: any) => {
      console.log('接收到任务执行完成:', data)
      // 任务完成后刷新任务列表
      fetchTasks()
    }

    // 监听任务执行失败
    const handleTaskError = (data: any) => {
      console.log('接收到任务执行失败:', data)
      // 任务失败后刷新任务列表
      fetchTasks()
    }

    // 注册监听器
    websocketService.on('task_update', handleTaskUpdate)
    websocketService.on('task_complete', handleTaskComplete)
    websocketService.on('task_error', handleTaskError)

    // 清理监听器
    return () => {
      websocketService.off('task_update', handleTaskUpdate)
      websocketService.off('task_complete', handleTaskComplete)
      websocketService.off('task_error', handleTaskError)
    }
  }, [fetchTasks])

  // 创建任务
  const createTask = useCallback(async (taskData: Partial<Task>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '创建任务失败')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const newTask = data.data
      setTasks(prev => [newTask, ...prev])
      // 清除缓存，以便下次获取最新数据
      removeFromCache(TASKS_CACHE_KEY)
      return newTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建任务失败'
      setError({
        code: 'CREATE_TASK_FAILED',
        message: errorMessage
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 执行任务
  const executeTask = useCallback(async (taskId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '执行任务失败')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      // 更新任务列表
      await fetchTasks()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行任务失败'
      setError({
        code: 'EXECUTE_TASK_FAILED',
        message: errorMessage
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTasks])

  // 取消任务
  const cancelTask = useCallback(async (taskId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '取消任务失败')
        throw new Error(errorMessage)
      }

      // 更新任务列表
      await fetchTasks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消任务失败'
      setError({
        code: 'CANCEL_TASK_FAILED',
        message: errorMessage
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [fetchTasks])



  // 获取任务详情
  const getTaskDetail = useCallback(async (taskId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '获取任务详情失败')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取任务详情失败'
      setError({
        code: 'GET_TASK_DETAIL_FAILED',
        message: errorMessage
      })
      // 尝试从本地任务列表中获取
      const localTask = tasks.find(task => task._id === taskId)
      return localTask || null
    } finally {
      setIsLoading(false)
    }
  }, [tasks])



  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        createTask,
        executeTask,
        cancelTask,
        fetchTasks,
        getTaskDetail
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

// 自定义hook
export const useTask = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider')
  }
  return context
}
