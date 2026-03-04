import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export const maxDuration = 300 // 5 minutes for large imports

// Map folder prefixes to storage buckets
const FOLDER_TO_BUCKET: Record<string, string> = {
  'profile': 'avatars',
  'memories': 'memories',
  'gallery': 'media',
  'contacts': 'avatars',
  'pets': 'avatars',
  'voice_samples': 'voice-samples',
  'video_responses': 'videos',
  'postscript_attachments': 'attachments',
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the form data with the ZIP file
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Load ZIP
    const JSZipLib = (await import('jszip')).default
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZipLib.loadAsync(arrayBuffer)

    // Read data.json
    const dataFile = zip.file('data.json')
    if (!dataFile) {
      return NextResponse.json({ error: 'Invalid backup: missing data.json' }, { status: 400 })
    }

    const dataText = await dataFile.async('text')
    const backupData = JSON.parse(dataText)

    // Track URL remapping (old path in zip -> new URL in storage)
    const urlRemap: Record<string, string> = {}
    let uploadedFiles = 0
    let uploadErrors = 0

    // Upload all media files and build URL remap
    const mediaMapping = backupData._media_mapping || {}
    
    for (const [oldUrl, zipPath] of Object.entries(mediaMapping)) {
      const mediaFile = zip.file(zipPath as string)
      if (!mediaFile) {
        console.warn('Missing file in ZIP:', zipPath)
        uploadErrors++
        continue
      }

      try {
        // Determine target bucket based on folder
        const folder = (zipPath as string).split('/')[0]
        const bucket = FOLDER_TO_BUCKET[folder] || 'uploads'
        
        // Generate new filename with user prefix
        const filename = (zipPath as string).split('/').pop() || 'file'
        const newPath = `${user.id}/${Date.now()}-${filename}`

        // Get file content
        const content = await mediaFile.async('nodebuffer')
        
        // Determine content type
        const ext = filename.split('.').pop()?.toLowerCase()
        const contentTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'mp4': 'video/mp4',
          'mov': 'video/quicktime',
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'pdf': 'application/pdf',
        }
        const contentType = contentTypes[ext || ''] || 'application/octet-stream'

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(newPath, content, { contentType })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          uploadErrors++
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(newPath)

        urlRemap[oldUrl] = publicUrl
        uploadedFiles++
      } catch (err) {
        console.error('Failed to upload:', zipPath, err)
        uploadErrors++
      }
    }

    // Helper to remap URLs in an object
    const remapUrls = (obj: any): any => {
      if (!obj) return obj
      if (typeof obj === 'string') {
        return urlRemap[obj] || obj
      }
      if (Array.isArray(obj)) {
        return obj.map(remapUrls)
      }
      if (typeof obj === 'object') {
        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
          // Check if this key contains a URL that needs remapping
          if (typeof value === 'string' && urlRemap[value]) {
            result[key] = urlRemap[value]
          } else {
            result[key] = remapUrls(value)
          }
        }
        return result
      }
      return obj
    }

    // Import data with remapped URLs
    let imported = 0
    let errors = 0

    // Helper to import array data
    const importTable = async (table: string, items: any[], userIdField = 'user_id') => {
      if (!items || items.length === 0) return

      for (const item of items) {
        const remapped = remapUrls(item)
        const { id, ...rest } = remapped
        const newItem = { ...rest, [userIdField]: user.id }
        
        const { error } = await supabase.from(table).insert(newItem)
        if (error) {
          console.error(`Error importing to ${table}:`, error.message)
          errors++
        } else {
          imported++
        }
      }
    }

    // Import profile (merge)
    if (backupData.profile) {
      const remapped = remapUrls(backupData.profile)
      const { id, email, created_at, updated_at, ...profileData } = remapped
      await supabase.from('profiles').update(profileData).eq('id', user.id)
      imported++
    }

    // Import all data tables
    await importTable('education_history', backupData.education_history)
    await importTable('contacts', backupData.contacts)
    await importTable('memories', backupData.memories)
    await importTable('pets', backupData.pets)
    await importTable('knowledge_entries', backupData.wisdom)
    await importTable('postscripts', backupData.postscripts)
    await importTable('circles', backupData.circles, 'owner_id')
    await importTable('media_items', backupData.media_items)
    await importTable('memory_albums', backupData.albums)
    await importTable('smart_albums', backupData.smart_albums)
    await importTable('interview_sessions', backupData.interview_sessions)
    await importTable('video_responses', backupData.video_responses)
    await importTable('voice_clones', backupData.voice_clones)
    await importTable('voice_clone_samples', backupData.voice_clone_samples)
    await importTable('chat_sessions', backupData.chat_sessions)

    return NextResponse.json({
      success: true,
      imported,
      errors,
      uploadedFiles,
      uploadErrors,
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed. Please try again.' },
      { status: 500 }
    )
  }
}
