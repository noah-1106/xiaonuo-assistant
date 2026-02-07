import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useUser } from './UserContext'

// 主题类型定义
export type ThemeName = 'aurora-dawn' | 'lime-fresh' | 'twilight-purple' | 'dawn-blue' | 'morning-gold' | 'ink-black-white'

// 主题配置接口
export interface ThemeConfig {
  name: ThemeName
  label: string
  description: string
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    background: string
    text: string
    border: string
  }
}

// 主题上下文接口
interface ThemeContextType {
  currentTheme: ThemeName
  themes: ThemeConfig[]
  setTheme: (themeName: ThemeName) => void
  isLoading: boolean
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// 主题配置
const themes: ThemeConfig[] = [
  {
    name: 'morning-gold',
    label: '晨光金辉',
    description: '明亮温暖，活力积极',
    colors: {
      primary: '#faad14',
      secondary: '#ff7875',
      success: '#52c41a',
      warning: '#fa8c16',
      error: '#fa541c',
      background: '#ffffff',
      text: '#262626',
      border: '#fff0cc'
    }
  },
  {
    name: 'aurora-dawn',
    label: '极光晨曦',
    description: '专业温和，健康创新',
    colors: {
      primary: '#389e0d',
      secondary: '#1677ff',
      success: '#52c41a',
      warning: '#d48806',
      error: '#cf1322',
      background: '#ffffff',
      text: '#262626',
      border: '#d9f5bf'
    }
  },
  {
    name: 'lime-fresh',
    label: '青柠清新',
    description: '自然活力，年轻有活力',
    colors: {
      primary: '#a0d911',
      secondary: '#1677ff',
      success: '#73d13d',
      warning: '#fa8c16',
      error: '#fa541c',
      background: '#ffffff',
      text: '#262626',
      border: '#e6fcc5'
    }
  },
  {
    name: 'twilight-purple',
    label: '薄暮紫韵',
    description: '温暖亲和，优雅浪漫',
    colors: {
      primary: '#722ed1',
      secondary: '#13c2c2',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      background: '#ffffff',
      text: '#262626',
      border: '#e5d7fa'
    }
  },
  {
    name: 'dawn-blue',
    label: '黎明蓝调',
    description: '沉稳内敛，探索钻研',
    colors: {
      primary: '#2f54eb',
      secondary: '#eb2f96',
      success: '#13c2c2',
      warning: '#fa8c16',
      error: '#d4380d',
      background: '#ffffff',
      text: '#262626',
      border: '#d6e4ff'
    }
  },
  {
    name: 'ink-black-white',
    label: '水墨黑白',
    description: '简约优雅，现代经典',
    colors: {
      primary: '#434343',
      secondary: '#262626',
      success: '#595959',
      warning: '#8c8c8c',
      error: '#666666',
      background: '#ffffff',
      text: '#1f1f1f',
      border: '#f0f0f0'
    }
  }
]

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUserProfile } = useUser()
  // 默认主题为水墨黑白
  const [currentTheme, setCurrentThemeState] = useState<ThemeName>('ink-black-white')
  const [isLoading] = useState(false)

  // 十六进制颜色转RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0'
  }

  // 应用主题到CSS变量
  const applyTheme = useCallback((themeName: ThemeName) => {
    const theme = themes.find(t => t.name === themeName)
    if (theme) {
      const root = document.documentElement
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value)
        root.style.setProperty(`--theme-${key}-rgb`, hexToRgb(value))
      })
    }
  }, [])

  // 切换主题
  const setTheme = useCallback(async (themeName: ThemeName) => {
    setCurrentThemeState(themeName)
    localStorage.setItem('theme', themeName)
    applyTheme(themeName)

    // 如果用户已登录，尝试更新用户的主题偏好
    if (user) {
      try {
        await updateUserProfile({ theme: themeName })
      } catch (error) {
        console.error('Error updating user theme preference:', error)
        // 即使更新失败，也继续应用主题（使用localStorage保存）
      }
    }
  }, [applyTheme, user, updateUserProfile])

  // 初始化主题
  useEffect(() => {
    try {
      // 登录状态下：只使用用户设置的主题，如果用户没有设置则使用默认主题
      // 未登录状态下：直接使用默认主题
      const initialTheme = user ? (user.theme as ThemeName | undefined) || 'ink-black-white' : 'ink-black-white'
      setCurrentThemeState(initialTheme)
      applyTheme(initialTheme)
    } catch (error) {
      console.error('Error initializing theme:', error)
      setCurrentThemeState('ink-black-white')
      applyTheme('ink-black-white')
    }
  }, [applyTheme, user])

  // 当用户主题偏好变化时，更新当前主题
  useEffect(() => {
    if (user && user.theme) {
      const userTheme = user.theme as ThemeName
      if (userTheme !== currentTheme) {
        setCurrentThemeState(userTheme)
        localStorage.setItem('theme', userTheme)
        applyTheme(userTheme)
      }
    }
  }, [user, user?.theme, currentTheme, applyTheme])

  // 主题上下文值
  const contextValue = useMemo(() => ({
    currentTheme,
    themes,
    setTheme,
    isLoading
  }), [currentTheme, setTheme, isLoading])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// 自定义hook
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext
