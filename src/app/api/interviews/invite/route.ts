import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSMS, SMS_TEMPLATES } from '@/lib/telnyx';
import { getResend } from '@/lib/email';
import { nanoid } from 'nanoid';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.yourstruly.love';

// POST /api/interviews/invite - Send interview invitation via SMS and/or email
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name,
      phone, 
      email,
      message,           // Optional custom message
      sessionId,         // Existing session to invite to (optional)
      createNewSession,  // Create a new interview session
      questions,         // Optional: specific questions for new session
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!phone && !email) {
      return NextResponse.json({ error: 'Phone or email required' }, { status: 400 });
    }

    let accessToken: string;
    let interviewSessionId: string;

    // If existing session provided, use it
    if (sessionId) {
      const { data: session, error } = await supabase
        .from('interview_sessions')
        .select('id, access_token')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (error || !session) {
        return NextResponse.json({ error: 'Interview session not found' }, { status: 404 });
      }

      accessToken = session.access_token;
      interviewSessionId = session.id;
    } 
    // Create new interview session for the invitee
    else if (createNewSession !== false) {
      accessToken = nanoid(32);
      
      // Find or create contact
      let contactId: string | null = null;
      
      if (phone || email) {
        // Check for existing contact
        let query = supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id);
        
        if (phone) {
          query = query.eq('phone', phone);
        } else if (email) {
          query = query.eq('email', email);
        }
        
        const { data: existingContact } = await query.single();
        
        if (existingContact) {
          contactId = existingContact.id;
        } else {
          // Create new contact
          const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
              user_id: user.id,
              name,
              phone: phone || null,
              email: email || null,
              relationship: 'interview_subject',
            })
            .select('id')
            .single();
          
          if (!contactError && newContact) {
            contactId = newContact.id;
          }
        }
      }

      // Create interview session
      const { data: newSession, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          access_token: accessToken,
          status: 'pending',
          invitee_name: name,
          phone_number: phone || null,
          email_address: email || null,
          custom_questions: questions || null,
        })
        .select('id')
        .single();

      if (sessionError || !newSession) {
        console.error('Failed to create interview session:', sessionError);
        return NextResponse.json({ error: 'Failed to create interview session' }, { status: 500 });
      }

      interviewSessionId = newSession.id;
    } else {
      return NextResponse.json({ error: 'Must provide sessionId or allow creating new session' }, { status: 400 });
    }

    // Generate interview link
    const interviewLink = `${APP_URL}/interview/${accessToken}`;
    
    const results: { sms?: { success: boolean; messageId?: string; error?: string }; email?: { success: boolean; error?: string } } = {};

    // Send SMS if phone provided
    if (phone) {
      const smsMessage = message 
        ? `${message}\n\nStart your interview: ${interviewLink}`
        : SMS_TEMPLATES.interviewInvite(name, interviewLink);
      
      const smsResult = await sendSMS(phone, smsMessage);
      results.sms = smsResult;

      // Log SMS
      try {
        await supabase.from('sms_logs').insert({
          user_id: user.id,
          to_number: phone,
          message_preview: smsMessage.substring(0, 100),
          template_used: message ? 'custom' : 'interviewInvite',
          telnyx_message_id: smsResult.messageId || null,
          status: smsResult.success ? 'sent' : 'failed',
          related_type: 'interview_invite',
          related_id: interviewSessionId,
        });
      } catch {
        // Don't fail if logging fails
      }
    }

    // Send email if email provided
    if (email) {
      try {
        const resend = getResend();
        if (resend) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();

          const senderName = profile?.display_name || 'Someone';
          
          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'YoursTruly <noreply@yourstruly.love>',
            to: email,
            subject: `${senderName} invited you to share your story`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>You're Invited to Share Your Story</h2>
                <p>Hi ${name},</p>
                <p>${message || `${senderName} would love to hear your stories and memories. YoursTruly makes it easy to record and preserve your life experiences through a guided interview.`}</p>
                <p style="margin: 24px 0;">
                  <a href="${interviewLink}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Start Your Interview
                  </a>
                </p>
                <p style="color: #666; font-size: 14px;">Or copy this link: ${interviewLink}</p>
                <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px;">This invitation was sent via YoursTruly. Your stories matter.</p>
              </div>
            `,
          });
          
          results.email = { success: true };
        }
      } catch (emailError) {
        console.error('Email invite error:', emailError);
        results.email = { success: false, error: 'Failed to send email' };
      }
    }

    // Update interview session with invite sent timestamp
    await supabase
      .from('interview_sessions')
      .update({ 
        invite_sent_at: new Date().toISOString(),
        invite_method: phone && email ? 'both' : (phone ? 'sms' : 'email'),
      })
      .eq('id', interviewSessionId);

    return NextResponse.json({
      success: true,
      sessionId: interviewSessionId,
      interviewLink,
      results,
    });

  } catch (error) {
    console.error('Interview invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
