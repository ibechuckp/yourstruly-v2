import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import crypto from 'crypto'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface ContentSummary {
  memories: { title: string; description: string; date?: string; location?: string }[]
  wisdom: { title: string; description: string; category?: string }[]
  postscripts: { title: string; message: string; recipientName: string }[]
  contacts: { name: string; relationship: string; notes?: string }[]
}

/**
 * POST /api/intelligence/compute
 * Computes/refreshes the user's intelligence profile
 */
export async function POST() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all user content
    const [memoriesRes, wisdomRes, postscriptsRes, contactsRes] = await Promise.all([
      supabase.from('memories').select('title, description, memory_date, location_name, ai_summary').eq('user_id', user.id).limit(100),
      supabase.from('knowledge_entries').select('title, description, category, ai_category').eq('user_id', user.id).limit(100),
      supabase.from('postscripts').select('title, message, recipient_name').eq('user_id', user.id).limit(50),
      supabase.from('contacts').select('full_name, relationship_type, notes').eq('user_id', user.id).limit(100),
    ])

    const content: ContentSummary = {
      memories: (memoriesRes.data || []).map(m => ({
        title: m.title || '',
        description: m.description || m.ai_summary || '',
        date: m.memory_date,
        location: m.location_name,
      })),
      wisdom: (wisdomRes.data || []).map(w => ({
        title: w.title || '',
        description: w.description || '',
        category: w.category || w.ai_category,
      })),
      postscripts: (postscriptsRes.data || []).map(p => ({
        title: p.title || '',
        message: p.message || '',
        recipientName: p.recipient_name || '',
      })),
      contacts: (contactsRes.data || []).map(c => ({
        name: c.full_name || '',
        relationship: c.relationship_type || '',
        notes: c.notes,
      })),
    }

    // Create content hash to detect changes
    const contentHash = crypto
      .createHash('md5')
      .update(JSON.stringify(content))
      .digest('hex')

    // Check if we need to recompute
    const { data: existing } = await supabase
      .from('user_intelligence')
      .select('content_hash, version')
      .eq('user_id', user.id)
      .single()

    if (existing?.content_hash === contentHash) {
      return NextResponse.json({ 
        message: 'Intelligence profile is up to date',
        recomputed: false 
      })
    }

    // Prepare prompt for Gemini
    const prompt = `Analyze this person's life data and create a comprehensive personality profile.

## Their Memories (life events):
${content.memories.slice(0, 30).map(m => `- ${m.title}: ${m.description?.slice(0, 200)}`).join('\n')}

## Their Wisdom (knowledge, advice, recipes):
${content.wisdom.slice(0, 20).map(w => `- [${w.category || 'general'}] ${w.title}: ${w.description?.slice(0, 200)}`).join('\n')}

## Their PostScripts (messages to loved ones):
${content.postscripts.slice(0, 10).map(p => `- To ${p.recipientName}: ${p.message?.slice(0, 150)}`).join('\n')}

## Their Contacts (people in their life):
${content.contacts.slice(0, 30).map(c => `- ${c.name} (${c.relationship})`).join('\n')}

Based on this data, provide a JSON response with:

{
  "personalitySummary": "A 2-3 paragraph description of who this person is - their character, what drives them, what they care about. Write in third person.",
  "communicationStyle": {
    "formality": "casual|neutral|formal",
    "verbosity": "concise|moderate|verbose",
    "emotionalTone": "reserved|warm|expressive",
    "vocabularyLevel": "simple|moderate|sophisticated"
  },
  "coreValues": ["list of 5-7 core values like 'family', 'creativity', 'faith', 'adventure'"],
  "topicInterests": {
    "topic1": 0.9,
    "topic2": 0.7
  },
  "expertiseAreas": ["areas they clearly know a lot about"],
  "importantPeople": [
    {
      "name": "Primary name used",
      "aliases": ["other names they might use like 'Mom', 'Dad'"],
      "relationship": "mother/father/spouse/friend/etc",
      "importanceScore": 0.95,
      "mentionCount": 15
    }
  ],
  "lifeChapters": [
    {
      "era": "Childhood",
      "yearRange": "1980-1998",
      "summary": "Brief description of this life phase",
      "keyEvents": ["event1", "event2"]
    }
  ],
  "keyLifeEvents": ["marriage", "first child", "career change"],
  "commonPhrases": ["phrases they seem to use often"],
  "storytellingStyle": "How they tend to tell stories - descriptive, emotional, factual, humorous",
  "humorStyle": "Their type of humor if apparent - dry, playful, self-deprecating, or 'not apparent'"
}

Only return valid JSON, no markdown or explanation.`

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Parse JSON from response
    let analysis
    try {
      // Remove potential markdown code blocks
      const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim()
      analysis = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText)
      return NextResponse.json({ error: 'Failed to parse AI analysis' }, { status: 500 })
    }

    // Upsert intelligence record
    const { error: upsertError } = await supabase
      .from('user_intelligence')
      .upsert({
        user_id: user.id,
        personality_summary: analysis.personalitySummary,
        communication_style: analysis.communicationStyle,
        core_values: analysis.coreValues,
        topic_interests: analysis.topicInterests,
        expertise_areas: analysis.expertiseAreas,
        important_people: analysis.importantPeople,
        life_chapters: analysis.lifeChapters,
        key_life_events: analysis.keyLifeEvents,
        common_phrases: analysis.commonPhrases,
        storytelling_style: analysis.storytellingStyle,
        humor_style: analysis.humorStyle,
        content_hash: contentHash,
        last_computed_at: new Date().toISOString(),
        version: (existing?.version || 0) + 1,
      }, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Failed to save intelligence:', upsertError)
      return NextResponse.json({ error: 'Failed to save intelligence' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Intelligence profile computed successfully',
      recomputed: true,
      version: (existing?.version || 0) + 1,
      analysis,
    })

  } catch (error) {
    console.error('Intelligence compute error:', error)
    return NextResponse.json({ error: 'Failed to compute intelligence' }, { status: 500 })
  }
}
