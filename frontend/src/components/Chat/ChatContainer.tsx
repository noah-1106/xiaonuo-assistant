import React, { useState, useEffect, useRef } from 'react'
import { Select, message, Input, Button } from 'antd'
import { EditOutlined, MessageOutlined, DownOutlined } from '@ant-design/icons'
import { useChat } from '../../contexts/ChatContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SessionManager from './SessionManager'

interface ChatContainerProps {
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
  setVisible?: (visible: boolean) => void
}

const { Option } = Select

const ChatContainer: React.FC<ChatContainerProps> = () => {
  const { currentSession, updateSessionEnhancedRole, messages, updateSessionTitle } = useChat()
  
  // 增强角色列表
  const [enhancedRoles, setEnhancedRoles] = useState([
    { id: '', name: '个人效率（默认）' }
  ])
  
  // 会话标题编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  
  // 菜单显示状态
  const [menuVisible, setMenuVisible] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [messageApi, contextHolder] = message.useMessage()
  

  
  // 初始化时设置默认状态
  useEffect(() => {
    // 当消息列表更新时，自动滚动到底部
    // 这里不需要调用scrollToBottom，因为MessageList组件会自动处理滚动
  }, [messages])
  
  // 点击外部区域关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuVisible(false)
      }
    }
    
    if (menuVisible) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuVisible])
  
  // 从API获取增强角色列表
  useEffect(() => {
    const fetchEnhancedRoles = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai-settings/roles/enhanced`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
        const data = await response.json()
        setEnhancedRoles([
          { id: '', name: '无（仅基础功能）' },
          ...data.data
        ])
      }
      } catch (error) {
        console.error('获取增强角色列表失败:', error)
        messageApi.error('获取增强角色列表失败')
      }
    }
    
    fetchEnhancedRoles()
  }, [])
  
  // 当currentSession变化时，更新editedTitle
  useEffect(() => {
    if (currentSession) {
      setEditedTitle(currentSession.title)
    }
  }, [currentSession])

  // 统一的聊天布局，确保输入框固定在底部
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--theme-background)', overflow: 'hidden', width: '100%' }}>
      {contextHolder}
      {/* 会话标题和角色状态显示 - 固定在顶部 */}
      {currentSession && (
        <div style={{ 
          padding: '12px 16px',
          backgroundColor: 'var(--theme-background)', 
          borderBottom: '1px solid var(--theme-border)',
          display: 'flex',
          alignItems: 'center',
          height: 60,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          flexWrap: 'nowrap',
          minWidth: 0
        }}>
          {/* 左侧：会话标题和编辑图标 */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onPressEnter={() => {
                  if (editedTitle.trim()) {
                    updateSessionTitle(currentSession.sessionId, editedTitle.trim())
                    setIsEditingTitle(false)
                  }
                }}
                onBlur={() => {
                  if (editedTitle.trim()) {
                    updateSessionTitle(currentSession.sessionId, editedTitle.trim())
                  }
                  setIsEditingTitle(false)
                }}
                style={{ 
                  marginRight: '8px', 
                  width: '100%',
                  maxWidth: '220px',
                  borderRadius: '12px',
                  border: '2px solid #1890ff',
                  boxShadow: '0 2px 8px rgba(24, 144, 255, 0.15)',
                }}
                size="large"
                autoFocus
              />
            ) : (
              <>
                <h2 style={{ 
                  margin: '0', 
                  fontSize: '22px', 
                  fontWeight: 700,
                  color: 'var(--theme-text)',
                  letterSpacing: '0.5px',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginRight: '8px'
                }}>{currentSession.title}</h2>
                <EditOutlined
                  style={{ 
                    cursor: 'pointer', 
                    color: 'var(--theme-text)',
                    fontSize: '18px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onClick={() => setIsEditingTitle(!isEditingTitle)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--theme-primary)'
                    e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--theme-text)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                />
              </>
            )}
          </div>
          
          {/* 右侧：会话管理按钮 - 聊天气泡图标 */}
          <div style={{ position: 'relative', zIndex: 1000, marginLeft: '16px' }}>
            <Button 
              type="text" 
              icon={<MessageOutlined />} 
              size="large"
              style={{ 
                fontSize: '24px', 
                color: 'var(--theme-text)',
                borderRadius: '50%',
                padding: '8px',
                transition: 'all 0.3s ease',
                zIndex: 1001,
                position: 'relative'
              }}
              onClick={() => {
                setMenuVisible(!menuVisible);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--theme-primary)'
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--theme-text)'
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            />
            
            {/* 弹出菜单 */}
            {menuVisible && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  zIndex: 1002,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--theme-background)',
                  border: '1px solid var(--theme-border)'
                }}
              >
                <div style={{ width: 300, maxHeight: 500, overflow: 'auto' }}>
                  <SessionManager />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 聊天消息列表 - 占据所有可用空间，允许滚动 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <MessageList />
      </div>
      
      {/* 增强角色选择区域 - 输入框上方 */}
      {currentSession && (
        <div style={{ 
          padding: '8px 16px',
          borderBottom: '1px solid var(--theme-border)',
          backgroundColor: 'var(--theme-background)', // 与聊天列表背景色一致
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* 左侧：能力标签 - 始终显示个人效率，同时显示选择的增强能力 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 始终显示基础能力 - 个人效率 */}
            <span style={{
              color: 'var(--theme-primary)',
              padding: '4px 8px',
              backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)',
              borderRadius: '4px',
              fontSize: '13px',
            }}>
              个人效率
            </span>
            
            {/* 如果选择了增强能力，显示增强能力 */}
            {currentSession.roles.enhancedRole && (
              <span style={{
                color: 'var(--theme-secondary)',
                padding: '4px 8px',
                backgroundColor: 'rgba(var(--theme-secondary-rgb), 0.1)',
                borderRadius: '4px',
                fontSize: '13px',
              }}>
                {enhancedRoles.find(role => role.id === currentSession.roles.enhancedRole)?.name}
              </span>
            )}
          </div>
          
          {/* 初始状态下显示选择框和提示 */}
          {messages.length <= 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* 简洁的提示文字 */}
              <span style={{
                color: 'var(--theme-text)',
                fontSize: '13px',
              }}>
                挂载强化能力
              </span>
              {/* 简洁的选择框 - 只显示增强能力，不显示默认能力 */}
              <Select
                style={{ width: 140 }}
                placeholder="选择增强角色"
                value={currentSession.roles.enhancedRole || ''}
                onChange={(value) => {
                  // 更新会话的增强角色
                  if (currentSession?.sessionId) {
                    updateSessionEnhancedRole(currentSession.sessionId, value)
                  }
                }}
                size="small"
              >
                {/* 只渲染从API获取的增强角色，不渲染默认项 */}
                {enhancedRoles.filter(role => role.id !== '').map(role => (
                  <Option key={role.id} value={role.id}>
                    {role.name}
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}
      


      {/* 消息输入区域 - 固定在底部，添加边框和背景 */}
      <div style={{ backgroundColor: 'var(--theme-background)', padding: '16px 16px', borderTop: '1px solid var(--theme-border)' }}>
        <MessageInput />
      </div>
    </div>
  )
}

export default ChatContainer
