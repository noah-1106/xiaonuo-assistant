import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { RecordProvider } from './contexts/RecordContext'
import { UserProvider } from './contexts/UserContext'
import { ChatProvider } from './contexts/ChatContext'
import { RecordTypeProvider } from './contexts/RecordTypeContext'
import { TaskProvider } from './contexts/TaskContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <RecordTypeProvider>
        <RecordProvider>
          <ChatProvider>
            <TaskProvider>
              <App />
            </TaskProvider>
          </ChatProvider>
        </RecordProvider>
      </RecordTypeProvider>
    </UserProvider>
  </React.StrictMode>,
)
