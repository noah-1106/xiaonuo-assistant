import React, { useContext, useMemo } from 'react'
import { ConfigProvider, theme, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import ThemeContext from '../../contexts/ThemeContext'
import type { ReactNode } from 'react'

interface ThemeConfigProps {
  children: ReactNode
}

const ThemeConfig: React.FC<ThemeConfigProps> = ({ children }) => {
  const themeContext = useContext(ThemeContext)
  
  // 确保主题上下文存在
  if (!themeContext) {
    return <>{children}</>
  }
  
  const { currentTheme, themes } = themeContext
  
  // 找到当前主题的配置
  const currentThemeConfig = useMemo(() => {
    return themes.find((theme) => theme.name === currentTheme)
  }, [currentTheme, themes])
  
  // 配置Ant Design主题
  const antdTheme = useMemo(() => {
    if (currentThemeConfig) {
      return {
        token: {
          colorPrimary: currentThemeConfig.colors.primary,
          colorSuccess: currentThemeConfig.colors.success,
          colorWarning: currentThemeConfig.colors.warning,
          colorError: currentThemeConfig.colors.error,
          colorInfo: currentThemeConfig.colors.secondary,
          colorBgLayout: currentThemeConfig.colors.background,
          colorTextBase: currentThemeConfig.colors.text,
          colorBorder: currentThemeConfig.colors.border,
        },
        algorithm: theme.defaultAlgorithm,
      }
    }
    return {
      algorithm: theme.defaultAlgorithm,
    }
  }, [currentThemeConfig])
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={antdTheme}
    >
      <App>
        {children}
      </App>
    </ConfigProvider>
  )
}

export default ThemeConfig
