import React, { useState } from 'react'
import { Button, Card, Input, Select, DatePicker, Slider, Switch, Badge, Progress, Tag, Space, Divider, Tabs, Radio, Checkbox, Avatar, Tooltip, Popover } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, UserOutlined, StarOutlined, HeartOutlined, MessageOutlined, SettingOutlined } from '@ant-design/icons'

const { Option } = Select
const { TabPane } = Tabs
const { TextArea } = Input

const StylePlayground: React.FC = () => {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState('light')

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: theme === 'light' ? '#f5f5f5' : '#1f1f1f',
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: theme === 'light' ? '#ffffff' : '#2c2c2c',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* 头部 */}
        <div style={{ 
          padding: '24px',
          backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
          borderBottom: `1px solid ${theme === 'light' ? '#e8e8e8' : '#444444'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 600,
            color: theme === 'light' ? '#262626' : '#ffffff'
          }}>样式效果 Playground</h1>
          <Button 
            type="primary" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            切换{theme === 'light' ? '深色' : '浅色'}主题
          </Button>
        </div>

        {/* 内容区域 */}
        <div style={{ padding: '24px' }}>
          <Tabs defaultActiveKey="1" style={{ marginBottom: '24px' }}>
            <TabPane tab="基础样式" key="1">
              {/* 1. 按钮样式 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>1. 按钮样式</h2>
                <Space wrap>
                  <Button type="primary">主要按钮</Button>
                  <Button>默认按钮</Button>
                  <Button type="dashed">虚线按钮</Button>
                  <Button type="text">文本按钮</Button>
                  <Button type="link">链接按钮</Button>
                  <Button danger>危险按钮</Button>
                  <Button type="primary" ghost>幽灵按钮</Button>
                  <Button type="primary" icon={<SearchOutlined />}>图标按钮</Button>
                  <Button type="primary" size="large">大按钮</Button>
                  <Button size="small">小按钮</Button>
                </Space>
              </div>

              {/* 2. 输入框样式 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>2. 输入框样式</h2>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Space wrap>
                    <Input placeholder="默认输入框" style={{ width: 200 }} />
                    <Input prefix={<UserOutlined />} placeholder="带前缀图标" style={{ width: 200 }} />
                    <Input suffix={<SearchOutlined />} placeholder="带后缀图标" style={{ width: 200 }} />
                  </Space>
                  <Space wrap>
                    <Input.Password placeholder="密码输入框" style={{ width: 200 }} />
                    <Input.TextArea rows={3} placeholder="文本域" style={{ width: 400 }} />
                  </Space>
                </Space>
              </div>

              {/* 3. 选择器样式 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>3. 选择器样式</h2>
                <Space wrap>
                  <Select defaultValue="option1" style={{ width: 200 }}>
                    <Option value="option1">选项1</Option>
                    <Option value="option2">选项2</Option>
                    <Option value="option3">选项3</Option>
                  </Select>
                  <DatePicker style={{ width: 200 }} />
                  <Radio.Group defaultValue="1">
                    <Space>
                      <Radio value="1">选项1</Radio>
                      <Radio value="2">选项2</Radio>
                      <Radio value="3">选项3</Radio>
                    </Space>
                  </Radio.Group>
                  <Checkbox.Group>
                    <Space>
                      <Checkbox value="1">选项1</Checkbox>
                      <Checkbox value="2">选项2</Checkbox>
                      <Checkbox value="3">选项3</Checkbox>
                    </Space>
                  </Checkbox.Group>
                </Space>
              </div>

              {/* 4. 滑块和开关 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>4. 滑块和开关</h2>
                <Space wrap>
                  <Slider defaultValue={30} style={{ width: 200 }} />
                  <Switch defaultChecked />
                  <Badge count={5}>徽章</Badge>
                  <Progress percent={60} />
                </Space>
              </div>
            </TabPane>

            <TabPane tab="布局样式" key="2">
              {/* 5. 卡片布局 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>5. 卡片布局</h2>
                <Space wrap>
                  <Card title="基础卡片" style={{ width: 300 }}>
                    <p>卡片内容</p>
                    <p>卡片内容</p>
                    <p>卡片内容</p>
                  </Card>
                  <Card 
                    title="带操作按钮的卡片" 
                    style={{ width: 300 }}
                    extra={<Button type="text" size="small">编辑</Button>}
                  >
                    <p>卡片内容</p>
                    <p>卡片内容</p>
                  </Card>
                  <Card 
                    title="带头像的卡片" 
                    style={{ width: 300 }}
                    cover={<img alt="示例图片" src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20office%20space%20interior%20design&image_size=square" />}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <Avatar src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20user%20avatar&image_size=square" />
                      <span style={{ marginLeft: '8px' }}>用户名称</span>
                    </div>
                    <p>卡片内容</p>
                  </Card>
                </Space>
              </div>

              {/* 6. 网格布局 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>6. 网格布局</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '16px'
                }}>
                  <div style={{ 
                    backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>网格项 1</div>
                  <div style={{ 
                    backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>网格项 2</div>
                  <div style={{ 
                    backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>网格项 3</div>
                  <div style={{ 
                    backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>网格项 4</div>
                </div>
              </div>

              {/* 7. 弹性布局 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>7. 弹性布局</h2>
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: theme === 'light' ? '#e6f7ff' : '#1a365d',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>flex: 1</div>
                  <div style={{ 
                    flex: 2, 
                    backgroundColor: theme === 'light' ? '#f6ffed' : '#2c5282',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>flex: 2</div>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: theme === 'light' ? '#fffbe6' : '#4a5568',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>flex: 1</div>
                </div>
              </div>
            </TabPane>

            <TabPane tab="交互效果" key="3">
              {/* 8. 提示工具 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>8. 提示工具</h2>
                <Space wrap>
                  <Tooltip title="这是一个提示">
                    <Button>悬停显示提示</Button>
                  </Tooltip>
                  <Popover title="弹出框标题" content="这是弹出框内容">
                    <Button>点击显示弹出框</Button>
                  </Popover>
                </Space>
              </div>

              {/* 9. 加载状态 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>9. 加载状态</h2>
                <Space wrap>
                  <Button type="primary" loading>加载中</Button>
                  <Button loading>加载中</Button>
                </Space>
              </div>

              {/* 10. 计数器 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>10. 计数器</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Button onClick={() => setCount(count - 1)}>-</Button>
                  <span style={{ fontSize: '18px', minWidth: '40px', textAlign: 'center' }}>{count}</span>
                  <Button onClick={() => setCount(count + 1)}>+</Button>
                </div>
              </div>
            </TabPane>

            <TabPane tab="动画效果" key="4">
              {/* 11. 悬停效果 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>11. 悬停效果</h2>
                <Space wrap>
                  <div style={{ 
                    width: 100, 
                    height: 100, 
                    backgroundColor: '#1890ff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }} 
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  >
                    悬停缩放
                  </div>
                  <div style={{ 
                    width: 100, 
                    height: 100, 
                    backgroundColor: '#52c41a',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }} 
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#73d13d'
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#52c41a'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                  >
                    悬停上浮
                  </div>
                </Space>
              </div>

              {/* 12. 渐变效果 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>12. 渐变效果</h2>
                <div style={{ 
                  width: '100%', 
                  height: 100, 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: 600
                }}>
                  线性渐变背景
                </div>
              </div>

              {/* 13. 阴影效果 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>13. 阴影效果</h2>
                <Space wrap>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #f0f0f0'
                  }}>轻微阴影</div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                  }}>中等阴影</div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}>强烈阴影</div>
                </Space>
              </div>
            </TabPane>

            <TabPane tab="响应式设计" key="5">
              {/* 14. 响应式布局 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>14. 响应式布局</h2>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '16px'
                }}>
                  <div style={{ 
                    flex: '1 1 200px', 
                    minWidth: '200px',
                    backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>响应式项 1</div>
                  <div style={{ 
                    flex: '1 1 200px', 
                    minWidth: '200px',
                    backgroundColor: theme === 'light' ? '#e6f7ff' : '#1a365d',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>响应式项 2</div>
                  <div style={{ 
                    flex: '1 1 200px', 
                    minWidth: '200px',
                    backgroundColor: theme === 'light' ? '#f6ffed' : '#2c5282',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>响应式项 3</div>
                </div>
                <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>调整浏览器窗口大小查看响应式效果</p>
              </div>

              {/* 15. 移动端适配 */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  marginBottom: '16px',
                  color: theme === 'light' ? '#262626' : '#ffffff'
                }}>15. 移动端适配</h2>
                <div style={{ 
                  maxWidth: '375px', 
                  margin: '0 auto',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#1890ff',
                    color: '#ffffff',
                    fontWeight: 600
                  }}>移动端顶部栏</div>
                  <div style={{ padding: '16px' }}>
                    <p>移动端内容区域</p>
                    <p>移动端内容区域</p>
                    <p>移动端内容区域</p>
                  </div>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: '#f0f2f5',
                    display: 'flex',
                    justifyContent: 'space-around',
                    borderTop: '1px solid #e8e8e8'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <MessageOutlined style={{ fontSize: '20px' }} />
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>消息</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <UserOutlined style={{ fontSize: '20px' }} />
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>我的</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <SettingOutlined style={{ fontSize: '20px' }} />
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>设置</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* 底部 */}
        <div style={{ 
          padding: '16px 24px',
          backgroundColor: theme === 'light' ? '#f0f2f5' : '#333333',
          borderTop: `1px solid ${theme === 'light' ? '#e8e8e8' : '#444444'}`,
          textAlign: 'center',
          fontSize: '14px',
          color: theme === 'light' ? '#666666' : '#999999'
        }}>
          样式 Playground - 用于参考和测试各种页面样式效果
        </div>
      </div>
    </div>
  )
}

export default StylePlayground
