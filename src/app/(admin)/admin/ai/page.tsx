import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import AIConfigDashboard from '@/components/admin/ai/AIConfigDashboard';

export default async function AIConfigPage() {
  await requireAdmin();
  const supabase = createAdminClient();
  
  // Fetch current AI settings from database (or use defaults)
  const { data: aiSettings } = await supabase
    .from('system_settings')
    .select('*')
    .eq('category', 'ai')
    .order('key');
  
  // Fetch prompt templates count
  const { count: promptCount } = await supabase
    .from('prompt_templates')
    .select('*', { count: 'exact', head: true });
  
  // Current config from code
  const currentConfig = {
    embeddingProvider: 'gemini',
    chatProvider: 'claude',
    models: {
      embedding: 'gemini-embedding-001',
      chat: 'claude-sonnet-4-20250514',
    },
    ollamaUrl: process.env.OLLAMA_URL || 'http://192.168.4.24:11434',
    embeddingDimensions: 768,
    // API key status (never expose actual keys)
    apiKeyStatus: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    },
  };

  return (
    <AIConfigDashboard 
      initialConfig={currentConfig}
      settings={aiSettings || []}
      promptCount={promptCount || 0}
    />
  );
}
