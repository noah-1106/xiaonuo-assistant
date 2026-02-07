import React, { useState } from 'react'
import { Card, Avatar, Typography, Button, Modal, Form, Input, message } from 'antd'
import { EditOutlined, UserOutlined, PhoneOutlined, CalendarOutlined, TagOutlined, CheckOutlined, CloseOutlined, MailOutlined, KeyOutlined, UserAddOutlined, UploadOutlined } from '@ant-design/icons'
import { useUser } from '../../contexts/UserContext'
import ThemeSelector from './ThemeSelector'

const { Title, Text } = Typography

// 编辑表单子组件
const EditProfileForm: React.FC<{
  user: any
  isLoading: boolean
  onSave: (values: any) => void
  onCancel: () => void
}> = ({ user, isLoading, onSave, onCancel }) => {
  const [form] = Form.useForm()
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(user?.avatar || null)
  const [messageApi, contextHolder] = message.useMessage()
  const [sendingCode, setSendingCode] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)
  const [codeType, setCodeType] = React.useState<'phone' | 'email' | ''>('')
  const [verifyToken, setVerifyToken] = React.useState<string>('')
  
  // 发送验证码
  const sendVerificationCode = async (type: 'phone' | 'email') => {
    try {
      setSendingCode(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '发送验证码失败')
      }
      
      messageApi.success(data.message)
      setCodeType(type)
      setCountdown(60)
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (error) {
      messageApi.error('发送验证码失败，请稍后重试')
      console.error('发送验证码失败:', error)
    } finally {
      setSendingCode(false)
    }
  }
  
  // 验证验证码
  const verifyCode = async (code: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: codeType, code })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '验证失败')
      }
      
      messageApi.success('验证成功')
      setVerifyToken(data.data.verifyToken)
      return true
    } catch (error) {
      messageApi.error('验证失败，请检查验证码')
      console.error('验证验证码失败:', error)
      return false
    }
  }

  // 当用户数据变化时，更新表单值
  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        nickname: user.nickname || user.username,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar
      })
      setAvatarPreview(user.avatar || null)
    }
  }, [user, form])

  // 处理编辑取消
  const handleCancel = () => {
    onCancel()
    form.resetFields()
    setAvatarFile(null)
    setAvatarPreview(user?.avatar || '')
  }

  // 处理头像文件上传
  const handleAvatarUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      messageApi.error('请选择图片文件')
      return false
    }

    // 检查文件大小
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      messageApi.error('文件大小不能超过2MB')
      return false
    }

    // 创建预览
    const preview = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(preview)
    
    // 更新表单中的avatar值
    form.setFieldsValue({ avatar: preview })
    
    return false // 阻止自动上传
  }

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          try {
            // 如果有验证码，先验证
            if (values.verificationCode) {
              const isValid = await verifyCode(values.verificationCode)
              if (!isValid) {
                return
              }
            }
            
            // 提交数据，包含verifyToken
            onSave({ ...values, avatarFile, verifyToken })
          } catch (error) {
            console.error('表单提交失败:', error)
          }
        }}
      >
      <Form.Item
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input placeholder="请输入用户名" />
      </Form.Item>

      <Form.Item
        name="nickname"
        label="昵称"
        rules={[{ required: true, message: '请输入昵称' }]}
      >
        <Input placeholder="请输入昵称" />
      </Form.Item>

      <Form.Item
        name="phone"
        label="手机号"
        rules={[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
        ]}
      >
        <Input placeholder="请输入手机号" />
      </Form.Item>

      <Form.Item
        name="email"
        label="邮箱"
        rules={[
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
      >
        <Input placeholder="请输入邮箱地址" />
      </Form.Item>

      {/* 验证码输入区域 */}
      <Form.Item
        label="验证码"
        tooltip="修改手机号、邮箱或密码时需要验证码验证"
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Form.Item
            name="verificationCode"
            noStyle
            rules={[
              {
                validator: (_, value) => {
                  // 如果修改了手机号、邮箱或密码，需要验证码
                  const values = form.getFieldsValue()
                  if ((values.phone || values.email || values.password) && !value) {
                    return Promise.reject(new Error('请输入验证码'))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input placeholder="请输入验证码" />
          </Form.Item>
          <Button
            type="primary"
            loading={sendingCode}
            disabled={countdown > 0}
            onClick={() => {
              const values = form.getFieldsValue()
              if (values.phone) {
                sendVerificationCode('phone')
              } else if (values.email) {
                sendVerificationCode('email')
              } else {
                messageApi.error('请先填写手机号或邮箱')
              }
            }}
          >
            {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
          </Button>
        </div>
      </Form.Item>

      <Form.Item
        name="avatar"
        label="头像"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Avatar size={80} src={avatarPreview || null} icon={<UserOutlined />} />
          <div>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleAvatarUpload(e.target.files[0])
                }
              }}
            />
            <Button
              type="text"
              icon={<UploadOutlined />}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              上传头像
            </Button>
            {avatarFile && (
              <Button
                type="text"
                danger
                onClick={() => {
                  setAvatarFile(null)
                  setAvatarPreview(user?.avatar || null)
                  form.setFieldsValue({ avatar: user?.avatar || null })
                }}
              >
                取消
              </Button>
            )}
          </div>
        </div>
      </Form.Item>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
        <Button
          icon={<CloseOutlined />}
          onClick={handleCancel}
          loading={isLoading}
        >
          取消
        </Button>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          htmlType="submit"
          loading={isLoading}
        >
          保存
        </Button>
      </div>
    </Form>
    </>
  )
}

// 密码修改表单子组件
const ChangePasswordForm: React.FC<{
  isLoading: boolean
  onSave: (values: any) => void
  onCancel: () => void
  hasPassword: boolean
}> = ({ isLoading, onSave, onCancel, hasPassword }) => {
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [sendingCode, setSendingCode] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)
  const [codeType, setCodeType] = React.useState<'phone' | 'email' | ''>('')
  const [verifyToken, setVerifyToken] = React.useState<string>('')

  // 处理编辑取消
  const handleCancel = () => {
    onCancel()
    form.resetFields()
  }
  
  // 发送验证码
  const sendVerificationCode = async (type: 'phone' | 'email') => {
    try {
      setSendingCode(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '发送验证码失败')
      }
      
      messageApi.success(data.message)
      setCodeType(type)
      setCountdown(60)
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (error) {
      messageApi.error('发送验证码失败，请稍后重试')
      console.error('发送验证码失败:', error)
    } finally {
      setSendingCode(false)
    }
  }
  
  // 验证验证码
  const verifyCode = async (code: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: codeType, code })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '验证失败')
      }
      
      messageApi.success('验证成功')
      setVerifyToken(data.data.verifyToken)
      return true
    } catch (error) {
      messageApi.error('验证失败，请检查验证码')
      console.error('验证验证码失败:', error)
      return false
    }
  }

  return (
    <>
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          try {
            // 验证验证码
            if (values.verificationCode) {
              const isValid = await verifyCode(values.verificationCode)
              if (!isValid) {
                return
              }
            }
            
            // 提交数据，包含verifyToken
            onSave({ ...values, verifyToken })
          } catch (error) {
            console.error('表单提交失败:', error)
          }
        }}
      >
        {hasPassword && (
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
        )}

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              }
            })
          ]}
        >
          <Input.Password placeholder="请确认新密码" />
        </Form.Item>

        {/* 验证码输入区域 */}
        <Form.Item
          label="验证码"
          tooltip="修改密码需要验证码验证"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Form.Item
                name="verificationCode"
                noStyle
                rules={[
                  {
                    validator: (_, value) => {
                      if (!value) {
                        return Promise.reject(new Error('请输入验证码'))
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Input placeholder="请输入验证码" />
              </Form.Item>
              <Button
                type="primary"
                loading={sendingCode}
                disabled={countdown > 0}
                onClick={() => {
                  sendVerificationCode(codeType || 'phone')
                }}
              >
                {countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="codeType"
                  checked={codeType === 'phone'}
                  onChange={() => setCodeType('phone')}
                />
                短信验证码
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  name="codeType"
                  checked={codeType === 'email'}
                  onChange={() => setCodeType('email')}
                />
                邮箱验证码
              </label>
            </div>
          </div>
        </Form.Item>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
        <Button
          icon={<CloseOutlined />}
          onClick={handleCancel}
          loading={isLoading}
        >
          取消
        </Button>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          htmlType="submit"
          loading={isLoading}
        >
          保存
        </Button>
      </div>
    </Form>
    </>
  )
}

const Profile: React.FC = () => {
  const { user, updateUserProfile, isLoading, error, clearError } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  
  // 头像上传状态
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null)
  
  // 字段编辑状态管理
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [verificationModalVisible, setVerificationModalVisible] = useState(false)
  const [verificationType, setVerificationType] = useState<'phone' | 'email'>('phone')
  const [verificationCode, setVerificationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [verifyToken, setVerifyToken] = useState('')
  const [pendingUpdate, setPendingUpdate] = useState<{ field: string; value: string } | null>(null)
  
  // 监听错误状态变化
  React.useEffect(() => {
    if (error) {
      // 处理资源冲突错误
      if (error.message.includes('资源冲突') || error.message.includes('已被使用') || error.message.includes('已注册')) {
        const currentField = pendingUpdate?.field || editingField
        if (currentField === 'username') {
          messageApi.error('哎呀，您选择的用户名已经被使用了，换一个吧~')
        } else if (currentField === 'phone') {
          messageApi.error('您输入的手机号码已经被注册了，您可以使用其他手机号码或更换账户登录')
        } else if (currentField === 'email') {
          messageApi.error('您输入的邮箱地址已经被注册了，您可以使用其他邮箱地址或更换账户登录')
        } else {
          messageApi.error('更新失败，请稍后重试')
        }
      } else if (error.message !== '更新个人信息失败') {
        // 其他错误
        messageApi.error(error.message)
      }
      
      // 清除错误状态
      setTimeout(() => {
        clearError()
      }, 3000)
    }
  }, [error, editingField, pendingUpdate, messageApi, clearError])

  // 处理编辑保存
  const handleSave = async (values: any) => {
    try {
      let avatarUrl = values.avatar
      
      // 如果有新的头像文件，先上传到TOS
      if (values.avatarFile) {
        const formData = new FormData()
        formData.append('file', values.avatarFile)
        formData.append('fileType', 'avatar')
        
        // 调用上传API将头像上传到TOS
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/files/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        })
        
        if (!response.ok) {
          throw new Error('头像上传失败')
        }
        
        const data = await response.json()
        avatarUrl = data.data.url
      }
      
      // 更新用户资料
      await updateUserProfile({
        ...values,
        avatar: avatarUrl
      })
      
      messageApi.success('个人信息更新成功')
      setIsEditing(false)
    } catch (error: any) {
      messageApi.error(error.message || '更新失败，请稍后重试')
      console.error('更新失败:', error)
    }
  }

  // 处理头像上传
  const handleAvatarUpload = (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      messageApi.error('请选择图片文件')
      return false
    }

    // 检查文件大小
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      messageApi.error('文件大小不能超过2MB')
      return false
    }

    // 创建预览
    const preview = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(preview)
    
    return false // 阻止自动上传
  }

  // 处理头像保存
  const handleAvatarSave = async () => {
    if (!avatarFile) return

    try {
      const formData = new FormData()
      formData.append('file', avatarFile)
      formData.append('fileType', 'avatar')
      
      // 调用上传API将头像上传到TOS
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('头像上传失败')
      }
      
      const data = await response.json()
      const avatarUrl = data.data.url
      
      // 更新用户资料
      await updateUserProfile({ avatar: avatarUrl })
      
      messageApi.success('头像更新成功')
      setIsAvatarModalVisible(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error: any) {
      messageApi.error(error.message || '更新失败，请稍后重试')
      console.error('更新失败:', error)
    }
  }

  // 处理头像取消
  const handleAvatarCancel = () => {
    setIsAvatarModalVisible(false)
    setAvatarFile(null)
    setAvatarPreview(user?.avatar || null)
  }

  // 处理密码修改
  const handleChangePassword = async (values: any) => {
    try {
      // 构建密码修改请求数据
      const passwordData: { newPassword: any; oldPassword?: any } = {
        newPassword: values.newPassword
      };
      
      // 如果有旧密码，添加到请求数据中
      if (values.oldPassword) {
        passwordData.oldPassword = values.oldPassword;
      }
      
      // 调用后端修改密码API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '修改密码失败')
      }

      messageApi.success('密码修改成功')
      setIsChangingPassword(false)
    } catch (error: any) {
      messageApi.error(error.message || '修改密码失败，请稍后重试')
    }
  }

  // 开始编辑字段
  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field)
    setEditingValue(currentValue)
  }

  // 取消编辑字段
  const cancelEditing = () => {
    setEditingField(null)
    setEditingValue('')
  }

  // 发送验证码
  const sendVerificationCode = async (type: 'phone' | 'email') => {
    try {
      setSendingCode(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          type, 
          contact: editingValue 
        })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '发送验证码失败')
      }
      
      messageApi.success('验证码已发送，5分钟内有效')
      setVerificationType(type)
      setCountdown(60)
      
      // 倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (error) {
      messageApi.error('发送验证码失败，请稍后重试')
      console.error('发送验证码失败:', error)
    } finally {
      setSendingCode(false)
    }
  }

  // 验证验证码
  const verifyCode = async (code: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: verificationType, code })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '验证失败')
      }
      
      messageApi.success('验证成功')
      setVerifyToken(data.data.verifyToken)
      return true
    } catch (error) {
      messageApi.error('验证失败，请检查验证码')
      console.error('验证验证码失败:', error)
      return false
    }
  }

  // 保存编辑的字段
  const saveField = async () => {
    if (!editingField || !editingValue) return

    // 验证输入
    if (editingField === 'phone' && !/^1[3-9]\d{9}$/.test(editingValue)) {
      messageApi.error('请输入正确的手机号')
      return
    }

    if (editingField === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingValue)) {
      messageApi.error('请输入有效的邮箱地址')
      return
    }

    // 对于手机号和邮箱，需要验证
    if (editingField === 'phone' || editingField === 'email') {
      // 发送验证码
      await sendVerificationCode(editingField)
      // 保存待更新的字段和值
      setPendingUpdate({ field: editingField, value: editingValue })
      // 打开验证码模态框
      setVerificationModalVisible(true)
    } else {
      // 其他字段直接更新
      const success = await updateUserProfile({ [editingField]: editingValue })
      // 检查是否成功
      if (success) {
        messageApi.success('更新成功')
        setEditingField(null)
        setEditingValue('')
      } else {
        // 错误已经在useEffect中处理，这里不需要重复处理
        // 保持编辑状态
      }
    }
  }

  // 处理验证码提交
  const handleVerificationSubmit = async () => {
    if (!verificationCode) {
      messageApi.error('请输入验证码')
      return
    }

    try {
      // 直接调用后端验证接口
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: verificationType, code: verificationCode })
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || '验证失败')
      }
      
      messageApi.success('验证成功')
      const token = data.data.verifyToken
      
      if (pendingUpdate) {
        // 验证成功，更新用户资料
        const success = await updateUserProfile({ 
          [pendingUpdate.field]: pendingUpdate.value,
          verifyToken: token 
        })
        
        // 检查是否成功
        if (success) {
          // 显示成功消息
          messageApi.success('更新成功')
          setVerificationModalVisible(false)
          setVerificationCode('')
          setPendingUpdate(null)
          setEditingField(null)
          setEditingValue('')
        } else {
          // 错误已经在useEffect中处理，这里不需要重复处理
          // 保持验证码模态框打开状态和编辑状态
        }
      }
    } catch (error: any) {
      messageApi.error(error.message || '验证失败，请检查验证码')
      console.error('验证验证码失败:', error)
    }
  }

  // 个人信息列表
  const personalInfo = [
    {
      title: '手机号',
      content: user?.phone || '未设置',
      icon: <PhoneOutlined />
    },
    {
      title: '邮箱',
      content: user?.email || '未设置',
      icon: <MailOutlined />
    },
    {
      title: '昵称',
      content: user?.nickname || user?.username || '未设置',
      icon: <UserAddOutlined />
    }
  ]

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px', backgroundColor: '#f0f2f5', height: '100%', overflow: 'auto' }}>
      {/* 合并的个人信息卡片 */}
      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        {/* 头像和基本信息 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsAvatarModalVisible(true)}>
            <Avatar size={80} src={user?.avatar || null} icon={<UserOutlined />} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UploadOutlined style={{ color: '#fff', fontSize: 12 }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingField === 'username' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  style={{ maxWidth: '200px' }}
                  placeholder="请输入用户名"
                />
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  onClick={saveField}
                  loading={isLoading}
                />
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  onClick={cancelEditing}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Title level={3} style={{ margin: 0, color: '#333' }}>{user?.username || '未设置'}</Title>
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  size="small"
                  onClick={() => startEditing('username', user?.username || '')}
                />
              </div>
            )}
          </div>
          <Button 
            type="text" 
            icon={<KeyOutlined />} 
            size="small"
            onClick={() => setIsChangingPassword(true)}
          >
            {user?.hasPassword ? '修改密码' : '设置密码'}
          </Button>
        </div>
          </div>
        </div>

        {/* 详细信息列表 */}
        <div>
          {personalInfo.map((item, index) => {
            const fieldName = item.title === '手机号' ? 'phone' : 
                            item.title === '邮箱' ? 'email' : 
                            item.title === '昵称' ? 'nickname' : '';
            
            return (
              <div key={index} style={{ padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px', color: '#666' }}>
                  {item.icon}
                  <Text strong>{item.title}:</Text>
                </div>
                
                {editingField === fieldName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      style={{ maxWidth: '300px' }}
                      placeholder={`请输入${item.title}`}
                    />
                    <Button 
                      type="text" 
                      icon={<CheckOutlined />} 
                      onClick={saveField}
                      loading={isLoading}
                    />
                    <Button 
                      type="text" 
                      icon={<CloseOutlined />} 
                      onClick={cancelEditing}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Text>{item.content}</Text>
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      size="small"
                      onClick={() => startEditing(fieldName, item.content)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 主题选择器 */}
      <ThemeSelector />

      {/* 编辑资料弹窗 */}
      <Modal
        title="编辑个人资料"
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        footer={null}
        width={500}
      >
        {isEditing && (
          <EditProfileForm
            user={user}
            isLoading={isLoading}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        )}
      </Modal>

      {/* 修改密码弹窗 */}
      <Modal
        title={user?.hasPassword ? "修改密码" : "设置密码"}
        open={isChangingPassword}
        onCancel={() => setIsChangingPassword(false)}
        footer={null}
        width={500}
      >
        {isChangingPassword && (
          <ChangePasswordForm
            isLoading={isLoading}
            onSave={handleChangePassword}
            onCancel={() => setIsChangingPassword(false)}
            hasPassword={user?.hasPassword || false}
          />
        )}
      </Modal>

      {/* 验证码模态框 */}
      <Modal
        title="验证码验证"
        open={verificationModalVisible}
        onCancel={() => {
          setVerificationModalVisible(false)
          setVerificationCode('')
          setPendingUpdate(null)
          setEditingField(null)
          setEditingValue('')
        }}
        footer={null}
        width={400}
      >
        <div style={{ padding: '20px 0' }}>
          <p style={{ marginBottom: '20px' }}>验证码已发送，5分钟内有效</p>
          
          <Form layout="vertical">
            <Form.Item
              label="验证码"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="请输入验证码"
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  loading={sendingCode}
                  disabled={countdown > 0}
                  onClick={() => sendVerificationCode(verificationType)}
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '重发验证码'}
                </Button>
              </div>
            </Form.Item>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <Button
                onClick={() => {
                  setVerificationModalVisible(false)
                  setVerificationCode('')
                  setPendingUpdate(null)
                  setEditingField(null)
                  setEditingValue('')
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                onClick={handleVerificationSubmit}
                loading={isLoading}
              >
                确认
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* 头像上传模态框 */}
      <Modal
        title="上传头像"
        open={isAvatarModalVisible}
        onCancel={handleAvatarCancel}
        footer={null}
        width={400}
      >
        <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar size={120} src={avatarPreview || null} icon={<UserOutlined />} style={{ marginBottom: '20px' }} />
          
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            id="avatar-upload"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleAvatarUpload(e.target.files[0])
              }
            }}
          />
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => document.getElementById('avatar-upload')?.click()}
            style={{ marginBottom: '16px' }}
          >
            选择图片
          </Button>
          
          {avatarFile && (
            <Button
              type="text"
              danger
              onClick={() => {
                setAvatarFile(null)
                setAvatarPreview(user?.avatar || null)
              }}
              style={{ marginBottom: '20px' }}
            >
              取消选择
            </Button>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%', marginTop: '20px' }}>
            <Button
              onClick={handleAvatarCancel}
              loading={isLoading}
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleAvatarSave}
              loading={isLoading}
              disabled={!avatarFile}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </>
  )
}

export default Profile
