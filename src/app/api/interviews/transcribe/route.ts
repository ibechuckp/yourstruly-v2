import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// POST /api/interviews/transcribe
// Transcribe audio for interview responses (no auth required)
export async function POST(request: NextRequest) {
  try {
    // Get audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file size (max 25MB for interviews)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type
    const mimeType = audioFile.type || 'audio/webm';

    // Use Gemini for transcription
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      // Fall back to returning empty transcription - user can type
      console.warn('GEMINI_API_KEY not configured, returning empty transcription');
      return NextResponse.json({ 
        transcription: '',
        message: 'Transcription service unavailable. Please type your response.' 
      });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      {
        text: `Transcribe this audio recording accurately. Output only the transcription text, nothing else. 
If the audio is unclear or empty, respond with an empty string.
Do not add any commentary, timestamps, or speaker labels - just the spoken words.`,
      },
    ]);

    const transcription = result.response.text().trim();

    return NextResponse.json({ transcription });
  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Return empty transcription on error - user can still type
    return NextResponse.json({ 
      transcription: '',
      message: 'Transcription failed. Please type your response.',
      error: error.message 
    });
  }
}
