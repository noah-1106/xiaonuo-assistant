import React, { useState, useRef, useEffect } from 'react'
import { Layout, Button, Popover } from 'antd'
import { MessageOutlined } from '@ant-design/icons'
import ChatContainer from './ChatContainer'

const { Content } = Layout

const ChatLayout: React.FC = () => {
  const [visible, setVisible] = useState(false)
  
  const handleVisibleChange = (newVisible: boolean) => {
    setVisible(newVisible)
  }

  return (
    <Layout style={{ height: '100%' }}>
      {/* 聊天内容区域 */}
      <Content style={{ height: '100%', overflow: 'visible' }}>
        {/* 聊天容器 - 包含顶部标题和气泡图标 */}
        <ChatContainer 
          visible={visible} 
          onVisibleChange={handleVisibleChange} 
          setVisible={setVisible}
        />
      </Content>
    </Layout>
  )
}

export default ChatLayout