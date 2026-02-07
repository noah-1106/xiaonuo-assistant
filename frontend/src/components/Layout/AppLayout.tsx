import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { Button } from 'antd'
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons'
import ChatLayout from '../Chat/ChatLayout'
import RecordManagement from '../Record/RecordManagement'

interface AppLayoutProps {
  onLogout: () => void
}

const AppLayout: React.FC<AppLayoutProps> = ({ onLogout }) => {
  // 移动端适配状态
  const [isMobile, setIsMobile] = useState(false)
  
  // 左侧聊天区域宽度，默认占据页面1/4
  const [leftWidth, setLeftWidth] = useState(Math.max(300, window.innerWidth / 4)) // 初始直接计算，确保最小宽度
  const [isResizing, setIsResizing] = useState(false)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  
  // 移动端显示记录管理中心的状态（移到条件渲染之前，确保Hooks顺序一致）
  const [showRecordManagement, setShowRecordManagement] = useState(false)
  
  // 使用useEffect确保在组件挂载后获取正确的窗口宽度
  useEffect(() => {
    // 监听窗口大小变化，但不重置宽度，保持用户调整后的宽度
    const handleWindowResize = () => {
      // 当窗口大小变化时，保持左侧面板与窗口宽度的比例
      // 计算调整后的宽度，保持与窗口宽度的比例不变
      if (!isResizing) {
        // 确保window.innerWidth不为0或NaN
        if (window.innerWidth > 0) {
          // 计算当前左侧宽度占窗口宽度的比例
          const currentRatio = leftWidth / window.innerWidth
          // 根据新窗口宽度计算新的左侧宽度
          const newWidth = window.innerWidth * currentRatio
          // 确保新宽度有效且在合理范围内
          if (!isNaN(newWidth) && isFinite(newWidth)) {
            setLeftWidth(newWidth)
          }
        }
      }
    }
    
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [isResizing, leftWidth])
  
  // 最小和最大宽度限制：左侧聊天区域最小1/4，最大1/2
  const [minLeftWidth, setMinLeftWidth] = useState(Math.max(300, window.innerWidth > 0 ? window.innerWidth / 4 : 300)) // 左侧最小1/4，确保至少300px
  const [maxLeftWidth, setMaxLeftWidth] = useState(Math.min(window.innerWidth - 500, window.innerWidth > 0 ? window.innerWidth / 2 : 600)) // 左侧最大1/2，确保右侧至少500px
  
  // 监听窗口大小变化，更新最小和最大宽度限制
  useLayoutEffect(() => {
    const updateWidthLimits = () => {
      // 确保window.innerWidth不为0或NaN
      if (window.innerWidth > 0) {
        // 更新最小宽度为窗口宽度的1/4，确保至少300px
        setMinLeftWidth(Math.max(300, window.innerWidth / 4))
        // 更新最大宽度为窗口宽度的1/2，确保右侧至少500px
        setMaxLeftWidth(Math.min(window.innerWidth - 500, window.innerWidth / 2))
      }
    }
    
    // 初始化设置
    updateWidthLimits()
    // 监听窗口大小变化
    window.addEventListener('resize', updateWidthLimits)
    return () => window.removeEventListener('resize', updateWidthLimits)
  }, [])
  
  // 监听窗口大小变化
  useEffect(() => {
    const checkMobile = () => {
      // 设置最小宽度，防止触发移动端布局
      if (window.innerWidth < 800) {
        setIsMobile(true)
      } else {
        setIsMobile(false)
      }
    }

    // 初始化检查
    checkMobile()
    // 添加窗口大小变化监听
    window.addEventListener('resize', checkMobile)
    // 清理监听
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // 处理鼠标按下事件，开始调整大小
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setStartX(e.clientX)
    setStartWidth(leftWidth)
  }
  
  // 处理触摸事件，开始调整大小
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    setIsResizing(true)
    setStartX(e.touches[0].clientX)
    setStartWidth(leftWidth)
  }
  
  // 处理鼠标移动事件，调整左侧聊天区域宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      // 计算鼠标移动的距离
      const deltaX = e.clientX - startX
      // 新宽度 = 初始宽度 + 鼠标移动距离
      let newWidth = startWidth + deltaX
      // 限制宽度范围：确保左侧和右侧都有足够的最小宽度
      const maxAllowedWidth = window.innerWidth > 0 ? window.innerWidth - 500 : 600 // 右侧最小500px，确保window.innerWidth有效
      newWidth = Math.max(300, Math.min(maxAllowedWidth, newWidth))
      // 确保新宽度有效且在合理范围内
      if (!isNaN(newWidth) && isFinite(newWidth)) {
        setLeftWidth(newWidth)
      }
    }
    
    // 处理鼠标释放事件，结束调整大小
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    
    // 添加全局事件监听
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    // 清理事件监听
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, startX, startWidth])

  // 确保左侧宽度不会导致右侧过窄，同时设置最小宽度限制
  const minLeftWidthFixed = 300; // 左侧聊天区域最小宽度，根据会话列表小菜单的宽度设置
  const maxAllowedWidth = window.innerWidth > 0 ? window.innerWidth - 500 : 600; // 右侧最小500px，确保window.innerWidth有效
  const calculatedLeftWidth = Math.max(minLeftWidthFixed, Math.min(!isNaN(leftWidth) && isFinite(leftWidth) ? leftWidth : minLeftWidthFixed, maxAllowedWidth));
  
  // 为整个应用添加响应式布局设置
  return (
    <div style={{ height: '100vh', display: 'flex', backgroundColor: 'var(--theme-background)', overflow: 'hidden' }}>
      {/* 左侧聊天区域 - 包含会话管理（点击显示）和聊天容器 */}
      <div style={{
        width: isMobile ? '100%' : calculatedLeftWidth,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
        flexShrink: 0
      }}>
        <ChatLayout />
        
        {/* 拖动调整宽度的手柄 - 位于左侧面板右侧，仅在非移动端显示 */}
        {!isMobile && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              cursor: isResizing ? 'col-resize' : 'ew-resize',
              backgroundColor: isResizing ? '#1890ff' : '#f0f0f0',
              boxShadow: isResizing ? '0 0 10px rgba(24, 144, 255, 0.6)' : 'none',
              zIndex: 10,
              transition: 'all 0.2s ease'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        )}
      </div>
      
      {/* 右侧记录管理面板 - 仅在非移动端显示 */}
      {!isMobile && (
        <div
          ref={rightPanelRef}
          style={{
            flex: 1,
            height: '100%',
            backgroundColor: 'var(--theme-background)',
            overflow: 'hidden',
            boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <RecordManagement onLogout={onLogout} />
        </div>
      )}
    </div>
  )
}

export default AppLayout
