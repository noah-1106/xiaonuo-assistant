import React, { useState, useEffect, useRef } from 'react'
import { Modal, Card, Typography, Space, Button, message, Spin } from 'antd'
import { WechatOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { QRCodeSVG } from 'qrcode.react'

const { Title, Text } = Typography

interface PaymentQRModalProps {
  visible: boolean
  orderId: string
  codeUrl: string
  totalAmount: number
  onClose: () => void
  onPaymentSuccess: () => void
}

const PaymentQRModal: React.FC<PaymentQRModalProps> = ({ 
  visible, 
  orderId, 
  codeUrl, 
  totalAmount, 
  onClose, 
  onPaymentSuccess 
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const [countdown, setCountdown] = useState(300) // 5分钟倒计时
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState('')
  const pollingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // 使用message.useMessage()创建实例
  const [messageApi, contextHolder] = message.useMessage()

  // 轮询支付状态
  const pollPaymentStatus = async () => {
    if (!visible || paymentStatus !== 'pending') return

    setIsPolling(true)
    try {
      // 调用真实的API来查询支付状态
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orders/${orderId}/pay-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.status === 'ok') {
        if (data.data.status === 'paid') {
          setPaymentStatus('success')
          onPaymentSuccess()
        }
      } else if (data.status === 'subscription_expired') {
        // 处理订阅过期情况
        setError(data.message)
        messageApi.error(data.message)
      }
    } catch (err: any) {
      console.error('查询支付状态失败:', err)
      // 不显示错误信息，避免频繁提示用户
      // 继续轮询，直到超时
    } finally {
      setIsPolling(false)
    }
  }

  // 开始轮询
  useEffect(() => {
    if (visible && paymentStatus === 'pending') {
      // 立即查询一次
      pollPaymentStatus()
      // 然后每3秒查询一次
      pollingIntervalRef.current = setInterval(() => {
        pollPaymentStatus()
      }, 3000)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [visible, paymentStatus, orderId, onPaymentSuccess])

  // 倒计时
  useEffect(() => {
    if (visible && paymentStatus === 'pending' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)

      return () => clearInterval(timer)
    } else if (countdown === 0 && paymentStatus === 'pending') {
    // 超时处理
    setPaymentStatus('failed')
    setError('支付超时，请重新发起支付')
    messageApi.error('支付超时，请重新发起支付')
  }
  }, [visible, paymentStatus, countdown])

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 取消支付
  const handleCancelPayment = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    onClose()
  }

  // 重新支付
  const handleRetryPayment = () => {
    setPaymentStatus('pending')
    setCountdown(300)
    setError('')
    pollPaymentStatus()
  }

  return (
    <Modal
      title="微信支付"
      open={visible}
      onCancel={handleCancelPayment}
      footer={null}
      width={500}
      destroyOnHidden
    >
      {contextHolder}
      {paymentStatus === 'pending' && (
        <Space orientation="vertical" size="large" style={{ width: '100%', alignItems: 'center' }}>
          {/* 支付金额 */}
          <Card
            style={{ textAlign: 'center', width: '100%', boxShadow: 'none' }}
            variant="borderless"
            styles={{ body: { padding: 20 } }}
          >
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: '#ff4d4f' }}>
              ¥{totalAmount.toFixed(2)}
            </Text>
          </Card>

          {/* 微信二维码 */}
          <Card
            style={{ width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}
            variant="borderless"
            styles={{ body: { padding: 20 } }}
          >
            <Space orientation="vertical" size="middle" style={{ alignItems: 'center' }}>
              <WechatOutlined style={{ fontSize: 48, color: '#07C160' }} />
              {codeUrl ? (
                <QRCodeSVG value={codeUrl} size={200} />
              ) : (
                <Spin size="large" />
              )}
              <Text type="secondary">请使用微信扫码支付</Text>
            </Space>
          </Card>

          {/* 支付提示 */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Text strong>支付提示：</Text>
            <ul style={{ textAlign: 'left', marginTop: 12, paddingLeft: 20 }}>
              <li>请使用微信扫描上方二维码</li>
              <li>确认支付金额后完成支付</li>
              <li>支付成功后系统将自动跳转</li>
            </ul>
          </div>

          {/* 倒计时 */}
          <div style={{ width: '100%' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text strong>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                支付超时时间
              </Text>
              <Text strong>{formatCountdown(countdown)}</Text>
            </Space>
          </div>

          {/* 错误信息 */}
          {error && (
            <Text type="danger" style={{ textAlign: 'center' }}>
              {error}
            </Text>
          )}

          {/* 取消按钮 */}
          <Button onClick={handleCancelPayment}>
            取消支付
          </Button>
        </Space>
      )}

      {/* 支付成功 */}
      {paymentStatus === 'success' && (
        <Space orientation="vertical" size="large" style={{ width: '100%', alignItems: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 100, color: '#52c41a' }} />
          <Title level={3} style={{ color: '#52c41a' }}>支付成功</Title>
          <Text>订单号：{orderId}</Text>
          <Text>支付金额：¥{totalAmount.toFixed(2)}</Text>
          <Card
            style={{ width: '100%' }}
            variant="outlined"
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ textAlign: 'center' }}>
              <Text strong>支付成功提示：</Text>
              <ul style={{ textAlign: 'left', marginTop: 12, paddingLeft: 20 }}>
                <li>您的套餐已成功购买</li>
                <li>套餐将立即生效</li>
                <li>请前往"我的套餐"查看详情</li>
              </ul>
            </div>
          </Card>
          <Button type="primary" size="large" onClick={onClose}>
            完成
          </Button>
        </Space>
      )}

      {/* 支付失败 */}
      {paymentStatus === 'failed' && (
        <Space orientation="vertical" size="large" style={{ width: '100%', alignItems: 'center' }}>
          <CloseCircleOutlined style={{ fontSize: 100, color: '#ff4d4f' }} />
          <Title level={3} style={{ color: '#ff4d4f' }}>支付失败</Title>
          <Text>{error || '支付失败，请稍后重试'}</Text>
          <Space size="middle">
            <Button onClick={handleRetryPayment} type="primary">
              重新支付
            </Button>
            <Button onClick={handleCancelPayment}>
              取消
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  )
}

export default PaymentQRModal