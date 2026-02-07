import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, Switch, Tabs, Select, Alert, message } from 'antd'
import { SaveOutlined, ReloadOutlined, SendOutlined, MailOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Option } = Select

const NotificationConfig: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('sms')
  const [testLoading, setTestLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 获取当前配置
  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notification/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取配置失败')
      }

      const data = await response.json()
      setConfig(data.data)
      
      // 使用后端返回的配置，包括密码字段（虽然它是星号）
      // 这样当用户没有修改密码时，表单会提交后端返回的星号，而不是空字符串
      form.setFieldsValue(data.data)
    } catch (error: any) {
      messageApi.error(error.message || '获取配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setLoading(true)
      console.log('保存配置，发送的数据:', values)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notification/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '保存配置失败')
      }

      const data = await response.json()
      console.log('保存配置成功，返回的数据:', data)
      messageApi.success('保存配置成功')
      setConfig(data.data)
    } catch (error: any) {
      console.error('保存配置失败:', error)
      messageApi.error(error.message || '保存配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 测试短信发送
  const testSms = async () => {
    try {
      const phone = form.getFieldValue(['sms', 'testPhone'])
      if (!phone) {
        messageApi.error('请输入测试手机号码')
        return
      }

      setTestLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notification/test/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ phone })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '测试短信发送失败')
      }

      const data = await response.json()
      messageApi.success(`测试短信发送成功${data.data.testCode ? `，验证码：${data.data.testCode}` : ''}`)
    } catch (error: any) {
      messageApi.error(error.message || '测试短信发送失败')
    } finally {
      setTestLoading(false)
    }
  }

  // 测试邮件发送
  const testEmail = async () => {
    try {
      const email = form.getFieldValue(['email', 'testEmail'])
      if (!email) {
        messageApi.error('请输入测试邮箱地址')
        return
      }

      setTestLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notification/test/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '测试邮件发送失败')
      }

      const data = await response.json()
      messageApi.success(`测试邮件发送成功${data.data.testCode ? `，验证码：${data.data.testCode}` : ''}`)
    } catch (error: any) {
      messageApi.error(error.message || '测试邮件发送失败')
    } finally {
      setTestLoading(false)
    }
  }

  // 重置配置
  const handleReset = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notification/config/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('重置配置失败')
      }

      messageApi.success('重置配置成功')
      fetchConfig()
    } catch (error: any) {
      messageApi.error(error.message || '重置配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化获取配置
  useEffect(() => {
    fetchConfig()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>通知服务配置</Title>
          <Text type="secondary">配置短信和邮件服务，支持验证码发送和通知功能</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'sms',
                label: '短信服务',
                children: (
                  <>
                    <Form.Item label="服务状态">
                      <Form.Item name={['sms', 'enabled']} valuePropName="checked" noStyle>
                        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                      </Form.Item>
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'provider']}
                      label="短信服务商"
                      rules={[{ required: true, message: '请选择短信服务商' }]}
                    >
                      <Select placeholder="请选择短信服务商">
                        <Option value="tencent">腾讯云</Option>
                        <Option value="aliyun">阿里云</Option>
                        <Option value="huawei">华为云</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'secretId']}
                      label="Secret ID"
                      rules={[{ required: true, message: '请输入Secret ID' }]}
                    >
                      <Input placeholder="请输入Secret ID" />
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'secretKey']}
                      label="Secret Key"
                      rules={[{ required: true, message: '请输入Secret Key' }]}
                    >
                      <Input.Password placeholder="请输入Secret Key" />
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'appId']}
                      label="App ID"
                      rules={[{ required: true, message: '请输入App ID' }]}
                    >
                      <Input placeholder="请输入App ID" />
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'signName']}
                      label="签名名称"
                      rules={[{ required: true, message: '请输入签名名称' }]}
                    >
                      <Input placeholder="请输入签名名称" />
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'templateId']}
                      label="模板ID"
                      rules={[{ required: true, message: '请输入模板ID' }]}
                    >
                      <Input placeholder="请输入模板ID" />
                    </Form.Item>

                    <Form.Item
                      name={['sms', 'testPhone']}
                      label="测试手机号码"
                      rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }]}
                    >
                      <Input placeholder="请输入测试手机号码" />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={testSms}
                        loading={testLoading}
                        style={{ marginRight: 8 }}
                      >
                        测试发送
                      </Button>
                      <Text type="secondary">（开发环境下会在控制台显示验证码）</Text>
                    </Form.Item>
                  </>
                )
              },
              {
                key: 'email',
                label: '邮箱服务',
                children: (
                  <>
                    <Form.Item label="服务状态">
                      <Form.Item name={['email', 'enabled']} valuePropName="checked" noStyle>
                        <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                      </Form.Item>
                    </Form.Item>

                    <Form.Item
                      name={['email', 'provider']}
                      label="邮箱服务商"
                      rules={[{ required: true, message: '请选择邮箱服务商' }]}
                    >
                      <Select placeholder="请选择邮箱服务商">
                        <Option value="smtp">SMTP</Option>
                        <Option value="sendgrid">SendGrid</Option>
                        <Option value="mailgun">Mailgun</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name={['email', 'host']}
                      label="SMTP主机"
                      rules={[{ required: true, message: '请输入SMTP主机' }]}
                    >
                      <Input placeholder="请输入SMTP主机" />
                    </Form.Item>

                    <Form.Item
                      name={['email', 'port']}
                      label="SMTP端口"
                      rules={[{ required: true, message: '请输入SMTP端口' }]}
                    >
                      <Input type="number" placeholder="请输入SMTP端口" />
                    </Form.Item>

                    <Form.Item label="安全连接">
                      <Form.Item name={['email', 'secure']} valuePropName="checked" noStyle>
                        <Switch checkedChildren="SSL/TLS" unCheckedChildren="普通" />
                      </Form.Item>
                    </Form.Item>

                    <Form.Item
                      name={['email', 'user']}
                      label="用户名"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input placeholder="请输入用户名" />
                    </Form.Item>

                    <Form.Item
                      name={['email', 'pass']}
                      label="密码"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password placeholder="请输入密码" visibilityToggle />
                    </Form.Item>

                    <Form.Item
                    name={['email', 'from']}
                    label="发件人"
                    rules={[
                      { required: true, message: '请输入发件人邮箱' },
                      {
                        validator: (_, value) => {
                          if (!value) {
                            return Promise.resolve();
                          }
                          // 验证两种格式：纯邮箱地址 或 名称 <邮箱地址>
                          const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
                          const nameEmailRegex = /^.+<[\w-\.]+@([\w-]+\.)+[\w-]{2,4}>$/;
                          
                          if (emailRegex.test(value) || nameEmailRegex.test(value)) {
                            return Promise.resolve();
                          } else {
                            return Promise.reject(new Error('请输入正确的邮箱地址，格式为：邮箱地址 或 名称 <邮箱地址>'));
                          }
                        }
                      }
                    ]}
                  >
                    <Input placeholder="请输入发件人邮箱，格式为：邮箱地址 或 名称 <邮箱地址>" />
                  </Form.Item>

                    <Form.Item
                      name={['email', 'template']}
                      label="邮件模板"
                      rules={[{ required: true, message: '请输入邮件模板' }]}
                    >
                      <Input.TextArea
                        placeholder="请输入邮件模板，{{code}}会被替换为验证码"
                        rows={3}
                      />
                    </Form.Item>

                    <Form.Item
                      name={['email', 'testEmail']}
                      label="测试邮箱"
                      rules={[{ required: true, message: '请输入测试邮箱' }, { type: 'email', message: '请输入正确的邮箱地址' }]}
                    >
                      <Input placeholder="请输入测试邮箱" />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        icon={<MailOutlined />}
                        onClick={testEmail}
                        loading={testLoading}
                        style={{ marginRight: 8 }}
                      >
                        测试发送
                      </Button>
                      <Text type="secondary">（开发环境下会在控制台显示验证码）</Text>
                    </Form.Item>
                  </>
                )
              },
              {
                key: 'verification',
                label: '验证码配置',
                children: (
                  <>
                    <Form.Item
                      name={['verification', 'codeLength']}
                      label="验证码长度"
                      rules={[{ required: true, message: '请输入验证码长度' }]}
                    >
                      <Input type="number" placeholder="请输入验证码长度" min={4} max={8} />
                    </Form.Item>

                    <Form.Item
                      name={['verification', 'expiryMinutes']}
                      label="验证码有效期（分钟）"
                      rules={[{ required: true, message: '请输入验证码有效期' }]}
                    >
                      <Input type="number" placeholder="请输入验证码有效期" min={1} max={30} />
                    </Form.Item>

                    <Form.Item
                      name={['verification', 'resendInterval']}
                      label="重发间隔（秒）"
                      rules={[{ required: true, message: '请输入重发间隔' }]}
                    >
                      <Input type="number" placeholder="请输入重发间隔" min={30} max={300} />
                    </Form.Item>

                    <Form.Item
                      name={['verification', 'maxAttempts']}
                      label="最大尝试次数"
                      rules={[{ required: true, message: '请输入最大尝试次数' }]}
                    >
                      <Input type="number" placeholder="请输入最大尝试次数" min={1} max={10} />
                    </Form.Item>
                  </>
                )
              }
            ]}
          />

          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={loading}>
              保存配置
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={fetchConfig} icon={<ReloadOutlined />}>
              刷新配置
            </Button>
            <Button danger style={{ marginLeft: 8 }} onClick={handleReset}>
              重置为默认值
            </Button>
          </Form.Item>
        </Form>

        <Alert
          title="配置说明"
          description="
            1. 短信服务需要在对应云服务商处申请账号和模板
            2. 邮箱服务需要开启SMTP服务并获取授权密码
            3. 测试功能仅在开发环境下显示验证码
            4. 配置保存后立即生效
          "
          type="info"
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  )
}

export default NotificationConfig