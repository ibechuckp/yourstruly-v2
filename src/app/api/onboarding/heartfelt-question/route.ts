import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy init OpenAI
let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, whyHere, whatDrives, userName, conversation } = body;

    if (action === 'generate_initial') {
      return generateInitialQuestion(whyHere, whatDrives, userName);
    } else if (action === 'follow_up') {
      return generateFollowUp(whyHere, whatDrives, userName, conversation);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Heartfelt question error:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}

async function generateInitialQuestion(
  whyHere: string,
  whatDrives: string[],
  userName: string
) {
  const openai = getOpenAI();

  const prompt = `You are a warm, caring conversation partner on YoursTruly, a digital legacy platform where people document their life stories for loved ones.

The person's name is ${userName || 'Friend'}.
They said they're here because: "${whyHere}"
${whatDrives.length > 0 ? `What matters to them: ${whatDrives.join(', ')}` : ''}

Ask ONE deeply personal opening question that:
1. Directly references their specific reason for being here — show you were listening
2. Asks about a concrete memory, person, or turning point — not abstract feelings
3. Makes them feel like this platform truly understands them
4. Is 1-3 sentences max. Start with their name.

BAD examples (too generic):
- "What's something important to you?"
- "Tell me about yourself"

GOOD examples (specific, personal):
- "${userName}, you mentioned wanting to preserve memories for your kids. What's one moment with them you never want to forget?"
- "${userName}, it sounds like family legacy matters deeply to you. Who in your family had the biggest impact on who you are today?"
- "${userName}, you're here to document your journey. What's the chapter of your life you're most proud of?"

Respond with ONLY the question. Make it feel personal to what THEY shared.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 200,
  });

  const question = completion.choices[0]?.message?.content?.trim() || 
    `${userName ? userName + ', w' : 'W'}hat moment in your life shaped who you are today?`;

  return NextResponse.json({ question });
}

async function generateFollowUp(
  whyHere: string,
  whatDrives: string[],
  userName: string,
  conversation: Message[]
) {
  const openai = getOpenAI();

  // Format conversation history
  const conversationHistory = conversation
    .map(m => `${m.role === 'assistant' ? 'YoursTruly' : userName || 'User'}: ${m.content}`)
    .join('\n\n');

  const exchangeCount = conversation.filter(m => m.role === 'user').length;

  const prompt = `You are having a warm conversation with ${userName || 'someone'} on YoursTruly, helping them document their life story.

CONVERSATION:
${conversationHistory}

Respond naturally:
1. Briefly acknowledge what they shared (1 sentence)
2. Ask ONE direct follow-up question about a specific detail they mentioned
3. Keep it short — 2-3 sentences total
4. Don't reference their profile info, just respond to what they actually said
5. Do NOT suggest wrapping up, saving, or stopping. Never say "if you'd like, we can wrap up" or similar. The user has a save button — let them decide when they're done.

Respond with ONLY your message.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 250,
  });

  const response = completion.choices[0]?.message?.content?.trim() || 
    "Thank you for sharing that. Your story is already becoming part of your legacy.";

  return NextResponse.json({ response });
}
