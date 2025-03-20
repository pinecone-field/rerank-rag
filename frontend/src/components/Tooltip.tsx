import React, { useState, useEffect } from 'react'

interface Props {
  content: React.ReactNode
  children: React.ReactNode
}

export const Tooltip = ({ content, children }: Props) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    // Add offset to position tooltip near cursor
    setPosition({ 
      x: e.clientX + 10, // Offset right of cursor
      y: e.clientY + 10  // Offset below cursor
    })
  }

  return (
    <div 
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {content && isVisible && (
        <div 
          className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg 
                     whitespace-pre-wrap max-w-lg max-h-[80vh] overflow-y-auto shadow-lg"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(0, -50%)',
            padding: '0.5rem 0.75rem',
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
} 