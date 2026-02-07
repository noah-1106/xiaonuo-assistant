import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, message, Spin, Space, Typography, Card } from 'antd'
import { API_BASE_URL } from '../../utils/env'

const { Title, Text } = Typography

interface Order {
  _id: string
  orderId: string
  userId: string
  planId: {
    _id: string
    name: string
    duration: number
  }
  amount: number
  quantity: number
  paymentMethod: string
  status: string
  paymentTime: string
  createdAt: string
  updatedAt: string
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 获取所有订单
  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取订单列表失败')
      }

      const data = await response.json()
      setOrders(data.data || [])
    } catch (error: any) {
      messageApi.error(error.message || '获取订单列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // 订单状态标签配置
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待支付</Tag>
      case 'paid':
        return <Tag color="green">已支付</Tag>
      case 'cancelled':
        return <Tag color="red">已取消</Tag>
      case 'refunded':
        return <Tag color="blue">已退款</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  // 表格列配置
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: string) => <Text copyable>{orderId}</Text>
    },
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId: string) => <Text copyable>{userId}</Text>
    },
    {
      title: '套餐信息',
      key: 'plan',
      render: (_: any, record: Order) => (
        <div>
          <div>{record.planId?.name || '未知套餐'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {record.planId?.duration || 0}天 × {record.quantity}份
          </div>
        </div>
      )
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <Text strong>¥{amount.toFixed(2)}</Text>
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        switch (method) {
          case 'wechat':
            return '微信支付'
          case 'alipay':
            return '支付宝'
          default:
            return '其他'
        }
      }
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '支付时间',
      dataIndex: 'paymentTime',
      key: 'paymentTime',
      render: (time: string) => time ? new Date(time).toLocaleString() : '未支付'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          <Button type="text" onClick={() => messageApi.info('查看详情功能开发中')}>
            查看详情
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
          <Title level={3} style={{ margin: 0, color: '#333' }}>订单管理</Title>
          <Button type="primary" onClick={fetchOrders}>
            刷新订单
          </Button>
        </div>
      </Card>

      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Spin spinning={isLoading}>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="_id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default OrderManagement
