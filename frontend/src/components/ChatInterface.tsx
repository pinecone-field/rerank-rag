import React, { useRef, useEffect } from 'react'
import { ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'
import { Tooltip } from './Tooltip'

interface Props {
  title: string
  messages: ChatMessage[]
  loading: boolean
  side: 'left' | 'right'
  searchResults?: any[]
}

const ChatInterface = ({ title, messages, loading, side, searchResults }: Props) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Filter messages to show correct responses for each side
  const filteredMessages = messages.filter((message, index) => {
    if (message.role === 'user') return true;
    if (message.role === 'assistant') {
      return (side === 'left' && index % 3 === 1) || (side === 'right' && index % 3 === 2);
    }
    return false;
  });

  const formatMessage = (content: string) => {
    // Split content into message and sources at the markdown Sources section
    const parts = content.split(/\n\nSources:/);
    const message = parts[0];
    const sourceSection = parts[1];
    
    // Format just the message part with proper paragraphs
    const formattedMessage = message.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');

    const formattedSourceSection = sourceSection?.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
    
    return (
      <>
        <div className="prose prose-sm">
          <ReactMarkdown>
            {formattedMessage}
          </ReactMarkdown>
        </div>
        {sourceSection && (
          <div className="text-sm text-gray-500 pt-2 border-t">
            <div className="font-medium mb-1">Sources:</div>
            <div className="space-y-1">
              <ReactMarkdown>
                {formattedSourceSection}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </>
    )
  }

  const tooltipContent = searchResults && searchResults.length > 0 ? (
    <div className="max-w-2xl">
      <h3 className="font-bold mb-2">All {side === 'left' ? 'Vector' : 'Reranked'} Results:</h3>
      <div className="space-y-4">
        {searchResults.map((result, i) => (
          <div key={i} className="pb-3 border-b border-gray-600 last:border-0">
            <div className="font-mono text-xs mb-1">Score: {result.score.toFixed(4)}</div>
            <div className="text-sm mb-1 whitespace-pre-wrap">{result.metadata.text}</div>
            <div className="text-xs text-gray-400">
              Title: {result.metadata.title}
              <br />
              Source: {result.metadata.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <Tooltip content={tooltipContent}>
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
    </Tooltip>
  )
}

export default ChatInterface 