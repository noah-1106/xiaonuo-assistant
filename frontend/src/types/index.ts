// 导入主题类型
import type { ThemeName } from '../contexts/ThemeContext'

// 标签页类型定义
export interface Tab {
  key: string
  label: string
  closable: boolean
  url: string
  favicon?: string
}

// 上传文件类型定义
export interface UploadedFile {
  uid: string
  name: string
  url?: string
  file: File
  type: 'image' | 'file'
  preview: string
}

// 消息文件类型定义
export interface MessageFile {
  name: string
  type: 'image' | 'file'
  url: string
}

// 消息类型定义
export interface Message {
  id: string
  content: string
  sender: 'user' | 'bot'
  timestamp?: Date
  files?: MessageFile[]
  type?: 'text' | 'tool_execution_start' | 'function_error'
  recordId?: string
  recordTitle?: string
}

// 上传简录类型定义
export interface UploadedRecord {
  uid: string
  recordId: string
  title: string
  content: string
  summary?: string
  type: string
  status: string
  createdAt?: string
}

// Coze SDK配置类型
export interface CozeConfig {
  type: string
  bot_id: string
  isframe: boolean
}

// 套餐类型定义
export interface Plan {
  _id: string
  name: string
  description: string
  price: number
  discountPrice?: number
  duration: number // 套餐时长，单位：天
  features: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// 用户套餐信息定义
export interface UserPlan {
  _id: string
  name: string
  status: string
  endDate: Date
  planId?: string
}

// 用户类型定义
export interface User {
  id: string
  username: string
  phone: string
  email?: string
  nickname?: string
  avatar?: string
  role?: 'user' | 'admin'
  plan?: UserPlan
  theme?: ThemeName
  hasPassword?: boolean
}

// 简录类型定义
export interface RecordItem {
  _id: string
  title?: string
  content: string
  summary?: string
  type: 'article' | 'todo' | 'inspiration' | 'other'
  status: 'pending' | 'completed' | 'archived'
  tags: string[]
  link?: string
  createdAt: Date
  updatedAt: Date
  startTime?: Date
  endTime?: Date
  files?: MessageFile[]
}

// 日志文件类型定义
export interface LogFile {
  filename: string
  size: number
  mtime: string
  isCompressed: boolean
}

// AI设置类型定义
export interface AISetting {
  _id: string
  model: string
  apiKey: string
  temperature: number
  topP: number
  systemPrompt: string
  contextRounds: number
  contextLength: number
  useContextCache: boolean
  createdAt: Date
  updatedAt: Date
}
