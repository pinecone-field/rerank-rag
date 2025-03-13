import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    const response = await fetch('http://127.0.0.1:5328/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`)
    }

    return NextResponse.json(await response.json())
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to chat' }, { status: 500 })
  }
} 