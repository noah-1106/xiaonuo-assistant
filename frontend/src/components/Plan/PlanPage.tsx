import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, Tag, message, Spin, Space } from 'antd'
import { CalendarOutlined, TagOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useUser } from '../../contexts/UserContext'
import type { Plan } from '../../types'
import OrderModal from './OrderModal'
import PaymentMethodModal from './PaymentMethodModal'
import PaymentQRModal from './PaymentQRModal'

const { Title, Text } = Typography

const PlanPage: React.FC = () => {
  const { user, fetchUserInfo } = useUser()
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // 订单相关状态
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [orderModalVisible, setOrderModalVisible] = useState(false)
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false)
  const [paymentQRModalVisible, setPaymentQRModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<any>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>({
    codeUrl: '',
    outTradeNo: '',
    totalAmount: 0
  })
  const [messageApi, contextHolder] = message.useMessage()

  // 获取所有可用套餐
  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/plans/`, {
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

  // 当前用户套餐
  const currentPlan = user?.plan


  // 提交订单
  const handleSubmitOrder = async (planId: string, quantity: number) => {
    if (!selectedPlan) return
    
    setIsLoading(true)
    try {
      // 创建订单
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          paymentMethod: 'wechat',
          quantity
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.errors?.[0]?.msg || '创建订单失败')
      }

      const data = await response.json()
      const order = data.data
      
      setCurrentOrder(order)
      setOrderModalVisible(false)
      setPaymentMethodModalVisible(true)
    } catch (error: any) {
      messageApi.error(error.message || '创建订单失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 选择支付方式
  const handleSelectPayment = async (paymentMethod: string, orderId: string) => {
    if (paymentMethod !== 'wechat') {
      messageApi.error('暂不支持该支付方式')
      return
    }
    
    setIsLoading(true)
    try {
      // 生成微信支付二维码
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${orderId}/wechat/qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('生成支付二维码失败响应:', { status: response.status, data: errorData })
        throw new Error(errorData.message || `生成支付二维码失败 (${response.status})`)
      }

      const data = await response.json()
      const paymentResult = data.data
      
      setPaymentInfo({
        codeUrl: paymentResult.codeUrl,
        outTradeNo: paymentResult.outTradeNo,
        totalAmount: paymentResult.totalAmount
      })
      
      setPaymentMethodModalVisible(false)
      setPaymentQRModalVisible(true)
    } catch (error: any) {
      console.error('生成支付二维码失败:', error)
      messageApi.error(error.message || '生成支付二维码失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 支付成功处理
  const handlePaymentSuccess = async () => {
    setPaymentQRModalVisible(false)
    messageApi.success('支付成功')
    
    // 更新用户信息
    if (fetchUserInfo) {
      fetchUserInfo()
    }
    
    // 刷新套餐列表
    fetchPlans()
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', height: '100%', overflow: 'auto' }}>
      {contextHolder}
      {/* 当前套餐信息卡片 */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Text style={{ fontSize: '16px', color: '#333', fontWeight: 'bold' }}>当前套餐：</Text>
          <Text style={{ fontSize: '16px', color: '#333' }}>
            {currentPlan?.name || '未设置'}{currentPlan?.endDate && `，到期时间：${new Date(currentPlan.endDate).toLocaleString()}`}
          </Text>
          {currentPlan?.status && (
            <Tag color={currentPlan.status === 'active' ? 'green' : 'red'}>
              {currentPlan.status === 'active' ? '已激活' : '已过期'}
            </Tag>
          )}
        </div>
      </Card>

      {/* 可用套餐列表 */}
      <Card title="可用套餐" style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Spin spinning={isLoading}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {plans.map(plan => {
              const planId = plan._id;
              return (
                <Card 
                  key={planId} 
                  style={{ 
                    borderRadius: '12px',
                    border: planId === currentPlan?.planId ? '2px solid #1890ff' : '1px solid #f0f0f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
                  }}
                >
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Title level={4} style={{ margin: 0, color: '#333' }}>{plan.name}</Title>
                    <Text type="secondary" style={{ display: 'block', margin: '8px 0 16px' }}>
                      {plan.description}
                    </Text>
                    <div style={{ margin: '16px 0' }}>
                      <Space>
                        {plan.discountPrice ? (
                          <>
                            <Text key="discount-price" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                              ¥{plan.discountPrice}
                            </Text>
                            <Text key="original-price" type="secondary" style={{ textDecoration: 'line-through' }}>
                              ¥{plan.price}
                            </Text>
                          </>
                        ) : (
                          <Text key="single-price" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                            ¥{plan.price}
                          </Text>
                        )}
                        <Text key="duration" type="secondary">
                          /{plan.duration}天
                        </Text>
                      </Space>
                    </div>
                    <div style={{ margin: '16px 0' }}>
                      <Tag color={plan.isActive ? 'green' : 'red'}>
                        {plan.isActive ? '可购买' : '已下架'}
                      </Tag>
                    </div>
                  </div>
                  <div style={{ margin: '16px 0' }}>
                    <Title level={5} style={{ margin: '0 0 12px', color: '#666' }}>套餐包含</Title>
                    <ul key="plan-features" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {plan.features.map((feature, index) => (
                        <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <CheckCircleOutlined key={`icon-${index}`} style={{ color: '#52c41a', fontSize: '16px' }} />
                          <Text key={`feature-${index}`}>{feature}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    type={planId === currentPlan?.planId ? 'default' : 'primary'} 
                    block
                    disabled={!plan.isActive}
                    onClick={() => {
                      if (planId !== currentPlan?.planId) {
                        setSelectedPlan(plan)
                        setOrderModalVisible(true)
                      }
                    }}
                  >
                    {planId === currentPlan?.planId ? '当前套餐' : '立即购买'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </Spin>
      </Card>

      {/* 订单弹窗 */}
      <OrderModal
        visible={orderModalVisible}
        plan={selectedPlan}
        onClose={() => setOrderModalVisible(false)}
        onSubmit={handleSubmitOrder}
      />

      {/* 支付方式选择弹窗 */}
      <PaymentMethodModal
        visible={paymentMethodModalVisible}
        orderId={currentOrder?._id || ''}
        totalAmount={currentOrder?.amount || 0}
        onClose={() => setPaymentMethodModalVisible(false)}
        onSelectPayment={handleSelectPayment}
      />

      {/* 支付二维码弹窗 */}
      <PaymentQRModal
        visible={paymentQRModalVisible}
        orderId={currentOrder?._id || ''}
        codeUrl={paymentInfo.codeUrl}
        totalAmount={paymentInfo.totalAmount}
        onClose={() => setPaymentQRModalVisible(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

export default PlanPage
