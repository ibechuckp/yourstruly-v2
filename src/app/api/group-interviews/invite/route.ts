import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSMS } from '@/lib/telnyx';
import { getResend } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.yourstruly.love';

// POST /api/group-interviews/invite - Send invite to group interview participants
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      groupInterviewId,
      participantIds,     // Specific participants to invite (optional - if not provided, invites all pending)
      sendSms = true,     // Send SMS invites
      sendEmail = true,   // Send email invites
      customMessage,      // Optional custom message
    } = body;

    if (!groupInterviewId) {
      return NextResponse.json({ error: 'groupInterviewId is required' }, { status: 400 });
    }

    // Verify user owns this group interview
    const { data: groupInterview, error: giError } = await supabase
      .from('group_interviews')
      .select('id, title, user_id')
      .eq('id', groupInterviewId)
      .eq('user_id', user.id)
      .single();

    if (giError || !groupInterview) {
      return NextResponse.json({ error: 'Group interview not found' }, { status: 404 });
    }

    // Get sender's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    
    const senderName = profile?.display_name || 'Someone';

    // Get participants to invite
    let query = supabase
      .from('group_interview_participants')
      .select('id, name, phone, email, access_token, status')
      .eq('group_interview_id', groupInterviewId);

    if (participantIds && participantIds.length > 0) {
      query = query.in('id', participantIds);
    } else {
      // Only invite pending participants
      query = query.eq('status', 'pending');
    }

    const { data: participants, error: pError } = await query;

    if (pError) {
      console.error('Error fetching participants:', pError);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No participants to invite',
        invited: 0 
      });
    }

    const results: Array<{
      participantId: string;
      name: string;
      sms?: { success: boolean; error?: string };
      email?: { success: boolean; error?: string };
    }> = [];

    // Send invites to each participant
    for (const participant of participants) {
      const interviewLink = `${APP_URL}/g/${participant.access_token}`;
      const result: typeof results[0] = {
        participantId: participant.id,
        name: participant.name,
      };

      // Send SMS
      if (sendSms && participant.phone) {
        const smsMessage = customMessage 
          ? `${customMessage}\n\nShare your story: ${interviewLink}`
          : `Hi ${participant.name}! ${senderName} invited you to share your story for "${groupInterview.title}". Click here to participate: ${interviewLink}`;
        
        const smsResult = await sendSMS(participant.phone, smsMessage);
        result.sms = { success: smsResult.success, error: smsResult.error };

        // Log SMS
        try {
          await supabase.from('sms_logs').insert({
            user_id: user.id,
            to_number: participant.phone,
            message_preview: smsMessage.substring(0, 100),
            template_used: 'group_interview_invite',
            telnyx_message_id: smsResult.messageId || null,
            status: smsResult.success ? 'sent' : 'failed',
            related_type: 'group_interview_invite',
            related_id: participant.id,
          });
        } catch {
          // Don't fail if logging fails
        }
      }

      // Send email
      if (sendEmail && participant.email) {
        try {
          const resend = getResend();
          if (resend) {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'YoursTruly <noreply@yourstruly.love>',
              to: participant.email,
              subject: `${senderName} invited you to share your story`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>You're Invited to Share Your Story</h2>
                  <p>Hi ${participant.name},</p>
                  <p>${customMessage || `${senderName} would love to hear your stories for "${groupInterview.title}". Join others in sharing your memories and experiences.`}</p>
                  <p style="margin: 24px 0;">
                    <a href="${interviewLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                      Share Your Story
                    </a>
                  </p>
                  <p style="color: #666; font-size: 14px;">Or copy this link: ${interviewLink}</p>
                  <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px;">This invitation was sent via YoursTruly.</p>
                </div>
              `,
            });
            result.email = { success: true };
          }
        } catch (emailError) {
          console.error('Email invite error:', emailError);
          result.email = { success: false, error: 'Failed to send email' };
        }
      }

      results.push(result);

      // Update participant invite status
      await supabase
        .from('group_interview_participants')
        .update({ 
          invited_at: new Date().toISOString(),
          last_reminder_at: new Date().toISOString(),
          reminder_count: participant.status === 'pending' ? 1 : undefined,
        })
        .eq('id', participant.id);
    }

    const successCount = results.filter(r => 
      (r.sms?.success || !sendSms) && (r.email?.success || !sendEmail)
    ).length;

    return NextResponse.json({
      success: true,
      invited: successCount,
      total: results.length,
      results,
    });

  } catch (error) {
    console.error('Group interview invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
