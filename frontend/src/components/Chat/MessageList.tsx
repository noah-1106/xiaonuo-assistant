import React, { useEffect, useRef } from 'react'
import { Card, Image, Typography } from 'antd'
import { FileOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useChat } from '../../contexts/ChatContext'
import { useUser } from '../../contexts/UserContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../../types'

const { Text } = Typography

// 检测消息是否包含简录信息
const isRecordMessage = (content: string): boolean => {
  try {
    // 尝试在内容中查找JSON部分
    // 查找第一个{开始的位置
    const jsonStartIndex = content.indexOf('{')
    if (jsonStartIndex !== -1) {
      // 查找对应的}结束位置
      let jsonEndIndex = jsonStartIndex
      let braceCount = 1
      
      for (let i = jsonStartIndex + 1; i < content.length; i++) {
        if (content[i] === '{') {
          braceCount++
        } else if (content[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEndIndex = i
            break
          }
        }
      }
      
      // 提取JSON部分
      let possibleJson = content.substring(jsonStartIndex, jsonEndIndex + 1)
      
      // 移除可能的转义字符
      possibleJson = possibleJson.replace(/\"/g, '"')
      possibleJson = possibleJson.replace(/\\'/g, "'")
      possibleJson = possibleJson.replace(/\\/g, "\\")
      
      // 尝试解析JSON
      const parsedJson = JSON.parse(possibleJson)
      return parsedJson.recordId && (parsedJson.title || parsedJson.content)
    }
    
    return false
  } catch {
    return false
  }
}

// 解析简录消息
const parseRecordMessage = (content: string): any => {
  try {
    // 尝试在内容中查找JSON部分
    // 查找第一个{开始的位置
    const jsonStartIndex = content.indexOf('{')
    if (jsonStartIndex !== -1) {
      // 查找对应的}结束位置
      let jsonEndIndex = jsonStartIndex
      let braceCount = 1
      
      for (let i = jsonStartIndex + 1; i < content.length; i++) {
        if (content[i] === '{') {
          braceCount++
        } else if (content[i] === '}') {
          braceCount--
          if (braceCount === 0) {
            jsonEndIndex = i
            break
          }
        }
      }
      
      // 提取JSON部分
      let possibleJson = content.substring(jsonStartIndex, jsonEndIndex + 1)
      
      // 移除可能的转义字符
      possibleJson = possibleJson.replace(/\"/g, '"')
      possibleJson = possibleJson.replace(/\\'/g, "'")
      possibleJson = possibleJson.replace(/\\/g, "\\")
      
      // 尝试解析JSON
      const parsedJson = JSON.parse(possibleJson)
      if (parsedJson.recordId && (parsedJson.title || parsedJson.content)) {
        return parsedJson
      }
    }
    
    return null
  } catch {
    return null
  }
}

// 渲染简录卡片
const renderRecordCard = (record: any, sender: 'user' | 'bot') => {
  // 截取内容预览
  const contentPreview = record && record.content 
    ? (record.content.length > 100 
      ? record.content.substring(0, 100) + '...' 
      : record.content)
    : ''
  
  return (
    <div style={{
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
      backgroundColor: '#ffffff',
      border: '1px solid #e8e8e8',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 卡片内容区域 - 与输入界面保持一致 */}
      <div style={{ position: 'relative', minHeight: 80, padding: '12px 16px' }}>
        <Text strong ellipsis={{ tooltip: record && record.title ? record.title : '无标题' }} style={{ fontSize: '14px', display: 'block', marginBottom: '8px', color: '#000000' }}>
          {record && record.title ? record.title : '无标题'}
        </Text>
        {/* 添加分隔线 */}
        <div style={{ height: '1px', backgroundColor: '#f0f0f0', margin: '4px 0 8px 0' }}></div>
        <Text ellipsis={{ tooltip: record && record.content ? record.content : '' }} style={{ fontSize: '12px', color: '#333333', lineHeight: '1.4' }}>
          {contentPreview}
        </Text>
      </div>
      
      {/* 卡片底部 - 显示简录ID */}
      <div style={{
        padding: '6px 12px',
        textAlign: 'right',
        backgroundColor: '#fafafa',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Text style={{ fontSize: '12px', color: '#666666' }}>
          简录ID: {record && record.recordId ? record.recordId : '无ID'}
        </Text>
      </div>
    </div>
  )
}

const MessageList: React.FC = () => {
  const { messages, isLoading } = useChat()
  const { user } = useUser()
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      })
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])



  // 检测链接并替换为可点击的链接，支持Markdown渲染
  const formatMessageContent = (content: string, sender: 'user' | 'bot') => {
    return (
      <div style={{ 
        lineHeight: '1.5', 
        fontSize: '14px',
        color: sender === 'user' ? '#fff' : 'var(--theme-text)',
        minWidth: '100%',
        width: '100%'
      }}>
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
                  color: sender === 'user' ? '#e6f7ff' : 'var(--theme-primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
                {...props}
              >
                {children}
              </a>
            ),
            // 自定义段落样式
            p: ({ children }) => <p style={{ margin: '0 0 4px 0', lineHeight: '1.5' }}>{children}</p>,
            // 自定义标题样式
            h1: ({ children }) => <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: '5px 0 4px 0' }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 3px 0' }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '3px 0 2px 0' }}>{children}</h3>,
            // 自定义列表样式
            ul: ({ children }) => <ul style={{ margin: '2px 0 4px 0', paddingLeft: '14px' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: '2px 0 4px 0', paddingLeft: '16px' }}>{children}</ol>,
            li: ({ children }) => (
              <li style={{ 
                margin: '1px 0', 
                lineHeight: '1.5',
                listStylePosition: 'outside',
                paddingLeft: '2px',
                textAlign: 'left',
                minWidth: '100%',
                whiteSpace: 'normal'
              }}>
                {children}
              </li>
            ),
            // 自定义代码样式
            code: ({ node, className, children, ...props }: any) => {
              const inline = !className?.includes('language-')
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <pre style={{ 
                  padding: '12px', 
                  backgroundColor: (sender === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                  borderRadius: '4px',
                  overflow: 'auto',
                  margin: '12px 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxWidth: '100%',
                  width: '100%'
                }}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code style={{ 
                  backgroundColor: (sender === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
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
                borderLeft: (sender === 'user' ? '4px solid #e6f7ff' : '4px solid var(--theme-primary)'),
                paddingLeft: '12px',
                margin: '12px 0',
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
                margin: '12px 0'
              }}>
                {children}
              </table>
            ),
            th: ({ children }) => (
              <th style={{
                border: '1px solid ' + (sender === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
                padding: '6px 12px',
                backgroundColor: (sender === 'user' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                fontWeight: 'bold'
              }}>
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td style={{
                border: '1px solid ' + (sender === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
                padding: '6px 12px'
              }}>
                {children}
              </td>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    )
  }

  return (
    <div 
      ref={chatContainerRef}
      style={{ 
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        minHeight: '100%',
        height: '100%'
      }}
    >
      {messages.map(message => (
        <div 
          key={message.id}
          className={`message-container ${message.sender}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'flex-start',
            maxWidth: '90%',
            marginBottom: '16px',
            position: 'relative'
          }}
        >
          {/* 头像和消息气泡容器 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px'
          }}>
            {/* 头像 */}
            <div 
              style={{
                width: '32px', 
                height: '32px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                flexShrink: 0
              }}
            >
              {message.sender === 'user' ? (
                user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="用户头像" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      minWidth: '100%',
                      minHeight: '100%'
                    }} 
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    你
                  </div>
                )
              ) : (
                <img 
                  src="/nuo.png" 
                  alt="小诺头像" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    minWidth: '100%',
                    minHeight: '100%'
                  }} 
                  loading="lazy"
                />
              )}
            </div>
            
            {/* 消息气泡和时间容器 */}
            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
              {/* 消息气泡 */}
              <div 
                className={`message-item ${message.sender}`}
                style={{
                  padding: '14px 18px',
                  borderRadius: '6px 18px 18px 18px',
                  lineHeight: '1.6',
                  backgroundColor: message.sender === 'user' ? 'var(--theme-primary)' : 'var(--theme-background)',
                  color: message.sender === 'user' ? '#fff' : 'var(--theme-text)',
                  position: 'relative',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: '14px',
                  fontWeight: '400',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  maxWidth: '100%',
                  width: 'fit-content',
                  minWidth: '60px',
                  wordWrap: 'break-word',
                  letterSpacing: '0.02em',
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                }}
              >
                {/* 消息内容 - 支持任务执行消息、工具执行开始通知和简录卡片 */}
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontWeight: '400',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  letterSpacing: '0.02em',
                  textRendering: 'optimizeLegibility',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                }}>
                  {message.type === 'tool_execution_start' ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(24, 144, 255, 0.1)',
                      borderRadius: '8px',
                      borderLeft: '4px solid var(--theme-primary)',
                      fontSize: '13px',
                      color: 'var(--theme-primary)'
                    }}>
                      <LoadingOutlined style={{ fontSize: '14px' }} />
                      <span>{message.content}</span>
                    </div>
                  ) : message.type === 'function_error' ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(250, 84, 28, 0.1)',
                      borderRadius: '8px',
                      borderLeft: '4px solid var(--theme-error)',
                      fontSize: '14px',
                      color: 'var(--theme-error)'
                    }}>
                      <ExclamationCircleOutlined style={{ fontSize: '16px', alignSelf: 'flex-start' }} />
                      <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                    </div>
                  ) : (
                    (() => {
                        // 尝试直接解析消息内容为简录信息
                        try {
                          const parsedJson = JSON.parse(message.content)
                          if (parsedJson.recordId && (parsedJson.title || parsedJson.content)) {
                            return renderRecordCard(parsedJson, message.sender)
                          }
                        } catch {
                          // 如果直接解析失败，尝试使用原有的isRecordMessage函数
                          if (isRecordMessage(message.content)) {
                            return (
                              <>
                                {/* 提取文本内容（如果有） */}
                                {(() => {
                                  // 查找JSON部分的开始位置
                                  const jsonStartIndex = message.content.indexOf('{')
                                  if (jsonStartIndex > 0) {
                                    // 提取JSON之前的文本内容
                                    const textContent = message.content.substring(0, jsonStartIndex).trim()
                                    if (textContent) {
                                      return formatMessageContent(textContent, message.sender)
                                    }
                                  }
                                  return null
                                })()}
                                {/* 渲染简录卡片 */}
                                {renderRecordCard(parseRecordMessage(message.content), message.sender)}
                              </>
                            )
                          }
                        }
                        return formatMessageContent(message.content, message.sender)
                      })()
                  )}
                </div>
              
                {/* 消息文件 */}
                {message.files && message.files.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {message.files.map((file, index) => (
                      <Card
                        key={index}
                        size="small"
                        style={{ 
                          margin: 0, 
                          borderRadius: '8px', 
                          overflow: 'hidden',
                          maxWidth: 200,
                          backgroundColor: message.sender === 'user' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)'
                        }}
                        cover={
                          file.type === 'image' ? (
                            <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
                              <Image 
                                alt={file.name} 
                                src={file.url || undefined} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                preview={{ src: file.url || undefined }}
                              />
                            </div>
                          ) : (
                            <div style={{ 
                              position: 'relative', 
                              height: 100, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              backgroundColor: message.sender === 'user' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                            }}>
                              <FileOutlined style={{ fontSize: 40, color: message.sender === 'user' ? '#fff' : 'var(--theme-primary)' }} />
                            </div>
                          )
                        }>
                        <div style={{ padding: '8px', textAlign: 'center' }}>
                          <Text 
                            ellipsis={{ tooltip: file.name }} 
                            style={{ 
                              fontSize: '12px', 
                              maxWidth: '100%', 
                              display: 'block',
                              color: message.sender === 'user' ? '#fff' : 'var(--theme-text)'
                            }}
                          >
                            {file.name}
                          </Text>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 消息时间 - 移到气泡外面右下角 */}
              {message.timestamp && (
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.5,
                  marginTop: '4px',
                  alignSelf: 'flex-end',
                  marginRight: '8px',
                  color: 'var(--theme-text)',
                  fontWeight: '300',
                  textAlign: 'right'
                }}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* 思考中状态提示 - 当AI正在生成回复时显示 */}
      {isLoading && (
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'flex-start',
            maxWidth: '90%',
            marginBottom: '16px'
          }}
        >
          {/* 头像和消息气泡容器 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px'
          }}>
            {/* 头像 */}
            <div 
              style={{
                width: '32px', 
                height: '32px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                flexShrink: 0
              }}
            >
              <img 
                src="/nuo.png" 
                alt="小诺头像" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  minWidth: '100%',
                  minHeight: '100%'
                }} 
                loading="lazy"
              />
            </div>
            
            {/* 消息气泡 */}
            <div 
              style={{
                padding: '14px 18px',
                borderRadius: '6px 18px 18px 18px',
                lineHeight: '1.6',
                backgroundColor: 'var(--theme-background)',
                color: 'var(--theme-text)',
                position: 'relative',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                minHeight: '40px', // 确保气泡有足够高度显示加载动画
                fontSize: '14px',
                maxWidth: '100%'
              }}
            >
              {/* 现代波浪效果 - 适配新的气泡样式 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '5px',
                      height: '20px',
                      borderRadius: '2.5px',
                      backgroundColor: 'var(--theme-primary)',
                      animation: 'wave 1.5s ease-in-out ' + (i * 0.15) + 's infinite',
                      display: 'inline-block',
                      opacity: 0.7
                    }}
                  />
                ))}
              </div>
              <style>{`
                /* 波浪动画 */
                @keyframes wave {
                  0%, 100% {
                    transform: scaleY(0.5);
                    opacity: 0.5;
                  }
                  50% {
                    transform: scaleY(1);
                    opacity: 0.9;
                  }
                }
              `}</style>
            </div>
          </div>
        </div>
      )}

      {/* 占位符div，确保内容显示正常 */}
      <div style={{ flex: 1 }} />
    </div>
  )
}

export default MessageList