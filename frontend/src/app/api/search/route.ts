import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('search route received:', payload);

    const searchResponse = await fetch('http://127.0.0.1:5328/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search error response:', errorText);
      throw new Error(`Search failed: ${searchResponse.statusText}\n${errorText}`);
    }

    return NextResponse.json(await searchResponse.json());
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
} 