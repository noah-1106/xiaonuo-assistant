import React, { useState } from 'react'
import { Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { SettingOutlined, UserOutlined, LogoutOutlined, MenuOutlined, LeftOutlined, RobotOutlined, TagOutlined, ShoppingOutlined, TeamOutlined, MailOutlined, OrderedListOutlined, FileTextOutlined } from '@ant-design/icons'
import ChatLayout from '../Chat/ChatLayout'
import RecordList from './RecordList'
import Profile from '../Profile/Profile'
import AISettings from '../AISettings/AISettings'
import NotificationConfig from '../Admin/NotificationConfig'
import LogManagement from '../Admin/LogManagement'
import PlanPage from '../Plan/PlanPage'
import PlanManagement from '../Plan/PlanManagement'
import OrderManagement from './OrderManagement'
import UserManagement from './UserManagement'

import { useUser } from '../../contexts/UserContext'

interface RecordManagementProps {
  onLogout?: () => void
}

const RecordManagement: React.FC<RecordManagementProps> = ({ onLogout }) => {
  const { user } = useUser()
  // 状态管理：控制当前显示的页面
  const [activePage, setActivePage] = useState<'records' | 'profile' | 'ai-settings' | 'notification-config' | 'plan' | 'plan-management' | 'order-management' | 'user-management' | 'logs'>('records')

  // 菜单配置 - 根据用户角色动态生成
  const menuItems: MenuProps['items'] = [
    {
      key: 'records',
      label: '记录管理',
      icon: <MenuOutlined />,
      onClick: () => {
        setActivePage('records')
      }
    },
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
      onClick: () => {
        setActivePage('profile')
      }
    },
    {
      key: 'plan',
      label: '我的套餐',
      icon: <TagOutlined />,
      onClick: () => {
        setActivePage('plan')
      }
    },

    // 只有管理员才能看到的选项
    ...(user?.role === 'admin' ? [
      {
        key: 'ai-settings',
        label: 'AI设置',
        icon: <RobotOutlined />,
        onClick: () => {
          setActivePage('ai-settings')
        }
      },
      {
        key: 'notification-config',
        label: '通知配置',
        icon: <MailOutlined />,
        onClick: () => {
          setActivePage('notification-config')
        }
      },
      {
        key: 'plan-management',
        label: '套餐管理',
        icon: <TagOutlined />,
        onClick: () => {
          setActivePage('plan-management')
        }
      },
      {
        key: 'order-management',
        label: '订单管理',
        icon: <ShoppingOutlined />,
        onClick: () => {
          setActivePage('order-management')
        }
      },
      {
        key: 'user-management',
        label: '用户管理',
        icon: <TeamOutlined />,
        onClick: () => {
          setActivePage('user-management')
        }
      },
      {
        key: 'logs',
        label: '系统日志',
        icon: <FileTextOutlined />,
        onClick: () => {
          setActivePage('logs')
        }
      }
    ] : []),
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        onLogout?.()
      }
    }
  ]

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部标题和操作栏 */}
      <div style={{ 
          padding: '12px 20px', 
          borderBottom: '1px solid var(--theme-border)', 
          backgroundColor: 'var(--theme-background)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 60, // 固定高度，与左侧一致
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
        <div style={{ 
          fontSize: '22px', 
          fontWeight: 700,
          color: 'var(--theme-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          letterSpacing: '0.5px',
          flexWrap: 'wrap'
        }}>
          {activePage === 'profile' && (
            <Button 
              type="text" 
              icon={<LeftOutlined />} 
              onClick={() => setActivePage('records')}
              size="large"
              style={{ 
                color: 'var(--theme-text)',
                borderRadius: '12px',
                padding: '6px 16px',
                fontSize: '14px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--theme-primary)'
                e.currentTarget.style.backgroundColor = 'var(--theme-background)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--theme-text)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              返回
            </Button>
          )}
          {activePage === 'records' ? '小诺：你的个人效率助理' : '个人中心'}
          
          {/* 订阅到期提示 */}
          {user?.plan && activePage === 'records' && (
            <div style={{ fontSize: '14px', fontWeight: 'normal', color: '#faad14', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(() => {
                const endDate = new Date(user.plan.endDate)
                const now = new Date()
                const daysDiff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                
                if (daysDiff > 7) {
                  // 距离到期还有7天以上，不显示提示
                  return null
                } else if (daysDiff > 0) {
                  // 距离到期还有1-7天
                  return (
                    <>
                      <span>（您当前订阅套餐还有{daysDiff}天过期，</span>
                      <Button 
                        type="text" 
                        style={{ padding: 0, color: '#1890ff' }} 
                        onClick={() => setActivePage('plan')}
                      >
                        立即续费
                      </Button>
                      <span>）</span>
                    </>
                  )
                } else {
                  // 已过期
                  const daysSinceExpired = Math.abs(daysDiff)
                  return (
                    <>
                      <span>（订阅已过期，您的记录将在{30 - daysSinceExpired}天后清空，</span>
                      <Button 
                        type="text" 
                        style={{ padding: 0, color: '#1890ff' }} 
                        onClick={() => setActivePage('plan')}
                      >
                        续费以继续使用
                      </Button>
                      <span>）</span>
                    </>
                  )
                }
              })()}
            </div>
          )}
        </div>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            size="large"
            style={{ 
              fontSize: '24px',
              color: 'var(--theme-text)',
              borderRadius: '50%',
              padding: '8px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--theme-primary)'
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.backgroundColor = 'var(--theme-background)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--theme-text)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          />
        </Dropdown>
      </div>
      
      {/* 内容区域 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activePage === 'records' ? (
          <RecordList />
        ) : activePage === 'profile' ? (
          <Profile />
        ) : activePage === 'plan' ? (
          <PlanPage />
        ) : activePage === 'ai-settings' && user?.role === 'admin' ? (
          <AISettings />
        ) : activePage === 'notification-config' && user?.role === 'admin' ? (
          <NotificationConfig />
        ) : activePage === 'plan-management' && user?.role === 'admin' ? (
          <PlanManagement />
        ) : activePage === 'order-management' && user?.role === 'admin' ? (
          <OrderManagement />
        ) : activePage === 'user-management' && user?.role === 'admin' ? (
          <UserManagement />
        ) : activePage === 'logs' && user?.role === 'admin' ? (
          <LogManagement />
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
            您没有权限访问此页面
          </div>
        )}
      </div>
    </div>
  )
}

export default RecordManagement
