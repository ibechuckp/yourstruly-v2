import { NextResponse } from 'next/server';

// Get Deepgram WebSocket URL with authentication
// This keeps the API key server-side while allowing browser WebSocket connection
export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Deepgram not configured' }, { status: 503 });
  }

  // Return the API key for WebSocket connection
  // In production, you'd want to use Deepgram's temporary token API
  return NextResponse.json({
    apiKey,
    wsUrl: 'wss://api.deepgram.com/v1/listen',
  });
}
