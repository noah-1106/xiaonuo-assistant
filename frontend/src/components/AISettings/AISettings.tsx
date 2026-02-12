import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Slider, message, Typography, Checkbox, Collapse, Select, Switch } from 'antd'
import { SaveOutlined, UndoOutlined, PlusOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface EnhancedRecordType {
  id: string
  name: string
  description: string
  autoCreateRules: {
    keywords: string[]
    intentPatterns: string[]
  }
}

interface EnhancedRole {
  id: string
  name: string
  description: string
  prompt: string
  enhancedRecordTypes: EnhancedRecordType[]
  isEnabled: boolean
}

interface EfficiencyRecordType {
  id: string
  name: string
  description: string
}

interface EfficiencyAssistant {
  id: string
  name: string
  prompt: string
  recordTypes: EfficiencyRecordType[]
}

interface MultiModalConfig {
  images: boolean
  videos: boolean
  files: boolean
  maxFileSize: number
  allowedFileTypes: string[]
}

interface AISetting {
  _id: string
  model: string
  apiKey: string
  temperature: number
  topP: number
  systemPrompt: string
  efficiencyAssistant: EfficiencyAssistant
  enhancedRoles: EnhancedRole[]
  enabled: boolean
  contextRounds: number
  contextLength: number
  multiModalConfig: MultiModalConfig
  apiBaseUrl?: string
}

const AISettings: React.FC = () => {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<AISetting | null>(null)
  // 将简录类型信息移到组件内部状态中管理，初始为空数组，完全依赖后端数据
  const [recordTypes, setRecordTypes] = useState<EfficiencyRecordType[]>([])
  const [messageApi, contextHolder] = message.useMessage()

  // 获取AI设置
  const fetchAISettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai-settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取AI设置失败')
      }

      const data = await response.json()
      const setting = data.data.setting
      setSettings(setting)
      
      // 处理效率助理的简录类型，确保从后端获取完整的简录类型对象数组
      const backendRecordTypes = setting.efficiencyAssistant?.recordTypes || [];
      
      // 更新组件内部状态的简录类型
      let updatedRecordTypes: EfficiencyRecordType[] = [];
      
      if (backendRecordTypes.length > 0 && typeof backendRecordTypes[0] === 'object') {
        // 后端返回的是完整的简录类型对象数组，直接使用
        updatedRecordTypes = backendRecordTypes as EfficiencyRecordType[];
      } else if (backendRecordTypes.length > 0) {
        // 后端返回的是字符串数组，转换为对象数组，名称和描述为空
        updatedRecordTypes = (backendRecordTypes as string[]).map((id) => ({
          id: id,
          name: '',
          description: ''
        }));
      }
      
      setRecordTypes(updatedRecordTypes);
      
      // 确保enhancedRoles和enhancedRecordTypes字段存在，避免Form.List出错
      const processedSetting = {
        ...setting,
        // 系统提示词不使用默认值，完全依赖后端
        systemPrompt: setting.systemPrompt,
        // API基础URL
        apiBaseUrl: setting.apiBaseUrl,
        // 效率助理，完全依赖后端数据，不使用默认值
        efficiencyAssistant: {
          ...setting.efficiencyAssistant,
          recordTypes: updatedRecordTypes
        },
        // 增强角色完全依赖后端数据，不使用默认值
        enhancedRoles: setting.enhancedRoles || [],
        // 多模态配置
        multiModalConfig: setting.multiModalConfig || {
          images: true,
          videos: true,
          files: true,
          maxFileSize: 50,
          allowedFileTypes: 'pdf,doc,docx,txt,xlsx,pptx,md'
        }
      };
      
      // 更新表单
      form.setFieldsValue(processedSetting);
      
      // 手动更新效率简录类型表单字段，确保显示正确的名称和描述
      updatedRecordTypes.forEach((recordType, index) => {
        form.setFieldValue(['efficiencyRecordTypes', index, 'name'], recordType.name);
        form.setFieldValue(['efficiencyRecordTypes', index, 'description'], recordType.description);
      });
    } catch (error) {
      console.error('获取AI设置失败:', error)
      messageApi.error('获取AI设置失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 更新AI设置
  const handleUpdateSettings = async () => {
    try {
      const values = form.getFieldsValue()
      
      // 处理效率助理的简录类型，保存修改后的名称和描述
      const formRecordTypes = values.efficiencyRecordTypes || [];
      
      // 验证类型ID和名称的全局唯一性
      const allTypeIds = new Set<string>();
      const allTypeNames = new Set<string>();
      
      // 检查效率助理的类型
      for (const recordType of formRecordTypes) {
        const id = recordType?.id?.trim();
        const name = recordType?.name?.trim();
        
        if (!id || !name) continue;
        
        // 检查ID唯一性（不区分大小写）
        const lowerId = id.toLowerCase();
        if (allTypeIds.has(lowerId)) {
          messageApi.error(`类型ID "${id}" 重复，请确保所有类型ID唯一`);
          return;
        }
        allTypeIds.add(lowerId);
        
        // 检查名称唯一性（不区分大小写）
        const lowerName = name.toLowerCase();
        if (allTypeNames.has(lowerName)) {
          messageApi.error(`类型名称 "${name}" 重复，请确保所有类型名称唯一`);
          return;
        }
        allTypeNames.add(lowerName);
      }
      
      // 检查增强角色的类型
      const enhancedRoles = values.enhancedRoles || [];
      for (const role of enhancedRoles) {
        const roleRecordTypes = role?.enhancedRecordTypes || [];
        for (const recordType of roleRecordTypes) {
          const id = recordType?.id?.trim();
          const name = recordType?.name?.trim();
          
          if (!id || !name) continue;
          
          // 检查ID唯一性（不区分大小写）
          const lowerId = id.toLowerCase();
          if (allTypeIds.has(lowerId)) {
            messageApi.error(`类型ID "${id}" 重复，请确保所有类型ID全局唯一（包括效率助理和增强角色）`);
            return;
          }
          allTypeIds.add(lowerId);
          
          // 检查名称唯一性（不区分大小写）
          const lowerName = name.toLowerCase();
          if (allTypeNames.has(lowerName)) {
            messageApi.error(`类型名称 "${name}" 重复，请确保所有类型名称全局唯一（包括效率助理和增强角色）`);
            return;
          }
          allTypeNames.add(lowerName);
        }
      }
      
      const frontendUpdatedRecordTypes = formRecordTypes.map((recordType: any, index: number) => ({
        // 使用已有的ID或生成新ID
        id: recordTypes[index]?.id || `type_${Date.now()}_${index}`,
        name: recordType?.name || '',
        description: recordType?.description || ''
      }));
      
      // 更新本地状态
      setRecordTypes(frontendUpdatedRecordTypes);
      
      // 准备更新数据，将完整的简录类型对象数组发送到后端
      const updatedValues = {
        ...values,
        efficiencyAssistant: {
          ...values.efficiencyAssistant,
          recordTypes: frontendUpdatedRecordTypes
        },
        // 确保多模态配置存在
        multiModalConfig: values.multiModalConfig || {
          images: true,
          videos: true,
          files: true,
          maxFileSize: 50,
          allowedFileTypes: 'pdf,doc,docx,txt,xlsx,pptx,md'
        }
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedValues)
      })

      if (!response.ok) {
        throw new Error('更新AI设置失败')
      }

      const data = await response.json()
      const setting = data.data.setting
      
      // 处理效率助理的简录类型，确保从后端获取完整的简录类型对象数组
      const backendRecordTypes = setting.efficiencyAssistant?.recordTypes || [];
      
      // 更新组件内部状态的简录类型
      let backendUpdatedRecordTypes: EfficiencyRecordType[] = [];
      
      if (backendRecordTypes.length > 0 && typeof backendRecordTypes[0] === 'object') {
        // 后端返回的是完整的简录类型对象数组，直接使用
        backendUpdatedRecordTypes = backendRecordTypes as EfficiencyRecordType[];
      } else if (backendRecordTypes.length > 0) {
        // 后端返回的是字符串数组，转换为对象数组，名称和描述为空
        backendUpdatedRecordTypes = (backendRecordTypes as string[]).map((id) => ({
          id: id,
          name: '',
          description: ''
        }));
      }
      
      setRecordTypes(backendUpdatedRecordTypes);
      
      // 处理返回的设置数据，确保格式正确，完全依赖后端数据
      const processedSetting = {
        ...setting,
        // 效率助理，完全依赖后端数据，不使用默认值
        efficiencyAssistant: {
          ...setting.efficiencyAssistant,
          recordTypes: backendUpdatedRecordTypes
        },
        // 增强角色完全依赖后端数据，不使用默认值
        enhancedRoles: setting.enhancedRoles || []
      }
      
      setSettings(processedSetting)
      
      // 更新表单
      form.setFieldsValue(processedSetting);
      
      // 手动更新效率简录类型表单字段，确保显示正确的名称和描述
      backendUpdatedRecordTypes.forEach((recordType, index) => {
        form.setFieldValue(['efficiencyRecordTypes', index, 'name'], recordType.name);
        form.setFieldValue(['efficiencyRecordTypes', index, 'description'], recordType.description);
      });
      
      messageApi.success('AI设置更新成功')
    } catch (error) {
      console.error('更新AI设置失败:', error)
      messageApi.error('更新AI设置失败')
    }
  }

  // 重置AI设置
  const handleResetSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai-settings/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('重置AI设置失败')
      }

      const data = await response.json()
      const setting = data.data.setting
      
      // 处理效率助理的简录类型，确保从后端获取完整的简录类型对象数组
      const backendRecordTypes = setting.efficiencyAssistant?.recordTypes || [];
      
      // 更新组件内部状态的简录类型
      let updatedRecordTypes: EfficiencyRecordType[] = [];
      
      if (backendRecordTypes.length > 0 && typeof backendRecordTypes[0] === 'object') {
        // 后端返回的是完整的简录类型对象数组，直接使用
        updatedRecordTypes = backendRecordTypes as EfficiencyRecordType[];
      } else if (backendRecordTypes.length > 0) {
        // 后端返回的是字符串数组，转换为对象数组，名称和描述为空
        updatedRecordTypes = (backendRecordTypes as string[]).map((id) => ({
          id: id,
          name: '',
          description: ''
        }));
      }
      
      setRecordTypes(updatedRecordTypes);
      
      // 处理返回的设置数据，确保格式正确，完全依赖后端数据
      const processedSetting = {
        ...setting,
        // 效率助理，完全依赖后端数据，不使用默认值
        efficiencyAssistant: {
          ...setting.efficiencyAssistant,
          recordTypes: updatedRecordTypes
        },
        // 增强角色完全依赖后端数据，不使用默认值
        enhancedRoles: setting.enhancedRoles || []
      };
      
      setSettings(processedSetting)
      form.setFieldsValue(processedSetting);
      
      // 手动更新效率简录类型表单字段，确保显示正确的名称和描述
      updatedRecordTypes.forEach((recordType, index) => {
        form.setFieldValue(['efficiencyRecordTypes', index, 'name'], recordType.name);
        form.setFieldValue(['efficiencyRecordTypes', index, 'description'], recordType.description);
      });
      
      messageApi.success('AI设置重置成功')
    } catch (error) {
      console.error('重置AI设置失败:', error)
      messageApi.error('重置AI设置失败')
    }
  }

  // 初始化时获取AI设置
  useEffect(() => {
    fetchAISettings()
  }, [])

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>AI设置管理</Title>
        <Text type="secondary">管理AI助手的提示词和参数设置</Text>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateSettings}
        >
          <div style={{ marginBottom: '24px' }}>
            <Title level={4}>基础设置</Title>
          </div>

          <Form.Item
            name="model"
            label="AI模型"
            rules={[{ required: true, message: '请输入AI模型名称' }]}
          >
            <Select placeholder="请选择AI模型">
              <Select.Option value="doubao-seed-1-8-251228">豆包 1.8 (doubao-seed-1-8-251228)</Select.Option>
              <Select.Option value="doubao-seed-1-6-lite-251015">豆包 1.6 Lite</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API密钥"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input placeholder="请输入API密钥" />
          </Form.Item>

          <Form.Item
            name="apiBaseUrl"
            label="API基础URL"
            rules={[{ required: true, message: '请输入API基础URL' }]}
          >
            <Input placeholder="请输入API基础URL，例如：https://ark.cn-beijing.volces.com/api/v3" />
          </Form.Item>

          <Form.Item
            name="temperature"
            label={`温度 (${settings?.temperature || 80})`}
            rules={[{ required: true, message: '请设置温度参数' }]}
          >
            <Slider
              min={0}
              max={100}
              tooltip={{ formatter: (value) => `${value}` }}
            />
          </Form.Item>

          <Form.Item
            name="topP"
            label={`Top P (${settings?.topP || 0.95})`}
            rules={[{ required: true, message: '请设置Top P参数' }]}
          >
            <Slider
              min={0}
              max={1}
              step={0.01}
              tooltip={{ formatter: (value) => `${value}` }}
            />
          </Form.Item>

          <Form.Item
            name="contextRounds"
            label={`上下文轮数 (${settings?.contextRounds || 3})`}
            rules={[{ required: true, message: '请设置上下文轮数' }]}
          >
            <Slider
              min={1}
              max={10}
              tooltip={{ formatter: (value) => `${value}` }}
            />
          </Form.Item>

          <Form.Item
            name="contextLength"
            label={`上下文长度 (${settings?.contextLength || 10240})`}
            rules={[{ required: true, message: '请设置上下文长度' }]}
          >
            <Input placeholder="请输入上下文长度" type="number" />
          </Form.Item>

          {/* 系统基础提示词区域 */}
          <div style={{ marginBottom: '32px', marginTop: '32px', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
            <Title level={4}>系统基础提示词</Title>
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>基础系统提示词，不包含角色能力设定</Text>
            
            <Form.Item
              name="systemPrompt"
              label="系统提示词"
              rules={[{ required: true, message: '请输入系统提示词' }]}
            >
              <Input.TextArea
                rows={6}
                placeholder="请输入系统基础提示词，不包含角色能力设定"
              />
            </Form.Item>
          </div>

          {/* 效率助理提示词区域 */}
          <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
            <Title level={4}>效率助理提示词</Title>
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>默认效率助理，管理员可修改所有设置</Text>
            
            <Form.Item
              name={['efficiencyAssistant', 'id']}
              label="角色ID"
              rules={[{ required: true, message: '请输入角色ID' }]}
            >
              <Input placeholder="请输入角色ID" />
            </Form.Item>
            
            <Form.Item
              name={['efficiencyAssistant', 'name']}
              label="角色名称"
              rules={[{ required: true, message: '请输入角色名称' }]}
            >
              <Input placeholder="请输入角色名称" />
            </Form.Item>
            
            <Form.Item
              name={['efficiencyAssistant', 'prompt']}
              label="提示词"
              rules={[{ required: true, message: '请输入提示词' }]}
            >
              <Input.TextArea
                rows={6}
                placeholder="请输入效率助理提示词"
              />
            </Form.Item>
            
            {/* 效率助理简录类型管理 */}
            <div style={{ marginTop: '16px' }}>
              <Text strong>简录类型</Text>
              {/* 使用普通Form.Item展示简录类型，因为Form.List可能需要更多配置 */}
              <div style={{ marginLeft: '20px', marginTop: '12px' }}>
                {recordTypes.map((recordType, index) => (
                  <div key={recordType.id} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
                    <Form.Item
                      label="类型ID"
                      colon={false}
                    >
                      <Input placeholder="请输入类型ID" value={recordType.id} disabled />
                    </Form.Item>

                    <Form.Item
                      name={['efficiencyRecordTypes', index, 'name']}
                      label="类型名称"
                      rules={[{ required: true, message: '请输入类型名称' }]}
                      initialValue={recordType.name || ''}
                    >
                      <Input placeholder="请输入类型名称" />
                    </Form.Item>

                    <Form.Item
                      name={['efficiencyRecordTypes', index, 'description']}
                      label="类型描述"
                      initialValue={recordType.description || ''}
                    >
                      <Input.TextArea
                        rows={2}
                        placeholder="请输入类型描述"
                      />
                    </Form.Item>
                  </div>
                ))}
              </div>
              <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>管理员设置的简录类型，可修改名称和描述</Text>
            </div>
          </div>

          {/* 能力增强区域 */}
          <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Title level={4}>能力增强</Title>
            </div>
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>可增加和删除增强能力包，点击卡片查看详细设置</Text>
            
            <Form.List
              name="enhancedRoles"
            >
              {(fields, { add, remove }) => (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    {fields.map((field, index) => {
                      // 获取当前角色的初始值或默认值
                      const roleName = settings?.enhancedRoles?.[index]?.name || `增强能力包 ${index + 1}`;
                      const roleId = settings?.enhancedRoles?.[index]?.id || `role_${index + 1}`;
                       
                      return (
                      <Card 
                        key={field.key} 
                        style={{ marginBottom: '0' }}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{roleName}</div>
                              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                ID: {roleId}
                              </div>
                            </div>
                            <Button
                              danger
                              type="text"
                              onClick={() => remove(field.name)}
                              size="small"
                            >
                              删除
                            </Button>
                          </div>
                        }
                      >
                      <Collapse
                        defaultActiveKey={[]}
                        items={[
                          {
                            key: field.key,
                            label: (
                              <div style={{ fontWeight: 'bold' }}>详细设置</div>
                            ),
                            children: (
                              <>
                                <Form.Item
                                  name={[field.name, 'id']}
                                  label="角色ID"
                                  rules={[{ required: true, message: '请输入角色ID' }]}
                                >
                                  <Input placeholder="请输入角色ID" />
                                </Form.Item>

                                <Form.Item
                                  name={[field.name, 'name']}
                                  label="角色名称"
                                  rules={[{ required: true, message: '请输入角色名称' }]}
                                >
                                  <Input placeholder="请输入角色名称" />
                                </Form.Item>

                                <Form.Item
                                  name={[field.name, 'description']}
                                  label="角色描述"
                                >
                                  <Input.TextArea
                                    rows={2}
                                    placeholder="请输入角色描述"
                                  />
                                </Form.Item>

                                <Form.Item
                                  name={[field.name, 'prompt']}
                                  label="角色提示词"
                                  rules={[{ required: true, message: '请输入角色提示词' }]}
                                >
                                  <Input.TextArea
                                    rows={4}
                                    placeholder="请输入角色提示词"
                                  />
                                </Form.Item>

                                <Form.Item
                                  name={[field.name, 'isEnabled']}
                                  label="启用状态"
                                  valuePropName="checked"
                                >
                                  <Checkbox>启用此增强能力</Checkbox>
                                </Form.Item>

                                {/* 增强简录类型管理 */}
                                <div style={{ marginTop: '16px' }}>
                                  <Text strong>增强简录类型</Text>
                                  <Form.List
                                    name={[field.name, 'enhancedRecordTypes']}
                                  >
                                    {(recordTypeFields, { add: addRecordType, remove: removeRecordType }) => (
                                      <>
                                        {recordTypeFields.map((recordTypeField) => (
                                          <div key={recordTypeField.key} style={{ marginLeft: '20px', marginBottom: '12px', padding: '12px', border: '1px solid #e8e8e8', borderRadius: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                              <Text strong>简录类型</Text>
                                              <Button
                                                danger
                                                type="text"
                                                onClick={() => removeRecordType(recordTypeField.name)}
                                                size="small"
                                              >
                                                删除
                                              </Button>
                                            </div>
                                            
                                            <div style={{ marginLeft: '20px' }}>
                                              <Form.Item
                                                name={[recordTypeField.name, 'id']}
                                                label="类型ID"
                                                rules={[{ required: true, message: '请输入类型ID' }]}
                                              >
                                                <Input placeholder="请输入类型ID" />
                                              </Form.Item>

                                              <Form.Item
                                                name={[recordTypeField.name, 'name']}
                                                label="类型名称"
                                                rules={[{ required: true, message: '请输入类型名称' }]}
                                              >
                                                <Input placeholder="请输入类型名称" />
                                              </Form.Item>

                                              <Form.Item
                                                name={[recordTypeField.name, 'description']}
                                                label="类型描述"
                                              >
                                                <Input.TextArea
                                                  rows={2}
                                                  placeholder="请输入类型描述"
                                                />
                                              </Form.Item>
                                            </div>
                                          </div>
                                        ))}

                                        <Form.Item>
                                          <Button
                                            type="dashed"
                                            onClick={() => addRecordType()}
                                            block
                                            size="small"
                                          >
                                            添加增强简录类型
                                          </Button>
                                        </Form.Item>
                                      </>
                                    )}
                                  </Form.List>
                                </div>
                              </>
                            )
                          }
                        ]}
                      />
                    </Card>
                      );
                    })}
                  </div>
                  
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      添加能力增强包
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          {/* 多模态处理配置区域 */}
          <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
            <Title level={4}>多模态处理配置</Title>
            <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>配置AI模型的多模态处理能力，包括图片、视频和文件处理</Text>
            
            <Form.Item
              name={['multiModalConfig', 'images']}
              label="图片处理"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name={['multiModalConfig', 'videos']}
              label="视频处理"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name={['multiModalConfig', 'files']}
              label="文件处理"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            
            <Form.Item
              name={['multiModalConfig', 'maxFileSize']}
              label="最大文件大小 (MB)"
              rules={[{ required: true, message: '请设置最大文件大小' }]}
            >
              <Input type="number" placeholder="请输入最大文件大小" min={1} max={100} />
            </Form.Item>
            
            <Form.Item
              name={['multiModalConfig', 'allowedFileTypes']}
              label="允许的文件类型"
              rules={[{ required: true, message: '请设置允许的文件类型' }]}
            >
              <Input placeholder="请输入允许的文件类型，用逗号分隔，例如：pdf,doc,docx,txt" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button
              icon={<UndoOutlined />}
              onClick={handleResetSettings}
              loading={isLoading}
            >
              重置为默认值
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={isLoading}
            >
              保存设置
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default AISettings
