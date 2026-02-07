import { render, screen, act, fireEvent } from '@testing-library/react'
import { ChatProvider, useChat } from './ChatContext'
import { useRecord } from './RecordContext'

// Mock RecordContext
jest.mock('./RecordContext', () => ({
  useRecord: jest.fn()
}))

// Mock API_BASE_URL
jest.mock('../utils/env', () => ({
  API_BASE_URL: 'http://localhost:3001/api'
}))

const TestComponent = () => {
  const chatContext = useChat()
  return (
    <div>
      <div data-testid="messages-count">{chatContext.messages.length}</div>
      <div data-testid="input-value">{chatContext.inputValue}</div>
      <div data-testid="is-loading">{chatContext.isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{chatContext.error?.message || 'null'}</div>
      <div data-testid="sessions-count">{chatContext.sessions.length}</div>
      <div data-testid="current-session">{chatContext.currentSession?.title || 'null'}</div>
      <button
        data-testid="send-message"
        onClick={chatContext.sendMessage}
      >
        Send Message
      </button>
      <button
        data-testid="create-session"
        onClick={() => chatContext.createSession('Test Session')}
      >
        Create Session
      </button>
      <button
        data-testid="fetch-sessions"
        onClick={chatContext.fetchSessions}
      >
        Fetch Sessions
      </button>
      <button
        data-testid="clear-error"
        onClick={chatContext.clearError}
      >
        Clear Error
      </button>
      <button
        data-testid="create-record"
        onClick={() => chatContext.createRecordFromChat('1')}
      >
        Create Record
      </button>
      <button
        data-testid="check-reminder"
        onClick={chatContext.checkAndShowReminder}
      >
        Check Reminder
      </button>
      <input
        data-testid="input"
        value={chatContext.inputValue}
        onChange={(e) => chatContext.setInputValue(e.target.value)}
      />
    </div>
  )
}

const mockAddRecord = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRecord as jest.Mock).mockReturnValue({
    addRecord: mockAddRecord
  })
  // Mock localStorage
  localStorage.clear()
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key) => {
        if (key === 'token') return 'test-token'
        if (key === 'chat_sessions_cache') return JSON.stringify([])
        return null
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    },
    writable: true
  })
  // Mock fetch
  ;(globalThis as any).fetch = jest.fn()
})

describe('ChatContext', () => {
  it('should initialize with default messages', async () => {
    // Mock fetch for sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    expect(screen.getByTestId('messages-count')).toHaveTextContent('1')
    expect(screen.getByTestId('input-value')).toHaveTextContent('')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('should set input value correctly', async () => {
    // Mock fetch for sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    const input = screen.getByTestId('input')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
    })

    expect(screen.getByTestId('input-value')).toHaveTextContent('Hello')
  })

  it('should send message successfully', async () => {
    // Mock fetch for sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    // Mock successful response for send message
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          reply: 'Hello from bot'
        }
      })
    })

    // Set token in localStorage is already handled in beforeEach

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    // Set input value
    const input = screen.getByTestId('input')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
    })

    // Send message
    const sendButton = screen.getByTestId('send-message')
    await act(async () => {
      fireEvent.click(sendButton)
    })

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('input-value')).toHaveTextContent('')
  })

  it('should handle message sending error', async () => {
    // Mock error response
    ;(globalThis as any).fetch.mockRejectedValueOnce(new Error('Network error'))

    // Set token in localStorage is already handled in beforeEach

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    // Set input value
    const input = screen.getByTestId('input')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
    })

    // Send message
    const sendButton = screen.getByTestId('send-message')
    await act(async () => {
      fireEvent.click(sendButton)
    })

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).not.toHaveTextContent('null')
  })

  it('should create record from chat', async () => {
    mockAddRecord.mockResolvedValueOnce({})

    // Mock fetch for sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    const createRecordButton = screen.getByTestId('create-record')
    await act(async () => {
      fireEvent.click(createRecordButton)
    })

    expect(mockAddRecord).toHaveBeenCalledTimes(1)
  })

  it('should clear error', async () => {
    // Mock fetch for sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    // First, we need to set an error
    // For this test, we'll simulate an error by mocking a failed fetch
    ;(globalThis as any).fetch.mockRejectedValueOnce(new Error('Test error'))

    // Set input value and send message to trigger error
    const input = screen.getByTestId('input')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
    })

    const sendButton = screen.getByTestId('send-message')
    await act(async () => {
      fireEvent.click(sendButton)
    })

    // Clear error
    const clearErrorButton = screen.getByTestId('clear-error')
    await act(async () => {
      fireEvent.click(clearErrorButton)
    })

    expect(screen.getByTestId('error')).toHaveTextContent('null')
  })

  it('should fetch sessions successfully', async () => {
    // Mock fetch for initial sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    // Mock successful response for fetch sessions
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            sessionId: '1',
            title: 'Test Session',
            lastMessage: 'Hello',
            messageCount: 1,
            isActive: true,
            roles: {
              baseRole: 'assistant',
              enhancedRole: null
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      })
    })

    // Set token in localStorage is already handled in beforeEach

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    const fetchSessionsButton = screen.getByTestId('fetch-sessions')
    await act(async () => {
      fireEvent.click(fetchSessionsButton)
    })

    expect(screen.getByTestId('sessions-count')).toHaveTextContent('1')
  })

  it('should create session successfully', async () => {
    // Mock fetch for initial sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    // Mock successful response for create session
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          sessionId: '1',
          title: 'New Session',
          lastMessage: '',
          messageCount: 0,
          isActive: true,
          roles: {
            baseRole: 'assistant',
            enhancedRole: null
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    })

    // Set token in localStorage is already handled in beforeEach

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    const createSessionButton = screen.getByTestId('create-session')
    await act(async () => {
      fireEvent.click(createSessionButton)
    })

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
  })

  it('should check reminder successfully', async () => {
    // Mock fetch for initial sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    // Mock successful response for check reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 2
        }
      })
    })

    // Set token in localStorage is already handled in beforeEach

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    const checkReminderButton = screen.getByTestId('check-reminder')
    await act(async () => {
      fireEvent.click(checkReminderButton)
    })

    // Should add a reminder message
    expect(screen.getByTestId('messages-count')).toHaveTextContent('2')
  })

  it('should handle fetch sessions error', async () => {
    // Mock fetch for initial sessions and reminder
    ;(globalThis as any).fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: []
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          pendingCount: 0
        }
      })
    })

    // Mock error response for fetch sessions
    ;(globalThis as any).fetch.mockRejectedValueOnce(new Error('Network error'))

    // Set token in localStorage is already handled in beforeEach

    await act(async () => {
      render(
        <ChatProvider>
          <TestComponent />
        </ChatProvider>
      )
    })

    const fetchSessionsButton = screen.getByTestId('fetch-sessions')
    await act(async () => {
      fireEvent.click(fetchSessionsButton)
    })

    expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
    expect(screen.getByTestId('error')).not.toHaveTextContent('null')
  })
})
