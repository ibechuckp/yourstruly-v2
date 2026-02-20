import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// System prompt that gives the AI context about the user
function buildSystemPrompt(profile: any, memories: any[], contacts: any[]) {
  const memoryList = memories.slice(0, 10).map(m => 
    `- ${m.title || 'Untitled'} (${m.memory_date || 'no date'}): ${m.description || m.ai_summary || 'no description'}`
  ).join('\n')

  const contactList = contacts.slice(0, 20).map(c => 
    `- ${c.full_name} (${c.relationship_type || 'contact'})`
  ).join('\n')

  return `You are the AI assistant for YoursTruly, a life documentation platform. You help the user manage their memories, contacts, and future messages.

USER PROFILE:
- Name: ${profile?.full_name || 'Unknown'}
- Location: ${profile?.city || 'Unknown'}${profile?.country ? `, ${profile.country}` : ''}
- Motto: ${profile?.personal_motto || 'Not set'}

RECENT MEMORIES:
${memoryList || 'No memories yet'}

CONTACTS:
${contactList || 'No contacts yet'}

CAPABILITIES:
- Answer questions about their life data
- Help write memory descriptions
- Suggest people to tag in photos
- Help compose PostScript messages
- Navigate: say "go to [memories/contacts/postscripts/profile/albums/journalist]"
- Create: say "create memory" or "add contact"

Be warm, helpful, and concise. Reference their actual data when relevant.
If they ask to navigate or create something, respond with a JSON action:
{"action": "navigate", "path": "/dashboard/memories"}
{"action": "create", "type": "memory"}
{"action": "create", "type": "contact"}

Otherwise, just respond conversationally.`
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, history = [] } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Load user context
  const [profileRes, memoriesRes, contactsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('memories').select('id, title, description, memory_date, ai_summary').eq('user_id', user.id).order('memory_date', { ascending: false }).limit(10),
    supabase.from('contacts').select('id, full_name, relationship_type').eq('user_id', user.id).limit(20),
  ])

  const systemPrompt = buildSystemPrompt(
    profileRes.data,
    memoriesRes.data || [],
    contactsRes.data || []
  )

  // Build conversation
  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'I understand. I\'m ready to help you with YoursTruly.' }] },
    ...history.map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ]

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    )

    const data = await response.json()
    
    if (data.error) {
      console.error('Gemini error:', data.error)
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.'

    // Check if response contains an action
    let action = null
    const jsonMatch = text.match(/\{[\s\S]*?"action"[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[0])
      } catch (e) {
        // Not valid JSON, ignore
      }
    }

    // Clean response text (remove JSON if present)
    const cleanText = text.replace(/\{[\s\S]*?"action"[\s\S]*?\}/g, '').trim()

    return NextResponse.json({ 
      response: cleanText || 'Done!',
      action 
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 })
  }
}
