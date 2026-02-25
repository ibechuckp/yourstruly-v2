import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for uploads (interviewees may not be authenticated)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/interviews/upload
// Upload interview recordings (no auth required - validated by session token)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const questionId = formData.get('questionId') as string;
    const type = formData.get('type') as 'video' | 'audio';
    const accessToken = formData.get('accessToken') as string;

    if (!file || !sessionId || !questionId || !type || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate session token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('interview_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('access_token', accessToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
    }

    // Validate file size (max 100MB for video, 25MB for audio)
    const maxSize = type === 'video' ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large (max ${type === 'video' ? '100MB' : '25MB'})` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine bucket and file path
    const bucket = type === 'video' ? 'videos' : 'audio';
    const fileName = `${sessionId}/${questionId}-${Date.now()}.webm`;

    // Upload to Supabase Storage with service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: type === 'video' ? 'video/webm' : 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      
      // Try fallback bucket if primary doesn't exist
      if (uploadError.message?.includes('not found') || uploadError.message?.includes('Bucket')) {
        // Try uploading to 'memories' bucket as fallback
        const fallbackFileName = `interviews/${sessionId}/${questionId}-${Date.now()}.webm`;
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin.storage
          .from('memories')
          .upload(fallbackFileName, buffer, {
            contentType: type === 'video' ? 'video/webm' : 'audio/webm',
            upsert: false,
          });

        if (fallbackError) {
          console.error('Fallback upload error:', fallbackError);
          return NextResponse.json({ 
            error: 'Failed to upload file',
            details: fallbackError.message 
          }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('memories')
          .getPublicUrl(fallbackFileName);

        return NextResponse.json({ 
          url: publicUrl,
          key: fallbackFileName,
          bucket: 'memories'
        });
      }

      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: uploadError.message 
      }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      url: publicUrl,
      key: fileName,
      bucket
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error.message 
    }, { status: 500 });
  }
}
