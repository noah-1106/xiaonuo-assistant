import React, { useState } from 'react'
import { Modal, Radio, Button, Card, Typography, Space } from 'antd'
import { WechatOutlined, AlipayOutlined, CreditCardOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface PaymentMethodModalProps {
  visible: boolean
  orderId: string
  totalAmount: number
  onClose: () => void
  onSelectPayment: (paymentMethod: string, orderId: string) => void
}

type PaymentMethod = 'wechat' | 'alipay' | 'card'

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ 
  visible, 
  orderId, 
  totalAmount, 
  onClose, 
  onSelectPayment 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat')

  // 支付方式选项
  const paymentOptions = [
    {
      value: 'wechat' as PaymentMethod,
      label: (
        <Space>
          <WechatOutlined style={{ fontSize: 24, color: '#07C160' }} />
          <Text strong>微信支付</Text>
        </Space>
      ),
      description: '推荐使用微信扫码支付',
      icon: <WechatOutlined style={{ fontSize: 48, color: '#07C160' }} />
    },
    {
      value: 'alipay' as PaymentMethod,
      label: (
        <Space>
          <AlipayOutlined style={{ fontSize: 24, color: '#1677FF' }} />
          <Text strong>支付宝</Text>
        </Space>
      ),
      description: '暂未开通，敬请期待',
      icon: <AlipayOutlined style={{ fontSize: 48, color: '#1677FF' }} />,
      disabled: true
    },
    {
      value: 'card' as PaymentMethod,
      label: (
        <Space>
          <CreditCardOutlined style={{ fontSize: 24, color: '#FF6B6B' }} />
          <Text strong>银行卡支付</Text>
        </Space>
      ),
      description: '暂未开通，敬请期待',
      icon: <CreditCardOutlined style={{ fontSize: 48, color: '#FF6B6B' }} />,
      disabled: true
    }
  ]

  // 选择支付方式
  const handleSelectPayment = () => {
    onSelectPayment(paymentMethod, orderId)
  }

  return (
    <Modal
      title="选择支付方式"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        {/* 订单金额信息 */}
        <Card
          style={{ textAlign: 'center' }}
          variant="borderless"
          styles={{ body: { padding: 20 } }}
        >
          <Title level={4} style={{ marginBottom: 16 }}>订单金额</Title>
          <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#ff4d4f' }}>
            ¥{totalAmount.toFixed(2)}
          </Text>
        </Card>

        {/* 支付方式选择 */}
        <div>
          <Title level={5} style={{ marginBottom: 16 }}>请选择支付方式</Title>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              {paymentOptions.map(option => (
                <Radio
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  style={{ width: '100%' }}
                >
                  <Card
                    style={{ 
                      width: '100%', 
                      border: `2px solid ${paymentMethod === option.value ? '#1890ff' : '#f0f0f0'}`,
                      transition: 'all 0.3s',
                      cursor: option.disabled ? 'not-allowed' : 'pointer'
                    }}
                    variant="borderless"
                    styles={{ body: { padding: 20 } }}
                  >
                    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div>
                        {option.icon}
                      </div>
                      <div style={{ flex: 1, marginLeft: 24 }}>
                        {option.label}
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                          {option.description}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {/* 操作按钮 */}
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>取消</Button>
          <Button 
            type="primary" 
            size="large"
            onClick={handleSelectPayment}
            disabled={paymentMethod !== 'wechat'}
          >
            确认支付
          </Button>
        </Space>
      </Space>
    </Modal>
  )
}

export default PaymentMethodModal