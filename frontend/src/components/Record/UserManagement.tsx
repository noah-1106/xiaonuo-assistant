import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, message, Spin, Space, Typography, Modal, Form, Input, Select, DatePicker, Card } from 'antd'
import { API_BASE_URL } from '../../utils/env'

const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

interface Plan {
  _id: string
  name: string
  description: string
  price: number
  discountPrice?: number
  duration: number
  features: string[]
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  phone: string
  username?: string
  nickname: string
  email?: string
  role: string
  subscription: {
    status: string
    plan: string
    startDate: string
    endDate: string
  }
  recordCount: number
  createdAt: string
  updatedAt: string
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  // 获取所有套餐
  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans/admin/plans`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取套餐列表失败')
      }

      const data = await response.json()
      setPlans(data.data || [])
    } catch (error: any) {
      messageApi.error(error.message || '获取套餐列表失败')
      // 使用模拟数据
      setPlans([
        {
          _id: '69821d81651a30a82453e9a7',
          name: '免费版',
          description: '免费试用套餐，包含基础功能',
          price: 0,
          discountPrice: 0,
          duration: 7,
          features: ['基础简录管理', '7天免费试用', '最多50条简录'],
          isActive: true,
          isSystem: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
    }
  }

  // 获取所有用户
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取用户列表失败')
      }

      const data = await response.json()
      setUsers(data.data || [])
    } catch (error: any) {
      messageApi.error(error.message || '获取用户列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchPlans()
  }, [])

  // 用户状态标签配置
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'subscribed':
        return <Tag color="green">已订阅</Tag>
      case 'free':
        return <Tag color="blue">免费版</Tag>
      case 'expired':
        return <Tag color="red">已过期</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  // 角色标签配置
  const getRoleTag = (role: string) => {
    switch (role) {
      case 'admin':
        return <Tag color="orange">管理员</Tag>
      case 'user':
        return <Tag color="default">普通用户</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  // 打开编辑用户模态框
  const handleEditUser = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: undefined,
      endDate: undefined
    })
    setIsModalVisible(true)
  }

  // 保存用户套餐修改
  const handleSaveUserPlan = async () => {
    try {
      const values = await form.validateFields()
      
      if (!editingUser) return

      // 处理日期值
      let startDate: string | undefined = undefined
      let endDate: string | undefined = undefined
      
      if (values.startDate) {
        if (typeof values.startDate === 'string') {
          startDate = values.startDate
        } else if (values.startDate.toISOString) {
          startDate = values.startDate.toISOString()
        } else if (values.startDate.format) {
          startDate = values.startDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        }
      }
      
      if (values.endDate) {
        if (typeof values.endDate === 'string') {
          endDate = values.endDate
        } else if (values.endDate.toISOString) {
          endDate = values.endDate.toISOString()
        } else if (values.endDate.format) {
          endDate = values.endDate.format('YYYY-MM-DDTHH:mm:ss.SSSZ')
        }
      }

      const response = await fetch(`${API_BASE_URL}/users/${editingUser._id}/plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan: values.plan,
          status: values.status,
          startDate: startDate,
          endDate: endDate
        })
      })

      if (!response.ok) {
        throw new Error('修改用户套餐失败')
      }

      messageApi.success('修改用户套餐成功')
      setIsModalVisible(false)
      fetchUsers()
    } catch (error: any) {
      messageApi.error(error.message || '修改用户套餐失败')
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string, username: string) => {
    if (window.confirm(`确定要删除用户 ${username} 吗？`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (!response.ok) {
          throw new Error('删除用户失败')
        }

        messageApi.success('删除用户成功')
        fetchUsers()
      } catch (error: any) {
        messageApi.error(error.message || '删除用户失败')
      }
    }
  }

  // 表格列配置
  const columns = [
    {
      title: '用户ID',
      dataIndex: '_id',
      key: '_id',
      render: (id: string) => <Text copyable>{id}</Text>
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => username || '未设置'
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '未设置'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role)
    },
    {
      title: '套餐状态',
      dataIndex: ['subscription', 'status'],
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '当前套餐',
      dataIndex: ['subscription', 'plan'],
      key: 'plan',
      render: (plan: string) => plan || '未设置'
    },
    {
      title: '套餐结束日期',
      key: 'endDate',
      render: (_: any, record: User) => {
        if (record.subscription.endDate) {
          const endDate = new Date(record.subscription.endDate)
          const now = new Date()
          const isExpired = endDate < now
          return (
            <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
              {endDate.toLocaleDateString()}
            </span>
          )
        }
        return '未设置'
      }
    },
    {
      title: '记录数量',
      dataIndex: 'recordCount',
      key: 'recordCount'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button type="text" onClick={() => handleEditUser(record)}>
            编辑套餐
          </Button>
          <Button type="text" danger onClick={() => handleDeleteUser(record._id, record.nickname)}>
            删除用户
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', height: '100%', overflow: 'auto' }}>
      {contextHolder}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#333' }}>用户管理</Title>
          <Button type="primary" onClick={fetchUsers}>
            刷新用户
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="_id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            scroll={{ x: 1400 }}
          />
        </Spin>
      </Card>

      {/* 编辑用户套餐模态框 */}
      <Modal
        title="编辑用户套餐"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalVisible(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveUserPlan}>
            保存
          </Button>
        ]}
        width={600}
      >
        {editingUser && (
          <div>
            <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <div><strong>用户信息：</strong></div>
              <div>昵称：{editingUser.nickname}</div>
              <div>手机号：{editingUser.phone}</div>
              <div>当前套餐：{editingUser.subscription.plan}</div>
              <div>套餐状态：{editingUser.subscription.status}</div>
            </div>
            
            <Form form={form} layout="vertical">
              <Form.Item
                name="plan"
                label="套餐名称"
                rules={[{ required: true, message: '请选择套餐名称' }]}
              >
                <Select placeholder="请选择套餐名称">
                  {plans.map(plan => (
                    <Option key={plan._id} value={plan._id}>
                      {plan.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="status"
                label="套餐状态"
                rules={[{ required: true, message: '请选择套餐状态' }]}
              >
                <Select placeholder="请选择套餐状态">
                  <Option value="free">免费版</Option>
                  <Option value="subscribed">已订阅</Option>
                  <Option value="expired">已过期</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="startDate"
                label="开始日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="endDate"
                label="结束日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement
