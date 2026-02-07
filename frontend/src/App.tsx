import React, { useState, useEffect } from 'react'
import { ConfigProvider, theme, App as AntdApp } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import zhCN from 'antd/locale/zh_CN'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import LoginForm from './components/Auth/LoginForm'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeConfig from './components/Theme/ThemeConfig'
import HomePage from './pages/Home/HomePage'
import websocketService from './services/websocketService'

const App: React.FC = () => {
  // 从localStorage读取登录状态，实现页面刷新后保持登录
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true'
  })
  
  // 跟踪是否已经检查过用户信息
  const [profileChecked, setProfileChecked] = useState(false)

  // 检查用户信息（不再强制要求完善个人信息）
  const checkUserProfile = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setProfileChecked(true)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const user = data.data
        
        // 初始化WebSocket服务
        if (user._id && token) {
          websocketService.init(user._id, token)
          console.log('WebSocket服务已初始化')
        }
      }
    } catch (error) {
      console.error('检查用户信息失败:', error)
    } finally {
      setProfileChecked(true)
    }
  }

  // 登录成功回调
  const handleLoginSuccess = () => {
    setIsLoggedIn(true)
    // 将登录状态保存到localStorage
    localStorage.setItem('isLoggedIn', 'true')
    // 检查用户信息
    checkUserProfile()
    // 更新地址栏，移除/login路径，避免用户困惑
    if (window.location.pathname === '/login') {
      window.history.replaceState({}, '', '/')
    }
  }

  // 登出回调
  const handleLogout = () => {
    setIsLoggedIn(false)
    setProfileChecked(false)
    // 关闭WebSocket连接
    websocketService.close()
    console.log('WebSocket连接已关闭')
    // 清除localStorage中的登录状态和token
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('token')
  }

  // 当登录状态改变时，检查用户信息
  useEffect(() => {
    if (isLoggedIn && !profileChecked) {
      checkUserProfile()
    }
  }, [isLoggedIn, profileChecked])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AntdApp>
        <ThemeProvider>
          <ThemeConfig>
            <Router>
              <Routes>
                {/* 登录路由 */}
                <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <LoginForm onLoginSuccess={handleLoginSuccess} />} />
                
                {/* 主页路由 */}
                <Route path="/" element={isLoggedIn ? (
                  <AppLayout onLogout={handleLogout} />
                ) : <HomePage />} />
                
                {/* 捕获所有未匹配的路由 */}
                <Route path="*" element={isLoggedIn ? (
                  <AppLayout onLogout={handleLogout} />
                ) : <HomePage />} />
              </Routes>
            </Router>
          </ThemeConfig>
        </ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App