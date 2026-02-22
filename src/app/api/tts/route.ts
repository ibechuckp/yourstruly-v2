import { NextRequest, NextResponse } from 'next/server';

// TTS using Deepgram Aura with Delia voice
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  
  if (!text) {
    return NextResponse.json({ error: 'Text required' }, { status: 400 });
  }

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  // Use Deepgram Aura TTS if available
  if (DEEPGRAM_API_KEY) {
    try {
      // Delia: Young Adult, Casual, Friendly, Cheerful, Breathy - great for interviews
      const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-2-delia-en', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        console.error('Deepgram TTS error:', response.status, await response.text());
        throw new Error(`Deepgram TTS failed: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      console.error('Deepgram TTS error:', error);
      // Fall through to Google TTS fallback
    }
  }

  // Fallback: Google Translate TTS (no API key needed)
  try {
    const truncatedText = text.slice(0, 200);
    const encodedText = encodeURIComponent(truncatedText);
    
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodedText}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`Google TTS failed: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
