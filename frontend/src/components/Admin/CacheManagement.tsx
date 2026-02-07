import React, { useState, useEffect } from 'react'
import { Card, Typography, Button, Table, Tag, message, Spin, Alert, Statistic, Row, Col, Modal, Descriptions } from 'antd'
import { ReloadOutlined, DeleteOutlined, SettingOutlined, DatabaseOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
const { Column } = Table

const CacheManagement: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null)
  const [contextInfo, setContextInfo] = useState<any>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 获取缓存统计信息
  const fetchCacheStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '获取缓存统计信息失败')
      }

      const data = await response.json()
      setCacheStats(data.data)
    } catch (error: any) {
      messageApi.error(error.message || '获取缓存统计信息失败')
    } finally {
      setLoading(false)
    }
  }

  // 清除本地缓存
  const clearLocalCache = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/local`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '清除本地缓存失败')
      }

      messageApi.success('本地缓存已清除')
      fetchCacheStats()
    } catch (error: any) {
      messageApi.error(error.message || '清除本地缓存失败')
    } finally {
      setLoading(false)
    }
  }

  // 刷新缓存配置
  const refreshCacheConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '刷新缓存配置失败')
      }

      messageApi.success('缓存配置已刷新')
      fetchCacheStats()
    } catch (error: any) {
      messageApi.error(error.message || '刷新缓存配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取上下文缓存详情
  const fetchContextInfo = async (contextId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cache/context/${contextId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '获取上下文缓存详情失败')
      }

      const data = await response.json()
      setContextInfo(data.data)
      setSelectedContextId(contextId)
      setDetailModalVisible(true)
    } catch (error: any) {
      messageApi.error(error.message || '获取上下文缓存详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化获取缓存统计信息
  useEffect(() => {
    fetchCacheStats()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>缓存监控与管理</Title>
          <Text type="secondary">监控和管理系统缓存，优化系统性能</Text>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchCacheStats} 
            loading={loading}
            style={{ marginRight: 8 }}
          >
            刷新统计
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={clearLocalCache}
            loading={loading}
            style={{ marginRight: 8 }}
          >
            清除本地缓存
          </Button>
          <Button 
            icon={<SettingOutlined />} 
            onClick={refreshCacheConfig}
            loading={loading}
          >
            刷新配置
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载缓存统计信息...</div>
          </div>
        ) : cacheStats ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card>
                    <Statistic 
                      title="本地缓存条目数" 
                      value={cacheStats.localCache.size} 
                      prefix={<DatabaseOutlined />}
                      suffix="条"
                      valueStyle={{ color: cacheStats.localCache.size > 0 ? '#1890ff' : '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic 
                      title="缓存状态" 
                      value={cacheStats.localCache.size > 0 ? '活跃' : '空闲'} 
                      prefix={<BarChartOutlined />}
                      valueStyle={{ color: cacheStats.localCache.size > 0 ? '#1890ff' : '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic 
                      title="缓存使用率" 
                      value={Math.round((cacheStats.localCache.size / 100) * 100)} 
                      suffix="%"
                      valueStyle={{ color: cacheStats.localCache.size > 50 ? '#ff4d4f' : '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>
            </div>

            <Title level={4}>本地缓存条目</Title>
            <Table 
              dataSource={cacheStats.localCache.entries.map(([sessionId, contextId]: [string, string], index: number) => ({
                key: index,
                sessionId,
                contextId,
                actions: (
                  <Button 
                    type="link" 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => fetchContextInfo(contextId)}
                  >
                    查看详情
                  </Button>
                )
              }))}
              pagination={{
                pageSize: 10
              }}
            >
              <Column title="序号" dataIndex="key" key="key" render={(text) => text + 1} />
              <Column title="会话ID" dataIndex="sessionId" key="sessionId" ellipsis />
              <Column title="上下文ID" dataIndex="contextId" key="contextId" ellipsis />
              <Column title="操作" dataIndex="actions" key="actions" />
            </Table>
          </>
        ) : (
          <Alert
            title="暂无缓存数据"
            description="系统中暂无缓存数据，或无法获取缓存统计信息"
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 上下文缓存详情模态框 */}
        <Modal
          title="上下文缓存详情"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>
          ]}
          width={800}
        >
          {contextInfo ? (
            <div>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="上下文ID">{selectedContextId}</Descriptions.Item>
                <Descriptions.Item label="模型">{contextInfo.model || '未知'}</Descriptions.Item>
                <Descriptions.Item label="模式">{contextInfo.mode || '未知'}</Descriptions.Item>
                <Descriptions.Item label="TTL">{contextInfo.ttl || '未知'} 秒</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {contextInfo.createdAt ? new Date(contextInfo.createdAt).toLocaleString() : '未知'}
                </Descriptions.Item>
                {contextInfo.truncation_strategy && (
                  <Descriptions.Item label="截断策略" span={2}>
                    {JSON.stringify(contextInfo.truncation_strategy, null, 2)}
                  </Descriptions.Item>
                )}
              </Descriptions>
              
              {contextInfo.messages && contextInfo.messages.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>缓存的消息</Title>
                  {contextInfo.messages.map((msg: any, index: number) => (
                    <Card key={index} style={{ marginBottom: 8 }}>
                      <div>
                        <Tag color={msg.role === 'system' ? 'blue' : msg.role === 'user' ? 'green' : 'purple'}>
                          {msg.role === 'system' ? '系统' : msg.role === 'user' ? '用户' : '助手'}
                        </Tag>
                        <div style={{ marginTop: 8 }}>
                          {typeof msg.content === 'string' ? (
                            <Text>{msg.content}</Text>
                          ) : msg.content && Array.isArray(msg.content) ? (
                            msg.content.map((contentItem: any, contentIndex: number) => (
                              <div key={contentIndex}>
                                {contentItem.type === 'text' && <Text>{contentItem.text}</Text>}
                                {contentItem.type === 'image' && <Text>[图片内容]</Text>}
                                {contentItem.type === 'video' && <Text>[视频内容]</Text>}
                              </div>
                            ))
                          ) : (
                            <Text>无内容</Text>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Spin size="small" />
              <div style={{ marginTop: 16 }}>加载详情中...</div>
            </div>
          )}
        </Modal>

        <Alert
          title="缓存管理说明"
          description="
            1. 本地缓存用于存储会话ID到上下文ID的映射关系
            2. 定期清除过期缓存可以提高系统性能
            3. 刷新缓存配置会重新加载缓存相关的配置信息
            4. 操作缓存可能影响正在进行的对话，请谨慎操作
          "
          type="info"
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  )
}

export default CacheManagement