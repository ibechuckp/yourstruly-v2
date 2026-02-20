import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Search memories, contacts, and postscripts
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = request.nextUrl.searchParams.get('q')?.toLowerCase() || ''
  const type = request.nextUrl.searchParams.get('type') || 'all' // all, memories, contacts, postscripts

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  const results: any = {}

  // Search memories
  if (type === 'all' || type === 'memories') {
    const { data: memories } = await supabase
      .from('memories')
      .select('id, title, description, memory_date, location_name, ai_summary')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location_name.ilike.%${query}%,ai_summary.ilike.%${query}%`)
      .limit(10)
    
    results.memories = memories || []
  }

  // Search contacts
  if (type === 'all' || type === 'contacts') {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, full_name, relationship_type, email, phone')
      .eq('user_id', user.id)
      .or(`full_name.ilike.%${query}%,relationship_type.ilike.%${query}%`)
      .limit(10)
    
    results.contacts = contacts || []
  }

  // Search postscripts
  if (type === 'all' || type === 'postscripts') {
    const { data: postscripts } = await supabase
      .from('postscripts')
      .select('id, title, message, recipient_name, status')
      .eq('user_id', user.id)
      .or(`title.ilike.%${query}%,message.ilike.%${query}%,recipient_name.ilike.%${query}%`)
      .limit(10)
    
    results.postscripts = postscripts || []
  }

  return NextResponse.json({ results })
}
