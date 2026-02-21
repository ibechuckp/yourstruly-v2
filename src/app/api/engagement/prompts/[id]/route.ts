import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AnswerPromptRequest, AnswerPromptResponse } from '@/types/engagement';

// POST /api/engagement/prompts/[id]/respond
// Answer a specific prompt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: promptId } = await params;
    const body: AnswerPromptRequest = await request.json();

    // Verify prompt belongs to user
    const { data: prompt, error: fetchError } = await supabase
      .from('engagement_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Call answer_prompt function
    const { data: answeredPrompt, error: answerError } = await supabase
      .rpc('answer_prompt', {
        p_prompt_id: promptId,
        p_response_type: body.responseType,
        p_response_text: body.responseText || null,
        p_response_audio_url: body.responseAudioUrl || null,
        p_response_data: body.responseData || null,
      });

    if (answerError) {
      console.error('Failed to answer prompt:', answerError);
      return NextResponse.json({ error: 'Failed to answer prompt' }, { status: 500 });
    }

    // Handle different prompt types
    let knowledgeEntry = null;
    let memoryCreated = false;
    let contactUpdated = false;

    // If it's a knowledge prompt, create a knowledge entry
    if (prompt.type === 'knowledge' && body.responseText) {
      const { data: knowledge, error: knowledgeError } = await supabase
        .from('knowledge_entries')
        .insert({
          user_id: user.id,
          category: prompt.category || 'life_lessons',
          prompt_text: prompt.prompt_text,
          response_text: body.responseText,
          audio_url: body.responseAudioUrl,
          related_interest: prompt.personalization_context?.interest,
          related_skill: prompt.personalization_context?.skill,
          related_hobby: prompt.personalization_context?.hobby,
          related_religion: prompt.personalization_context?.religion,
          source_prompt_id: promptId,
        })
        .select()
        .single();

      if (!knowledgeError) {
        knowledgeEntry = knowledge;

        // Update the prompt with the knowledge entry ID
        await supabase
          .from('engagement_prompts')
          .update({ result_knowledge_id: knowledge.id })
          .eq('id', promptId);
      }
    }

    // If it's a memory prompt, create a memory
    if (prompt.type === 'memory_prompt' && body.responseText) {
      const { error: memoryError } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          title: prompt.prompt_text.substring(0, 100),
          description: body.responseText,
          audio_url: body.responseAudioUrl,
          tags: [prompt.category].filter(Boolean),
        });

      memoryCreated = !memoryError;
    }

    // If it's a photo backstory, update the media
    if (prompt.type === 'photo_backstory' && prompt.photo_id && body.responseText) {
      await supabase
        .from('memory_media')
        .update({
          description: body.responseText,
          backstory_audio_url: body.responseAudioUrl,
        })
        .eq('id', prompt.photo_id);
    }

    // If it's missing info, update the contact
    if (prompt.type === 'missing_info' && prompt.contact_id && prompt.missing_field) {
      const updateData: Record<string, any> = {};
      
      if (prompt.missing_field === 'birth_date' && body.responseData?.date) {
        updateData.birth_date = body.responseData.date;
      } else if (prompt.missing_field === 'relationship_type' && body.responseData?.value) {
        updateData.relationship_type = body.responseData.value;
      } else if (prompt.missing_field === 'how_met' && body.responseText) {
        updateData.how_met = body.responseText;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: contactError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', prompt.contact_id);

        contactUpdated = !contactError;
      }
    }

    // If it's tag person, link face to contact
    if (prompt.type === 'tag_person' && body.responseData?.contactId) {
      const faceId = prompt.metadata?.face_id;
      if (faceId) {
        await supabase
          .from('detected_faces')
          .update({
            matched_contact_id: body.responseData.contactId,
            manually_verified: true,
          })
          .eq('id', faceId);
      }
    }

    const response: AnswerPromptResponse = {
      success: true,
      prompt: answeredPrompt,
      knowledgeEntry,
      memoryCreated,
      contactUpdated,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Answer prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/engagement/prompts/[id]/skip
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: promptId } = await params;
    const body = await request.json();
    const action = body.action; // 'skip' or 'dismiss'

    if (action === 'skip') {
      const cooldownDays = body.cooldownDays || 7;
      
      const { error } = await supabase
        .rpc('skip_prompt', {
          p_prompt_id: promptId,
          p_cooldown_days: cooldownDays,
        });

      if (error) {
        return NextResponse.json({ error: 'Failed to skip prompt' }, { status: 500 });
      }
    } else if (action === 'dismiss') {
      const { error } = await supabase
        .rpc('dismiss_prompt', {
          p_prompt_id: promptId,
        });

      if (error) {
        return NextResponse.json({ error: 'Failed to dismiss prompt' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Skip/dismiss prompt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
