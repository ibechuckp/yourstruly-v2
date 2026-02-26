import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAdminAuth } from '@/lib/auth/admin';

// GET /api/engagement/debug - Debug prompt generation
// RESTRICTED: Development only + Admin only
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify admin access
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const user = { id: auth.userId! };

    // Get user's profile to see what data we have
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('interests, skills, hobbies, religions, personality_type, personality_traits, languages, education_level, life_goals, occupation, city, country, date_of_birth')
      .eq('id', user.id)
      .single();

    // Count existing prompts
    const { count: pendingCount } = await admin
      .from('engagement_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Check what templates exist that could match
    const { data: matchingTemplates, error: templateError } = await admin
      .from('prompt_templates')
      .select('id, type, category, prompt_text, target_interest, target_skill, target_hobby, target_religion, target_life_goal')
      .eq('is_active', true)
      .or(`target_interest.in.(${(profile?.interests || []).map((i: string) => `"${i}"`).join(',')}),target_religion.in.(${(profile?.religions || []).map((r: string) => `"${r}"`).join(',')}),target_skill.in.(${(profile?.skills || []).map((s: string) => `"${s}"`).join(',')})`)
      .limit(20);

    // Try to regenerate prompts
    const { data: generated, error: genError } = await admin
      .rpc('generate_engagement_prompts', {
        p_user_id: user.id,
        p_count: 20,
      });

    // Count after generation
    const { count: afterCount } = await admin
      .from('engagement_prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending');

    // Get some sample prompts
    const { data: samplePrompts } = await admin
      .from('engagement_prompts')
      .select('id, type, category, prompt_text, source, personalization_context')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile: {
        interests: profile?.interests,
        skills: profile?.skills,
        hobbies: profile?.hobbies,
        religions: profile?.religions,
        personality_type: profile?.personality_type,
        personality_traits: profile?.personality_traits,
        life_goals: profile?.life_goals,
        occupation: profile?.occupation,
        location: profile?.city || profile?.country,
      },
      prompts: {
        pendingBefore: pendingCount,
        generated: generated,
        generationError: genError?.message,
        pendingAfter: afterCount,
      },
      matchingTemplates: matchingTemplates?.length || 0,
      templateError: templateError?.message,
      samplePrompts,
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
