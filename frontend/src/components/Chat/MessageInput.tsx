import React, { useRef, useState } from 'react'
import { Input, Button, message, Card, Typography, Tooltip, Modal, Space } from 'antd'
import { SendOutlined, UploadOutlined, DeleteOutlined, FileOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useChat } from '../../contexts/ChatContext'
import type { UploadedFile, UploadedRecord } from '../../types'

const { TextArea } = Input
const { Text } = Typography

const MessageInput: React.FC = () => {
  const { inputValue, setInputValue, sendMessage, isLoading, uploadedFiles, setUploadedFiles, uploadedRecords, setUploadedRecords } = useChat()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messageApi, contextHolder] = message.useMessage()
  
  // 预览模态框状态
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  
  // 上传进度状态
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})

  // 处理键盘回车发送消息，支持Ctrl+Enter或Cmd+Enter换行
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!e.ctrlKey && !e.metaKey && !isLoading) {
        e.preventDefault()
        sendMessage()
      }
      // 当按下Ctrl+Enter或Cmd+Enter时，允许默认的换行行为
      // 由于Ant Design的TextArea可能会阻止默认行为，我们需要手动处理
      else if ((e.ctrlKey || e.metaKey)) {
        // 手动插入换行符
        const textArea = e.target as HTMLTextAreaElement;
        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;
        const newValue = inputValue.substring(0, start) + '\n' + inputValue.substring(end);
        setInputValue(newValue);
        // 光标移动到新插入的换行符后面
        setTimeout(() => {
          textArea.selectionStart = textArea.selectionEnd = start + 1;
        }, 0);
        e.preventDefault();
      }
    }
  }

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    return new Promise<boolean>((resolve) => {
      try {
        // 检查文件类型和大小
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
          messageApi.error('文件大小不能超过5MB')
          resolve(false)
          return
        }

        // 创建唯一的上传ID
        const uploadId = Date.now().toString()
        
        // 初始化上传进度
        setUploadProgress(prev => ({ ...prev, [uploadId]: 0 }))

        // 创建表单数据
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileType', 'chat')
        
        // 使用XMLHttpRequest来监控上传进度
        const xhr = new XMLHttpRequest()
        
        // 监控上传进度
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(prev => ({ ...prev, [uploadId]: progress }))
          }
        })
        
        // 上传完成
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText)
              const fileType = file.type.startsWith('image/') ? 'image' : 'file'

              const newFile: UploadedFile = {
                uid: uploadId,
                name: data.data.name,
                url: data.data.url, // 直接使用TOS返回的URL作为url字段
                file,
                type: fileType, // 前端内部使用的类型，用于UI显示
                preview: data.data.url // 同时设置preview字段，用于前端预览
              }

              // 添加新文件到已上传文件列表
              setUploadedFiles([...uploadedFiles, newFile])
              messageApi.success('文件上传成功')
              
              // 清除上传进度
              setUploadProgress(prev => {
                const newProgress = { ...prev }
                delete newProgress[uploadId]
                return newProgress
              })
              
              resolve(false) // 阻止默认上传行为
            } catch (parseError) {
              messageApi.error('文件上传失败，请重试')
              console.error('解析响应失败:', parseError)
              
              // 清除上传进度
              setUploadProgress(prev => {
                const newProgress = { ...prev }
                delete newProgress[uploadId]
                return newProgress
              })
              
              resolve(false)
            }
          } else {
            messageApi.error('文件上传失败，请重试')
            console.error('上传失败，状态码:', xhr.status)
            
            // 清除上传进度
            setUploadProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[uploadId]
              return newProgress
            })
            
            resolve(false)
          }
        })
        
        // 上传错误
        xhr.addEventListener('error', () => {
          messageApi.error('文件上传失败，请重试')
          console.error('上传错误')
          
          // 清除上传进度
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[uploadId]
            return newProgress
          })
          
          resolve(false)
        })
        
        // 打开连接
        xhr.open('POST', `${import.meta.env.VITE_API_BASE_URL}/files/upload`)
        
        // 设置请求头
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)
        
        // 发送请求
        xhr.send(formData)
      } catch (error) {
        messageApi.error('文件上传失败，请重试')
        console.error('文件上传失败:', error)
        resolve(false)
      }
    })
  }

  // 处理剪贴板粘贴
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          handleFileUpload(file)
        }
      } else if (items[i].type === 'text/plain') {
        // 文本粘贴由浏览器默认处理
      }
    }
  }

  // 移除已上传的文件
  const removeFile = (uid: string) => {
    const fileToRemove = uploadedFiles.find(file => file.uid === uid)
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
    // 过滤掉要删除的文件
    setUploadedFiles(uploadedFiles.filter(file => file.uid !== uid))
  }

  // 移除已上传的记录
  const removeRecord = (uid: string) => {
    // 过滤掉要删除的记录
    setUploadedRecords(uploadedRecords.filter(record => record.uid !== uid))
  }

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }
  
  // 处理文件预览
  const handleFilePreview = (file: UploadedFile) => {
    setPreviewFile(file)
    setPreviewModalVisible(true)
  }
  
  // 关闭预览模态框
  const handlePreviewModalClose = () => {
    setPreviewModalVisible(false)
    setPreviewFile(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {contextHolder}
      {/* 上传进度显示 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
          {Object.entries(uploadProgress).map(([uploadId, progress]) => (
            <div key={uploadId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Text style={{ fontSize: '12px', color: '#666' }}>正在上传文件...</Text>
              <div style={{ height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: 'var(--theme-primary)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <Text style={{ fontSize: '11px', color: '#999', textAlign: 'right' }}>{progress}%</Text>
            </div>
          ))}
        </div>
      )}
      
      {/* 已上传文件预览 */}
      {(uploadedFiles.length > 0 || uploadedRecords.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {uploadedFiles.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', maxHeight: '200px', overflowY: 'auto', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
              {uploadedFiles.map(file => (
                <Card
                  key={file.uid}
                  size="small"
                  style={{ width: 120, margin: 0, borderRadius: '8px', overflow: 'hidden' }}
                  cover={
                    file.type === 'image' ? (
                      <div style={{ position: 'relative', height: 100, cursor: 'pointer' }} onClick={() => handleFilePreview(file)}>
                        <img alt={file.name} src={file.preview || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.uid);
                          }}
                          style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%' }}
                        />
                      </div>
                    ) : (
                      <div style={{ position: 'relative', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(var(--theme-primary-rgb), 0.1)', cursor: 'pointer' }} onClick={() => handleFilePreview(file)}>
                        <FileOutlined style={{ fontSize: 40, color: 'var(--theme-primary)' }} />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.uid);
                          }}
                          style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%' }}
                        />
                      </div>
                    )
                  }
                >
                  <div style={{ padding: '4px', textAlign: 'center' }}>
                    <Text ellipsis={{ tooltip: file.name }} style={{ fontSize: '12px', maxWidth: '100px', display: 'block' }}>
                      {file.name}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* 已上传记录预览 */}
          {uploadedRecords.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
              {uploadedRecords.map(record => (
                <Card
                  key={record.uid}
                  size="small"
                  style={{ margin: 0, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#ffffff', border: '1px solid #e8e8e8', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)' }}
                  cover={
                    <div style={{ position: 'relative', minHeight: 80, backgroundColor: '#ffffff' }}>
                      <div style={{ padding: '12px' }}>
                        <Text strong ellipsis={{ tooltip: record.title }} style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#000000' }}>
                          {record.title}
                        </Text>
                        {/* 添加分隔线 */}
                        <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '4px 0 8px 0' }}></div>
                        <Text ellipsis={{ tooltip: record.content }} style={{ fontSize: '12px', color: '#333333', lineHeight: '1.4' }}>
                          {record.content.substring(0, 100)} {record.content.length > 100 ? '...' : ''}
                        </Text>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeRecord(record.uid)}
                        style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '50%' }}
                      />
                    </div>
                  }
                >
                  <div style={{ padding: '6px 12px', textAlign: 'right', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                    <Text style={{ fontSize: '12px', color: '#666666' }}>
                      记录ID: {record.recordId}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 输入区域 - 修复滚动条超出问题，恢复边框 */}
      <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--theme-border)' }}>
        {/* 隐藏的文件输入 */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          onChange={(e) => {
            if (e.target.files) {
              Array.from(e.target.files).forEach(file => handleFileUpload(file))
            }
            // 清空文件输入，允许重复选择相同文件
            e.target.value = ''
          }}
        />

        {/* 输入框 - 修复滚动条超出问题 */}
        <TextArea
          placeholder="输入消息...(Enter发送消息，Ctrl+Enter/Cmd+Enter换行)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleKeyPress}
          onKeyDown={(e) => {
            // 处理Ctrl+A全选快捷键
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
              e.preventDefault();
              const textArea = e.target as HTMLTextAreaElement;
              textArea.select();
            }
          }}
          disabled={isLoading}
          style={{ 
            width: '100%',
            borderRadius: '16px', 
            minHeight: 120, 
            maxHeight: 200, 
            resize: 'vertical',
            padding: '16px 20px 16px 20px', // 右侧内边距与左侧一致，均为20px
            position: 'relative',
            border: 'none',
            outline: 'none',
            margin: 0
          }}
          onPaste={handlePaste}
          autoSize={{ minRows: 4, maxRows: 6 }}
          showCount={false}
        />
        
        {/* 上传文件按钮 - 左下角，调整位置 */}
        <Tooltip title="上传文件">
          <Button
            icon={<UploadOutlined />}
            onClick={triggerFileSelect}
            type="text"
            size="large"
            disabled={isLoading}
            style={{ 
                position: 'absolute', 
                bottom: '16px', 
                left: '16px', 
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                width: 40,
                height: 40,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                // 改善图标渲染质量
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
              }}
          />
        </Tooltip>
        
        {/* 发送按钮 - 右下角，半透明，浮于文字上方 */}
        <Tooltip title="发送消息">
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0 && uploadedRecords.length === 0)}
            loading={isLoading}
            size="large"
            style={{ 
                position: 'absolute', 
                bottom: '16px', 
                right: '16px', 
                borderRadius: '50%',
                width: 40,
                height: 40,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'rgba(var(--theme-primary-rgb), 0.9)', // 半透明背景
                backdropFilter: 'blur(5px)',
                zIndex: 10,
                color: '#ffffff',
                // 改善图标渲染质量
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                imageRendering: 'pixelated'
              }}
          />
        </Tooltip>
      </div>
      
      {/* 文件预览模态框 */}
      <Modal
        title={previewFile?.name}
        open={previewModalVisible}
        onCancel={handlePreviewModalClose}
        footer={
          <Space>
            <Button onClick={handlePreviewModalClose}>关闭</Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => {
                if (previewFile?.preview) {
                  const link = document.createElement('a');
                  link.href = previewFile.preview;
                  link.download = previewFile.name;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
            >
              下载
            </Button>
          </Space>
        }
        width={800}
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            {previewFile.type === 'image' ? (
              <img 
                src={previewFile.preview} 
                alt={previewFile.name} 
                style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ padding: '40px', backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: '8px' }}>
                <FileOutlined style={{ fontSize: 80, color: 'var(--theme-primary)', marginBottom: '20px' }} />
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>{previewFile.name}</Text>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <Text type="secondary">
                    {previewFile.file?.size ? `${(previewFile.file.size / 1024).toFixed(2)} KB` : '未知大小'}
                  </Text>
                </div>
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => {
                    if (previewFile.preview) {
                      window.open(previewFile.preview, '_blank');
                    }
                  }}
                >
                  在新窗口查看
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MessageInput
