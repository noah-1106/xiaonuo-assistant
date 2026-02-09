import React, { useState } from 'react'
import { Tag, Space, Typography, Button } from 'antd'
import { useRecordType } from '../../contexts/RecordTypeContext'
import type { RecordItem } from '../../types'

interface CardViewProps {
  onOpenDetail: (record: RecordItem, currentCardHeap?: {
    type?: string
    status?: string
    records: RecordItem[]
  }) => void
  records: RecordItem[]
  onUpdateRecord?: (record: RecordItem) => void // 添加更新简录的回调
}

const { Title, Text } = Typography

// 模式类型
type ModeType = 'organize' | 'browse'

const CardView: React.FC<CardViewProps> = ({ onOpenDetail, records, onUpdateRecord }) => {
  // 添加模式状态管理
  const [mode, setMode] = useState<ModeType>('organize')
  // 添加模式切换动画状态
  const [isModeChanging, setIsModeChanging] = useState(false)
  
  // 分离待处理和已完成的卡片
  // 待处理卡片堆按照更新时间从晚到早排序
  const pendingCards = records
    .filter(record => record.status === 'pending')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  
  // 已完成卡片堆按照完成时间从晚到早排序
  // 当记录状态变更为 completed 时，会触发 updateRecord 函数，updatedAt 字段会被更新
  // 无论是前端还是后端，都会在状态变更时更新 updatedAt 字段
  const completedCards = records
    .filter(record => record.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  
  // 在浏览模式下，按类型分组卡片
  const groupedCardsByType = records.reduce((groups, record) => {
    const type = record.type || 'other'
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(record)
    return groups
  }, {} as Record<string, RecordItem[]>)
  
  // 浏览模式下的卡片堆都按照更新时间从晚到早排序
  Object.keys(groupedCardsByType).forEach(type => {
    groupedCardsByType[type].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  // 获取类型名称
  const { getRecordTypeLabel } = useRecordType()



  // 卡片类型样式映射 - 使用主题相关色
  const typeMap: { [key: string]: { gradient: string; color: string } } = {
    article: {
      gradient: `linear-gradient(135deg, var(--theme-border) 0%, var(--theme-background) 100%)`,
      color: 'var(--theme-primary)'
    },
    todo: {
      gradient: `linear-gradient(135deg, var(--theme-border) 0%, var(--theme-background) 100%)`,
      color: 'var(--theme-primary)'
    },
    inspiration: {
      gradient: `linear-gradient(135deg, var(--theme-border) 0%, var(--theme-background) 100%)`,
      color: 'var(--theme-primary)'
    },
    other: {
      gradient: `linear-gradient(135deg, var(--theme-border) 0%, var(--theme-background) 100%)`,
      color: 'var(--theme-primary)'
    }
  }

  // 渲染单个卡片
  const renderCard = (record: RecordItem, index: number, isPending: boolean, currentCardHeap?: {
    type?: string
    status?: string
    records: RecordItem[]
  }) => {
    const typeInfo = typeMap[record.type] || typeMap.other
    const typeLabel = getRecordTypeLabel(record.type)
    
    // 只让最上面的卡片可交互
    const isTopCard = index === 0
    
    // 黄金比例 1:1.618（高度大于宽度，更符合卡片视觉习惯）
    const pendingWidth = mode === 'browse' ? 280 : 400 // 待处理卡片宽度（浏览模式下减小30%）
    const pendingHeight = pendingWidth * 1.618 // 待处理卡片高度（黄金比例）
    const completedWidth = 240 // 已完成卡片宽度
    const completedHeight = completedWidth * 1.618 // 已完成卡片高度（黄金比例）
    
    // 拖拽事件处理
    const handleDragStart = (e: React.DragEvent) => {
      if (isTopCard) {
        e.dataTransfer.setData('text/plain', record._id)
        e.dataTransfer.effectAllowed = 'move'
      }
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      const draggedRecordId = e.dataTransfer.getData('text/plain')
      
      // 只处理其他卡片的拖拽
      if (draggedRecordId !== record._id && onUpdateRecord) {
        const draggedRecord = records.find(r => r._id === draggedRecordId)
        if (draggedRecord) {
          // 在整理模式下，根据目标卡片状态更新拖拽卡片状态
          if (mode === 'organize') {
            const newStatus = isPending ? 'pending' : 'completed'
            if (draggedRecord.status !== newStatus) {
              onUpdateRecord({
                ...draggedRecord,
                status: newStatus
              })
            }
          }
          // 在浏览模式下，根据目标卡片类型更新拖拽卡片类型
          else if (mode === 'browse') {
            if (draggedRecord.type !== record.type) {
              onUpdateRecord({
                ...draggedRecord,
                type: record.type
              })
            }
          }
        }
      }
    }

    return (
      <div
        key={record._id}
        className="card-item"
        draggable={isTopCard} // 只让顶层卡片可拖拽
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          position: 'absolute',
          left: '50%', // 在各自容器中居中显示
          transform: `translateX(-50%) translateY(${index * 10}px) rotate(${isPending ? (index % 3 - 1) * 1.5 : (index % 3 - 1) * -1.5}deg) scale(${isTopCard ? (isPending ? 1 : 0.8) : (isPending ? 0.95 : 0.75)})`,
          zIndex: records.length - index,
          transition: isModeChanging ? 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'all 0.15s ease',
          cursor: isTopCard ? 'grab' : 'default', // 可拖拽时显示抓取光标
          opacity: isModeChanging ? 0.7 : (isTopCard ? 1 : 0.6), // 非顶层卡片透明度设置为60%
          boxShadow: `0 ${index * 3}px ${index * 6}px rgba(0, 0, 0, ${isTopCard ? 0.2 : 0.05})`,
          transformOrigin: 'center center',
          width: '100%',
          maxWidth: isPending ? pendingWidth : completedWidth,
          pointerEvents: isTopCard ? 'auto' : 'none',
          height: isPending ? pendingHeight : completedHeight, // 黄金比例卡片高度
          borderRadius: '16px',
          overflow: 'visible',
          animation: isModeChanging ? 'cardShift 0.25s ease forwards' : 'none'
        }}
        onMouseEnter={(e) => {
          if (isTopCard) {
            const scaleFactor = isPending ? 1.03 : 0.85
            e.currentTarget.style.transform = `translateX(-50%) translateY(${index * 10}px) rotate(0deg) scale(${scaleFactor})`
            e.currentTarget.style.zIndex = `${records.length + 10}`
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)'
            // 确保悬停时保持圆角
            e.currentTarget.style.borderRadius = '16px'
            e.currentTarget.style.overflow = 'hidden'
            e.currentTarget.style.cursor = 'grab' // 悬停时显示抓取光标
          }
        }}
        onMouseLeave={(e) => {
          if (isTopCard) {
            const scaleFactor = isPending ? 1 : 0.8
            e.currentTarget.style.transform = `translateX(-50%) translateY(${index * 10}px) rotate(${isPending ? (index % 3 - 1) * 1.5 : (index % 3 - 1) * -1.5}deg) scale(${scaleFactor})`
            e.currentTarget.style.zIndex = `${records.length - index}`
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.boxShadow = `0 ${index * 3}px ${index * 6}px rgba(0, 0, 0, 0.15)`
            // 确保离开时保持圆角
            e.currentTarget.style.borderRadius = '16px'
            e.currentTarget.style.overflow = 'hidden'
            e.currentTarget.style.cursor = 'grab' // 离开时恢复抓取光标
          }
        }}
        onClick={() => {
          if (isTopCard) {
            onOpenDetail(record, currentCardHeap)
          }
        }}
      >
        <div 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '16px',
            border: '1px solid #e0e0e0', // 浅灰色描边
            overflow: 'visible',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
            backgroundColor: 'var(--theme-background)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative', // 相对定位，便于底部区域绝对定位
            zIndex: 1,
            opacity: isTopCard ? 1 : 0.6 // 非顶层卡片透明度设置为60%
          }}
        >
          {/* 卡片头部 - 渐变背景，放大标题区域 */}
          <div 
            style={{
              padding: '24px 20px', // 增加内边距，放大标题区域
              background: typeInfo.gradient,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              flexShrink: 0, // 防止头部被压缩
              zIndex: 2
            }}
          >
            <Space size="middle" align="center" style={{ marginBottom: '16px' }}>
              <Tag 
                color={typeInfo.color}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: typeInfo.color,
                  border: `2px solid ${typeInfo.color}`,
                  fontWeight: 'bold',
                  fontSize: mode === 'browse' ? '12px' : (isPending ? '16px' : '14px'),
                  padding: mode === 'browse' ? '4px 16px' : '6px 20px',
                  borderRadius: '24px'
                }}
              >
                {typeLabel}
              </Tag>
            </Space>
            <Title 
              level={isPending ? 3 : 4} 
              style={{ 
                margin: '8px 0 0 0', 
                color: typeInfo.color,
                fontSize: mode === 'browse' ? '18px' : (isPending ? '24px' : '18px'), // 浏览模式下缩小标题字体
                fontWeight: 'bold',
                lineHeight: 1.3,
                opacity: 1 // 文字保持完全不透明
              }}
            >
              {record.title || record.summary || record.content.substring(0, 60) + '...'}
            </Title>
          </div>
          
          {/* 卡片内容区域 - 添加足够的底部内边距，避免被底部固定区域遮挡 */}
          <div style={{ 
            flex: 1, 
            padding: '20px 20px 140px 20px', // 增加底部内边距，为固定底部区域留出空间
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* 卡片内容 - 限制显示行数，根据卡片类型调整 */}
            <div
              style={{
                fontSize: mode === 'browse' ? '14px' : (isPending ? '16px' : '14px'), 
                color: 'var(--theme-text)',
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: mode === 'browse' ? 8 : (isPending ? 12 : 6), // 浏览模式下减少显示行数
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                opacity: 1
              }}
            >
              {record.content}
            </div>
          </div>
          
          {/* 底部固定区域 - 绝对定位在卡片底部，增加阴影效果 */}
          <div style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 20px 24px 20px',
            backgroundColor: 'var(--theme-background)',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            boxShadow: '0 -8px 24px rgba(0, 0, 0, 0.1)',
            zIndex: 3,
            borderTop: '1px solid var(--theme-border)'
          }}>
            {/* 标签区域 - 减小标签大小 */}
              {record.tags.length > 0 && (
                <div style={{ marginBottom: '12px', width: '100%' }}>
                  <Space size={[6, 6]} wrap style={{ width: '100%' }}>
                    {record.tags.map((tag, tagIndex) => (
                      <Tag 
                        key={tagIndex} 
                        style={{
                          background: 'var(--theme-background)',
                          color: 'var(--theme-text)',
                          fontSize: mode === 'browse' ? '10px' : (isPending ? '12px' : '11px'), // 浏览模式下进一步减小标签字体大小
                          borderRadius: '16px',
                          border: '1px solid var(--theme-border)',
                          padding: mode === 'browse' ? '3px 8px' : '4px 10px', // 浏览模式下进一步减小标签内边距
                          marginBottom: '4px',
                          opacity: 1 // 文字保持完全不透明
                        }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}
            
            {/* 时间信息区域 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
              {/* 简录时间 */}
              <Text style={{ fontSize: mode === 'browse' ? '11px' : (isPending ? '14px' : '12px'), color: 'var(--theme-text)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 1 }}>
                简录时间: {new Date(record.createdAt).toLocaleDateString()}
              </Text>
              
              {/* 已完成卡片显示整理时间 */}
              {!isPending && (
                <Text style={{ fontSize: mode === 'browse' ? '10px' : '12px', color: 'var(--theme-text)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 1 }}>
                  整理时间: {new Date(record.updatedAt).toLocaleDateString()}
                </Text>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 渲染浏览模式下的卡片布局
  const renderBrowseMode = () => {
    // 定义所有可能的简录类型
    const allTypes = ['article', 'todo', 'inspiration', 'other']
    
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '60px',
        justifyContent: 'center',
        width: '100%'
      }}>
        {allTypes.map((type) => {
          const typeCards = groupedCardsByType[type] || []
          const typeLabel = getRecordTypeLabel(type as any)
          
          return (
            <div key={type} style={{
              flex: 1,
              minWidth: '280px',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div 
                style={{
                  position: 'relative',
                  height: '500px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  overflow: 'visible'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedRecordId = e.dataTransfer.getData('text/plain')
                  if (draggedRecordId && onUpdateRecord) {
                    const draggedRecord = records.find(r => r._id === draggedRecordId)
                    if (draggedRecord && draggedRecord.type !== type) {
                      onUpdateRecord({
                        ...draggedRecord,
                        type: type as 'article' | 'todo' | 'inspiration' | 'other'
                      })
                    }
                  }
                }}
              >
                {typeCards.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: '280px',
                    height: '453px',
                    color: '#999',
                    fontSize: '18px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e0e0e0'
                  }}>
                    暂无卡片
                  </div>
                ) : (
                  <>
                    {/* 只渲染前5个卡片 */}
                    {typeCards.slice(0, 5).map((card, index) => renderCard(card, index, true, {
                      type: type,
                      records: typeCards
                    }))}
                  </>
                )}
              </div>
              <div style={{
                marginTop: '10px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 24px',
                  backgroundColor: 'var(--theme-background)',
                  borderRadius: '28px',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08)',
                  border: '1px solid var(--theme-border)',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--theme-primary)',
                    lineHeight: 1
                  }}>
                    {typeLabel}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-border)',
                    padding: '3px 10px',
                    borderRadius: '14px',
                    minWidth: '28px',
                    textAlign: 'center'
                  }}>
                    {typeCards.length}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '10px 16px', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      height: '100%',
      minHeight: '800px',
      width: '100%',
      backgroundImage: `
        linear-gradient(rgba(200, 200, 200, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(200, 200, 200, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '30px 30px',
      backgroundPosition: 'center center',
      backgroundColor: 'var(--theme-background)',
      overflow: 'visible'
    }}>
      {/* 模式切换按钮 - 与上方筛选卡片左对齐 */}
      <div style={{
        marginBottom: '10px',
        alignSelf: 'flex-start',
        position: 'relative',
        zIndex: 100,
        width: '100%',
        maxWidth: '1200px'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          border: `1px solid var(--theme-primary)`,
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <Button
            type={mode === 'organize' ? 'primary' : 'default'}
            onClick={() => {
              // 1. 先触发淡出动画
              setIsModeChanging(true)
              // 2. 等待淡出动画完成后（75ms），更新模式
              setTimeout(() => {
                setMode('organize')
                // 3. 再等待一小段时间后，触发淡入动画
                setTimeout(() => setIsModeChanging(false), 13)
              }, 75)
            }}
            style={{
              border: 'none',
              borderRadius: 0,
              backgroundColor: mode === 'organize' ? 'var(--theme-primary)' : 'var(--theme-background)',
              color: mode === 'organize' ? '#ffffff' : 'var(--theme-text)',
              padding: '8px 24px',
              fontSize: '16px',
              borderRight: `1px solid var(--theme-primary)`
            }}
          >
            整理模式
          </Button>
          <Button
            type={mode === 'browse' ? 'primary' : 'default'}
            onClick={() => {
              // 1. 先触发淡出动画
              setIsModeChanging(true)
              // 2. 等待淡出动画完成后（75ms），更新模式
              setTimeout(() => {
                setMode('browse')
                // 3. 再等待一小段时间后，触发淡入动画
                setTimeout(() => setIsModeChanging(false), 13)
              }, 75)
            }}
            style={{
              border: 'none',
              borderRadius: 0,
              backgroundColor: mode === 'browse' ? 'var(--theme-primary)' : 'var(--theme-background)',
              color: mode === 'browse' ? '#ffffff' : 'var(--theme-text)',
              padding: '8px 24px',
              fontSize: '16px'
            }}
          >
            浏览模式
          </Button>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        width: '100%',
        transition: 'opacity 0.15s ease-in-out',
        opacity: isModeChanging ? 0 : 1,
        zIndex: 200
      }}>
        {/* 根据模式渲染不同布局 */}
        {mode === 'organize' ? (
          <div style={{
            display: 'flex', 
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '60px',
            justifyContent: 'center'
          }}>
            {/* 待处理卡片 - 左侧位置 */}
            <div style={{ 
              flex: 1,
              minWidth: '400px',
              maxWidth: '440px',
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              <div 
                style={{ 
                  position: 'relative',
                  height: '650px',
                  width: '100%',
                  overflow: 'visible',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedRecordId = e.dataTransfer.getData('text/plain')
                  if (draggedRecordId && onUpdateRecord) {
                    const draggedRecord = records.find(r => r._id === draggedRecordId)
                    if (draggedRecord && draggedRecord.status !== 'pending') {
                      onUpdateRecord({
                        ...draggedRecord,
                        status: 'pending'
                      })
                    }
                  }
                }}
              >
                {pendingCards.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: '400px',
                    height: '647px',
                    color: '#999',
                    fontSize: '18px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e0e0e0'
                  }}>
                    暂无待处理卡片
                  </div>
                ) : (
                  <>
                    {/* 只渲染前5个卡片 */}
                    {pendingCards.slice(0, 5).map((card, index) => renderCard(card, index, true, {
                      status: 'pending',
                      records: pendingCards
                    }))}
                  </>
                )}
              </div>
              <div style={{
                marginTop: '30px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  backgroundColor: 'var(--theme-background)',
                  borderRadius: '32px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  border: '1px solid var(--theme-border)',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    color: 'var(--theme-primary)',
                    lineHeight: 1
                  }}>
                    待处理
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-border)',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    minWidth: '32px',
                    textAlign: 'center'
                  }}>
                    {pendingCards.length}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 已完成卡片 - 右侧位置 */}
            <div style={{ 
              flex: 1,
              minWidth: '280px',
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div 
                style={{ 
                  position: 'relative',
                  height: '650px',
                  width: '100%',
                  overflow: 'visible',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end'
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const draggedRecordId = e.dataTransfer.getData('text/plain')
                  if (draggedRecordId && onUpdateRecord) {
                    const draggedRecord = records.find(r => r._id === draggedRecordId)
                    if (draggedRecord && draggedRecord.status !== 'completed') {
                      onUpdateRecord({
                        ...draggedRecord,
                        status: 'completed'
                      })
                    }
                  }
                }}
              >
                {completedCards.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    width: '240px',
                    height: '388px',
                    color: '#999',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e0e0e0'
                  }}>
                    暂无已完成卡片
                  </div>
                ) : (
                  <>
                    {/* 只渲染前3个卡片，最新完成的在最上面 */}
                    {completedCards.slice(0, 3).map((card, index) => {
                      return renderCard(card, index, false, {
                        status: 'completed',
                        records: completedCards
                      });
                    })}
                  </>
                )}
              </div>
              <div style={{
                marginTop: '30px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 20px',
                  backgroundColor: 'var(--theme-background)',
                  borderRadius: '28px',
                  boxShadow: '0 3px 12px rgba(0, 0, 0, 0.08)',
                  border: '1px solid var(--theme-border)',
                  transition: 'all 0.3s ease'
                }}>
                  <span style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'var(--theme-primary)',
                    lineHeight: 1
                  }}>
                    已完成
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--theme-text)',
                    backgroundColor: 'var(--theme-border)',
                    padding: '3px 10px',
                    borderRadius: '14px',
                    minWidth: '28px',
                    textAlign: 'center'
                  }}>
                    {completedCards.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          renderBrowseMode()
        )}
      </div>
    </div>
  )
}

export default CardView