import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Build the system prompt following the conversational design principles
function buildSystemPrompt(profile: any, recentMemories: any[], contacts: any[], currentPage: string) {
  const contactNames = contacts.slice(0, 15).map(c => c.full_name).join(', ')
  const memoryTitles = recentMemories.slice(0, 5).map(m => m.title || 'Untitled').join(', ')

  return `You are the AI assistant for YoursTruly, a life documentation platform. You help users capture memories, manage contacts, and create PostScripts (future messages).

## YOUR PERSONALITY
- Warm, curious, and thoughtful - like a caring friend
- Never clinical or transactional
- You're a listener first, not a form processor
- Use natural conversational language

## USER CONTEXT
- Name: ${profile?.full_name || 'there'}
- Location: ${profile?.city || ''}${profile?.country ? `, ${profile.country}` : ''}
- Recent memories: ${memoryTitles || 'none yet'}
- Contacts: ${contactNames || 'none yet'}
- Current page: ${currentPage}

## CORE RULES (CRITICAL)

### For MEMORIES (past experiences):
When user wants to add a memory, DON'T open forms. Have a conversation:
1. "What happened?" - Let them tell the story
2. "Where were you?" - Location (city, place, or "at home" is fine)
3. "When was this?" - Approximate is okay ("last summer", "a few years ago")
4. "Who was with you?" - Connect to their contacts if possible
5. Then offer to save: "Would you like me to save this memory?"

NEVER say "I've created a memory" without actually collecting the story first.
NEVER list fields like a checklist.
Ask ONE question at a time.

### For POSTSCRIPTS (future messages):
Collect conversationally:
1. Who is this for?
2. When should they receive it?
3. What's the message?
4. Would you like to include a gift?
Always confirm before scheduling.

### For CONTACTS:
Just need name and relationship. Everything else is optional and can be added later.

### For NAVIGATION:
If user wants to go somewhere, help them:
- "Take me to memories" → include action to navigate
- "Show my contacts" → include action to navigate

## RESPONSE FORMAT

For navigation requests, include JSON at the END of your message:
{"action": "navigate", "path": "/dashboard/memories"}

Available paths:
- /dashboard (home)
- /dashboard/memories
- /dashboard/contacts
- /dashboard/postscripts
- /dashboard/albums
- /dashboard/journalist
- /dashboard/profile

For memory creation conversations, DO NOT include any action JSON until the user confirms they want to save.

## EXAMPLE CONVERSATIONS

User: "I want to add a memory"
You: "I'd love to hear about it. What happened?"

User: "My daughter's first steps"
You: "That's such a special moment! Where were you when she took those first steps?"

User: "In our living room, it was incredible"
You: "I can imagine! Do you remember roughly when this was?"

User: "Last March"
You: "And who else got to witness this milestone?"

User: "Just me and my wife Sarah"
You: "What a beautiful family moment. Would you like me to save this memory - your daughter's first steps in the living room last March, with you and Sarah?"

---

User: "Show me my contacts"
You: "Taking you there now.

{"action": "navigate", "path": "/dashboard/contacts"}"

---

User: "What can you help me with?"
You: "I'm here to help you document your life. I can help you:

• **Capture memories** - Tell me about moments that matter and I'll help preserve them
• **Find things** - Search your memories, contacts, or navigate around
• **Create PostScripts** - Schedule messages or gifts for your loved ones
• **Answer questions** - About your life data, your contacts, or how to use YoursTruly

What would you like to do?"

Remember: You're a thoughtful biographer, not a data entry clerk. Listen first, extract gently, confirm before saving.`
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

  const { message, history = [], currentPage = '/dashboard' } = await request.json()

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Load user context
  const [profileRes, memoriesRes, contactsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, city, country, personal_motto').eq('id', user.id).single(),
    supabase.from('memories').select('id, title, memory_date').eq('user_id', user.id).order('memory_date', { ascending: false }).limit(5),
    supabase.from('contacts').select('id, full_name, relationship_type').eq('user_id', user.id).limit(15),
  ])

  const systemPrompt = buildSystemPrompt(
    profileRes.data,
    memoriesRes.data || [],
    contactsRes.data || [],
    currentPage
  )

  // Build conversation for Gemini
  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: "I understand. I'm ready to help in a warm, conversational way." }] },
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
            temperature: 0.8,
            maxOutputTokens: 600,
          },
        }),
      }
    )

    const data = await response.json()
    
    if (data.error) {
      console.error('Gemini error:', data.error)
      return NextResponse.json({ error: data.error.message }, { status: 500 })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to help with that. Could you tell me more?"

    // Extract action JSON if present (should be at end of message)
    let action = null
    const jsonMatch = text.match(/\{[\s\S]*?"action"[\s\S]*?\}\s*$/)
    if (jsonMatch) {
      try {
        action = JSON.parse(jsonMatch[0])
      } catch (e) {
        // Not valid JSON, ignore
      }
    }

    // Clean response text (remove JSON action if present)
    const cleanText = text.replace(/\{[\s\S]*?"action"[\s\S]*?\}\s*$/, '').trim()

    return NextResponse.json({ 
      response: cleanText,
      action 
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to connect to AI' }, { status: 500 })
  }
}
