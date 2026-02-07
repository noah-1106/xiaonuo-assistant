import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, Tabs, message } from 'antd'
import { PhoneOutlined, MailOutlined, SendOutlined, UserOutlined, LockOutlined, ReloadOutlined } from '@ant-design/icons'

const { Title } = Typography

interface LoginFormProps {
  onLoginSuccess: () => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  // 为每个标签页创建独立的Form实例
  const [phoneForm] = Form.useForm()
  const [emailForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  
  // 使用message.useMessage()创建实例
  const [messageApi, contextHolder] = message.useMessage()
  
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('phone') // 'phone', 'email' 或 'password'
  const [captchaId, setCaptchaId] = useState('')

  // 存储验证码图片的URL
  const [captchaUrl, setCaptchaUrl] = useState<string | null>(null)

  // 获取验证码并保存验证码ID和图片URL
  const fetchCaptcha = async () => {
    try {
      // 确保在开发环境下才输出日志，保护用户隐私
      if (import.meta.env.DEV) {
        console.log('开始获取验证码...')
        console.log('API基础URL:', import.meta.env.VITE_API_BASE_URL)
      }
      
      // 检查API基础URL是否配置正确
      if (!import.meta.env.VITE_API_BASE_URL) {
        throw new Error('API基础URL未配置')
      }
      
      // 直接使用完整URL
      const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/captcha`
      
      // 使用最简化的fetch配置
      const response = await fetch(fullUrl)
      
      if (!response.ok) {
        throw new Error(`获取验证码失败，HTTP状态码: ${response.status}`)
      }
      
      // 获取验证码ID
      const id = response.headers.get('X-Captcha-Id')
      if (!id) {
        throw new Error('未获取到验证码ID')
      }
      
      setCaptchaId(id)
      
      // 将响应转换为blob，然后创建URL
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      
      // 清理旧的URL，避免内存泄漏
      if (captchaUrl) {
        URL.revokeObjectURL(captchaUrl)
      }
      
      setCaptchaUrl(url)
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('获取验证码失败:', error)
      }
      messageApi.error('获取验证码失败，请稍后重试')
      // 确保captchaUrl被重置，显示占位符
      setCaptchaUrl(null)
    }
  }

  // 刷新验证码
  const refreshCaptcha = () => {
    fetchCaptcha()
  }

  // 初始化验证码ID
  useEffect(() => {
    fetchCaptcha()
    
    // 组件卸载时清理URL对象
    return () => {
      if (captchaUrl) {
        URL.revokeObjectURL(captchaUrl)
      }
    }
  }, [])

  // 发送验证码
  const sendVerificationCode = async () => {
    let contact: string | undefined
    let type: 'sms' | 'email'
    
    if (activeTab === 'phone') {
      contact = phoneForm.getFieldValue('phone')
      type = 'sms'
      if (!contact) {
        messageApi.error('请输入手机号码')
        return
      }
    } else if (activeTab === 'email') {
      contact = emailForm.getFieldValue('email')
      type = 'email'
      if (!contact) {
        messageApi.error('请输入邮箱地址')
        return
      }
    } else {
      return
    }

    try {
      setLoading(true)
      // 调用后端API发送验证码
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contact,
          type
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '发送验证码失败')
      }
      
      const data = await response.json()
      console.log('发送验证码成功:', data)
      messageApi.success('验证码发送成功')
      
      // 开始倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      messageApi.error(error.message || '验证码发送失败，请稍后重试')
      console.error('发送验证码失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 验证验证码
  const verifyCaptcha = async (captchaText: string) => {
    try {
      // 移除开发环境日志，保护用户隐私
      if (!captchaId) {
        messageApi.error('验证码已失效，请刷新重试')
        fetchCaptcha()
        return false
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/captcha/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: captchaId,
          code: captchaText
        })
      })
      
      if (!response.ok) {
        let errorMessage = '验证码错误，请重试'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || '验证码错误，请重试'
        } catch (jsonError) {
          // 生产环境不记录详细错误日志，保护用户隐私
        }
        messageApi.error(errorMessage)
        // 刷新验证码
        fetchCaptcha()
        return false
      }
      
      return true
    } catch (error: any) {
      // 生产环境不记录详细错误日志，保护用户隐私
      messageApi.error('验证码错误，请重试')
      // 刷新验证码
      fetchCaptcha()
      return false
    }
  }

  // 手机验证码登录/注册
  const handlePhoneLogin = async (values: any) => {
    try {
      setLoading(true)
      
      // 验证验证码
      const captchaValid = await verifyCaptcha(values.captcha)
      if (!captchaValid) {
        return
      }
      
      // 构建登录请求数据
      const loginData = {
        captcha: values.captcha,
        code: values.code,
        captchaId,
        phone: values.phone,
        contact: values.phone
      }
      
      // 调用后端登录API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login-with-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || '登录失败')
      }
      
      const data = await response.json()
      
      // 清除旧的用户缓存
      localStorage.removeItem('user_cache')
      
      // 保存token到localStorage
      localStorage.setItem('token', data.data.token)
      
      messageApi.success('登录成功')
      onLoginSuccess()
    } catch (error: any) {
      messageApi.error(error.message || '登录失败，请检查验证码是否正确')
    } finally {
      setLoading(false)
    }
  }

  // 邮箱验证码登录/注册
  const handleEmailLogin = async (values: any) => {
    try {
      setLoading(true)
      
      // 验证验证码
      const captchaValid = await verifyCaptcha(values.captcha)
      if (!captchaValid) {
        return
      }
      
      // 构建登录请求数据
      const loginData = {
        captcha: values.captcha,
        code: values.code,
        captchaId,
        email: values.email,
        contact: values.email
      }
      
      // 调用后端登录API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login-with-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || '登录失败')
      }
      
      const data = await response.json()
      
      // 清除旧的用户缓存
      localStorage.removeItem('user_cache')
      
      // 保存token到localStorage
      localStorage.setItem('token', data.data.token)
      
      messageApi.success('登录成功')
      onLoginSuccess()
    } catch (error: any) {
      messageApi.error(error.message || '登录失败，请检查验证码是否正确')
    } finally {
      setLoading(false)
    }
  }

  // 用户名密码登录
  const handlePasswordLogin = async (values: { username: string; password: string; captcha: string }) => {
    try {
      setLoading(true)
      
      // 验证验证码
      const captchaValid = await verifyCaptcha(values.captcha)
      if (!captchaValid) {
        return
      }
      
      // 调用后端登录API，包含验证码ID
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login-with-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          captchaId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.message || '登录失败')
      }
      
      const data = await response.json()
      
      // 清除旧的用户缓存
      localStorage.removeItem('user_cache')
      
      // 保存token到localStorage
      localStorage.setItem('token', data.data.token)
      
      messageApi.success('登录成功')
      onLoginSuccess()
    } catch (error: any) {
      messageApi.error(error.message || '登录失败，请检查用户名或密码是否正确')
    } finally {
      setLoading(false)
    }
  }

  // Tabs items配置
  const tabsItems = [
    {
      key: 'phone',
      label: '手机登录',
      children: (
        <Form
          form={phoneForm}
          layout="vertical"
          onFinish={handlePhoneLogin}
        >
          {/* 手机号码输入 */}
          <Form.Item
            name="phone"
            label="手机号码"
            rules={[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
            ]}
            style={{
              marginBottom: 20
            }}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入手机号码"
              maxLength={11}
              style={{
                height: 48,
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                '&:focus': {
                  borderColor: '#1890ff',
                  boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
            style={{
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Input
                style={{
                  width: '70%',
                  height: 48,
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  '&:focus': {
                    borderColor: '#1890ff',
                    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                  }
                }}
                placeholder="请输入验证码"
                maxLength={6}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendVerificationCode}
                disabled={countdown > 0 || loading}
                loading={loading}
                style={{
                  width: '30%',
                  height: 48,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 0.9
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="captcha"
            label="图片验证码"
            rules={[{ required: true, message: '请输入图片验证码' }]}
            style={{
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Input
                placeholder="请输入图片验证码"
                maxLength={6}
                style={{
                  width: '70%',
                  height: 48,
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  '&:focus': {
                    borderColor: '#1890ff',
                    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                  }
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {captchaUrl ? (
                  <img
                    src={captchaUrl}
                    alt="验证码"
                    style={{ 
                      width: '120px', 
                      height: '48px', 
                      cursor: 'pointer',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                    onClick={refreshCaptcha}
                  />
                ) : (
                  <div
                    style={{ 
                      width: '120px', 
                      height: '48px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#666',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#1890ff',
                        color: '#1890ff'
                      }
                    }}
                    onClick={refreshCaptcha}
                  >
                    点击获取验证码
                  </div>
                )}
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={refreshCaptcha}
                  loading={loading}
                  style={{ 
                    padding: '8px', 
                    color: '#1890ff',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(24, 144, 255, 0.1)'
                    }
                  }}
                />
              </div>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%', 
                height: 48, 
                fontSize: 16,
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 0.9
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              登录/注册
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'email',
      label: '邮箱登录',
      children: (
        <Form
          form={emailForm}
          layout="vertical"
          onFinish={handleEmailLogin}
        >
          {/* 邮箱输入 */}
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入正确的邮箱地址' }
            ]}
            style={{
              marginBottom: 20
            }}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入邮箱地址"
              maxLength={50}
              style={{
                height: 48,
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                '&:focus': {
                  borderColor: '#1890ff',
                  boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="验证码"
            rules={[{ required: true, message: '请输入验证码' }]}
            style={{
              marginBottom: 20
            }}
          >
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Input
                style={{
                  width: '70%',
                  height: 48,
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  '&:focus': {
                    borderColor: '#1890ff',
                    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                  }
                }}
                placeholder="请输入验证码"
                maxLength={6}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendVerificationCode}
                disabled={countdown > 0 || loading}
                loading={loading}
                style={{
                  width: '30%',
                  height: 48,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    opacity: 0.9
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </Button>
            </div>
          </Form.Item>

          <Form.Item
            name="captcha"
            label="图片验证码"
            rules={[{ required: true, message: '请输入图片验证码' }]}
            style={{
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Input
                placeholder="请输入图片验证码"
                maxLength={6}
                style={{
                  width: '70%',
                  height: 48,
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  '&:focus': {
                    borderColor: '#1890ff',
                    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                  }
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {captchaUrl ? (
                  <img
                    src={captchaUrl}
                    alt="验证码"
                    style={{ 
                      width: '120px', 
                      height: '48px', 
                      cursor: 'pointer',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                    onClick={refreshCaptcha}
                  />
                ) : (
                  <div
                    style={{ 
                      width: '120px', 
                      height: '48px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#666',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#1890ff',
                        color: '#1890ff'
                      }
                    }}
                    onClick={refreshCaptcha}
                  >
                    点击获取验证码
                  </div>
                )}
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={refreshCaptcha}
                  loading={loading}
                  style={{ 
                    padding: '8px', 
                    color: '#1890ff',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(24, 144, 255, 0.1)'
                    }
                  }}
                />
              </div>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%', 
                height: 48, 
                fontSize: 16,
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 0.9
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              登录/注册
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'password',
      label: '密码登录',
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordLogin}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' }
            ]}
            style={{
              marginBottom: 20
            }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入用户名"
              style={{
                height: 48,
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                '&:focus': {
                  borderColor: '#1890ff',
                  boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' }
            ]}
            style={{
              marginBottom: 20
            }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#1890ff' }} />}
              placeholder="请输入密码"
              style={{
                height: 48,
                borderRadius: '8px',
                border: '1px solid #e8e8e8',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                '&:focus': {
                  borderColor: '#1890ff',
                  boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            label="图片验证码"
            rules={[{ required: true, message: '请输入图片验证码' }]}
            style={{
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Input
                placeholder="请输入图片验证码"
                maxLength={6}
                style={{
                  width: '70%',
                  height: 48,
                  borderRadius: '8px',
                  border: '1px solid #e8e8e8',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  '&:focus': {
                    borderColor: '#1890ff',
                    boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)'
                  }
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {captchaUrl ? (
                  <img
                    src={captchaUrl}
                    alt="验证码"
                    style={{ 
                      width: '120px', 
                      height: '48px', 
                      cursor: 'pointer',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                    onClick={refreshCaptcha}
                  />
                ) : (
                  <div
                    style={{ 
                      width: '120px', 
                      height: '48px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#666',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#1890ff',
                        color: '#1890ff'
                      }
                    }}
                    onClick={refreshCaptcha}
                  >
                    点击获取验证码
                  </div>
                )}
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={refreshCaptcha}
                  loading={loading}
                  style={{ 
                    padding: '8px', 
                    color: '#1890ff',
                    borderRadius: '4px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(24, 144, 255, 0.1)'
                    }
                  }}
                />
              </div>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%', 
                height: 48, 
                fontSize: 16,
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 0.9
                },
                '&:active': {
                  transform: 'scale(0.98)'
                }
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      )
    }
  ]

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(24, 144, 255, 0.05) 0%, rgba(24, 144, 255, 0) 70%)',
      padding: '20px'
    }}>
      {contextHolder}
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 440, 
          borderRadius: '16px', 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(24, 144, 255, 0.1)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
        hoverable
      >
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 32, 
          paddingTop: 16
        }}>
          <div style={{ 
            width: 80, 
            height: 80, 
            margin: '0 auto 20px', 
            borderRadius: '20px', 
            backgroundColor: '#1890ff', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            boxShadow: '0 4px 16px rgba(24, 144, 255, 0.3)'
          }}>
            <span style={{ 
              fontSize: '32px', 
              color: 'white', 
              fontWeight: 'bold'
            }}>诺</span>
          </div>
          <Title 
            level={2} 
            style={{ 
              marginBottom: 8, 
              color: '#333',
              fontWeight: '600'
            }}
          >
            小诺智能助理
          </Title>
          <p style={{ 
            color: '#666', 
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            登录后开始使用智能助理
          </p>
        </div>
        
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} 
          centered 
          items={tabsItems}
          style={{
            marginBottom: 16
          }}
          tabBarStyle={{
            marginBottom: 24
          }}
        />
      </Card>
    </div>
  )
}

export default LoginForm
