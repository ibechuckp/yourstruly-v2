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
    
    console.log('=== ANSWER PROMPT API ===');
    console.log('Prompt ID:', promptId);
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Verify prompt belongs to user
    const { data: prompt, error: fetchError } = await supabase
      .from('engagement_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !prompt) {
      console.error('Prompt not found:', promptId, fetchError);
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    
    console.log('Found prompt:', JSON.stringify(prompt, null, 2));

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
      console.error('Prompt ID:', promptId);
      console.error('Request body:', body);
      
      // Fallback: If RPC fails, try direct update
      const { error: directError } = await supabase
        .from('engagement_prompts')
        .update({
          status: 'answered',
          answered_at: new Date().toISOString(),
          response_type: body.responseType,
          response_text: body.responseText || null,
          response_audio_url: body.responseAudioUrl || null,
          response_data: body.responseData || null,
        })
        .eq('id', promptId);
      
      if (directError) {
        console.error('Direct update also failed:', directError);
        return NextResponse.json({ 
          error: 'Failed to answer prompt', 
          details: answerError.message,
          code: answerError.code
        }, { status: 500 });
      }
    }

    // Handle different prompt types
    let knowledgeEntry = null;
    let memoryCreated = false;
    let memoryId: string | null = null;
    let contactUpdated = false;

    // === UNIFIED MEMORY CREATION FOR ALL CONTENT-GENERATING PROMPTS ===
    // All user-generated content goes into the Memories table
    console.log('=== MEMORY CREATION CHECK ===');
    console.log('prompt.type:', prompt.type);
    console.log('body.responseText length:', body.responseText?.length || 0);
    console.log('body.responseAudioUrl:', body.responseAudioUrl || 'none');
    
    // These prompt types should ALL create memory records
    const MEMORY_CREATING_TYPES = [
      'knowledge',       // wisdom/life lessons
      'memory_prompt',   // general memories
      'photo_backstory', // photo stories  
      'favorites_firsts', // favorites and firsts
      'recipes_wisdom',  // recipes/traditions
      'postscript',      // future messages
    ];
    
    const shouldCreateMemory = MEMORY_CREATING_TYPES.includes(prompt.type);
    const hasContent = !!(body.responseText || body.responseAudioUrl);
    
    console.log('shouldCreateMemory:', shouldCreateMemory, 'hasContent:', hasContent);
    
    if (shouldCreateMemory && hasContent) {
      // Build tags based on prompt type and context
      const tags: string[] = [];
      
      if (prompt.type === 'knowledge') {
        tags.push('wisdom');
        if (prompt.personalization_context?.interest) tags.push(prompt.personalization_context.interest);
        if (prompt.personalization_context?.skill) tags.push(prompt.personalization_context.skill);
      } else if (prompt.type === 'photo_backstory') {
        tags.push('photo story');
      } else {
        tags.push(prompt.type.replace(/_/g, ' '));
      }
      if (prompt.category) tags.push(prompt.category);
      
      console.log('Creating memory with tags:', tags);
      
      const { data: newMemory, error: memoryError } = await supabase
        .from('memories')
        .insert({
          user_id: user.id,
          title: prompt.prompt_text?.substring(0, 100) || 'Memory',
          description: body.responseText || '🎤 Voice memory recorded',
          audio_url: body.responseAudioUrl || null,
          memory_date: new Date().toISOString(),
          tags,
        })
        .select()
        .single();

      if (memoryError) {
        console.error('=== MEMORY INSERT FAILED ===');
        console.error('Error:', memoryError);
        console.error('Error code:', memoryError.code);
        console.error('Error details:', memoryError.details);
      } else if (newMemory) {
        memoryCreated = true;
        memoryId = newMemory.id;
        console.log('=== MEMORY CREATED ===');
        console.log('Memory ID:', newMemory.id);
        
        // Update prompt with result memory ID
        await supabase
          .from('engagement_prompts')
          .update({ result_memory_id: newMemory.id })
          .eq('id', promptId);
          
        // If photo_backstory, also link the photo to this memory
        if (prompt.type === 'photo_backstory' && prompt.photo_id) {
          await supabase
            .from('memory_media')
            .update({ 
              memory_id: newMemory.id,
              description: body.responseText 
            })
            .eq('id', prompt.photo_id);
          console.log('Linked photo to memory');
        }
      }
    } else {
      console.log('Skipping memory creation - shouldCreateMemory:', shouldCreateMemory, 'hasContent:', hasContent);
    }

    // NOTE: photo_backstory is now handled by the unified memory creation block above

    // If it's missing info, update the contact
    if ((prompt.type === 'missing_info' || prompt.type === 'quick_question') && prompt.contact_id) {
      const updateData: Record<string, any> = {};
      const field = prompt.missing_field;
      
      // Map field types to columns
      if (field === 'birth_date' || field === 'date_of_birth') {
        // Accept text input as date
        updateData.birth_date = body.responseText || body.responseData?.date || null;
      } else if (field === 'phone') {
        updateData.phone = body.responseText || body.responseData?.value || null;
      } else if (field === 'email') {
        updateData.email = body.responseText || body.responseData?.value || null;
      } else if (field === 'relationship_type' || field === 'relationship') {
        updateData.relationship_type = body.responseText || body.responseData?.value || null;
      } else if (field === 'how_met') {
        updateData.how_met = body.responseText || null;
      } else if (field === 'address') {
        updateData.address = body.responseText || null;
      } else if (field === 'contact_info') {
        // Combined phone/email input (pipe-separated)
        const parts = (body.responseText || '').split('|');
        if (parts[0]?.trim()) updateData.phone = parts[0].trim();
        if (parts[1]?.trim()) updateData.email = parts[1].trim();
      } else if (body.responseText) {
        // Generic text response - store in notes
        updateData.notes = body.responseText;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: contactError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', prompt.contact_id);

        if (contactError) {
          console.error('Failed to update contact:', contactError);
        }
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
      memoryId: memoryId || undefined,
      contactId: prompt.contact_id || undefined,
      contactUpdated,
    };

    console.log('=== ANSWER RESPONSE ===');
    console.log('memoryId:', memoryId);
    console.log('contactId:', prompt.contact_id);
    console.log('type:', prompt.type);

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
