import React, { useState, useEffect, useRef } from 'react'
import { Modal, Button, Tag, Space, Typography, Divider, Input, Upload, Card, message, Tooltip, Dropdown } from 'antd'
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, SendOutlined, UploadOutlined, FileOutlined, PictureOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, StrikethroughOutlined, OrderedListOutlined, UnorderedListOutlined, CopyOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useRecord } from '../../contexts/RecordContext'
import { useRecordType } from '../../contexts/RecordTypeContext'
import { useChat } from '../../contexts/ChatContext'
import { useUser } from '../../contexts/UserContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { RecordItem, MessageFile } from '../../types'

const { Title, Text } = Typography
const { TextArea } = Input

interface RecordDetailModalProps {
  visible: boolean
  onCancel: () => void
  record: RecordItem | null
  records: RecordItem[] // 添加所有记录的数组
  onRecordChange?: (record: RecordItem) => void // 添加简录切换回调
  currentCardHeap?: {
    type?: string // 卡片堆类型，如 'pending', 'completed' 或具体的类型名称
    status?: string // 卡片堆状态，如 'pending', 'completed'
    records: RecordItem[] // 当前卡片堆的记录数组
  }
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ visible, onCancel, record, records, onRecordChange, currentCardHeap }) => {
  const { updateRecord, deleteRecord } = useRecord()
  const { getRecordTypeLabel, recordTypes } = useRecordType() // 移到顶层，在条件语句之前调用
  const { setInputValue } = useChat()
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInputValue, setTagInputValue] = useState('') // 独立的输入框值state
  const [startTime, setStartTime] = useState<Date | undefined>(undefined)
  const [endTime, setEndTime] = useState<Date | undefined>(undefined)
  const [files, setFiles] = useState<MessageFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [recordType, setRecordType] = useState('')
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const [sendModalVisible, setSendModalVisible] = useState(false)

  // 当记录变化时更新内容
  useEffect(() => {
    if (record) {
      // 当没有title时，从summary或content中获取备选标题
      const fallbackTitle = record.title || record.summary || record.content.substring(0, 60) + '...'
      setTitle(fallbackTitle)
      setSummary(record.summary || '')
      setContent(record.content)
      setLink(record.link || '')
      setTags(record.tags || [])
      setTagInputValue('') // 重置输入框值
      setStartTime(record.startTime ? new Date(record.startTime) : undefined)
      setEndTime(record.endTime ? new Date(record.endTime) : undefined)
      setFiles(record.files || [])
      setRecordType(record.type || 'inspiration')
      setIsEditing(false)
      setUploadedFiles([])
    }
  }, [record])

  if (!record) return null

  // 保存编辑内容
  const handleSave = async () => {
    // 发送所有字段，确保完整更新
    const updates: any = {
      title: title || '', // 确保title始终是一个字符串
      summary,
      content,
      tags,
      type: recordType,
      status: record.status
    }
    
    // 处理链接：如果有值，添加http://前缀（如果没有的话），然后保存
    if (link && link.trim()) {
      updates.link = link.startsWith('http://') || link.startsWith('https://') ? link : `http://${link}`
    } else {
      updates.link = ''
    }
    
    // 处理时间字段，转换为ISO8601格式字符串
    if (startTime) {
      updates.startTime = startTime.toISOString()
    }
    if (endTime) {
      updates.endTime = endTime.toISOString()
    }
    
    // 处理文件字段
    updates.files = files || []
    
    // 确保其他字段的类型正确
    updates.summary = summary || ''
    updates.content = content || ''
    updates.type = recordType || 'other'
    updates.status = record.status || 'pending'
    updates.tags = tags || []
    
    await updateRecord(record._id, updates)
    setIsEditing(false)
  }

  // 处理文件上传
  const handleFileUpload = async (file: any) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', 'record')
      if (record) {
        formData.append('relatedId', record._id)
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('文件上传失败')
      }
      
      const data = await response.json()
      const newFile: MessageFile = {
        name: data.data.name,
        type: data.data.type.startsWith('image/') ? 'image' : 'file',
        url: data.data.url
      }
      
      setFiles([...files, newFile])
      messageApi.success('文件上传成功')
    } catch (error) {
      messageApi.error('文件上传失败，请重试')
      console.error('文件上传失败:', error)
    }
    return false // 阻止自动上传
  }

  // 处理文件删除
  const handleFileDelete = async (index: number) => {
    try {
      const fileToDelete = files[index]
      
      // 调用API删除TOS上的文件
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fileUrl: fileToDelete.url })
      })
      
      const newFiles = [...files]
      newFiles.splice(index, 1)
      setFiles(newFiles)
      messageApi.success('文件删除成功')
    } catch (error) {
      messageApi.error('文件删除失败，请重试')
      console.error('文件删除失败:', error)
    }
  }

  // 处理文本格式化
  const handleFormatText = (formatType: string) => {
    const textarea = contentRef.current as any
    if (!textarea) return

    // 获取选中文本
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    let newText = ''
    
    switch (formatType) {
      case 'bold':
        newText = `**${selectedText}**`
        break
      case 'italic':
        newText = `*${selectedText}*`
        break
      case 'underline':
        newText = `__${selectedText}__`
        break
      case 'strikethrough':
        newText = `~~${selectedText}~~`
        break
      case 'ordered-list':
        newText = `1. ${selectedText}\n2. `
        break
      case 'unordered-list':
        newText = `- ${selectedText}\n- `
        break
      default:
        newText = selectedText
    }
    
    // 替换选中文本
    const updatedContent = content.substring(0, start) + newText + content.substring(end)
    setContent(updatedContent)
    
    // 重新聚焦并设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + newText.length, start + newText.length)
    }, 0)
  }

  // 自定义Markdown渲染组件
  const MarkdownRenderer = ({ text }: { text: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义链接样式
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1890ff',
                textDecoration: 'underline',
                cursor: 'pointer'
              }}
              {...props}
            >
              {children}
            </a>
          ),
          // 自定义段落样式
          p: ({ children }) => <p style={{ margin: '8px 0', lineHeight: '1.6' }}>{children}</p>,
          // 自定义标题样式
          h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '12px 0' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '10px 0' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '8px 0' }}>{children}</h3>,
          // 自定义列表样式
          ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
          // 自定义代码样式
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !className || !match
            return !isInline && match ? (
              <pre style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '4px',
                overflow: 'auto',
                margin: '8px 0'
              }}>
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '2px 4px',
                borderRadius: '3px',
                fontSize: '0.9em'
              }} {...props}>
                {children}
              </code>
            )
          },
          // 自定义引用样式
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid #1890ff',
              paddingLeft: '12px',
              margin: '8px 0',
              fontStyle: 'italic'
            }}>
              {children}
            </blockquote>
          ),
          // 自定义表格样式
          table: ({ children }) => (
            <table style={{
              borderCollapse: 'collapse',
              width: '100%',
              margin: '8px 0'
            }}>
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th style={{
              border: '1px solid rgba(0, 0, 0, 0.2)',
              padding: '6px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              fontWeight: 'bold'
            }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td style={{
              border: '1px solid rgba(0, 0, 0, 0.2)',
              padding: '6px 12px'
            }}>
              {children}
            </td>
          )
        }}
      >
        {text}
      </ReactMarkdown>
    )
  }

  // 卡片类型颜色映射
  const colorMap: { [key: string]: string } = {
    article: '#667eea',
    todo: '#f5576c',
    inspiration: '#4facfe',
    other: '#43e97b'
  }
  
  // 使用record之前确保它不为null
  const typeLabel = record ? getRecordTypeLabel(record.type) : ''
  const typeColor = record ? (colorMap[record.type] || colorMap.other) : colorMap.other
  const isPending = record ? record.status === 'pending' : false

  // 发送记录到聊天输入框
  const sendToChat = () => {
    try {
      // 构建上传记录对象
      const uploadedRecord = {
        uid: Date.now().toString(),
        recordId: record._id,
        title: record.title || record.summary || '无标题',
        content: record.content,
        summary: record.summary,
        type: record.type,
        status: record.status,
        createdAt: record.createdAt
      }
      
      // 使用全局事件通知ChatContext添加上传记录
      window.dispatchEvent(new CustomEvent('addUploadedRecord', {
        detail: uploadedRecord
      }))
      
      messageApi.success('记录已添加到聊天输入区域')
      setSendModalVisible(false)
    } catch (error) {
      messageApi.error('添加失败，请重试')
      console.error('添加到聊天输入区域失败:', error)
    }
  }

  // 发送记录到邮箱
  const sendToEmail = async () => {
    try {
      // 校验用户是否有邮箱地址
      if (!user || !user.email) {
        messageApi.error('请先在个人资料中添加邮箱地址')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/records/${record._id}/send-to-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '发送失败')
      }

      messageApi.success(`记录已发送至您的邮箱 ${user.email}，请注意查收`)
      setSendModalVisible(false)
    } catch (error) {
      messageApi.error('发送失败，请稍后重试')
      console.error('发送到邮箱失败:', error)
    }
  }

  // 发送记录到短信
  const sendToSms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/records/${record._id}/send-to-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('发送失败')
      }

      messageApi.success('记录已发送到短信')
      setSendModalVisible(false)
    } catch (error) {
      messageApi.error('发送失败，请重试')
      console.error('发送到短信失败:', error)
    }
  }

  // 切换到上一个记录
  // 获取当前使用的记录数组
  const currentRecords = currentCardHeap?.records || records

  const goToPreviousRecord = () => {
    if (!record || !currentRecords.length) return
    
    const currentIndex = currentRecords.findIndex(r => r._id === record._id)
    if (currentIndex > 0) {
      const previousRecord = currentRecords[currentIndex - 1]
      onRecordChange?.(previousRecord)
    }
  }

  // 切换到下一个记录
  const goToNextRecord = () => {
    if (!record || !currentRecords.length) return
    
    const currentIndex = currentRecords.findIndex(r => r._id === record._id)
    if (currentIndex < currentRecords.length - 1) {
      const nextRecord = currentRecords[currentIndex + 1]
      onRecordChange?.(nextRecord)
    }
  }

  // 检查是否有前一个记录
  const hasPreviousRecord = () => {
    if (!record || !currentRecords.length) return false
    const currentIndex = currentRecords.findIndex(r => r._id === record._id)
    return currentIndex > 0
  }

  // 检查是否有后一个记录
  const hasNextRecord = () => {
    if (!record || !currentRecords.length) return false
    const currentIndex = currentRecords.findIndex(r => r._id === record._id)
    return currentIndex < currentRecords.length - 1
  }

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        width={850}
        footer={null}
        style={{
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          backgroundColor: '#fff'
        }}
        centered={true}
        title={null} // 去掉标题
        className="record-detail-modal"
        maskClosable={false} // 禁用点击外部区域关闭模态框
        styles={{
          mask: {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease'
          }
        }}
        transitionName="record-modal"
        maskTransitionName="record-modal-mask"
      >
        {contextHolder}
        <div style={{ padding: '32px', backgroundColor: '#fff', borderRadius: '16px', position: 'relative' }}>
          {/* 导航按钮 - 固定显示在详情区域外部的左右两侧，不跟随滚动 */}
          {!isEditing && currentRecords.length > 1 && (
            <>
              {/* 左侧切换按钮 - 距离模态框左边缘25像素 */}
              {hasPreviousRecord() && (
                <Button
                  type="text"
                  icon={<LeftOutlined />}
                  onClick={goToPreviousRecord}
                  style={{
                    position: 'fixed',
                    left: 'calc(50% - 425px - 75px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 99999, // 确保在模态框和遮罩之上
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    pointerEvents: 'auto',
                    border: 'none'
                  }}
                />
              )}
              {/* 右侧切换按钮 - 距离模态框右边缘15像素 */}
              {hasNextRecord() && (
                <Button
                  type="text"
                  icon={<RightOutlined />}
                  onClick={goToNextRecord}
                  style={{
                    position: 'fixed',
                    left: 'calc(50% + 425px + 15px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 99999, // 确保在模态框和遮罩之上
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    pointerEvents: 'auto',
                    border: 'none'
                  }}
                />
              )}
            </>
          )}
          {/* 简录类型和日期 */}
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {isEditing ? (
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  style={{
                    fontSize: '13px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    width: 'auto',
                    maxWidth: '120px',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                >
                  {/* 合并基本类型和能力包类型，去重处理 */}
                  {Array.from(
                    new Map<string, { id: string; name: string }>([
                      // 添加基本类型
                      ['article', { id: 'article', name: '文章' }],
                      ['todo', { id: 'todo', name: '待办事项' }],
                      ['inspiration', { id: 'inspiration', name: '灵感闪现' }],
                      ['other', { id: 'other', name: '其他' }],
                      // 添加能力包类型，覆盖重复的基本类型
                      ...recordTypes.map(type => [type.id, { id: type.id, name: type.name }] as const)
                    ]).values()
                  ).map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              ) : (
                <Tag color={typeColor} style={{ fontSize: '13px', padding: '4px 12px', fontWeight: '600', borderRadius: '6px' }}>
                  {typeLabel}
                </Tag>
              )}
              <Text style={{ fontSize: '13px', color: '#6b7280' }}>
                创建于{new Date(record.createdAt).toLocaleString()}{record.updatedAt !== record.createdAt ? `，上次更新于${new Date(record.updatedAt).toLocaleString()}` : ''}
              </Text>
            </div>
          </div>

          {/* 简录标题 */}
          <div style={{ marginBottom: '24px' }}>
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '0',
                  transition: 'all 0.2s ease'
                }}
                placeholder="请输入标题"
              />
            ) : (
              <h1 style={{ 
                margin: '0 0 8px 0', 
                color: '#111827', 
                fontSize: '24px', 
                fontWeight: '600', 
                lineHeight: '1.3'
              }}>
                {record.title || record.summary || record.content.substring(0, 60) + '...'}
              </h1>
            )}
          </div>

          {/* 简录内容 */}
          <div style={{ marginBottom: '16px' }}>
            {isEditing ? (
              <>
                {/* 内容编辑区域 */}
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    // 手动处理全选快捷键
                    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                      e.preventDefault();
                      if (contentRef.current) {
                        contentRef.current.select();
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: '240px',
                    padding: '16px',
                    fontSize: '15px',
                    lineHeight: 1.7,
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-wrap',
                    transition: 'all 0.2s ease'
                  }}
                  placeholder="请输入内容，支持完整的Markdown格式：**粗体**、*斜体*、[链接](https://example.com)、`代码`、```代码块```、> 引用、标题、列表、表格等"
                />
              </>
            ) : (
              <div
                style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#374151',
                  padding: '20px',
                  backgroundColor: '#fcfcfd',
                  borderRadius: '10px',
                  border: '1px solid #f3f4f6',
                  minHeight: '200px'
                }}
              >
                <MarkdownRenderer text={content} />
              </div>
            )}
          </div>

          {/* 简录标签 */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: '14px', minWidth: '80px', color: '#6b7280' }}>简录标签:</Text>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {/* 已添加的标签 */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {tags.map((tag, index) => (
                    <Tag closable onClose={() => setTags(tags.filter((_, i) => i !== index))} style={{ fontSize: '13px', borderRadius: '6px', padding: '4px 10px' }}>
                      {tag}
                    </Tag>
                  ))}
                </div>
                {/* 标签输入框 */}
                {tags.length < 5 && (
                  <Input
                    value={tagInputValue}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      // 检查输入内容是否包含逗号（中英文）
                      if (/,|，/.test(inputValue)) {
                        // 获取最后一个逗号之前的内容作为新标签
                        const lastCommaIndex = Math.max(inputValue.lastIndexOf(','), inputValue.lastIndexOf('，'));
                        const newTag = inputValue.substring(0, lastCommaIndex).trim();
                        if (newTag && !tags.includes(newTag) && tags.length < 5) {
                          setTags([...tags, newTag]);
                        }
                        // 剩下的内容继续留在输入框中
                        setTagInputValue(inputValue.substring(lastCommaIndex + 1).trim());
                      } else {
                        // 没有逗号，正常更新输入值
                        setTagInputValue(inputValue);
                      }
                    }}
                    onKeyPress={(e) => {
                      // 支持回车键创建标签
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputValue = tagInputValue.trim();
                        if (inputValue && !tags.includes(inputValue) && tags.length < 5) {
                          setTags([...tags, inputValue]);
                          // 清空输入框，准备输入下一个标签
                          setTagInputValue('');
                        }
                      }
                    }}
                    style={{
                      flex: tags.length > 0 ? '0 1 auto' : 1,
                      minWidth: '200px',
                      maxWidth: '300px',
                      fontSize: '14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      transition: 'all 0.2s ease'
                    }}
                    placeholder="请输入标签，按回车键或逗号创建"
                  />
                )}
                {tags.length >= 5 && (
                  <Text style={{ fontSize: '13px', color: '#9ca3af' }}>最多添加5个标签</Text>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {tags.length > 0 ? (
                  tags.map((tag, index) => (
                    <Tag key={index} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '6px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none' }}>
                      {tag}
                    </Tag>
                  ))
                ) : (
                  <Text style={{ color: '#9ca3af', fontSize: '14px', padding: '8px 0' }}>
                    无
                  </Text>
                )}
              </div>
            )}
          </div>

          {/* 预计时间 */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text strong style={{ fontSize: '14px', minWidth: '80px', color: '#6b7280' }}>预计开始:</Text>
              {isEditing ? (
                <Input
                  type="datetime-local"
                  value={startTime ? startTime.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setStartTime(e.target.value ? new Date(e.target.value + 'Z') : undefined)}
                  style={{
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    minWidth: '200px',
                    height: '36px',
                    transition: 'all 0.2s ease'
                  }}
                />
              ) : (
                <Text style={{ fontSize: '14px', color: '#374151', padding: '8px 0' }}>
                  {startTime ? new Date(startTime).toLocaleString() : '无'}
                </Text>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Text strong style={{ fontSize: '14px', minWidth: '80px', color: '#6b7280' }}>预计完成:</Text>
              {isEditing ? (
                <Input
                  type="datetime-local"
                  value={endTime ? endTime.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEndTime(e.target.value ? new Date(e.target.value + 'Z') : undefined)}
                  style={{
                    fontSize: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    minWidth: '200px',
                    height: '36px',
                    transition: 'all 0.2s ease'
                  }}
                />
              ) : (
                <Text style={{ fontSize: '14px', color: '#374151', padding: '8px 0' }}>
                  {endTime ? new Date(endTime).toLocaleString() : '无'}
                </Text>
              )}
            </div>
          </div>

          {/* 参考链接 */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Text strong style={{ fontSize: '14px', minWidth: '80px', color: '#6b7280' }}>参考链接:</Text>
            {isEditing ? (
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  fontSize: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  height: '36px',
                  transition: 'all 0.2s ease'
                }}
                placeholder="请输入链接"
              />
            ) : link ? (
              <a
                href={link.startsWith('http://') || link.startsWith('https://') ? link : `http://${link}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '14px', color: '#3b82f6', wordBreak: 'break-all', flex: 1, textDecoration: 'none', borderBottom: '1px solid #e5e7eb', padding: '8px 0' }}
              >
                {link}
              </a>
            ) : (
              <Text style={{ fontSize: '14px', color: '#9ca3af', flex: 1, padding: '8px 0' }}>
                无
              </Text>
            )}
          </div>

          {/* 简录附件 */}
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '12px', color: '#6b7280' }}>简录附件:</Text>
            <div style={{ marginBottom: '12px' }}>
              {files.length > 0 ? (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      style={{ 
                        width: 160, 
                        borderRadius: '8px', 
                        border: '1px solid #f3f4f6', 
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        overflow: 'hidden',
                        backgroundColor: '#fff'
                      }}
                      onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
                        {file.type === 'image' ? (
                          <PictureOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
                        ) : (
                          <FileOutlined style={{ fontSize: 32, color: '#3b82f6' }} />
                        )}
                      </div>
                      <div style={{ padding: '12px', textAlign: 'center' }}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none', color: '#3b82f6' }}
                        >
                          <Text ellipsis={{ tooltip: file.name }} style={{ fontSize: '13px', maxWidth: '136px', display: 'block', marginBottom: '8px' }}>
                            {file.name}
                          </Text>
                        </a>
                        {isEditing && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // 阻止事件冒泡，避免触发外层div的点击事件
                              handleFileDelete(index);
                            }}
                            style={{ padding: '4px 12px', fontSize: '12px', lineHeight: 1.2, color: '#ef4444' }}
                          >
                            删除
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>无</Text>
              )}
            </div>
            
            {/* 编辑模式下显示上传控件 */}
            {isEditing && (
              <div>
                <Upload
                  beforeUpload={handleFileUpload}
                  fileList={uploadedFiles}
                  onRemove={(file) => {
                    setUploadedFiles(uploadedFiles.filter(f => f.uid !== file.uid))
                  }}
                  showUploadList={false}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    style={{ 
                      fontSize: '13px', 
                      padding: '8px 16px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    上传文件
                  </Button>
                </Upload>
              </div>
            )}
          </div>

          <Divider />

          {/* 操作按钮 - 调整布局：左侧为删除，右侧为发送、复制、编辑、完成 */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
            {/* 左侧按钮：已完成、删除 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {!isEditing && isPending && (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    updateRecord(record._id, { status: 'completed' })
                  }}
                  style={{ 
                    fontSize: '14px', 
                    padding: '6px 16px', 
                    borderRadius: '6px'
                  }}
                >
                  标记为已完成
                </Button>
              )}
              {!isEditing && !isPending && (
                <Button
                  icon={<ClockCircleOutlined />}
                  onClick={() => {
                    updateRecord(record._id, { status: 'pending' })
                  }}
                  style={{ 
                    fontSize: '14px', 
                    padding: '6px 16px', 
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    borderColor: '#d9d9d9',
                    color: '#666'
                  }}
                >
                  标记为待处理
                </Button>
              )}
              <Button
                icon={<DeleteOutlined />}
                onClick={() => {
                  deleteRecord(record._id)
                  onCancel()
                }}
                style={{ 
                  fontSize: '14px', 
                  padding: '6px 16px', 
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  borderColor: '#ff4d4f',
                  color: '#ff4d4f'
                }}
              >
                删除
              </Button>
            </div>

            {/* 右侧按钮：发送、复制、编辑、重置 */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {!isEditing && (
                <>
                  {/* 发送按钮 - 使用下拉菜单 */}
                  <Dropdown 
                    menu={{
                      items: [
                        {
                          label: '发送到聊天',
                          key: 'chat',
                          onClick: sendToChat
                        },
                        {
                          label: '通过邮件发送',
                          key: 'email',
                          onClick: sendToEmail
                        }
                      ]
                    }}
                    placement="bottom"
                    getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
                  >
                    <Button
                      icon={<SendOutlined />}
                      style={{ 
                        fontSize: '14px', 
                        padding: '8px 20px', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      发送
                    </Button>
                  </Dropdown>

                  {/* 复制按钮 - 使用下拉菜单 */}
                  <Dropdown 
                    menu={{
                      items: [
                        {
                          label: '文本格式',
                          key: 'rich',
                          onClick: async () => {
                            try {
                              // 构建富文本内容，包含所有字段
                              const richText = `标题: ${record.title || record.summary || record.content.substring(0, 60) + '...'}\n\n` +
                                `内容: ${record.content}\n\n` +
                                `${record.summary ? `摘要: ${record.summary}\n\n` : ''}` +
                                `${record.link ? `链接: ${record.link}\n\n` : ''}` +
                                `${record.tags && record.tags.length > 0 ? `标签: ${record.tags.join(', ')}\n\n` : ''}` +
                                `${record.type ? `类型: ${getRecordTypeLabel(record.type)}\n\n` : ''}` +
                                `${record.status ? `状态: ${record.status === 'completed' ? '已完成' : '待处理'}\n\n` : ''}` +
                                `${record.startTime ? `开始时间: ${new Date(record.startTime).toLocaleString()}\n\n` : ''}` +
                                `${record.endTime ? `结束时间: ${new Date(record.endTime).toLocaleString()}\n\n` : ''}` +
                                `${record.files && record.files.length > 0 ? `附件: ${record.files.map(file => `${file.name} (${file.url})`).join(', ')}\n\n` : ''}` +
                                `创建时间: ${new Date(record.createdAt).toLocaleString()}\n` +
                                `${record.updatedAt !== record.createdAt ? `更新时间: ${new Date(record.updatedAt).toLocaleString()}` : ''}`;
                              await navigator.clipboard.writeText(richText);
                              messageApi.success('文本格式已复制');
                            } catch (error) {
                              messageApi.error('复制失败，请重试');
                              console.error('复制富文本失败:', error);
                            }
                          }
                        },
                        {
                          label: 'Markdown格式',
                          key: 'md',
                          onClick: async () => {
                            try {
                              // 构建MD格式内容，包含所有字段
                              const mdText = `# ${record.title || record.summary || record.content.substring(0, 60) + '...'}\n\n` +
                                `## 内容\n${record.content}\n\n` +
                                `${record.summary ? `## 摘要\n${record.summary}\n\n` : ''}` +
                                `${record.link ? `## 链接\n[链接](${record.link})\n\n` : ''}` +
                                `${record.tags && record.tags.length > 0 ? `## 标签\n${record.tags.map(tag => `#${tag}`).join(' ')}\n\n` : ''}` +
                                `${record.type ? `## 类型\n${getRecordTypeLabel(record.type)}\n\n` : ''}` +
                                `${record.status ? `## 状态\n${record.status === 'completed' ? '已完成' : '待处理'}\n\n` : ''}` +
                                `${record.startTime ? `## 开始时间\n${new Date(record.startTime).toLocaleString()}\n\n` : ''}` +
                                `${record.endTime ? `## 结束时间\n${new Date(record.endTime).toLocaleString()}\n\n` : ''}` +
                                `${record.files && record.files.length > 0 ? `## 附件\n${record.files.map(file => `- ${file.name} (${file.url})`).join('\n')}\n\n` : ''}` +
                                `## 时间信息\n` +
                                `- 创建时间: ${new Date(record.createdAt).toLocaleString()}\n` +
                                `${record.updatedAt !== record.createdAt ? `- 更新时间: ${new Date(record.updatedAt).toLocaleString()}` : ''}`;
                              await navigator.clipboard.writeText(mdText);
                              messageApi.success('Markdown格式已复制');
                            } catch (error) {
                              messageApi.error('复制失败，请重试');
                              console.error('复制Markdown格式失败:', error);
                            }
                          }
                        }
                      ]
                    }}
                    placement="bottom"
                    getPopupContainer={(trigger) => trigger.parentElement as HTMLElement}
                  >
                    <Button
                      icon={<CopyOutlined />}
                      style={{ 
                        fontSize: '14px', 
                        padding: '8px 20px', 
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      复制
                    </Button>
                  </Dropdown>

                  {/* 编辑按钮 */}
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      setIsEditing(true)
                      // 进入编辑模式时，重新计算title，确保有值
                      const fallbackTitle = record.title || record.summary || record.content.substring(0, 60) + '...'
                      setTitle(fallbackTitle)
                    }}
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 20px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    编辑
                  </Button>


                </>
              )}
              {isEditing && (
                <>
                  {/* 编辑状态下只显示保存和取消按钮 */}
                  <Button
                    type="primary"
                    onClick={handleSave}
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 20px', 
                      borderRadius: '8px',
                      backgroundColor: '#3b82f6',
                      borderColor: '#3b82f6',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    保存
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      if (record) {
                        // 当没有title时，从summary或content中获取备选标题
                        const fallbackTitle = record.title || record.summary || record.content.substring(0, 60) + '...'
                        setTitle(fallbackTitle)
                        setSummary(record.summary || '')
                        setContent(record.content)
                        setLink(record.link || '')
                        setTags(record.tags || [])
                        setTagInputValue('') // 重置标签输入框
                        setStartTime(record.startTime)
                        setEndTime(record.endTime)
                        setFiles(record.files || [])
                      }
                    }}
                    style={{ 
                      fontSize: '14px', 
                      padding: '8px 20px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#fff',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    取消
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>


    </>
  )
}

export default RecordDetailModal
