import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Slider, Button, Table, Tag, Modal, message, Switch, Space, Typography } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { API_BASE_URL } from '../../utils/env'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input

// 意图识别规则接口
interface IntentRule {
  id: string
  keywords: string[]
  intent: string
  confidence: number
  enabled: boolean
  description: string
}

// 意图统计接口
interface IntentStats {
  intent: string
  count: number
  accuracy: number
  avgProcessingTime: number
  lastDetected: string
}

const IntentRecognitionOptimization: React.FC = () => {
  const [form] = Form.useForm()
  const [intentRules, setIntentRules] = useState<IntentRule[]>([])
  const [intentStats, setIntentStats] = useState<IntentStats[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRule, setEditingRule] = useState<IntentRule | null>(null)
  const [ruleModalVisible, setRuleModalVisible] = useState(false)
  const [testMessage, setTestMessage] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()

  // 获取AI设置
  const fetchAISettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('获取AI设置失败')
      }

      const data = await response.json()
      form.setFieldsValue({
        systemPrompt: data.data.systemPrompt,
        temperature: data.data.temperature * 100,
        topP: data.data.topP,
        contextRounds: data.data.contextRounds,
        contextLength: data.data.contextLength
      })
    } catch (error) {
      messageApi.error('获取AI设置失败')
      console.error('获取AI设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取意图识别规则
  const fetchIntentRules = async () => {
    setLoading(true)
    try {
      // 这里应该调用实际的API，现在使用模拟数据
      const mockRules: IntentRule[] = [
        {
          id: '1',
          keywords: ['创建', '添加', '新建'],
          intent: 'record_create',
          confidence: 0.85,
          enabled: true,
          description: '创建新简录的意图'
        },
        {
          id: '2',
          keywords: ['修改', '更新', '编辑'],
          intent: 'record_update',
          confidence: 0.8,
          enabled: true,
          description: '更新现有简录的意图'
        },
        {
          id: '3',
          keywords: ['删除', '移除', '清理'],
          intent: 'record_delete',
          enabled: true,
          confidence: 0.9,
          description: '删除简录的意图'
        },
        {
          id: '4',
          keywords: ['查询', '搜索', '查找'],
          intent: 'record_query',
          enabled: true,
          confidence: 0.75,
          description: '查询简录的意图'
        }
      ]
      setIntentRules(mockRules)
    } catch (error) {
      messageApi.error('获取意图规则失败')
      console.error('获取意图规则失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取意图统计数据
  const fetchIntentStats = async () => {
    setLoading(true)
    try {
      // 这里应该调用实际的API，现在使用模拟数据
      const mockStats: IntentStats[] = [
        {
          intent: 'record_create',
          count: 125,
          accuracy: 0.92,
          avgProcessingTime: 120,
          lastDetected: new Date().toISOString()
        },
        {
          intent: 'record_update',
          count: 89,
          accuracy: 0.88,
          avgProcessingTime: 145,
          lastDetected: new Date().toISOString()
        },
        {
          intent: 'record_delete',
          count: 45,
          accuracy: 0.95,
          avgProcessingTime: 98,
          lastDetected: new Date().toISOString()
        },
        {
          intent: 'record_query',
          count: 203,
          accuracy: 0.85,
          avgProcessingTime: 110,
          lastDetected: new Date().toISOString()
        },
        {
          intent: 'unknown',
          count: 32,
          accuracy: 0,
          avgProcessingTime: 85,
          lastDetected: new Date().toISOString()
        }
      ]
      setIntentStats(mockStats)
    } catch (error) {
      messageApi.error('获取意图统计数据失败')
      console.error('获取意图统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 初始化数据
  useEffect(() => {
    fetchAISettings()
    fetchIntentRules()
    fetchIntentStats()
  }, [])

  // 保存AI设置
  const handleSaveSettings = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: values.systemPrompt,
          temperature: values.temperature / 100,
          topP: values.topP,
          contextRounds: values.contextRounds,
          contextLength: values.contextLength
        })
      })

      if (!response.ok) {
        throw new Error('保存AI设置失败')
      }

      messageApi.success('保存AI设置成功')
      await fetchAISettings()
    } catch (error) {
      messageApi.error('保存AI设置失败')
      console.error('保存AI设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 测试意图识别
  const handleTestIntent = async () => {
    if (!testMessage) {
      messageApi.warning('请输入测试消息')
      return
    }

    setTesting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/intent-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: testMessage })
      })

      if (!response.ok) {
        throw new Error('测试意图识别失败')
      }

      const data = await response.json()
      setTestResult(data.data)
    } catch (error) {
      // 使用模拟数据
      setTestResult({
        intent: 'record_create',
        confidence: 0.92,
        keywords: ['创建', '客户'],
        explanation: '检测到关键词"创建"和"客户"，匹配到"record_create"意图'
      })
      messageApi.error('测试意图识别失败，使用模拟数据')
      console.error('测试意图识别失败:', error)
    } finally {
      setTesting(false)
    }
  }

  // 打开规则编辑模态框
  const openRuleModal = (rule?: IntentRule) => {
    if (rule) {
      setEditingRule(rule)
    } else {
      setEditingRule(null)
    }
    setRuleModalVisible(true)
  }

  // 关闭规则编辑模态框
  const closeRuleModal = () => {
    setRuleModalVisible(false)
    setEditingRule(null)
  }

  // 保存意图规则
  const saveIntentRule = async (rule: IntentRule) => {
    setLoading(true)
    try {
      // 这里应该调用实际的API，现在使用模拟数据
      if (editingRule) {
        // 更新现有规则
        setIntentRules(prev => prev.map(r => r.id === rule.id ? rule : r))
        messageApi.success('更新意图规则成功')
      } else {
        // 创建新规则
        const newRule = {
          ...rule,
          id: Date.now().toString()
        }
        setIntentRules(prev => [...prev, newRule])
        messageApi.success('创建意图规则成功')
      }
      closeRuleModal()
    } catch (error) {
      messageApi.error('保存意图规则失败')
      console.error('保存意图规则失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 删除意图规则
  const deleteIntentRule = async (ruleId: string) => {
    setLoading(true)
    try {
      // 这里应该调用实际的API，现在使用模拟数据
      setIntentRules(prev => prev.filter(r => r.id !== ruleId))
      messageApi.success('删除意图规则成功')
    } catch (error) {
      messageApi.error('删除意图规则失败')
      console.error('删除意图规则失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 切换规则启用状态
  const toggleRuleStatus = async (ruleId: string, enabled: boolean) => {
    setLoading(true)
    try {
      // 这里应该调用实际的API，现在使用模拟数据
      setIntentRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r))
      messageApi.success(enabled ? '启用意图规则成功' : '禁用意图规则成功')
    } catch (error) {
      messageApi.error('切换规则状态失败')
      console.error('切换规则状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 格式化时间
  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN')
  }

  // 规则表格列
  const ruleColumns = [
    {
      title: '意图类型',
      dataIndex: 'intent',
      key: 'intent',
      render: (text: string) => (
        <Tag color={
          text === 'record_create' ? 'green' :
          text === 'record_update' ? 'blue' :
          text === 'record_delete' ? 'red' :
          text === 'record_query' ? 'purple' : 'gray'
        }>
          {text === 'record_create' ? '创建简录' :
           text === 'record_update' ? '更新简录' :
           text === 'record_delete' ? '删除简录' :
           text === 'record_query' ? '查询简录' : text}
        </Tag>
      )
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (keywords: string[]) => (
        <Space direction="vertical">
          {keywords.map((keyword, index) => (
            <Tag key={index}>{keyword}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => `${(confidence * 100).toFixed(0)}%`
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: IntentRule) => (
        <Switch
          checked={enabled}
          onChange={(checked) => toggleRuleStatus(record.id, checked)}
        />
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: IntentRule) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => openRuleModal(record)}
          >
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => deleteIntentRule(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  // 统计表格列
  const statsColumns = [
    {
      title: '意图类型',
      dataIndex: 'intent',
      key: 'intent',
      render: (text: string) => (
        <Tag color={
          text === 'record_create' ? 'green' :
          text === 'record_update' ? 'blue' :
          text === 'record_delete' ? 'red' :
          text === 'record_query' ? 'purple' : 'gray'
        }>
          {text === 'record_create' ? '创建简录' :
           text === 'record_update' ? '更新简录' :
           text === 'record_delete' ? '删除简录' :
           text === 'record_query' ? '查询简录' : text}
        </Tag>
      )
    },
    {
      title: '检测次数',
      dataIndex: 'count',
      key: 'count'
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (accuracy: number) => `${(accuracy * 100).toFixed(0)}%`
    },
    {
      title: '平均处理时间(ms)',
      dataIndex: 'avgProcessingTime',
      key: 'avgProcessingTime'
    },
    {
      title: '最后检测时间',
      dataIndex: 'lastDetected',
      key: 'lastDetected',
      render: (time: string) => formatTime(time)
    }
  ]

  return (
    <div style={{ padding: '20px' }}>
      {contextHolder}
      <Title level={3}>AI意图识别优化</Title>

      {/* AI设置卡片 */}
      <Card title="AI模型设置" style={{ marginBottom: '20px' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSettings}
        >
          <Form.Item
            name="systemPrompt"
            label="系统提示词"
            tooltip="系统提示词会影响AI的行为和意图识别能力"
          >
            <TextArea rows={6} placeholder="请输入系统提示词" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <Form.Item
              name="temperature"
              label="温度"
              tooltip="控制AI输出的随机性，值越高随机性越大"
            >
              <Slider
                min={0}
                max={100}
                marks={{
                  0: '0',
                  50: '0.5',
                  100: '1.0'
                }}
              />
            </Form.Item>

            <Form.Item
              name="topP"
              label="Top P"
              tooltip="控制AI输出的多样性，值越高多样性越大"
            >
              <Slider
                min={0}
                max={1}
                step={0.01}
                marks={{
                  0: '0',
                  0.5: '0.5',
                  1: '1.0'
                }}
              />
            </Form.Item>

            <Form.Item
              name="contextRounds"
              label="上下文轮数"
              tooltip="保留的对话轮数，影响上下文理解能力"
            >
              <Select>
                <Option value={1}>1轮</Option>
                <Option value={2}>2轮</Option>
                <Option value={3}>3轮</Option>
                <Option value={5}>5轮</Option>
                <Option value={10}>10轮</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="contextLength"
              label="上下文长度"
              tooltip="保留的上下文长度（token），影响上下文理解能力"
            >
              <Select>
                <Option value={2048}>2048</Option>
                <Option value={4096}>4096</Option>
                <Option value={8192}>8192</Option>
                <Option value={10240}>10240</Option>
                <Option value={16384}>16384</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 意图识别规则卡片 */}
      <Card 
        title="意图识别规则" 
        style={{ marginBottom: '20px' }}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => openRuleModal()}
          >
            添加规则
          </Button>
        }
      >
        <Table
          columns={ruleColumns}
          dataSource={intentRules}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* 意图识别统计卡片 */}
      <Card 
        title="意图识别统计" 
        style={{ marginBottom: '20px' }}
        extra={
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchIntentStats}
            loading={loading}
          >
            刷新数据
          </Button>
        }
      >
        <Table
          columns={statsColumns}
          dataSource={intentStats}
          rowKey="intent"
          loading={loading}
        />
      </Card>

      {/* 意图识别测试卡片 */}
      <Card title="意图识别测试" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Input
            placeholder="请输入测试消息"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            style={{ marginBottom: '10px' }}
          />
          <Button 
            type="primary" 
            onClick={handleTestIntent}
            loading={testing}
            icon={<EyeOutlined />}
          >
            测试意图识别
          </Button>
        </div>

        {testResult && (
          <Card title="测试结果" size="small">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>
                <Text strong>识别意图:</Text>
                <Tag color={
                  testResult.intent === 'record_create' ? 'green' :
                  testResult.intent === 'record_update' ? 'blue' :
                  testResult.intent === 'record_delete' ? 'red' :
                  testResult.intent === 'record_query' ? 'purple' : 'gray'
                }>
                  {testResult.intent === 'record_create' ? '创建简录' :
                   testResult.intent === 'record_update' ? '更新简录' :
                   testResult.intent === 'record_delete' ? '删除简录' :
                   testResult.intent === 'record_query' ? '查询简录' : testResult.intent}
                </Tag>
              </div>
              <div>
                <Text strong>置信度:</Text>
                <Text>{(testResult.confidence * 100).toFixed(0)}%</Text>
              </div>
              <div>
                <Text strong>匹配关键词:</Text>
                <Space>
                  {testResult.keywords?.map((keyword: string, index: number) => (
                    <Tag key={index}>{keyword}</Tag>
                  ))}
                </Space>
              </div>
              <div>
                <Text strong>识别时间:</Text>
                <Text>{Date.now() - new Date(testResult.timestamp || Date.now()).getTime()}ms</Text>
              </div>
            </div>
            {testResult.explanation && (
              <div style={{ marginTop: '10px' }}>
                <Text strong>识别说明:</Text>
                <Text>{testResult.explanation}</Text>
              </div>
            )}
          </Card>
        )}
      </Card>

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑意图规则' : '创建意图规则'}
        open={ruleModalVisible}
        onCancel={closeRuleModal}
        footer={[
          <Button key="cancel" onClick={closeRuleModal}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={() => {
              // 这里应该使用表单来收集数据，现在使用模拟数据
              const mockRule: IntentRule = {
                id: editingRule?.id || '',
                keywords: ['测试', '关键词'],
                intent: 'record_create',
                confidence: 0.8,
                enabled: true,
                description: '测试规则'
              }
              saveIntentRule(mockRule)
            }}
            loading={loading}
          >
            保存
          </Button>
        ]}
      >
        {/* 这里应该使用表单来收集规则数据 */}
        <div style={{ padding: '20px' }}>
          <p>规则编辑表单将在后续实现</p>
          <p>当前使用模拟数据演示功能</p>
        </div>
      </Modal>
    </div>
  )
}

export default IntentRecognitionOptimization