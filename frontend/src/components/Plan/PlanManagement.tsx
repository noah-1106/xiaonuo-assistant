import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, Table, Tag, message, Modal, Form, Input, InputNumber, Switch, Space, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '../../utils/env'
import type { Plan } from '../../types'

const { Title, Text } = Typography


const PlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({})
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  // 获取所有套餐
  const fetchPlans = async () => {
    setIsLoading(true)
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
          _id: '1',
          name: '免费版',
          description: '基础功能，适合个人使用',
          price: 0,
          duration: 365,
          features: ['100条消息/月', '基础AI功能', '7天历史记录'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          name: '高级会员',
          description: '高级功能，适合专业用户',
          price: 99,
          discountPrice: 79,
          duration: 30,
          features: ['无限消息', '高级AI功能', '永久历史记录', '优先响应'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '3',
          name: '企业版',
          description: '企业级功能，适合团队使用',
          price: 299,
          discountPrice: 239,
          duration: 30,
          features: ['无限消息', '高级AI功能', '永久历史记录', '团队协作', 'API访问'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  // 显示添加/编辑弹窗
  const showModal = (plan?: Plan) => {
    if (plan) {
      setIsEditing(true)
      setCurrentPlan(plan)
      form.setFieldsValue({
        ...plan,
        features: plan.features.join('\n')
      })
    } else {
      setIsEditing(false)
      setCurrentPlan({})
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  // 隐藏弹窗
  const handleCancel = () => {
    setIsModalVisible(false)
  }

  // 保存套餐
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      // 处理功能列表，将换行符分隔的字符串转换为数组
      const processedValues = {
        ...values,
        features: values.features.split('\n').filter((feature: string) => feature.trim() !== '')
      }

      let response
      // 使用currentPlan._id，因为MongoDB文档的ID字段是_id
      const planId = currentPlan?._id;
      if (isEditing && planId) {
        // 更新套餐
        response = await fetch(`${API_BASE_URL}/plans/admin/plans/${planId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(processedValues)
        })
      } else {
        // 添加新套餐
        response = await fetch(`${API_BASE_URL}/plans/admin/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(processedValues)
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || (isEditing ? '更新套餐失败' : '添加套餐失败'))
      }

      messageApi.success(isEditing ? '更新套餐成功' : '添加套餐成功')
      setIsModalVisible(false)
      fetchPlans() // 刷新套餐列表
    } catch (error: any) {
      console.error('保存套餐失败:', error);
      messageApi.error(error.message || (isEditing ? '更新套餐失败' : '添加套餐失败'))
    }
  }

  // 删除套餐
  const handleDelete = async (id: string) => {
    try {
      console.log('删除套餐请求:', `${API_BASE_URL}/plans/admin/plans/${id}`);
      const response = await fetch(`${API_BASE_URL}/plans/admin/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '删除套餐失败')
      }

      messageApi.success('删除套餐成功')
      fetchPlans() // 刷新套餐列表
    } catch (error: any) {
      console.error('删除套餐失败:', error);
      messageApi.error(error.message || '删除套餐失败')
    }
  }

  // 切换套餐状态
  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      console.log('切换套餐状态请求:', `${API_BASE_URL}/plans/admin/plans/${id}/status`, { isActive });
      const response = await fetch(`${API_BASE_URL}/plans/admin/plans/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '更新套餐状态失败')
      }

      messageApi.success('更新套餐状态成功')
      fetchPlans() // 刷新套餐列表
    } catch (error: any) {
      console.error('切换套餐状态失败:', error);
      messageApi.error(error.message || '更新套餐状态失败')
    }
  }

  // 表格列配置
  const columns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text key="name" strong>{text}</Text>
    },
    {
      title: '价格',
      key: 'price',
      render: (_: any, record: Plan) => (
        <Space key="price-container">
          {record.discountPrice ? (
            <>
              <Text key="discount-price" style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>¥{record.discountPrice}</Text>
              <Text key="original-price" type="secondary" style={{ textDecoration: 'line-through' }}>¥{record.price}</Text>
            </>
          ) : (
            <Text key="single-price" style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>¥{record.price}</Text>
          )}
        </Space>
      )
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => <span key="duration">{duration}天</span>
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag key="status-tag" color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '功能',
      key: 'features',
      render: (_: any, record: Plan) => (
        <ul key="features-list" style={{ margin: 0, paddingLeft: '20px' }}>
          {record.features.map((feature, index) => (
            <li key={index} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
              <CheckCircleOutlined key={`icon-${index}`} style={{ color: '#52c41a', marginRight: '4px' }} />
              <span key={`feature-${index}`}>{feature}</span>
            </li>
          ))}
        </ul>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Plan) => {
        // 使用record._id，因为MongoDB文档的ID字段是_id
        const planId = record._id;
        return (
          <Space key="action-space" size="middle">
            <Button key="edit-btn" type="text" icon={<EditOutlined />} onClick={() => showModal(record)}>
              编辑
            </Button>
            <Button 
              key="delete-btn" 
              type="text" 
              icon={<DeleteOutlined />} 
              danger
              onClick={() => handleDelete(planId)}
            >
              删除
            </Button>
            <Switch 
              key="status-switch"
              checked={record.isActive} 
              onChange={(checked) => handleToggleStatus(planId, checked)}
            />
          </Space>
        );
      }
    }
  ]

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', height: '100%', overflow: 'auto' }}>
      {contextHolder}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#333' }}>套餐管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            添加套餐
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Spin spinning={isLoading}>
          <Table 
            columns={columns} 
            dataSource={plans} 
            rowKey="_id" 
            pagination={{
              pageSize: 10
            }}
          />
        </Spin>
      </Card>

      {/* 添加/编辑套餐弹窗 */}
      <Modal
        title={isEditing ? '编辑套餐' : '添加套餐'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{
            isActive: true,
            duration: 30,
            features: ''
          }}
        >
          <Form.Item
            name="name"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="请输入套餐名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="套餐描述"
            rules={[{ required: true, message: '请输入套餐描述' }]}
          >
            <Input.TextArea placeholder="请输入套餐描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="price"
            label="原价"
            rules={[{ required: true, message: '请输入原价' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入原价"
              min={0}
              step={0.01}
              formatter={(value) => `¥${value}`}
              parser={(value) => parseFloat(value?.replace(/¥/g, '') || '0') as any}
            />
          </Form.Item>

          <Form.Item
            name="discountPrice"
            label="折扣价"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入折扣价（可选）"
              min={0}
              step={0.01}
              formatter={(value) => `¥${value}`}
              parser={(value) => parseFloat(value?.replace(/¥/g, '') || '0') as any}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="时长（天）"
            rules={[{ required: true, message: '请输入时长' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入时长"
              min={1}
              step={1}
            />
          </Form.Item>

          <Form.Item
            name="features"
            label="功能列表（每行一个功能）"
            rules={[{ required: true, message: '请输入功能列表' }]}
          >
            <Input.TextArea 
              placeholder="请输入功能列表，每行一个功能"
              rows={6}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}
            >
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default PlanManagement
