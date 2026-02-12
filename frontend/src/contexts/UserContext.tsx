import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { API_BASE_URL } from '../utils/env'
import websocketService from '../services/websocketService'

// 定义错误类型
interface UserError {
  code: string
  message: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  error: UserError | null
  updateUserProfile: (updates: Partial<User>) => Promise<void>
  fetchUserInfo: () => Promise<void>
  clearError: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// 缓存键
const USER_CACHE_KEY = 'user_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 从缓存获取用户信息
 */
const getUserFromCache = (): User | null => {
  try {
    const cache = localStorage.getItem(USER_CACHE_KEY)
    if (cache) {
      const { data, timestamp } = JSON.parse(cache)
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
    }
  } catch (error) {
    console.error('从缓存获取用户信息失败:', error)
  }
  return null
}

/**
 * 将用户信息存入缓存
 */
const saveUserToCache = (user: User): void => {
  try {
    const cacheData = {
      data: user,
      timestamp: Date.now()
    }
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.error('将用户信息存入缓存失败:', error)
  }
}

/**
 * 清除用户缓存
 */
const clearUserCache = (): void => {
  localStorage.removeItem(USER_CACHE_KEY)
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<UserError | null>(null)

  // 从后端获取用户信息
  const fetchUserInfo = useCallback(async () => {
    // 检查是否有有效的token
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      clearUserCache()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-cache' // 禁用浏览器缓存
      })

      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {}
        throw new Error(errorData.message || '获取用户信息失败')
      }

      const data = await response.json()
      
      // 检查返回数据格式是否正确
      if (!data.data) {
        throw new Error('获取用户信息失败：数据格式不正确')
      }
      
      // 处理后端返回的用户信息，映射到前端User类型
      const endDate = new Date(data.data.subscription?.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const isExpired = endDate < now;
      
      // 确定套餐名称
      let planName = '未设置';
      if (data.data.planDetails) {
        // 使用后端返回的planDetails
        planName = data.data.planDetails.name;
      } else if (data.data.subscription?.plan) {
        // 后备方案：使用subscription.plan
        planName = (data.data.subscription.plan === 'free' || data.data.subscription.plan.toString().includes('free')) ? '免费版' : '高级版';
      }
      
      const userData: User = {
        id: data.data.userId || '',
        username: data.data.username || '',
        nickname: data.data.nickname || '',
        phone: data.data.phone || '',
        email: data.data.email || '',
        avatar: data.data.avatar || '',
        role: data.data.role || 'user',
        hasPassword: data.data.hasPassword || false,
        theme: data.data.theme,
        plan: {
          _id: data.data.planDetails?._id || '1',
          name: planName,
          status: isExpired ? 'expired' : 'active',
          endDate: endDate
        }
      }
      
      setUser(userData)
      saveUserToCache(userData)
      
      // 连接WebSocket服务器
      if (userData.id && token) {
        websocketService.init(userData.id, token);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取用户信息失败'
      setError({
        code: 'FETCH_USER_FAILED',
        message: errorMessage
      })
      
      // 使用模拟数据作为 fallback
      console.warn('使用模拟用户数据:', errorMessage)
      const mockUser: User = {
        id: '1',
        username: '小诺用户',
        nickname: '小诺',
        phone: '13800138000',
        email: 'admin@xiaonuo.com',
        avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
        role: 'admin',
        hasPassword: true,
        theme: 'ink-black-white',
        plan: {
          _id: '1',
          name: '高级会员',
          status: 'active',
          endDate: new Date('2026-12-31T23:59:59Z')
        }
      }
      setUser(mockUser)
      saveUserToCache(mockUser)
      
      // 连接WebSocket服务器
      if (mockUser.id && localStorage.getItem('token')) {
        websocketService.init(mockUser.id, localStorage.getItem('token')!);
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化时获取用户信息
  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  // 监听localStorage中的token变化，当token变化时重新获取用户信息
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchUserInfo()
      }
    }

    // 添加事件监听器
    window.addEventListener('storage', handleStorageChange)

    // 清理事件监听器
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchUserInfo])

  // 监听页面焦点变化，当页面获得焦点时重新获取用户信息
  useEffect(() => {
    const handleFocus = () => {
      // 只有在有token的情况下才获取用户信息
      if (localStorage.getItem('token')) {
        fetchUserInfo()
      }
    }

    // 添加事件监听器
    window.addEventListener('focus', handleFocus)

    // 清理事件监听器
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchUserInfo])

  // 更新用户个人信息
  const updateUserProfile = useCallback(async (updates: Partial<User> & { verifyToken?: string }): Promise<boolean> => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('未登录，无法更新用户信息')
    }

    setIsLoading(true)
    setError(null)

    try {
      // 过滤掉后端不接受的字段
      const filteredUpdates = {
        nickname: updates.nickname,
        username: updates.username,
        email: updates.email,
        theme: updates.theme,
        avatar: updates.avatar,
        phone: updates.phone,
        verifyToken: updates.verifyToken
      }
      
      // 移除undefined值
      Object.keys(filteredUpdates).forEach(key => {
        if (filteredUpdates[key as keyof typeof filteredUpdates] === undefined) {
          delete filteredUpdates[key as keyof typeof filteredUpdates]
        }
      })

      console.log('发送更新请求:', filteredUpdates)

      const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(filteredUpdates)
      })

      console.log('收到响应状态:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log('错误数据:', errorData)
        throw new Error(errorData.message || '更新个人信息失败')
      }

      const data = await response.json()
      console.log('响应数据:', data)
      
      // 处理后端返回的用户信息，映射到前端User类型
      const endDate = new Date(data.data.subscription?.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const isExpired = endDate < now;
      
      // 确定套餐名称
      let planName = '未设置';
      if (data.data.planDetails) {
        planName = data.data.planDetails.name;
      } else if (data.data.subscription?.plan) {
        planName = (data.data.subscription.plan === 'free' || data.data.subscription.plan.toString().includes('free')) ? '免费版' : '高级版';
      }
      
      const userData: User = {
        id: data.data.userId || '',
        username: data.data.username || '',
        nickname: data.data.nickname || '',
        phone: data.data.phone || '',
        email: data.data.email || '',
        avatar: data.data.avatar || '',
        role: data.data.role || 'user',
        hasPassword: data.data.hasPassword || false,
        theme: data.data.theme,
        plan: {
          _id: data.data.planDetails?._id || '1',
          name: planName,
          status: isExpired ? 'expired' : 'active',
          endDate: endDate
        }
      }
      
      setUser(userData)
      saveUserToCache(userData)
      
      // 成功完成
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新个人信息失败'
      setError({
        code: 'UPDATE_PROFILE_FAILED',
        message: errorMessage
      })
      
      // API调用失败
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 清除错误
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 计算是否已认证
  const isAuthenticated = useMemo(() => {
    return !!user && !!localStorage.getItem('token')
  }, [user])

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    error,
    updateUserProfile,
    fetchUserInfo,
    clearError,
    isAuthenticated
  }), [user, isLoading, error, updateUserProfile, fetchUserInfo, clearError, isAuthenticated])

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

// 自定义hook
export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}