import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { RecordItem } from '../types'
import { API_BASE_URL } from '../utils/env'
import websocketService from '../services/websocketService'

// 定义错误类型
interface RecordError {
  code: string
  message: string
}

interface RecordContextType {
  records: RecordItem[]
  isLoading: boolean
  error: RecordError | null
  viewMode: 'list' | 'card'
  setViewMode: (mode: 'list' | 'card') => void
  addRecord: (record: Partial<RecordItem>) => Promise<void>
  updateRecord: (id: string, updates: Partial<RecordItem>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  fetchRecords: () => Promise<void>
  filterRecords: (filters: { type?: string; status?: string }) => void
}

const RecordContext = createContext<RecordContextType | undefined>(undefined)

// 缓存键和过期时间
const RECORDS_CACHE_KEY = 'records_cache'
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

export const RecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<RecordItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState<{ type?: string; status?: string }>({})
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [error, setError] = useState<RecordError | null>(null)

  // 从后端获取简录列表
  const fetchRecords = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setRecords([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store' // 禁用浏览器缓存
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '获取简录失败')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const fetchedRecords = data.data.records || []
      setRecords(fetchedRecords)
      // 缓存获取到的记录
      setToCache(RECORDS_CACHE_KEY, fetchedRecords)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取简录失败'
      setError({
        code: 'FETCH_RECORDS_FAILED',
        message: errorMessage
      })
      // 失败时尝试从缓存获取简录
      const cachedRecords = getFromCache<RecordItem[]>(RECORDS_CACHE_KEY)
      setRecords(cachedRecords || [])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化时获取简录列表
  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // 设置WebSocket监听器
  useEffect(() => {
    // 监听记录创建通知
    const handleRecordCreated = (data: any) => {
      console.log('接收到记录创建通知:', data)
      // 转换后端格式为前端格式，确保ID字段匹配
      const recordWithCorrectId = {
        ...data.record,
        _id: data.record.id || data.record._id, // 确保使用_id字段
        createdAt: data.record.createdAt,
        updatedAt: data.record.updatedAt
      }
      console.log('处理后的记录数据:', recordWithCorrectId)
      setRecords(prev => [recordWithCorrectId, ...prev])
      // 清除缓存，以便下次获取最新数据
      removeFromCache(RECORDS_CACHE_KEY)
    }

    // 监听记录更新通知
    const handleRecordUpdated = (data: any) => {
      console.log('接收到记录更新通知:', data)
      // 转换后端格式为前端格式，确保ID字段匹配
      const recordWithCorrectId = {
        ...data.record,
        _id: data.record.id || data.record._id, // 确保使用_id字段
        createdAt: data.record.createdAt,
        updatedAt: data.record.updatedAt
      }
      console.log('处理后的记录数据:', recordWithCorrectId)
      const recordId = data.record.id || data.record._id
      setRecords(prev => prev.map(record => 
        record._id === recordId ? recordWithCorrectId : record
      ))
      // 清除缓存，以便下次获取最新数据
      removeFromCache(RECORDS_CACHE_KEY)
    }

    // 监听记录删除通知
    const handleRecordDeleted = (data: any) => {
      console.log('接收到记录删除通知:', data)
      setRecords(prev => prev.filter(record => record._id !== data.recordId))
      // 清除缓存，以便下次获取最新数据
      removeFromCache(RECORDS_CACHE_KEY)
    }

    // 注册监听器
    websocketService.on('record_created', handleRecordCreated)
    websocketService.on('record_updated', handleRecordUpdated)
    websocketService.on('record_deleted', handleRecordDeleted)

    // 清理监听器
    return () => {
      websocketService.off('record_created', handleRecordCreated)
      websocketService.off('record_updated', handleRecordUpdated)
      websocketService.off('record_deleted', handleRecordDeleted)
    }
  }, [])

  // 添加简录
  const addRecord = useCallback(async (record: Partial<RecordItem>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(record)
      })

      // 无论状态码如何，先解析响应数据
      const data = await response.json().catch(() => {
        throw new Error('添加简录失败')
      })

      if (!response.ok) {
        // 处理订阅过期特殊情况
        if (data.status === 'subscription_expired') {
          throw new Error(data.message || '您的订阅已过期，请续费以继续使用。')
        }
        // 其他错误情况
        throw new Error(data.message || '添加简录失败')
      }

      // API调用成功后直接更新本地状态
      const newRecord = data.data.record
      if (newRecord) {
        setRecords(prev => [newRecord, ...prev])
      }
      // 清除缓存，确保下次获取最新数据
      removeFromCache(RECORDS_CACHE_KEY)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加简录失败'
      setError({
        code: 'ADD_RECORD_FAILED',
        message: errorMessage
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 更新简录
  const updateRecord = useCallback(async (id: string, updates: Partial<RecordItem>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      })

      // 无论状态码如何，先解析响应数据
      const data = await response.json().catch(() => {
        throw new Error('更新简录失败')
      })

      if (!response.ok) {
        // 处理订阅过期特殊情况
        if (data.status === 'subscription_expired') {
          throw new Error(data.message || '您的订阅已过期，请续费以继续使用。')
        }
        // 其他错误情况，输出详细的错误信息到控制台
        console.error('更新简录失败:', data);
        throw new Error(data.message || '更新简录失败')
      }

      // API调用成功后直接更新本地状态
      const updatedRecord = data.data.record
      if (updatedRecord) {
        setRecords(prev => prev.map(record => 
          record._id === id ? updatedRecord : record
        ))
      }
      // 清除缓存，确保下次获取最新数据
      removeFromCache(RECORDS_CACHE_KEY)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新简录失败'
      setError({
        code: 'UPDATE_RECORD_FAILED',
        message: errorMessage
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 删除简录
  const deleteRecord = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/records/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorMessage = await response.text().catch(() => '删除简录失败')
        throw new Error(errorMessage)
      }

      // API调用成功后直接更新本地状态
      setRecords(prev => prev.filter(record => record._id !== id))
      // 清除缓存，确保下次获取最新数据
      removeFromCache(RECORDS_CACHE_KEY)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除简录失败'
      setError({
        code: 'DELETE_RECORD_FAILED',
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 筛选简录
  const filterRecords = useCallback((newFilters: { type?: string; status?: string }) => {
    setFilters(newFilters)
  }, [])

  // 应用筛选条件
  const filteredRecords = React.useMemo(() => {
    let result = [...records]
    
    if (filters.type) {
      result = result.filter(record => record.type === filters.type)
    }
    
    if (filters.status) {
      result = result.filter(record => record.status === filters.status)
    }
    
    return result
  }, [records, filters])

  return (
    <RecordContext.Provider
      value={{
        records: filteredRecords,
        isLoading,
        error,
        viewMode,
        setViewMode,
        addRecord,
        updateRecord,
        deleteRecord,
        fetchRecords,
        filterRecords
      }}
    >
      {children}
    </RecordContext.Provider>
  )
}

// 自定义hook
export const useRecord = () => {
  const context = useContext(RecordContext)
  if (context === undefined) {
    throw new Error('useRecord must be used within a RecordProvider')
  }
  return context
}
