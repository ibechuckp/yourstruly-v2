import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return _openai
}

/**
 * Transcribe audio from a URL using OpenAI Whisper
 * @param audioUrl - URL to the audio file
 * @returns Transcribed text
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const openai = getOpenAI()
  
  // Fetch the audio file
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.statusText}`)
  }
  
  const audioBuffer = await response.arrayBuffer()
  
  // Create a File object for the Whisper API
  const audioFile = new File([audioBuffer], 'audio.webm', { 
    type: response.headers.get('content-type') || 'audio/webm' 
  })
  
  // Transcribe using Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  })
  
  return transcription.trim()
}

/**
 * Transcribe audio and summarize if needed
 * @param audioUrl - URL to the audio file
 * @param maxLength - Maximum length before summarizing (optional)
 * @returns Transcribed (and optionally summarized) text
 */
export async function transcribeAndSummarize(
  audioUrl: string, 
  maxLength?: number
): Promise<string> {
  const transcript = await transcribeAudio(audioUrl)
  
  // If no max length or transcript is short enough, return as-is
  if (!maxLength || transcript.length <= maxLength) {
    return transcript
  }
  
  // For very long transcripts, summarize with GPT
  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes personal stories and wisdom. Keep the summary warm, personal, and preserve the key insights.',
      },
      {
        role: 'user',
        content: `Please summarize this in ${Math.floor(maxLength / 4)} words or less, preserving the key wisdom and personal touch:\n\n${transcript}`,
      },
    ],
    max_tokens: Math.floor(maxLength / 3),
  })
  
  return completion.choices[0]?.message?.content?.trim() || transcript
}
