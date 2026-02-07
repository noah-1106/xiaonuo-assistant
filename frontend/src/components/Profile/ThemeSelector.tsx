import React from 'react'
import { Card, Radio, Typography, Divider, Tooltip } from 'antd'
import { useTheme } from '../../contexts/ThemeContext'
import { useUser } from '../../contexts/UserContext'
import type { ThemeConfig } from '../../contexts/ThemeContext'

const { Title, Text, Paragraph } = Typography

const ThemeSelector: React.FC = () => {
  const { currentTheme, themes, setTheme } = useTheme()
  const { user } = useUser()

  // 处理主题切换
  const handleThemeChange = (e: any) => {
    const themeName = e.target.value
    setTheme(themeName)
  }

  // 渲染主题预览
  const renderThemePreview = (theme: ThemeConfig) => {
    return (
      <div 
        key={theme.name}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px',
          borderRadius: '8px',
          border: currentTheme === theme.name ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
          transition: 'all 0.3s ease',
          backgroundColor: theme.colors.background,
          color: theme.colors.text
        }}
      >
        {/* 主题颜色预览 */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <div 
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: theme.colors.primary
            }}
          />
          <div 
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: theme.colors.secondary
            }}
          />
          <div 
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: theme.colors.success
            }}
          />
        </div>
        
        {/* 主题信息 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio
              value={theme.name}
              checked={currentTheme === theme.name}
              onChange={handleThemeChange}
            />
            <Text strong>{theme.label}</Text>
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>{theme.description}</Text>
        </div>
      </div>
    )
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Title level={5} style={{ margin: 0 }}>色彩方案</Title>
        </div>
      }
      style={{ 
        marginTop: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
      }}
    >
      <Paragraph style={{ marginBottom: '16px' }}>
        选择一个你喜欢的色彩方案，系统将立即应用并保存你的偏好。
      </Paragraph>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {themes.map(theme => renderThemePreview(theme))}
      </div>
    </Card>
  )
}

export default ThemeSelector
