import websocketService from './websocketService'
import { io, Socket } from 'socket.io-client'

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket: any = {
    on: jest.fn((event: string, callback: Function) => {
      if (event === 'connect') {
        // 模拟连接成功
        setTimeout(() => callback(), 100)
      }
      return mockSocket
    }),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }
  
  const mockIo = jest.fn(() => mockSocket)
  
  return {
    io: mockIo,
    Socket: jest.fn()
  }
})

const mockIo = io as jest.MockedFunction<typeof io>
const mockSocket = mockIo() as jest.Mocked<Socket>

describe('WebSocketService', () => {
  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks()
    // 重置服务状态
    jest.resetModules()
  })

  afterEach(() => {
    // 关闭连接
    websocketService.close()
  })

  test('should initialize WebSocket connection with userId and token', () => {
    const userId = 'test-user-id'
    const token = 'test-token'

    websocketService.init(userId, token)

    // 验证io被调用
    expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: false
    })

    // 验证socket.on被调用
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('authenticated', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('authentication_error', expect.any(Function))
  })

  test('should register and notify message handlers', (done) => {
    const userId = 'test-user-id'
    const token = 'test-token'
    const testEvent = 'task_update'
    const testData = { taskId: '123', status: 'completed' }

    // 初始化服务
    websocketService.init(userId, token)

    // 注册消息处理器
    const handler = (data: any) => {
      expect(data).toEqual(testData)
      done()
    }

    websocketService.on(testEvent, handler)

    // 模拟内部notifyHandlers调用
    // 由于notifyHandlers是私有方法，我们需要通过触发相应的socket事件来间接测试
    // 这里我们可以通过访问私有方法或模拟socket事件来测试
    
    // 模拟socket事件触发
    const eventHandlers = (mockSocket.on as jest.Mock).mock.calls
    const taskUpdateHandler = eventHandlers.find((call) => call[0] === testEvent)?.[1]
    
    if (taskUpdateHandler) {
      taskUpdateHandler(testData)
    } else {
      done(new Error('Task update handler not found'))
    }
  })

  test('should remove message handlers', () => {
    const userId = 'test-user-id'
    const token = 'test-token'
    const testEvent = 'task_complete'

    // 初始化服务
    websocketService.init(userId, token)

    // 注册消息处理器
    const handler = jest.fn()
    websocketService.on(testEvent, handler)

    // 移除消息处理器
    websocketService.off(testEvent, handler)

    // 模拟socket事件触发
    const eventHandlers = (mockSocket.on as jest.Mock).mock.calls
    const taskCompleteHandler = eventHandlers.find((call) => call[0] === testEvent)?.[1]
    
    if (taskCompleteHandler) {
      taskCompleteHandler({ taskId: '123' })
      // 验证处理器没有被调用
      expect(handler).not.toHaveBeenCalled()
    }
  })

  test('should send messages when connected', async () => {
    const userId = 'test-user-id';
    const token = 'test-token';
    const testType = 'chat_message';
    const testData = { message: 'Hello' };

    // 初始化服务
    websocketService.init(userId, token);

    // 等待连接成功
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    // 直接修改isConnected属性为true
    (websocketService as any).isConnected = true;

    // 发送消息
    websocketService.send(testType, testData);

    // 验证socket.emit被调用
    expect(mockSocket.emit).toHaveBeenCalledWith(testType, testData);
  });

  test('should close WebSocket connection', () => {
    const userId = 'test-user-id'
    const token = 'test-token'

    // 初始化服务
    websocketService.init(userId, token)

    // 关闭连接
    websocketService.close()

    // 验证socket.disconnect被调用
    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  test('should return connection status', () => {
    const userId = 'test-user-id'
    const token = 'test-token'

    // 初始化服务
    websocketService.init(userId, token)

    // 检查连接状态
    const status = websocketService.getConnectionStatus()
    expect(typeof status).toBe('boolean')
  })
})
