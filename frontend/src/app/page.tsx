'use client'

import React, { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'
import { ChatMessage, ChatResponse } from '@/types'

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setLoading(true)
    const message = inputValue
    setInputValue('')
    
    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })
      
      const data: ChatResponse = await response.json()
      
      setMessages([
        ...newMessages,
        { role: 'assistant' as const, content: data.vectorResponse },
        { role: 'assistant' as const, content: data.rerankedResponse }
      ])
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="py-6 bg-white shadow">
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Vector vs Rerank: See the Difference!
        </h1>
        <p className="mt-2 text-center text-gray-600 max-w-2xl mx-auto">
          Ask a question and watch how reranking improves search results
        </p>
      </header>

      <main className="flex-1 container mx-auto p-6 flex flex-col">
        <div className="flex-1 grid grid-cols-2 gap-6 mb-6">
          <ChatInterface
            title="Similarity Search"
            messages={messages}
            loading={loading}
            side="left"
          />
          <ChatInterface
            title="Similarity + Rerank"
            messages={messages}
            loading={loading}
            side="right"
          />
        </div>

        <div className="max-w-3xl mx-auto w-full">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  )
} 