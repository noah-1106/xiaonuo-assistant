import { renderHook } from '@testing-library/react'
import { UserProvider, useUser } from './UserContext'
import websocketService from '../services/websocketService'

// Mock外部依赖
jest.mock('../utils/env', () => ({
  API_BASE_URL: 'http://localhost:3001/api'
}))

jest.mock('../services/websocketService', () => ({
  init: jest.fn(),
  close: jest.fn()
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock fetch
const mockFetch = jest.fn()
;(globalThis as any).fetch = mockFetch

// Mock StorageEvent
class MockStorageEvent extends Event {
  key: string | null
  oldValue: string | null
  newValue: string | null
  url: string
  storageArea: Storage

  constructor(key: string | null, oldValue: string | null, newValue: string | null) {
    super('storage')
    this.key = key
    this.oldValue = oldValue
    this.newValue = newValue
    this.url = window.location.href
    this.storageArea = localStorage
  }
}

const mockInitWebSocket = websocketService.init as jest.MockedFunction<typeof websocketService.init>

describe('UserContext', () => {
  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks()
    // 重置模块
    jest.resetModules()
  })

  test('should return initial state with no token', () => {
    // 模拟没有token
    mockLocalStorage.getItem.mockReturnValue(null)

    const { result } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('should fetch user info successfully with valid token', async () => {
    // 模拟有token
    const mockToken = 'test-token'
    const mockUserResponse = {
      data: {
        userId: '1',
        username: 'testuser',
        nickname: '测试用户',
        phone: '13800138000',
        email: 'test@example.com',
        avatar: 'avatar-url',
        role: 'user',
        hasPassword: true,
        planDetails: {
          _id: '1',
          name: '免费版'
        },
        subscription: {
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken
      return null
    })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockUserResponse
    } as Response)

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    // 初始状态
    expect(result.current.isLoading).toBe(true)

    // 等待更新
    await waitForNextUpdate()

    // 验证结果
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.id).toBe('1')
    expect(result.current.user?.username).toBe('testuser')
    expect(result.current.isAuthenticated).toBe(true)

    // 验证WebSocket初始化
    expect(mockInitWebSocket).toHaveBeenCalledWith('1', mockToken)
  })

  test('should handle fetch user info error', async () => {
    // 模拟有token
    const mockToken = 'test-token'

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken
      return null
    })

    // 模拟fetch失败
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: '获取用户信息失败' })
    } as Response)

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    // 等待更新
    await waitForNextUpdate()

    // 验证结果
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toBe('获取用户信息失败')
    // 应该使用mock数据作为fallback
    expect(result.current.user).not.toBeNull()
    expect(result.current.isAuthenticated).toBe(true)
  })

  test('should update user profile successfully', async () => {
    // 模拟有token和用户数据
    const mockToken = 'test-token'
    const initialUser = {
      id: '1',
      username: 'testuser',
      nickname: '测试用户',
      phone: '13800138000',
      email: 'test@example.com',
      avatar: 'avatar-url',
      role: 'user',
      hasPassword: true,
      plan: {
        _id: '1',
        name: '免费版',
        status: 'active',
        endDate: new Date()
      }
    }

    const updatedUserResponse = {
      data: {
        userId: '1',
        username: 'testuser',
        nickname: '更新后的用户',
        phone: '13800138000',
        email: 'test@example.com',
        avatar: 'avatar-url',
        role: 'user',
        hasPassword: true,
        planDetails: {
          _id: '1',
          name: '免费版'
        },
        subscription: {
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken
      return null
    })

    // 模拟fetch用户信息成功
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          userId: '1',
          username: 'testuser',
          nickname: '测试用户',
          phone: '13800138000',
          email: 'test@example.com',
          avatar: 'avatar-url',
          role: 'user',
          hasPassword: true,
          planDetails: {
            _id: '1',
            name: '免费版'
          },
          subscription: {
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      })
    } as Response)

    // 模拟更新用户信息成功
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedUserResponse
    } as Response)

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    // 等待初始用户信息加载
    await waitForNextUpdate()

    // 执行更新操作
    const updatePromise = result.current.updateUserProfile({
      nickname: '更新后的用户'
    })

    // 验证加载状态
    expect(result.current.isLoading).toBe(true)

    // 等待更新完成
    await waitForNextUpdate()

    // 验证结果
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.user?.nickname).toBe('更新后的用户')
  })

  test('should handle profile update error with fallback', async () => {
    // 模拟有token和用户数据
    const mockToken = 'test-token'

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken
      return null
    })

    // 模拟fetch用户信息成功
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          userId: '1',
          username: 'testuser',
          nickname: '测试用户',
          phone: '13800138000',
          email: 'test@example.com',
          avatar: 'avatar-url',
          role: 'user',
          hasPassword: true,
          planDetails: {
            _id: '1',
            name: '免费版'
          },
          subscription: {
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }
      })
    } as Response)

    // 模拟更新用户信息失败
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '更新用户信息失败' })
    } as Response)

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    // 等待初始用户信息加载
    await waitForNextUpdate()

    // 执行更新操作
    const updatePromise = result.current.updateUserProfile({
      nickname: '更新后的用户'
    })

    // 等待更新完成
    await waitForNextUpdate()

    // 验证结果
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toBe('更新用户信息失败')
    // 应该使用本地更新作为fallback
    expect(result.current.user?.nickname).toBe('更新后的用户')
  })

  test('should clear error', () => {
    // 模拟有错误
    const mockToken = 'test-token'

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken
      return null
    })

    // 模拟fetch失败
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: '获取用户信息失败' })
    } as Response)

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    // 等待更新
    await waitForNextUpdate()

    // 验证有错误
    expect(result.current.error).not.toBeNull()

    // 清除错误
    result.current.clearError()

    // 验证错误已清除
    expect(result.current.error).toBeNull()
  })

  test('should handle storage event for token change', async () => {
    // 模拟初始没有token
    mockLocalStorage.getItem.mockReturnValue(null)

    const { result, waitForNextUpdate } = renderHook(() => useUser(), {
      wrapper: ({ children }) => <UserProvider>{children}</UserProvider>
    })

    // 验证初始状态
    expect(result.current.user).toBeNull()

    // 模拟token变化事件
    const tokenEvent = new MockStorageEvent('token', null, 'new-token')
    window.dispatchEvent(tokenEvent)

    // 等待更新
    await waitForNextUpdate()

    // 验证应该尝试获取用户信息
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/auth/me', expect.any(Object))
  })
})
