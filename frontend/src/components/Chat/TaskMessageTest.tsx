import React from 'react'
import type { Message } from '../../types'
import MessageList from './MessageList'

// 模拟任务消息数据
const mockTaskMessages: Message[] = [
  {
    id: '1',
    content: '用户请求创建项目报告生成任务',
    sender: 'user',
    timestamp: new Date(),
    type: 'text'
  },
  {
    id: '2',
    content: '任务已创建，开始执行',
    sender: 'bot',
    timestamp: new Date(),
    type: 'task_execution',
    taskInfo: {
      taskId: 'task-001',
      status: 'in_progress',
      progress: 0,
      title: '生成项目报告',
      description: '基于最近的项目数据生成详细报告'
    }
  },
  {
    id: '3',
    content: '正在收集项目数据...',
    sender: 'bot',
    timestamp: new Date(),
    type: 'task_execution',
    taskInfo: {
      taskId: 'task-001',
      status: 'in_progress',
      progress: 25,
      title: '生成项目报告',
      description: '基于最近的项目数据生成详细报告'
    }
  },
  {
    id: '4',
    content: '正在分析数据...',
    sender: 'bot',
    timestamp: new Date(),
    type: 'task_execution',
    taskInfo: {
      taskId: 'task-001',
      status: 'in_progress',
      progress: 50,
      title: '生成项目报告',
      description: '基于最近的项目数据生成详细报告'
    }
  },
  {
    id: '5',
    content: '正在生成报告...',
    sender: 'bot',
    timestamp: new Date(),
    type: 'task_execution',
    taskInfo: {
      taskId: 'task-001',
      status: 'in_progress',
      progress: 75,
      title: '生成项目报告',
      description: '基于最近的项目数据生成详细报告'
    }
  },
  {
    id: '6',
    content: '项目报告已生成完成，包含市场分析、技术评估和未来规划等章节。',
    sender: 'bot',
    timestamp: new Date(),
    type: 'task_result',
    taskInfo: {
      taskId: 'task-001',
      status: 'completed',
      progress: 100,
      title: '生成项目报告',
      description: '基于最近的项目数据生成详细报告'
    }
  },
  {
    id: '7',
    content: '用户请求执行失败的任务示例',
    sender: 'user',
    timestamp: new Date(),
    type: 'text'
  },
  {
    id: '8',
    content: '任务执行过程中遇到错误',
    sender: 'bot',
    timestamp: new Date(),
    type: 'task_result',
    taskInfo: {
      taskId: 'task-002',
      status: 'failed',
      progress: 30,
      title: '测试失败任务',
      description: '这是一个测试失败情况的任务',
      error: '数据库连接超时，无法获取所需数据'
    }
  }
]

const TaskMessageTest: React.FC = () => {
  // 模拟ChatContext
  const mockChatContext = {
    messages: mockTaskMessages,
    isLoading: false,
    inputValue: '',
    uploadedFiles: [],
    error: null,
    setInputValue: () => {},
    setUploadedFiles: () => {},
    sendMessage: async () => {},
    createRecordFromChat: () => {},
    clearError: () => {},
    sessions: [],
    currentSession: null,
    isFetchingSessions: false,
    fetchSessions: async () => {},
    fetchSessionMessages: async () => {},
    createSession: async () => {},
    switchSession: () => {},
    updateSessionEnhancedRole: async () => {},
    updateSessionTitle: async () => {},
    deleteSession: async () => {},
    checkAndShowReminder: async () => {}
  }

  return (
    <div style={{
      width: '100%',
      height: '80vh',
      border: '1px solid #ddd',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--theme-background)',
        borderBottom: '1px solid #ddd',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        任务执行消息样式测试
      </div>
      <div style={{
        height: 'calc(100% - 60px)',
        overflow: 'auto'
      }}>
        {/* 这里应该使用ChatProvider包装，但为了简单测试，直接使用MessageList */}
        {/* 在实际使用中，应该通过ChatContext提供messages */}
        <div style={{
          height: '100%',
          overflow: 'auto'
        }}>
          {/* 手动渲染消息列表，模拟MessageList的内部逻辑 */}
          <div 
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
            {mockTaskMessages.map(message => (
              <div 
                key={message.id}
                className={`message-container ${message.sender}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  marginBottom: '16px',
                  position: 'relative'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '8px'
                }}>
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
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'var(--theme-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#fff',
                        fontWeight: 'bold'
                      }}>
                        你
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'var(--theme-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        color: '#fff',
                        fontWeight: 'bold'
                      }}>
                        诺
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%' }}>
                    <div 
                      className={`message-item ${message.sender}`}
                      style={{
                        padding: '14px 18px',
                        borderRadius: message.sender === 'user' ? '18px 6px 18px 18px' : '6px 18px 18px 18px',
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
                      {/* 简单的消息渲染，实际使用时会调用renderTaskMessage */}
                      <div style={{ 
                        whiteSpace: 'pre-wrap', 
                        wordBreak: 'break-word',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        {message.content}
                      </div>
                    </div>
                    
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskMessageTest
