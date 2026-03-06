import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are allowed' }, { status: 400 });
    }

    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).slice(2);
    const fileName = `${user.id}/onboarding/${timestamp}-${randomId}.${ext}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('memories')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('memories')
      .getPublicUrl(fileName);

    // Create media record in gallery (no memory - just standalone gallery item)
    // This keeps onboarding images in gallery only, not cluttering memories page
    const { data: media, error: mediaError } = await supabase
      .from('memory_media')
      .insert({
        user_id: user.id,
        file_url: publicUrl,
        file_key: fileName,
        file_type: 'image',
        mime_type: file.type || 'image/jpeg',
        file_size: file.size,
        is_cover: false,
        // No memory_id - this is a standalone gallery item
      })
      .select()
      .single();

    if (mediaError) {
      console.error('Media record error:', mediaError);
      // Image is in storage but not in DB
      return NextResponse.json({
        success: true,
        fileUrl: publicUrl,
        memoryId: null,
        mediaId: null,
      });
    }

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      memoryId: null,
      mediaId: media.id,
    });

  } catch (error) {
    console.error('Onboarding upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
