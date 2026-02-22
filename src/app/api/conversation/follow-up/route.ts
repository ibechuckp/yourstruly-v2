import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Exchange {
  question: string;
  response: string;
}

// POST /api/conversation/follow-up
// Generate contextual follow-up questions based on conversation history
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exchanges, promptType, originalPrompt } = body;

    if (!exchanges || !Array.isArray(exchanges) || exchanges.length === 0) {
      return NextResponse.json({ error: 'Invalid exchanges data' }, { status: 400 });
    }

    // Build conversation context
    const conversationContext = exchanges.map((e: Exchange, i: number) => 
      `Q${i + 1}: ${e.question}\nA${i + 1}: ${e.response}`
    ).join('\n\n');

    // Determine follow-up strategy based on prompt type and exchange count
    const exchangeCount = exchanges.length;
    const maxExchanges = 5;
    
    if (exchangeCount >= maxExchanges) {
      return NextResponse.json({ 
        followUpQuestion: null,
        shouldEnd: true,
        reason: 'Maximum exchanges reached'
      });
    }

    // Get API key - try Gemini first, then Anthropic, then OpenAI
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    const systemPrompt = getSystemPromptForType(promptType, exchangeCount);
    const userPrompt = `Original prompt: ${originalPrompt}\n\nConversation so far:\n${conversationContext}\n\nGenerate a natural, conversational follow-up question that helps gather more details. Keep it warm and personal, like a friend asking about a memory. Output ONLY the question, nothing else.`;

    let followUpQuestion: string | null = null;

    // Try Gemini first
    if (GEMINI_API_KEY && !followUpQuestion) {
      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 150,
              }
            }),
          }
        );

        if (geminiResponse.ok) {
          const data = await geminiResponse.json();
          followUpQuestion = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          console.log('Gemini follow-up generated:', followUpQuestion);
        }
      } catch (e) {
        console.error('Gemini follow-up error:', e);
      }
    }

    // Try Anthropic (Claude) as fallback
    if (ANTHROPIC_API_KEY && !followUpQuestion) {
      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`,
            }],
          }),
        });

        if (claudeResponse.ok) {
          const data = await claudeResponse.json();
          followUpQuestion = data.content?.[0]?.text?.trim();
          console.log('Claude follow-up generated:', followUpQuestion);
        }
      } catch (e) {
        console.error('Claude follow-up error:', e);
      }
    }

    // If no AI available or failed, use smart fallbacks
    if (!followUpQuestion) {
      followUpQuestion = getFallbackQuestion(promptType, exchangeCount);
    }

    return NextResponse.json({
      followUpQuestion,
      shouldEnd: false,
      exchangeCount: exchangeCount + 1,
      maxExchanges,
    });

  } catch (error) {
    console.error('Follow-up generation error:', error);
    
    // Return a graceful fallback if everything fails
    return NextResponse.json({
      followUpQuestion: "Is there anything else you'd like to add about this?",
      shouldEnd: false,
      warning: 'Using fallback question',
    });
  }
}

function getFallbackQuestion(promptType: string, exchangeCount: number): string {
  const fallbacks: Record<string, string[]> = {
    photo_backstory: [
      "Who else was there that day?",
      "What were you feeling in that moment?",
      "What happened right before or after this photo was taken?",
      "Why does this photo mean so much to you?",
      "Is there anything else you'd like to share about this memory?"
    ],
    memory_prompt: [
      "Can you describe that moment in more detail?",
      "How did that experience change you?",
      "Who else was part of this memory?",
      "What emotions come up when you think about this?",
      "Is there anything else you want to remember about this?"
    ],
    knowledge: [
      "How did you learn this lesson?",
      "Can you share a specific moment when this became clear to you?",
      "Who would you most want to pass this wisdom to?",
      "How has this knowledge shaped your decisions?",
      "Any final thoughts on this?"
    ],
    default: [
      "Tell me more about that.",
      "How did that make you feel?",
      "What happened next?",
      "Why is this significant to you?",
      "Anything else you'd like to add?"
    ]
  };

  const questions = fallbacks[promptType] || fallbacks.default;
  const index = Math.min(exchangeCount, questions.length - 1);
  return questions[index];
}

function getSystemPromptForType(promptType: string, exchangeCount: number): string {
  const basePrompt = `You are helping someone record their life stories. Generate a natural follow-up question.

CRITICAL RULES:
1. Ask ONE simple, clear question
2. Use casual, conversational language (like a friend would ask)
3. Keep it SHORT - under 20 words ideally
4. Reference something specific they just said
5. NEVER use awkward phrasing like "that [noun] you mentioned"
6. Output ONLY the question - no quotes, no preamble

GOOD examples:
- "What was going through your mind at that moment?"
- "Who else was there with you?"
- "How did that change things for you?"
- "What happened next?"

BAD examples (never do this):
- "That trip you mentioned, can you tell me more?" (awkward structure)
- "I'd love to hear more about what you described" (not a question)
- "The experience you shared sounds meaningful" (not a question)
\n`;

  const typeSpecificPrompts: Record<string, string> = {
    photo_backstory: `
This is about a photo memory. Ask about: who was there, the moment itself, why it matters.`,

    memory_prompt: `
This is a life memory. Ask about: feelings, what happened next, how it affected them.`,

    knowledge: `
This is life wisdom/advice. Ask about: how they learned it, a specific example, who taught them.`,

    favorites_firsts: `
This is about favorites or firsts. Ask about: why it was special, who they shared it with.`,

    recipes_wisdom: `
This is about recipes or traditions. Ask about: who passed it down, special occasions, techniques.`,

    default: `
Ask about: specific details, emotions, what happened next, or why it mattered.`,
  };

  const typePrompt = typeSpecificPrompts[promptType] || typeSpecificPrompts.default;
  
  let exchangeGuidance = '';
  if (exchangeCount === 1) {
    exchangeGuidance = '\nDig deeper into the initial response.';
  } else if (exchangeCount === 2) {
    exchangeGuidance = '\nExplore emotions or personal significance.';
  } else if (exchangeCount === 3) {
    exchangeGuidance = '\nAsk about related memories or broader context.';
  } else if (exchangeCount >= 4) {
    exchangeGuidance = '\nWrap up - invite any final thoughts.';
  }

  return basePrompt + typePrompt + exchangeGuidance;
}
