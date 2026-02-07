import React, { useState } from 'react'
import { Modal, Form, InputNumber, Button, Card, Typography, Space } from 'antd'
import { ShoppingCartOutlined, DollarOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { Plan } from '../../types'

const { Title, Text } = Typography

interface OrderModalProps {
  visible: boolean
  plan: Plan | null
  onClose: () => void
  onSubmit: (planId: string, quantity: number) => void
}

const OrderModal: React.FC<OrderModalProps> = ({ visible, plan, onClose, onSubmit }) => {
  const [form] = Form.useForm()
  const [quantity, setQuantity] = useState(1)

  // 计算总金额
  const calculateTotal = () => {
    if (!plan) return 0
    const price = plan.discountPrice || plan.price
    return price * quantity
  }

  // 提交订单
  const handleSubmit = () => {
    if (plan) {
      onSubmit(plan._id, quantity)
    }
  }

  // 重置表单
  const handleReset = () => {
    setQuantity(1)
    form.resetFields()
  }

  return (
    <Modal
      title="确认订单"
      open={visible}
      onCancel={() => {
        handleReset()
        onClose()
      }}
      footer={null}
      width={600}
    >
      {plan && (
        <div>
          {/* 套餐信息卡片 */}
          <Card
            style={{ marginBottom: 24 }}
            variant="borderless"
            styles={{ body: { padding: 20 } }}
          >
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ marginBottom: 16, color: '#333' }}>{plan.name}</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  {plan.description}
                </Text>
              </div>

              {/* 价格信息 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {plan.discountPrice ? (
                  <Space>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ff4d4f' }}>
                      ¥{plan.discountPrice.toFixed(2)}
                    </Text>
                    <Text type="secondary" style={{ textDecoration: 'line-through' }}>
                      ¥{plan.price.toFixed(2)}
                    </Text>
                  </Space>
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                    ¥{plan.price.toFixed(2)}
                  </Text>
                )}
                <Text type="secondary">/份</Text>
              </div>

              {/* 套餐时长 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#faad14' }} />
                <Text>套餐时长：{plan.duration}天</Text>
              </div>

              {/* 套餐包含 */}
              <div>
                <Text strong>套餐包含：</Text>
                <ul style={{ marginTop: 8, paddingLeft: 24, marginBottom: 0 }}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <CheckCircleOutlined key={`icon-${index}`} style={{ color: '#52c41a', fontSize: 16 }} />
                      <Text key={`feature-${index}`}>{feature}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            </Space>
          </Card>

          {/* 订单信息表单 */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="quantity"
              label="购买数量"
              rules={[{ required: true, message: '请输入购买数量' }]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <ShoppingCartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                <InputNumber
                  min={1}
                  max={12}
                  value={quantity}
                  onChange={(value) => setQuantity(value || 1)}
                  style={{ width: '100%' }}
                  placeholder="请输入购买数量"
                  formatter={(value) => `${value} 份`}
                  parser={(value) => parseInt(value?.replace(/\s?份/g, '') || '0', 10)}
                />
              </Space.Compact>
            </Form.Item>

            {/* 总金额 */}
            <div style={{ 
              marginBottom: 24, 
              padding: 16, 
              backgroundColor: '#f6ffed', 
              borderRadius: 8, 
              border: '1px solid #b7eb8f' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>总金额：</Text>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{calculateTotal().toFixed(2)}
                </Text>
              </div>
              <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                购买{quantity}份，每份{plan.discountPrice || plan.price}元
              </Text>
            </div>

            {/* 操作按钮 */}
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  handleReset()
                  onClose()
                }}>
                  取消
                </Button>
                <Button type="primary" onClick={handleSubmit} size="large">
                  提交订单
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  )
}

export default OrderModal