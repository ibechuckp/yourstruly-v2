import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/conversation/transcribe
// Upload audio and get transcription via Deepgram
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get audio file from form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file size (max 50MB)
    if (audioFile.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (use 'memories' bucket which should exist)
    const timestamp = Date.now();
    const extension = audioFile.name.split('.').pop() || 'webm';
    const filename = `voice/${user.id}/${timestamp}.${extension}`;
    
    // Try 'memories' bucket first, fallback handling
    const STORAGE_BUCKET = 'memories';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, {
        contentType: audioFile.type || 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload audio:', uploadError);
      
      // If bucket doesn't exist, still try to transcribe without saving audio
      if (uploadError.message?.includes('Bucket not found')) {
        console.warn('Storage bucket not found - transcribing without saving audio');
        // Continue to transcription without audio URL
      } else {
        return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
      }
    }

    // Get public URL (only if upload succeeded)
    let audioUrl = '';
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filename);
      audioUrl = urlData.publicUrl;
    }

    // Transcribe with Gemini, OpenAI Whisper, or Deepgram
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    
    // If no transcription API configured, return with warning
    if (!GEMINI_API_KEY && !OPENAI_API_KEY && !DEEPGRAM_API_KEY) {
      console.warn('No transcription API configured');
      return NextResponse.json({
        url: audioUrl,
        transcription: '', 
        warning: 'Transcription service not configured - please add GEMINI_API_KEY, OPENAI_API_KEY, or DEEPGRAM_API_KEY',
      });
    }
    
    // Try Gemini first (you have this key!)
    if (GEMINI_API_KEY) {
      try {
        console.log('Attempting Gemini transcription...');
        
        // Convert audio to base64
        const audioBase64 = buffer.toString('base64');
        const mimeType = audioFile.type || 'audio/webm';
        
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: audioBase64,
                    }
                  },
                  {
                    text: "Transcribe this audio recording exactly as spoken. Output ONLY the transcription text, nothing else. If the audio is unclear or empty, output an empty string."
                  }
                ]
              }],
              generationConfig: {
                temperature: 0,
                maxOutputTokens: 2048,
              }
            }),
          }
        );
        
        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const transcription = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
          
          console.log('Gemini transcription successful:', transcription.substring(0, 100));
          
          return NextResponse.json({
            url: audioUrl,
            transcription,
            provider: 'gemini',
          });
        } else {
          const errorText = await geminiResponse.text();
          console.warn('Gemini transcription failed:', errorText);
        }
      } catch (geminiError) {
        console.error('Gemini transcription error:', geminiError);
      }
    }
    
    // Try OpenAI Whisper as fallback
    if (OPENAI_API_KEY) {
      try {
        const whisperFormData = new FormData();
        whisperFormData.append('file', new Blob([buffer], { type: audioFile.type || 'audio/webm' }), 'audio.webm');
        whisperFormData.append('model', 'whisper-1');
        whisperFormData.append('response_format', 'json');
        
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: whisperFormData,
        });
        
        if (whisperResponse.ok) {
          const whisperData = await whisperResponse.json();
          return NextResponse.json({
            url: audioUrl,
            transcription: whisperData.text || '',
            provider: 'openai-whisper',
          });
        } else {
          console.warn('OpenAI Whisper failed, trying Deepgram...');
        }
      } catch (whisperError) {
        console.error('OpenAI Whisper error:', whisperError);
      }
    }
    
    // Fallback to Deepgram
    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json({
        url: audioUrl,
        transcription: '',
        warning: 'All transcription providers failed',
      });
    }

    const transcriptionResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&utterances=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': audioFile.type || 'audio/webm',
        },
        body: buffer,
      }
    );

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('Deepgram error:', errorText);
      
      // Return URL even if transcription fails
      return NextResponse.json({
        url: audioUrl,
        transcription: '',
        warning: 'Transcription failed, audio saved',
      });
    }

    const transcriptionData = await transcriptionResponse.json();
    
    // Combine utterances for full transcript
    const utterances = transcriptionData.results?.utterances || [];
    const transcription = utterances
      .map((u: any) => u.transcript)
      .join(' ')
      .trim() || transcriptionData.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    // Calculate word count for quality metrics
    const wordCount = transcription.split(/\s+/).filter((w: string) => w.length > 0).length;

    return NextResponse.json({
      url: audioUrl,
      transcription,
      wordCount,
      confidence: transcriptionData.results?.channels?.[0]?.alternatives?.[0]?.confidence,
      duration: transcriptionData.metadata?.duration,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
