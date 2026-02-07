import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordProvider, useRecord } from './RecordContext';
import { UserProvider } from './UserContext';
import { ThemeProvider } from './ThemeContext';

// 创建测试组件
const TestComponent = () => {
  const {
    records,
    viewMode,
    isLoading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    setViewMode
  } = useRecord();
  
  return (
    <div>
      {isLoading && <div data-testid="loading">加载中...</div>}
      {error && <div data-testid="error">{error.message}</div>}
      <div data-testid="record-count">记录数: {records.length}</div>
      <div data-testid="view-mode">视图模式: {viewMode}</div>
      <button data-testid="fetch-records" onClick={fetchRecords}>
        获取记录
      </button>
      <button data-testid="create-record" onClick={() => addRecord({
        type: 'todo',
        title: '测试记录',
        content: '测试内容',
        tags: ['测试', '重要']
      })}>
        创建记录
      </button>
      <button data-testid="update-record" onClick={() => updateRecord('1', {
        title: '更新的记录',
        status: 'completed'
      })}>
        更新记录
      </button>
      <button data-testid="delete-record" onClick={() => deleteRecord('1')}>
        删除记录
      </button>
      <button data-testid="switch-view" onClick={() => setViewMode(viewMode === 'list' ? 'card' : 'list')}>
        切换视图
      </button>
    </div>
  );
};

// Mock fetch
const mockFetch = jest.fn();
window.fetch = mockFetch as any;

describe('RecordContext', () => {
  beforeEach(() => {
    // 清除localStorage
    localStorage.clear();
    // 重置mock
    mockFetch.mockClear();
    // 设置token
    localStorage.setItem('token', 'mock-token');
  });

  test('should render with default state', () => {
    render(
      <UserProvider>
        <ThemeProvider>
          <RecordProvider>
            <TestComponent />
          </RecordProvider>
        </ThemeProvider>
      </UserProvider>
    );
    
    expect(screen.getByText('记录数: 0')).toBeInTheDocument();
    expect(screen.getByText('视图模式: list')).toBeInTheDocument();
    expect(screen.getByText('获取记录')).toBeInTheDocument();
    expect(screen.getByText('创建记录')).toBeInTheDocument();
    expect(screen.getByText('更新记录')).toBeInTheDocument();
    expect(screen.getByText('删除记录')).toBeInTheDocument();
    expect(screen.getByText('切换视图')).toBeInTheDocument();
  });

  test('should handle fetch records successfully', async () => {
    const mockRecords = [
      {
        _id: '1',
        type: 'todo',
        title: '测试记录1',
        content: '测试内容1',
        tags: ['测试'],
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        type: 'note',
        title: '测试记录2',
        content: '测试内容2',
        tags: ['重要'],
        status: 'completed',
        createdAt: new Date().toISOString()
      }
    ];
    
    // 为所有请求添加mock
    mockFetch.mockImplementation((url: string, options: any) => {
      // 模拟获取记录请求
      if (url.includes('/records') && !options?.body) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'ok',
            message: '获取记录成功',
            data: {
              records: mockRecords
            }
          })
        });
      }
      // 其他请求返回默认响应
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          status: 'ok',
          message: '操作成功',
          data: {}
        })
      });
    });
    
    render(
      <UserProvider>
        <ThemeProvider>
          <RecordProvider>
            <TestComponent />
          </RecordProvider>
        </ThemeProvider>
      </UserProvider>
    );
    
    fireEvent.click(screen.getByTestId('fetch-records'));
    
    await waitFor(() => {
      expect(screen.getByTestId('record-count')).toHaveTextContent('记录数: 2');
    });
  });

  test('should handle create record successfully', async () => {
    const mockRecord = {
      _id: '1',
      type: 'todo',
      title: '测试记录',
      content: '测试内容',
      tags: ['测试', '重要'],
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Mock所有可能的请求
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 'ok',
        message: '操作成功',
        data: {}
      })
    });
    
    // 为创建记录请求添加特定的mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        status: 'ok',
        message: '创建记录成功',
        data: {
          record: mockRecord
        }
      })
    });
    
    render(
      <UserProvider>
        <ThemeProvider>
          <RecordProvider>
            <TestComponent />
          </RecordProvider>
        </ThemeProvider>
      </UserProvider>
    );
    
    fireEvent.click(screen.getByTestId('create-record'));
    
    await waitFor(() => {
      expect(screen.getByTestId('record-count')).toHaveTextContent('记录数: 1');
    });
  });

  test('should handle switch view mode', () => {
    render(
      <UserProvider>
        <ThemeProvider>
          <RecordProvider>
            <TestComponent />
          </RecordProvider>
        </ThemeProvider>
      </UserProvider>
    );
    
    expect(screen.getByTestId('view-mode')).toHaveTextContent('视图模式: list');
    
    fireEvent.click(screen.getByTestId('switch-view'));
    expect(screen.getByTestId('view-mode')).toHaveTextContent('视图模式: card');
    
    fireEvent.click(screen.getByTestId('switch-view'));
    expect(screen.getByTestId('view-mode')).toHaveTextContent('视图模式: list');
  });
});
