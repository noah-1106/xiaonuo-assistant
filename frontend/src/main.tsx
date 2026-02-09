import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { RecordProvider } from './contexts/RecordContext'
import { UserProvider } from './contexts/UserContext'
import { ChatProvider } from './contexts/ChatContext'
import { RecordTypeProvider } from './contexts/RecordTypeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <RecordTypeProvider>
        <RecordProvider>
          <ChatProvider>
            <App />
          </ChatProvider>
        </RecordProvider>
      </RecordTypeProvider>
    </UserProvider>
  </React.StrictMode>,
)
