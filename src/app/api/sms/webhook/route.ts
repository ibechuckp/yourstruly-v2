import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Telnyx webhook for delivery status updates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Telnyx sends events in this format
    const { data } = body;
    
    if (!data) {
      return NextResponse.json({ received: true });
    }

    const eventType = data.event_type;
    const payload = data.payload;

    // Handle different event types
    switch (eventType) {
      case 'message.sent':
      case 'message.delivered':
      case 'message.failed': {
        const messageId = payload?.id;
        const status = eventType.replace('message.', '');
        
        if (messageId) {
          const supabase = await createClient();
          
          // Update SMS log with delivery status
          await supabase
            .from('sms_logs')
            .update({ 
              status,
              updated_at: new Date().toISOString(),
              delivery_details: payload,
            })
            .eq('telnyx_message_id', messageId);
        }
        break;
      }
      
      case 'message.received': {
        // Handle inbound SMS (future: could enable reply functionality)
        console.log('Inbound SMS received:', payload);
        break;
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Telnyx webhook error:', error);
    // Return 200 to prevent Telnyx from retrying
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

// Telnyx may send GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
