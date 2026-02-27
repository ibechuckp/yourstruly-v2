import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSMS, SMS_TEMPLATES } from '@/lib/telnyx';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, template, params, customMessage } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      );
    }

    // Build message from template or custom
    let message: string;
    
    if (customMessage) {
      message = customMessage;
    } else if (template && SMS_TEMPLATES[template as keyof typeof SMS_TEMPLATES]) {
      const templateFn = SMS_TEMPLATES[template as keyof typeof SMS_TEMPLATES];
      message = (templateFn as Function)(...(params || []));
    } else {
      return NextResponse.json(
        { error: 'Message or valid template required' },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await sendSMS(to, message);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Log to database for tracking (non-critical)
    try {
      await supabase.from('sms_logs').insert({
        user_id: user.id,
        to_number: to,
        message_preview: message.substring(0, 100),
        template_used: template || null,
        telnyx_message_id: result.messageId,
        status: 'sent',
      });
    } catch {
      // Don't fail if logging fails
      console.warn('Failed to log SMS to database');
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
