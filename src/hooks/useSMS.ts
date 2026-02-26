'use client';

import { useState } from 'react';

type SMSTemplate = 
  | 'interviewInvite'
  | 'interviewReminder'
  | 'memoryShared'
  | 'circleInvite'
  | 'verification';

interface SendSMSOptions {
  to: string;
  template?: SMSTemplate;
  params?: string[];
  customMessage?: string;
}

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function useSMS() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSMS = async (options: SendSMSOptions): Promise<SendSMSResult> => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send SMS';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setSending(false);
    }
  };

  // Convenience methods for common templates
  const sendInterviewInvite = (to: string, name: string, link: string) =>
    sendSMS({ to, template: 'interviewInvite', params: [name, link] });

  const sendInterviewReminder = (to: string, name: string, link: string) =>
    sendSMS({ to, template: 'interviewReminder', params: [name, link] });

  const sendMemoryShared = (to: string, senderName: string, link: string) =>
    sendSMS({ to, template: 'memoryShared', params: [senderName, link] });

  const sendCircleInvite = (to: string, inviterName: string, circleName: string, link: string) =>
    sendSMS({ to, template: 'circleInvite', params: [inviterName, circleName, link] });

  const sendVerification = (to: string, code: string) =>
    sendSMS({ to, template: 'verification', params: [code] });

  return {
    sendSMS,
    sendInterviewInvite,
    sendInterviewReminder,
    sendMemoryShared,
    sendCircleInvite,
    sendVerification,
    sending,
    error,
  };
}
