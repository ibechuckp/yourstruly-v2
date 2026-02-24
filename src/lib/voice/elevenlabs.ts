/**
 * ElevenLabs Voice Cloning Integration
 * 
 * Handles voice cloning via ElevenLabs API:
 * - Voice creation from audio samples
 * - TTS with cloned voice
 * - Voice deletion
 * 
 * API Docs: https://elevenlabs.io/docs/api-reference
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  error?: string;
}

interface TTSResult {
  success: boolean;
  audioBuffer?: ArrayBuffer;
  error?: string;
}

/**
 * Get ElevenLabs API key from environment
 */
function getApiKey(): string | null {
  return process.env.ELEVENLABS_API_KEY || null;
}

/**
 * Check if ElevenLabs is configured
 */
export function isElevenLabsConfigured(): boolean {
  return !!getApiKey();
}

/**
 * Clone a voice using audio samples
 * 
 * @param name - Name for the cloned voice
 * @param description - Description of the voice
 * @param audioUrls - Array of audio file URLs to use as samples
 * @returns Voice ID if successful
 */
export async function cloneVoice(
  name: string,
  description: string,
  audioUrls: string[]
): Promise<VoiceCloneResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  if (audioUrls.length === 0) {
    return { success: false, error: 'No audio samples provided' };
  }

  try {
    // Create form data with audio files
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    // Download and attach each audio file
    for (let i = 0; i < audioUrls.length && i < 25; i++) { // ElevenLabs limit: 25 samples
      const url = audioUrls[i];
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to fetch audio sample ${i}: ${url}`);
          continue;
        }
        const blob = await response.blob();
        formData.append('files', blob, `sample_${i}.mp3`);
      } catch (err) {
        console.warn(`Error fetching audio sample ${i}:`, err);
      }
    }

    // Create the voice clone
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || errorData.message || `HTTP ${response.status}`;
      console.error('ElevenLabs clone error:', errorData);
      return { success: false, error: `Voice cloning failed: ${errorMessage}` };
    }

    const data = await response.json();
    return { success: true, voiceId: data.voice_id };
  } catch (error) {
    console.error('ElevenLabs clone exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate speech from text using a cloned voice
 * 
 * @param voiceId - ElevenLabs voice ID
 * @param text - Text to convert to speech
 * @param options - Voice settings
 */
export async function textToSpeech(
  voiceId: string,
  text: string,
  options: {
    stability?: number;      // 0-1, default 0.5
    similarityBoost?: number; // 0-1, default 0.75
    style?: number;          // 0-1, default 0 (for multilingual v2)
    speakerBoost?: boolean;  // default true
  } = {}
): Promise<TTSResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          use_speaker_boost: options.speakerBoost ?? true,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || errorData.message || `HTTP ${response.status}`;
      return { success: false, error: `TTS failed: ${errorMessage}` };
    }

    const audioBuffer = await response.arrayBuffer();
    return { success: true, audioBuffer };
  } catch (error) {
    console.error('ElevenLabs TTS exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Delete a cloned voice from ElevenLabs
 * 
 * @param voiceId - ElevenLabs voice ID to delete
 */
export async function deleteVoice(voiceId: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail?.message || errorData.message || `HTTP ${response.status}`;
      return { success: false, error: `Delete failed: ${errorMessage}` };
    }

    return { success: true };
  } catch (error) {
    console.error('ElevenLabs delete exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get info about a voice
 * 
 * @param voiceId - ElevenLabs voice ID
 */
export async function getVoiceInfo(voiceId: string): Promise<{
  success: boolean;
  voice?: {
    voice_id: string;
    name: string;
    samples?: Array<{ sample_id: string; file_name: string }>;
    category: string;
  };
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Voice not found' };
      }
      return { success: false, error: `HTTP ${response.status}` };
    }

    const voice = await response.json();
    return { success: true, voice };
  } catch (error) {
    console.error('ElevenLabs getVoice exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get subscription/usage info
 */
export async function getSubscriptionInfo(): Promise<{
  success: boolean;
  subscription?: {
    character_count: number;
    character_limit: number;
    can_extend_character_limit: boolean;
    next_character_count_reset_unix: number;
  };
  error?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: 'ElevenLabs API key not configured' };
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const subscription = await response.json();
    return { success: true, subscription };
  } catch (error) {
    console.error('ElevenLabs subscription exception:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
