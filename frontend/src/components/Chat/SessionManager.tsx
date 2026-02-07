import React, { useState, useEffect } from 'react'
import { Button, message, Modal } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { useChat } from '../../contexts/ChatContext'
import { API_BASE_URL } from '../../utils/env'



const SessionManager: React.FC = () => {
  const { sessions, currentSession, createSession, switchSession, deleteSession } = useChat()

  // 增强角色列表
  const [enhancedRoles, setEnhancedRoles] = useState([
    { value: '', label: '无（仅基础功能）' }
  ])
  
  // 删除按钮状态 - 存储每个会话的删除按钮状态（正常大小还是放大状态）
  const [deleteButtonState, setDeleteButtonState] = useState<Record<string, 'normal' | 'confirm'>>({})
  const [isDeleting, setIsDeleting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 从API获取增强角色列表
  useEffect(() => {
    const fetchEnhancedRoles = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/ai-settings/roles/enhanced`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          const roles = data.data.map((role: { id: string; name: string }) => ({
            value: role.id,
            label: role.name
          }))
          setEnhancedRoles([
            { value: '', label: '无（仅基础功能）' },
            ...roles
          ])
        }
      } catch (error) {
        console.error('获取增强角色列表失败:', error)
      }
    }

    fetchEnhancedRoles()
  }, [])

  // 监听页面点击事件，当点击非删除按钮时重置删除按钮状态
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击的元素是否是删除按钮或其内部元素
      const target = event.target as HTMLElement
      const isDeleteButton = target.closest('.ant-btn-danger')
      
      // 如果点击的不是删除按钮，重置所有删除按钮状态
      if (!isDeleteButton) {
        setDeleteButtonState({})
      }
    }

    // 添加点击事件监听器
    document.addEventListener('mousedown', handleClickOutside)

    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 处理删除会话的函数
  const handleDeleteSession = async (sessionId: string) => {
    setIsDeleting(true)
    
    try {
      await deleteSession(sessionId)
      messageApi.success('会话已删除')
    } catch (error) {
      messageApi.error('删除会话失败，请重试')
    } finally {
      // 恢复删除按钮状态
      setDeleteButtonState(prev => {
        const newState = { ...prev }
        delete newState[sessionId]
        return newState
      })
      setIsDeleting(false)
    }
  }
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {contextHolder}
      {/* 会话列表创建按钮 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={async () => {
            // 直接创建新会话，使用默认名称"新会话"
            await createSession('新会话', null)
            messageApi.success('新会话创建成功')
          }}
          size="small"
          shape="circle"
          tooltip="新建会话"
        />
      </div>
      
      {/* 会话列表 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sessions.map(session => (
          <div
            key={session.sessionId}
            onClick={() => switchSession(session)}
            style={{
              cursor: 'pointer',
              backgroundColor: currentSession?.sessionId === session.sessionId ? '#e6f7ff' : 'transparent',
              borderRight: currentSession?.sessionId === session.sessionId ? '3px solid #1890ff' : 'none',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <div style={{ flex: 1, marginRight: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500 }}>{session.title}</span>
                {session.roles.enhancedRole && (
                  <span style={{ fontSize: '12px', color: '#1890ff' }}>
                    {enhancedRoles.find(r => r.value === session.roles.enhancedRole)?.label || session.roles.enhancedRole}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                  {session.lastMessage || '暂无消息'}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {new Date(session.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <Button 
                  type="text" 
                  danger 
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={(e) => {
                    e.stopPropagation()
                    const currentState = deleteButtonState[session.sessionId] || 'normal'
                    
                    if (currentState === 'normal') {
                      // 点击第一次：按钮变大，进入确认状态
                      setDeleteButtonState(prev => ({
                        ...prev,
                        [session.sessionId]: 'confirm'
                      }))
                    } else {
                      // 点击第二次：执行删除操作，恢复按钮状态
                      handleDeleteSession(session.sessionId)
                    }
                  }}
                  style={{
                    transition: 'all 0.15s ease',
                    transform: deleteButtonState[session.sessionId] === 'confirm' ? 'scale(1.5)' : 'scale(1)',
                    borderRadius: deleteButtonState[session.sessionId] === 'confirm' ? '50%' : '4px',
                    padding: deleteButtonState[session.sessionId] === 'confirm' ? '12px' : '8px',
                    backgroundColor: deleteButtonState[session.sessionId] === 'confirm' ? 'rgba(255, 77, 79, 0.2)' : 'transparent',
                    border: deleteButtonState[session.sessionId] === 'confirm' ? '2px solid #ff4d4f' : 'none'
                  }}
                  title={deleteButtonState[session.sessionId] === 'confirm' ? '确认删除' : '删除会话'}
                />
          </div>
        ))}
        
        {/* 空会话提示 */}
        {sessions.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <p>暂无会话，点击右上角按钮创建新会话</p>
          </div>
        )}
      </div>
      

    </div>
  )
}

export default SessionManager