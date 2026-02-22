import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Exchange {
  question: string;
  response: string;
  audioUrl?: string;
}

// POST /api/conversation/save
// Save complete conversation to memories/knowledge entries
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { promptId, promptType, exchanges, summary, expectedXp, photoId } = body;

    if (!exchanges || !Array.isArray(exchanges) || exchanges.length === 0) {
      return NextResponse.json({ error: 'No exchanges provided' }, { status: 400 });
    }

    // Calculate metrics
    const wordCount = summary.split(/\s+/).filter((w: string) => w.length > 0).length;
    const audioUrls = exchanges
      .map((e: Exchange) => e.audioUrl)
      .filter(Boolean) as string[];

    // Get first audio URL for memory audio field
    const primaryAudioUrl = audioUrls[0] || null;

    // Create title from first question and response preview
    const title = generateTitle(exchanges[0], promptType);

    // Determine memory type based on prompt type
    const memoryType = getMemoryType(promptType);

    // Build the full story content for description
    const storyContent = generateMemoryContent(exchanges, summary);

    // Generate AI insights from the conversation
    const aiInsights = await generateAIInsights(exchanges, promptType);

    // Build tags - include memoryType for easier querying
    const tags = [promptType, memoryType, 'conversation'].filter((v, i, a) => a.indexOf(v) === i);

    // Create memory record - use existing columns
    const { data: memory, error: memoryError } = await supabase
      .from('memories')
      .insert({
        user_id: user.id,
        title,
        description: storyContent,        // Full Q&A content
        ai_summary: aiInsights,            // AI-generated insights
        memory_type: memoryType,
        audio_url: primaryAudioUrl,
        tags,
        memory_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (memoryError) {
      console.error('Failed to create memory:', memoryError);
      return NextResponse.json({ error: 'Failed to save memory' }, { status: 500 });
    }
    
    console.log('Created memory:', { id: memory.id, title, memory_type: memoryType, tags });

    // Link photo if this is a photo_backstory prompt
    if (promptType === 'photo_backstory' && photoId) {
      await supabase
        .from('memory_media')
        .update({ memory_id: memory.id })
        .eq('id', photoId);
      console.log('Linked photo to memory:', photoId);
    }

    // Also check if the prompt has a photo_id we should link
    if (promptId) {
      const { data: promptData } = await supabase
        .from('engagement_prompts')
        .select('photo_id, photo_url')
        .eq('id', promptId)
        .single();
      
      if (promptData?.photo_id) {
        await supabase
          .from('memory_media')
          .update({ memory_id: memory.id })
          .eq('id', promptData.photo_id);
        console.log('Linked prompt photo to memory:', promptData.photo_id);
      }
    }

    // Mark original prompt as answered
    if (promptId) {
      await supabase
        .from('engagement_prompts')
        .update({
          status: 'answered',
          answered_at: new Date().toISOString(),
          response_type: 'voice',
          response_text: summary,
        })
        .eq('id', promptId);
    }

    // Create knowledge entry if applicable
    let knowledgeEntryId = null;
    const knowledgeCategory = getKnowledgeCategory(promptType);
    
    if (knowledgeCategory) {
      const { data: knowledgeEntry, error: knowledgeError } = await supabase
        .from('knowledge_entries')
        .insert({
          user_id: user.id,
          category: knowledgeCategory,
          prompt_text: exchanges[0]?.question || title,
          response_text: summary,
          audio_url: primaryAudioUrl,
          word_count: wordCount,
          memory_id: memory.id,
          is_featured: false,
        })
        .select()
        .single();

      if (!knowledgeError && knowledgeEntry) {
        knowledgeEntryId = knowledgeEntry.id;
      }
    }

    // Award XP for conversation (use expectedXp from prompt type if provided)
    const xpAmount = calculateXP(exchanges.length, wordCount, expectedXp || 15);
    
    try {
      await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: xpAmount,
        p_reason: 'conversation_complete',
        p_metadata: {
          memory_id: memory.id,
          prompt_type: promptType,
          exchange_count: exchanges.length,
        },
      });
    } catch (xpError) {
      console.error('Failed to award XP:', xpError);
      // Non-critical error, continue
    }

    // Update engagement stats
    try {
      await supabase.rpc('update_engagement_stats', {
        p_user_id: user.id,
        p_prompts_answered: 1,
        p_input_type: 'voice',
      });
    } catch (statsError) {
      console.error('Failed to update stats:', statsError);
      // Non-critical error
    }

    return NextResponse.json({
      success: true,
      memoryId: memory.id,
      knowledgeEntryId,
      xpAwarded: xpAmount,
      title,
      wordCount,
    });

  } catch (error) {
    console.error('Save conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateTitle(firstExchange: Exchange, promptType: string): string {
  // Use the question (prompt) as the title, not the response
  const question = firstExchange.question;
  
  // Remove common question prefixes for cleaner titles
  let title = question
    .replace(/^(tell me about|what is|what are|what was|what were|how did|how do|describe|share)\s+/i, '')
    .replace(/\?$/, '');
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Truncate if too long
  if (title.length > 60) {
    title = title.slice(0, 60) + '...';
  }
  
  return title;
}

function getMemoryType(promptType: string): string {
  const typeMap: Record<string, string> = {
    photo_backstory: 'story',
    memory_prompt: 'memory',
    knowledge: 'wisdom',
    favorites_firsts: 'favorite',
    recipes_wisdom: 'recipe',
    connect_dots: 'connection',
    highlight: 'highlight',
    postscript: 'postscript',
  };
  return typeMap[promptType] || 'memory';
}

function getKnowledgeCategory(promptType: string): string | null {
  const categoryMap: Record<string, string> = {
    knowledge: 'life_lessons',
    recipes_wisdom: 'practical',
    memory_prompt: 'life_lessons',
    photo_backstory: 'life_lessons',
  };
  return categoryMap[promptType] || null;
}

function generateMemoryContent(exchanges: Exchange[], summary: string): string {
  const qaSection = exchanges.map((e, i) => {
    let qa = `**Q${i + 1}:** ${e.question}\n\n**A${i + 1}:** ${e.response}`;
    // Include audio URL if present (for later playback)
    if (e.audioUrl) {
      qa += `\n\n🎙️ [Audio](${e.audioUrl})`;
    }
    return qa;
  }).join('\n\n---\n\n');

  return `## Summary\n\n${summary}\n\n## Conversation\n\n${qaSection}`;
}

function calculateXP(exchangeCount: number, wordCount: number, baseXp: number = 15): number {
  // Return exactly the expected XP from prompt type config
  // This ensures the XP matches what's shown on the tile
  return baseXp;
}

async function generateAIInsights(exchanges: Exchange[], promptType: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  // Build conversation context
  const conversationText = exchanges.map((e, i) => 
    `Q: ${e.question}\nA: ${e.response}`
  ).join('\n\n');

  const prompt = `Analyze this conversation and extract 2-3 brief insights.

CONVERSATION:
${conversationText}

Output format (keep each under 15 words):
- **Theme**: [Main topic in 5-10 words]
- **Feeling**: [Core emotion/value in 5 words]  
- **Takeaway**: [Key lesson in 10 words]

Be specific to what they said. No generic advice. Output ONLY the bullets.`;

  // Try Gemini
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            }
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const insights = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (insights) {
          console.log('AI insights generated:', insights.slice(0, 100));
          return insights;
        }
      }
    } catch (e) {
      console.error('Gemini insights error:', e);
    }
  }

  // Fallback: Simple summary from first response
  const firstResponse = exchanges[0]?.response || '';
  const preview = firstResponse.slice(0, 200) + (firstResponse.length > 200 ? '...' : '');
  return `- **Key Theme**: ${preview}`;
}
