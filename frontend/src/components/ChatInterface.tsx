import React, { useRef, useEffect } from 'react'
import { ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'

interface Props {
  title: string
  messages: ChatMessage[]
  loading: boolean
  side: 'left' | 'right'
}

const ChatInterface = ({ title, messages, loading, side }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const filteredMessages = messages.filter((message, index) => {
    if (message.role === 'user') return true
    if (message.role === 'assistant') {
      // After each user message, we get two responses
      // For a sequence like: user1, vector1, rerank1, user2, vector2, rerank2
      // Indices are:          0,     1,       2,     3,     4,       5
      // We want vector responses (indices 1, 4) on the left
      // And rerank responses (indices 2, 5) on the right
      return message.role === 'assistant' && (
        (side === 'left' && index % 3 === 1) ||  // Vector responses
        (side === 'right' && index % 3 === 2)    // Rerank responses
      )
    }
    return false
  })

  const formatMessage = (content: string) => {
    // Split content into message and sources at the first blank line
    const [message, sourceSection] = content.split(/\n\n\[\[1\]]/);
    
    return (
      <>
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed mb-2">
          <ReactMarkdown
            components={{
              a: ({ node, ref, href, ...props }) => {
                if (href?.startsWith('#')) {
                  // This is a source citation - make it a link to the source list
                  return (
                    <a 
                      {...props}
                      href={href}
                      className="text-blue-500 no-underline hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    />
                  );
                }
                // External link
                return (
                  <a 
                    {...props}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  />
                );
              }
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
        {sourceSection && (
          <div className="text-sm text-gray-500 pt-2 border-t space-y-1">
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <a 
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-500"
                  />
                )
              }}
            >
              {`[[1]]${sourceSection}`}
            </ReactMarkdown>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-lg h-[calc(100vh-16rem)]">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {filteredMessages.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-xl px-5 py-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm mb-1 opacity-75">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              {formatMessage(message.content)}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default ChatInterface 