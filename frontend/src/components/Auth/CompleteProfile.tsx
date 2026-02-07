import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'

const { Title } = Typography

interface CompleteProfileProps {
  onComplete: () => void
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ onComplete }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 更新用户信息
  const handleUpdateProfile = async (values: {
    nickname: string
    password?: string
    username?: string
    email?: string
  }) => {
    try {
      setLoading(true)
      
      // 调用后端API更新用户信息
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '更新信息失败')
      }
      
      const data = await response.json()
      console.log('更新信息成功:', data)
      
      messageApi.success('信息更新成功')
      onComplete()
    } catch (error: any) {
      messageApi.error(error.message || '更新信息失败，请稍后重试')
      console.error('更新信息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5'
    }}>
      {contextHolder}
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>完善个人信息</Title>
          <p style={{ color: '#666' }}>请完善您的个人信息，以便更好地使用我们的服务</p>
        </div>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { required: true, message: '请输入昵称' },
              { min: 1, max: 50, message: '昵称长度在1到50个字符之间' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入昵称"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 4, max: 20, message: '用户名长度在4到20个字符之间' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名（唯一，不可修改）"
              maxLength={20}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
              用户名是唯一标识符，一旦设置不可修改
            </div>
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请设置密码' },
              { min: 6, max: 20, message: '密码长度在6到20个字符之间' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请设置密码"
              maxLength={20}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' },
              { whitespace: true, message: '邮箱不能为空' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%', height: 40, fontSize: 16 }}
            >
              完成
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CompleteProfile