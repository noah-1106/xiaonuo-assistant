import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'

interface EfficiencyRecordType {
  id: string
  name: string
  description: string
}

interface RecordTypeContextType {
  recordTypes: EfficiencyRecordType[]
  isLoading: boolean
  fetchRecordTypes: () => void
  getRecordTypeLabel: (typeId: string) => string
}

const RecordTypeContext = createContext<RecordTypeContextType | undefined>(undefined)

export const RecordTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recordTypes, setRecordTypes] = useState<EfficiencyRecordType[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 从后端获取记录类型
  const fetchRecordTypes = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai-settings/record-types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('获取记录类型失败')
      }

      const data = await response.json()
      const backendRecordTypes = data.data || []
      
      // 确保返回的是完整的记录类型对象数组
      let updatedRecordTypes: EfficiencyRecordType[] = []
      
      if (backendRecordTypes.length > 0 && typeof backendRecordTypes[0] === 'object') {
        // 后端返回的是完整的记录类型对象数组
        updatedRecordTypes = backendRecordTypes as EfficiencyRecordType[]
      } else if (backendRecordTypes.length > 0) {
        // 后端返回的是字符串数组，转换为对象数组
        updatedRecordTypes = (backendRecordTypes as string[]).map((id) => ({
          id: id,
          name: id,
          description: ''
        }))
      }
      
      // 添加默认的记录类型，如果后端没有返回
      const defaultRecordTypes: EfficiencyRecordType[] = [
        { id: 'article', name: '文章', description: '文章类型' },
        { id: 'todo', name: '待办', description: '待办事项类型' },
        { id: 'inspiration', name: '灵感闪现', description: '灵感闪现类型' },
        { id: 'other', name: '其他', description: '其他类型' }
      ]

      // 合并默认类型和后端返回的类型，去重
      const mergedRecordTypes = [...defaultRecordTypes]
      updatedRecordTypes.forEach(type => {
        const existingIndex = mergedRecordTypes.findIndex(t => t.id === type.id)
        if (existingIndex !== -1) {
          mergedRecordTypes[existingIndex] = type
        } else {
          mergedRecordTypes.push(type)
        }
      })
      
      setRecordTypes(mergedRecordTypes)
    } catch (error) {
      console.error('获取记录类型失败:', error)
      // 错误时使用默认的记录类型
      setRecordTypes([
        { id: 'article', name: '文章', description: '文章类型' },
        { id: 'todo', name: '待办', description: '待办事项类型' },
        { id: 'inspiration', name: '灵感闪现', description: '灵感闪现类型' },
        { id: 'other', name: '其他', description: '其他类型' }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初始化时获取记录类型
  useEffect(() => {
    // 检查用户是否已登录，只有在登录状态下才获取记录类型
    const token = localStorage.getItem('token')
    if (token) {
      fetchRecordTypes()
    }
  }, [fetchRecordTypes])

  // 获取记录类型标签
  const getRecordTypeLabel = useCallback((typeId: string): string => {
    const recordType = recordTypes.find(type => type.id === typeId)
    return recordType?.name || typeId
  }, [recordTypes])

  return (
    <RecordTypeContext.Provider
      value={{
        recordTypes,
        isLoading,
        fetchRecordTypes,
        getRecordTypeLabel
      }}
    >
      {children}
    </RecordTypeContext.Provider>
  )
}

// 自定义hook
export const useRecordType = () => {
  const context = useContext(RecordTypeContext)
  if (context === undefined) {
    throw new Error('useRecordType must be used within a RecordTypeProvider')
  }
  return context
}