import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/engagement/transcribe
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

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const filename = `${user.id}/${Date.now()}-${audioFile.name || 'recording.webm'}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(filename, buffer, {
        contentType: audioFile.type || 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload audio:', uploadError);
      return NextResponse.json({ error: 'Failed to upload audio' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(filename);

    const audioUrl = urlData.publicUrl;

    // Transcribe with Deepgram
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    
    if (!DEEPGRAM_API_KEY) {
      console.warn('Deepgram API key not configured, returning empty transcription');
      return NextResponse.json({
        url: audioUrl,
        transcription: '', // Empty transcription if no API key
      });
    }

    const transcriptionResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true',
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
    const transcription = transcriptionData.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return NextResponse.json({
      url: audioUrl,
      transcription,
      confidence: transcriptionData.results?.channels?.[0]?.alternatives?.[0]?.confidence,
      duration: transcriptionData.metadata?.duration,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
