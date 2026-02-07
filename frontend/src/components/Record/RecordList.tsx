import React, { useState, useMemo, useEffect } from 'react'
import { Table, Button, Tag, Space, Tooltip, Form, Select, DatePicker, Input, Row, Col, Spin } from 'antd'
import { TableOutlined, AppstoreOutlined, SearchOutlined } from '@ant-design/icons'
import { useRecord } from '../../contexts/RecordContext'
import { useRecordType } from '../../contexts/RecordTypeContext'
import CardView from './CardView'
import RecordDetailModal from './RecordDetailModal'
import type { RecordItem } from '../../types'

const { RangePicker } = DatePicker

// 筛选值类型定义
interface FilterValues {
  type?: string
  status?: string
  tags?: string[]
  dateRange?: [Date, Date] | null
}

const RecordList: React.FC = () => {
  const { records, isLoading, viewMode, setViewMode, fetchRecords, updateRecord } = useRecord()
  const { getRecordTypeLabel } = useRecordType()
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  })
  const [form] = Form.useForm()
  const [filterValues, setFilterValues] = useState<FilterValues>({})
  const [isFiltering, setIsFiltering] = useState(false)
  const [userTypes, setUserTypes] = useState<string[]>([])
  const [userTags, setUserTags] = useState<string[]>([])

  // 当records变化时，更新selectedRecord引用
  const updatedSelectedRecord = React.useMemo(() => {
    if (selectedRecord) {
      const record = records.find(r => r._id === selectedRecord._id)
      return record || null
    }
    return null
  }, [records, selectedRecord])
  
  // 使用useEffect来更新状态，避免直接在render中设置state
  useEffect(() => {
    if (updatedSelectedRecord && updatedSelectedRecord !== selectedRecord) {
      setSelectedRecord(updatedSelectedRecord)
    }
  }, [updatedSelectedRecord, selectedRecord])
  
  // 提取用户所有记录中的类型和标签
  useEffect(() => {
    if (records.length > 0) {
      // 提取所有类型
      const types = [...new Set(records.map(record => record.type))]
      setUserTypes(types)
      
      // 提取所有标签
      const tags = [...new Set(records.flatMap(record => record.tags || []))]
      setUserTags(tags)
    }
  }, [records])

  // 打开详情浮窗
  const [currentCardHeap, setCurrentCardHeap] = useState<{
    type?: string
    status?: string
    records: RecordItem[]
  } | undefined>()

  const handleOpenDetail = (record: RecordItem, heap?: {
    type?: string
    status?: string
    records: RecordItem[]
  }) => {
    setSelectedRecord(record)
    setCurrentCardHeap(heap)
    setDetailVisible(true)
  }

  // 关闭详情浮窗
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedRecord(null)
    setCurrentCardHeap(undefined)
  }

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(pagination)
  }

  // 处理筛选条件变化
  const handleFilterChange = async (values: any) => {
    try {
      setFilterValues(values)
      
      // 构建筛选参数
      const params = new URLSearchParams()
      
      if (values.type && values.type !== 'all') {
        params.append('type', values.type)
      }
      
      if (values.status && values.status !== 'all') {
        params.append('status', values.status)
      }
      
      if (values.tags && values.tags.length > 0) {
        if (Array.isArray(values.tags)) {
          values.tags.forEach((tag: string) => params.append('tags', tag))
        } else {
          params.append('tags', values.tags)
        }
      }
      
      if (values.dateRange) {
        const [startDate, endDate] = values.dateRange
        if (startDate) {
          params.append('startDate', startDate.toISOString())
        }
        if (endDate) {
          params.append('endDate', endDate.toISOString())
        }
      }
      
      params.append('page', pagination.current.toString())
      params.append('limit', pagination.pageSize.toString())
      
      // 调用API获取筛选结果
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/records/filtered?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('获取筛选记录失败')
      }
      
      // 这里可以根据实际情况更新records状态
      // 目前我们假设useRecord钩子已经处理了数据获取
      
    } catch (error) {
      console.error('筛选失败:', error)
    }
  }

  // 应用筛选条件后的数据
  const filteredRecords = useMemo(() => {
    let result = [...records]
    
    // 应用类型筛选
    if (filterValues.type && filterValues.type !== '') {
      result = result.filter(record => record.type === filterValues.type)
    }
    
    // 应用状态筛选
    if (filterValues.status && filterValues.status !== '') {
      result = result.filter(record => record.status === filterValues.status)
    }
    
    // 应用标签筛选
    if (filterValues.tags && filterValues.tags.length > 0) {
      result = result.filter(record => {
        const recordTags = record.tags || []
        return filterValues.tags?.some((tag: string) => recordTags.includes(tag)) || false
      })
    }
    
    // 应用日期范围筛选
    if (filterValues.dateRange) {
      const [startDate, endDate] = filterValues.dateRange
      result = result.filter(record => {
        const recordDate = new Date(record.createdAt)
        if (startDate && recordDate < startDate) return false
        if (endDate && recordDate > endDate) return false
        return true
      })
    }
    
    return result
  }, [records, filterValues])

  // 分页处理后的数据
  const paginatedRecords = useMemo(() => {
    const { current, pageSize } = pagination
    const startIndex = (current - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredRecords.slice(startIndex, endIndex)
  }, [filteredRecords, pagination])

  // 表格列配置
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      align: 'center',
      width: 220,
      render: (title: string, record: RecordItem) => (
        <div style={{ 
          padding: '8px 12px',
          fontWeight: '500',
          fontSize: '14px',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textAlign: 'left',
          wordBreak: 'break-word'
        }}>
          {title || record.summary || '无标题'}
        </div>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      align: 'center',
      width: 400,
      render: (content: string) => (
        <div style={{ 
          padding: '8px 12px',
          fontSize: '14px',
          lineHeight: '1.5',
          color: '#666',
          whiteSpace: 'normal',
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          textAlign: 'left',
          maxHeight: '48px',
          overflow: 'hidden'
        }}>
          {content}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      align: 'center',
      width: 100,
      render: (type: string) => {
        const typeLabel = getRecordTypeLabel(type)
        // 为不同类型定义颜色
        const colorMap: { [key: string]: string } = {
          article: 'blue',
          todo: 'green',
          inspiration: 'purple',
          other: 'gray'
        }
        const color = colorMap[type] || 'gray'
        return (
          <div style={{ padding: '8px 12px' }}>
            <Tag color={color}>{typeLabel}</Tag>
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      width: 100,
      render: (status: string) => {
        const statusMap: { [key: string]: { color: string; label: string } } = {
          pending: { color: 'orange', label: '待处理' },
          completed: { color: 'green', label: '已完成' },
          archived: { color: 'gray', label: '已归档' }
        }
        const statusInfo = statusMap[status] || statusMap.pending
        return (
          <div style={{ padding: '8px 12px' }}>
            <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
          </div>
        )
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      align: 'center',
      width: 150,
      render: (tags: string[]) => (
        <div style={{ padding: '8px 12px', textAlign: 'left' }}>
          <Space size={[4, 4]} wrap>
            {tags.map((tag, index) => (
              <Tag key={index}>{tag}</Tag>
            ))}
            {tags.length === 0 && <Tag color="gray">无</Tag>}
          </Space>
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      align: 'center',
      width: 150,
      render: (createdAt: Date) => (
        <div style={{ 
          padding: '8px 12px',
          fontSize: '13px',
          color: '#999',
          textAlign: 'left'
        }}>
          {new Date(createdAt).toLocaleString()}
        </div>
      )
    }
  ]

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100%',
      backgroundColor: 'var(--theme-background)',
      height: '100%',
      width: '100%',
      backgroundImage: `
        linear-gradient(rgba(200, 200, 200, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200, 200, 200, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '30px 30px',
      backgroundPosition: 'center center'
    }}>
      {/* 筛选表单和视图切换按钮 */}
      <div style={{ 
        marginBottom: '16px',
        padding: '16px',
        backgroundColor: 'var(--theme-background)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--theme-border)'
      }}>
        <Row gutter={16} align="middle">
          {/* 视图切换按钮 - 放在最前方 */}
          <Col span={2} style={{ display: 'flex', gap: '8px', marginRight: '24px' }}>
            <Tooltip title="列表视图">
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<TableOutlined />}
                onClick={() => setViewMode('list')}
                shape="circle"
                size="middle"
                style={{ transition: 'all 0.3s ease' }}
              />
            </Tooltip>
            <Tooltip title="卡片视图">
              <Button
                type={viewMode === 'card' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('card')}
                shape="circle"
                size="middle"
                style={{ transition: 'all 0.3s ease' }}
              />
            </Tooltip>
          </Col>
          
          {/* 筛选表单 */}
          <Col flex="1">
            <Form
              form={form}
              layout="inline"
              initialValues={filterValues}
              onValuesChange={handleFilterChange}
              style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center',
                padding: '8px'
              }}
            >
              <Form.Item name="type" label="类型" style={{ marginBottom: 8 }}>
                <Select placeholder="请选择类型" style={{ minWidth: 100, width: 'auto' }} allowClear>
                  <Select.Option value="">全部</Select.Option>
                  {userTypes.map(type => (
                    <Select.Option key={type} value={type}>{getRecordTypeLabel(type)}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item name="status" label="状态" style={{ marginBottom: 8 }}>
                <Select placeholder="请选择状态" style={{ minWidth: 100, width: 'auto' }} allowClear>
                  <Select.Option value="">全部</Select.Option>
                  <Select.Option value="pending">待处理</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item name="tags" label="标签" style={{ marginBottom: 8 }}>
                <Select 
                  placeholder="请选择标签" 
                  mode="tags" 
                  style={{ minWidth: 120, width: 'auto' }} 
                  allowClear
                  options={userTags.map(tag => ({ value: tag, label: tag }))}
                  filterOption={(input, option) => {
                    if (option) {
                      return option.label.toLowerCase().includes(input.toLowerCase())
                    }
                    return false
                  }}
                />
              </Form.Item>
              
              <Form.Item name="dateRange" label="创建日期" style={{ marginBottom: 8 }}>
                <RangePicker style={{ minWidth: 200, width: 'auto' }} allowClear />
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </div>

      {/* 根据视图模式渲染不同内容，添加过渡动画 */}
      <div
        style={{
          transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
          opacity: 1,
          transform: 'translateY(0)',
          minHeight: '400px'
        }}
      >
        {viewMode === 'list' ? (
          <Table
            columns={columns}
            dataSource={paginatedRecords}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredRecords.length,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50'],
              style: {
                marginRight: '24px'
              }
            }}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            size="middle"
            style={{
              backgroundColor: 'var(--theme-background)',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--theme-border)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            rowStyle={{
              height: 'auto',
              minHeight: '80px',
              borderBottom: '1px solid var(--theme-border)',
              transition: 'all 0.3s ease'
            }}
            onRow={(record) => ({
              style: {
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                transform: 'translateY(0)',
                boxShadow: '0 0 0 rgba(0, 0, 0, 0.05)'
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.05)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.1)';
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-background)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 0 rgba(0, 0, 0, 0.05)';
              },
              onClick: () => handleOpenDetail(record)
            })}
          />
        ) : (
          <CardView 
            onOpenDetail={handleOpenDetail} 
            records={filteredRecords} 
            onUpdateRecord={(updatedRecord) => {
              // 调用updateRecord API来更新记录
              if (updatedRecord && updatedRecord._id) {
                // 提取需要更新的字段
                const { _id, ...updates } = updatedRecord
                updateRecord(_id, updates)
              }
            }} 
          />
        )}
        
        {/* 详情浮窗 */}
        <RecordDetailModal
          visible={detailVisible}
          onCancel={handleCloseDetail}
          record={selectedRecord}
          records={filteredRecords}
          currentCardHeap={currentCardHeap}
          onRecordChange={setSelectedRecord}
        />
      </div>
    </div>
  )
}

export default RecordList
