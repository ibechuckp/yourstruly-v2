import Telnyx from 'telnyx';

// Initialize Telnyx client
const telnyx = new Telnyx({
  apiKey: process.env.TELNYX_API_KEY!,
});

export { telnyx };

// Phone number for sending (set in env)
export const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER || '';

// Send SMS helper
export async function sendSMS(to: string, text: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!process.env.TELNYX_API_KEY) {
      throw new Error('TELNYX_API_KEY not configured');
    }
    
    if (!TELNYX_FROM_NUMBER) {
      throw new Error('TELNYX_FROM_NUMBER not configured');
    }

    // Normalize phone number (ensure E.164 format)
    const normalizedTo = normalizePhoneNumber(to);
    
    // @ts-expect-error - Telnyx SDK types may be outdated
    const message = await telnyx.messages.create({
      from: TELNYX_FROM_NUMBER,
      to: normalizedTo,
      text,
    });

    return {
      success: true,
      messageId: message.data?.id,
    };
  } catch (error) {
    console.error('Telnyx SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's US with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it has 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Otherwise, assume it already has country code
  return `+${digits}`;
}

// SMS Templates for YoursTruly
export const SMS_TEMPLATES = {
  interviewInvite: (name: string, link: string) => 
    `Hi ${name}! You've been invited to share your story on YoursTruly. Click here to start your interview: ${link}`,
  
  interviewReminder: (name: string, link: string) =>
    `Hi ${name}, this is a reminder to complete your YoursTruly interview. Continue here: ${link}`,
  
  memoryShared: (senderName: string, link: string) =>
    `${senderName} shared a memory with you on YoursTruly. View it here: ${link}`,
  
  circleInvite: (inviterName: string, circleName: string, link: string) =>
    `${inviterName} invited you to join "${circleName}" on YoursTruly. Accept here: ${link}`,
  
  verification: (code: string) =>
    `Your YoursTruly verification code is: ${code}. This code expires in 10 minutes.`,
};
