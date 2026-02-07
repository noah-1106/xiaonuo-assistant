import React, { useState, useEffect, useCallback } from 'react'
import { Card, Typography, Button, Table, Form, Input, Select, Modal, message, Spin, Alert, Tag, Descriptions, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SaveOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { TaskTemplate } from '../../types'

const { Title, Text } = Typography
const { TextArea } = Input

const TaskTemplateManagement: React.FC = () => {
  const [form] = Form.useForm()
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // 获取任务模板列表
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/task-templates`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '获取任务模板列表失败')
      }

      const data = await response.json()
      setTemplates(data.data)
    } catch (error: any) {
      messageApi.error(error.message || '获取任务模板列表失败')
    } finally {
      setLoading(false)
    }
  }, [messageApi])

  // 创建或更新任务模板
  const handleSubmit = useCallback(async (values: any) => {
    try {
      setLoading(true)
      
      const templateData = {
        name: values.name,
        description: values.description,
        taskType: values.taskType,
        paramsTemplate: JSON.parse(values.paramsTemplate || '{}'),
        status: values.status ? 'active' : 'inactive'
      }

      let response
      if (editingTemplate) {
        // 更新模板
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/task-templates/${editingTemplate._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(templateData)
        })
      } else {
        // 创建模板
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/task-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(templateData)
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '操作失败')
      }

      messageApi.success(editingTemplate ? '任务模板更新成功' : '任务模板创建成功')
      setModalVisible(false)
      setEditingTemplate(null)
      form.resetFields()
      fetchTemplates()
    } catch (error: any) {
      messageApi.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }, [editingTemplate, fetchTemplates, form, messageApi])

  // 删除任务模板
  const handleDelete = useCallback((template: TaskTemplate) => {
    setCurrentTemplate(template)
    setConfirmModalVisible(true)
  }, [])

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!currentTemplate) return
    
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/task-templates/${currentTemplate._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '删除失败')
      }

      messageApi.success('任务模板删除成功')
      setConfirmModalVisible(false)
      setCurrentTemplate(null)
      fetchTemplates()
    } catch (error: any) {
      messageApi.error(error.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }, [currentTemplate, fetchTemplates, messageApi])

  // 打开编辑模态框
  const handleEdit = useCallback((template: TaskTemplate) => {
    setEditingTemplate(template)
    form.setFieldsValue({
      name: template.name,
      description: template.description,
      taskType: template.taskType,
      paramsTemplate: JSON.stringify(template.paramsTemplate || {}, null, 2),
      status: template.status === 'active'
    })
    setModalVisible(true)
  }, [form])

  // 打开创建模态框
  const handleCreate = useCallback(() => {
    setEditingTemplate(null)
    form.resetFields()
    setModalVisible(true)
  }, [form])

  // 初始化获取模板列表
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // 任务类型选项
  const taskTypeOptions = [
    { value: 'record_create', label: '创建记录' },
    { value: 'record_update', label: '更新记录' },
    { value: 'record_delete', label: '删除记录' },
    { value: 'record_query', label: '查询记录' },
    { value: 'custom', label: '自定义任务' }
  ]

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>任务模板管理</Title>
          <Text type="secondary">管理系统中的任务模板，供用户快速创建任务</Text>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            loading={loading}
          >
            创建模板
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>加载中...</div>
          </div>
        ) : templates.length > 0 ? (
          <Table
            dataSource={templates}
            rowKey="_id"
            pagination={{
              pageSize: 10
            }}
          >
            <Table.Column title="模板名称" dataIndex="name" key="name" ellipsis />
            <Table.Column title="任务类型" dataIndex="taskType" key="taskType" render={(text) => {
              const typeMap: Record<string, string> = {
                record_create: '创建记录',
                record_update: '更新记录',
                record_delete: '删除记录',
                record_query: '查询记录',
                custom: '自定义任务'
              }
              return <Tag color="purple">{typeMap[text] || text}</Tag>
            }} />
            <Table.Column title="状态" dataIndex="status" key="status" render={(text) => {
              return <Tag color={text === 'active' ? 'green' : 'gray'}>
                {text === 'active' ? '活跃' : '停用'}
              </Tag>
            }} />
            <Table.Column title="使用次数" dataIndex="usageCount" key="usageCount" defaultSortOrder="descend" sorter={(a, b) => a.usageCount - b.usageCount} />
            <Table.Column title="创建时间" dataIndex="createdAt" key="createdAt" render={(text) => {
              return text ? new Date(text).toLocaleString() : '未知'
            }} />
            <Table.Column 
              title="操作" 
              key="actions"
              render={(_, record) => (
                <>
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<EyeOutlined />} 
                    style={{ marginRight: 8 }}
                    onClick={() => {
                      // 查看详情
                      setCurrentTemplate(record)
                      setDetailModalVisible(true)
                    }}
                  />
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<EditOutlined />} 
                    style={{ marginRight: 8 }}
                    onClick={() => handleEdit(record)}
                  />
                  <Button 
                    type="link" 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record)}
                  />
                </>
              )}
            />
          </Table>
        ) : (
          <Alert
            message="暂无任务模板"
            description="系统中暂无任务模板，点击'创建模板'按钮添加新模板"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* 创建/编辑模板模态框 */}
        <Modal
          title={editingTemplate ? '编辑任务模板' : '创建任务模板'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="请输入模板名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="模板描述"
            >
              <TextArea rows={3} placeholder="请输入模板描述" />
            </Form.Item>

            <Form.Item
              name="taskType"
              label="任务类型"
              rules={[{ required: true, message: '请选择任务类型' }]}
            >
              <Select placeholder="请选择任务类型" options={taskTypeOptions} />
            </Form.Item>

            <Form.Item
              name="paramsTemplate"
              label="参数模板"
              tooltip="JSON格式的参数模板，用于快速创建任务"
            >
              <TextArea
                rows={6}
                placeholder="请输入JSON格式的参数模板，例如：{\"type\": \"todo\", \"title\": \"新任务\"}"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              initialValue={true}
            >
              <Switch checkedChildren="活跃" unCheckedChildren="停用" />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
              <Button 
                style={{ marginRight: 8 }} 
                onClick={() => setModalVisible(false)}
                loading={loading}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                保存
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* 删除确认模态框 */}
        <Modal
          title="确认删除"
          open={confirmModalVisible}
          onCancel={() => {
            setConfirmModalVisible(false)
            setCurrentTemplate(null)
          }}
          footer={[
            <Button key="cancel" onClick={() => {
              setConfirmModalVisible(false)
              setCurrentTemplate(null)
            }}>
              取消
            </Button>,
            <Button 
              key="confirm" 
              type="primary" 
              danger 
              onClick={handleConfirmDelete}
              loading={loading}
            >
              确定
            </Button>
          ]}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
            <span>确定要删除任务模板 "{currentTemplate?.name}" 吗？</span>
          </div>
        </Modal>

        {/* 详情查看模态框 */}
        <Modal
          title="任务模板详情"
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false)
            setCurrentTemplate(null)
          }}
          footer={[
            <Button key="close" onClick={() => {
              setDetailModalVisible(false)
              setCurrentTemplate(null)
            }}>
              关闭
            </Button>
          ]}
          width={800}
        >
          {currentTemplate && (
            <div>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="模板名称">{currentTemplate.name}</Descriptions.Item>
                <Descriptions.Item label="任务类型">
                  {taskTypeOptions.find(opt => opt.value === currentTemplate.taskType)?.label}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={currentTemplate.status === 'active' ? 'green' : 'gray'}>
                    {currentTemplate.status === 'active' ? '活跃' : '停用'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="使用次数">{currentTemplate.usageCount}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {currentTemplate.createdAt ? new Date(currentTemplate.createdAt).toLocaleString() : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间" span={2}>
                  {currentTemplate.updatedAt ? new Date(currentTemplate.updatedAt).toLocaleString() : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {currentTemplate.description || '无'}
                </Descriptions.Item>
                <Descriptions.Item label="参数模板" span={2}>
                  <TextArea 
                    value={JSON.stringify(currentTemplate.paramsTemplate || {}, null, 2)} 
                    rows={6} 
                    readOnly 
                    style={{ fontFamily: 'monospace' }}
                  />
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  )
}

export default TaskTemplateManagement