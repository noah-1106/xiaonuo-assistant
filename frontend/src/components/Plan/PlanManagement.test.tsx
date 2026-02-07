import { render, screen, waitFor, act } from '@testing-library/react'
import PlanManagement from './PlanManagement'
import { API_BASE_URL } from '../../utils/env'

// 模拟antd的message
jest.mock('antd', () => {
  return {
    message: {
      error: jest.fn(),
      success: jest.fn()
    },
    Card: ({ children }: any) => <div>{children}</div>,
    Typography: {
      Title: ({ children }: any) => <h1>{children}</h1>,
      Text: ({ children }: any) => <span>{children}</span>
    },
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    Table: ({ dataSource }: any) => (
      <table>
        <tbody>
          {dataSource.map((item: any) => (
            <tr key={item._id}>
              <td>{item.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    Tag: ({ children }: any) => <span>{children}</span>,
    Spin: ({ children }: any) => <div>{children}</div>,
    Modal: ({ open, children }: any) => open ? <div>{children}</div> : null,
    Form: {
      useForm: () => [{
        setFieldsValue: jest.fn(),
        resetFields: jest.fn(),
        validateFields: jest.fn().mockResolvedValue({})
      }],
      Item: ({ children }: any) => <div>{children}</div>
    },
    Input: ({ placeholder }: any) => <input placeholder={placeholder} />,
    InputNumber: ({ placeholder }: any) => <input placeholder={placeholder} />,
    Switch: ({ checked, onChange }: any) => (
      <input type="checkbox" checked={checked} onChange={(e: any) => onChange(e.target.checked)} />
    ),
    Space: ({ children }: any) => <div>{children}</div>,
    PlusOutlined: () => '+',
    EditOutlined: () => 'Edit',
    DeleteOutlined: () => 'Delete',
    SaveOutlined: () => 'Save',
    CloseOutlined: () => 'Close',
    CheckCircleOutlined: () => '✓'
  }
})

// 模拟fetch
const mockFetch = jest.fn()
;(globalThis as any).fetch = mockFetch

// 模拟localStorage
localStorage.setItem('token', 'test-token')

describe('PlanManagement组件测试', () => {
  beforeEach(() => {
    // 重置mock
    mockFetch.mockReset()
  })

  describe('获取套餐列表', () => {
    it('当API调用成功时，应该显示套餐列表', async () => {
      const mockPlans = [
        {
          _id: '1',
          name: '免费版',
          description: '基础功能',
          price: 0,
          duration: 365,
          features: ['100条消息/月'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      // 模拟fetch响应
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: mockPlans })
      })

      // 渲染组件
      await act(async () => {
        render(<PlanManagement />)
      })

      // 验证fetch调用
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/plans/admin/plans`,
          {
            headers: {
              'Authorization': 'Bearer test-token'
            }
          }
        )
      })

      // 验证套餐名称显示
      await waitFor(() => {
        expect(screen.getByText('免费版')).toBeInTheDocument()
      })
    })

    it('当API调用失败时，应该使用模拟数据', async () => {
      // 模拟fetch失败
      mockFetch.mockRejectedValueOnce(new Error('网络错误'))

      // 渲染组件
      await act(async () => {
        render(<PlanManagement />)
      })

      // 验证使用了模拟数据
      await waitFor(() => {
        expect(screen.getByText('免费版')).toBeInTheDocument()
      })
    })
  })

  describe('基本UI渲染', () => {
    it('应该渲染套餐管理标题', async () => {
      // 模拟空数据
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ data: [] })
      })

      // 渲染组件
      await act(async () => {
        render(<PlanManagement />)
      })

      // 验证标题显示
      await waitFor(() => {
        expect(screen.getByText('套餐管理')).toBeInTheDocument()
      })
    })
  })
})
