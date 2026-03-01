/**
 * Email Service using Resend
 * 
 * Handles transactional emails for YoursTruly:
 * - Circle invitations
 * - Death claim notifications
 * - Welcome emails
 * - Password resets
 */

import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resendInstance: Resend | null = null;
export function getResend(): Resend | null {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - email sending disabled');
      return null;
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'YoursTruly <noreply@yourstruly.love>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yourstruly.love';

// =============================================================================
// Types
// =============================================================================

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface CircleInviteEmailData {
  recipientEmail: string;
  recipientName?: string;
  inviterName: string;
  circleName: string;
  inviteToken: string;
}

interface DeathClaimReceivedEmailData {
  recipientEmail: string;
  claimantName: string;
  deceasedName: string;
  claimId: string;
}

interface DeathClaimStatusEmailData {
  recipientEmail: string;
  claimantName: string;
  deceasedName: string;
  status: 'approved' | 'rejected' | 'needs_more_info';
  reviewerNotes?: string;
  accessLink?: string;
}

interface AdminNotificationEmailData {
  recipientEmail: string;
  subject: string;
  content: string;
}

// =============================================================================
// Email Templates
// =============================================================================

function circleInviteTemplate(data: CircleInviteEmailData): { subject: string; html: string; text: string } {
  const inviteUrl = `${APP_URL}/circles/join?token=${data.inviteToken}`;
  
  return {
    subject: `${data.inviterName} invited you to "${data.circleName}" on YoursTruly`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Circle Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">YoursTruly</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Preserve Your Legacy</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0;">You're Invited! 🎉</h2>
            <p style="margin: 0; font-size: 18px;">
              <strong>${data.inviterName}</strong> wants you to join their circle
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b;">Circle: "${data.circleName}"</h3>
            <p style="margin: 0; color: #64748b;">
              Circles are private groups where families and friends share memories, stories, and preserve their legacy together.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${inviteUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            This invitation will expire in 7 days.<br>
            If you don't have a YoursTruly account, you'll be able to create one when you accept.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            If you didn't expect this invitation, you can safely ignore this email.<br>
            <a href="${APP_URL}" style="color: #6366f1;">YoursTruly</a> - Preserve your legacy for generations to come.
          </p>
        </body>
      </html>
    `,
    text: `
${data.inviterName} invited you to "${data.circleName}" on YoursTruly

Circles are private groups where families and friends share memories, stories, and preserve their legacy together.

Accept the invitation: ${inviteUrl}

This invitation will expire in 7 days.

If you don't have a YoursTruly account, you'll be able to create one when you accept.

---
If you didn't expect this invitation, you can safely ignore this email.
YoursTruly - Preserve your legacy for generations to come.
    `.trim()
  };
}

function deathClaimReceivedTemplate(data: DeathClaimReceivedEmailData): { subject: string; html: string; text: string } {
  return {
    subject: `Death Claim Received - ${data.deceasedName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">YoursTruly</h1>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: #92400e;">Claim Received</h2>
            <p style="margin: 0; color: #78350f;">
              We've received your death verification claim for <strong>${data.deceasedName}</strong>.
            </p>
          </div>
          
          <p>Dear ${data.claimantName},</p>
          
          <p>
            Thank you for submitting your verification claim. We understand this is a difficult time, 
            and we're here to help preserve ${data.deceasedName}'s digital legacy.
          </p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0;">What happens next?</h3>
            <ol style="margin: 0; padding-left: 20px; color: #475569;">
              <li style="margin-bottom: 8px;">Our team will review the documentation you provided</li>
              <li style="margin-bottom: 8px;">This process typically takes 2-5 business days</li>
              <li style="margin-bottom: 8px;">We'll email you once a decision has been made</li>
              <li>If approved, you'll receive access to manage the memorial account</li>
            </ol>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Claim Reference: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${data.claimId}</code>
          </p>
          
          <p>
            If you have any questions, please reply to this email or contact our support team.
          </p>
          
          <p style="margin-top: 24px;">
            With sympathy,<br>
            <strong>The YoursTruly Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            <a href="${APP_URL}" style="color: #6366f1;">YoursTruly</a> - Preserve your legacy for generations to come.
          </p>
        </body>
      </html>
    `,
    text: `
Death Claim Received - ${data.deceasedName}

Dear ${data.claimantName},

Thank you for submitting your verification claim. We understand this is a difficult time, and we're here to help preserve ${data.deceasedName}'s digital legacy.

What happens next?
1. Our team will review the documentation you provided
2. This process typically takes 2-5 business days
3. We'll email you once a decision has been made
4. If approved, you'll receive access to manage the memorial account

Claim Reference: ${data.claimId}

If you have any questions, please reply to this email or contact our support team.

With sympathy,
The YoursTruly Team
    `.trim()
  };
}

function deathClaimStatusTemplate(data: DeathClaimStatusEmailData): { subject: string; html: string; text: string } {
  const statusConfig = {
    approved: {
      emoji: '✅',
      title: 'Claim Approved',
      color: '#10b981',
      bgColor: '#d1fae5',
      borderColor: '#10b981',
    },
    rejected: {
      emoji: '❌',
      title: 'Claim Not Approved',
      color: '#ef4444',
      bgColor: '#fee2e2',
      borderColor: '#ef4444',
    },
    needs_more_info: {
      emoji: '📋',
      title: 'Additional Information Needed',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      borderColor: '#f59e0b',
    },
  };

  const config = statusConfig[data.status];
  
  let bodyContent = '';
  let textBodyContent = '';
  
  if (data.status === 'approved') {
    bodyContent = `
      <p>
        Your death verification claim for <strong>${data.deceasedName}</strong> has been approved. 
        You now have access to manage their memorial account.
      </p>
      ${data.accessLink ? `
        <div style="text-align: center; margin: 24px 0;">
          <a href="${data.accessLink}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Access Memorial Account
          </a>
        </div>
      ` : ''}
      <p>
        As a memorial manager, you can:
      </p>
      <ul style="color: #475569;">
        <li>View and share ${data.deceasedName}'s memories</li>
        <li>Manage who has access to the memorial</li>
        <li>Ensure their digital legacy is preserved</li>
      </ul>
    `;
    textBodyContent = `Your death verification claim for ${data.deceasedName} has been approved. You now have access to manage their memorial account.${data.accessLink ? `\n\nAccess Memorial Account: ${data.accessLink}` : ''}`;
  } else if (data.status === 'rejected') {
    bodyContent = `
      <p>
        After careful review, we were unable to verify the death claim for <strong>${data.deceasedName}</strong>.
      </p>
      ${data.reviewerNotes ? `
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>Reason:</strong><br>
          ${data.reviewerNotes}
        </div>
      ` : ''}
      <p>
        If you believe this decision was made in error, please contact our support team with 
        additional documentation.
      </p>
    `;
    textBodyContent = `After careful review, we were unable to verify the death claim for ${data.deceasedName}.${data.reviewerNotes ? `\n\nReason: ${data.reviewerNotes}` : ''}\n\nIf you believe this decision was made in error, please contact our support team.`;
  } else {
    bodyContent = `
      <p>
        We need additional information to process your death verification claim for 
        <strong>${data.deceasedName}</strong>.
      </p>
      ${data.reviewerNotes ? `
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>Information needed:</strong><br>
          ${data.reviewerNotes}
        </div>
      ` : ''}
      <p>
        Please reply to this email with the requested information, or log in to your account 
        to update your claim.
      </p>
    `;
    textBodyContent = `We need additional information to process your death verification claim for ${data.deceasedName}.${data.reviewerNotes ? `\n\nInformation needed: ${data.reviewerNotes}` : ''}\n\nPlease reply to this email with the requested information.`;
  }

  return {
    subject: `${config.emoji} Death Claim Update - ${data.deceasedName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">YoursTruly</h1>
          </div>
          
          <div style="background: ${config.bgColor}; border: 1px solid ${config.borderColor}; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0 0 8px 0; color: ${config.color};">
              ${config.emoji} ${config.title}
            </h2>
          </div>
          
          <p>Dear ${data.claimantName},</p>
          
          ${bodyContent}
          
          <p style="margin-top: 24px;">
            With sympathy,<br>
            <strong>The YoursTruly Team</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            <a href="${APP_URL}" style="color: #6366f1;">YoursTruly</a> - Preserve your legacy for generations to come.
          </p>
        </body>
      </html>
    `,
    text: `
${config.title}

Dear ${data.claimantName},

${textBodyContent}

With sympathy,
The YoursTruly Team
    `.trim()
  };
}

// =============================================================================
// Send Functions
// =============================================================================

export async function sendCircleInviteEmail(data: CircleInviteEmailData): Promise<EmailResult> {
  try {
    const template = circleInviteTemplate(data);
    
    const { data: result, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('[Email] Circle invite failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Circle invite sent:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (err) {
    console.error('[Email] Circle invite error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendDeathClaimReceivedEmail(data: DeathClaimReceivedEmailData): Promise<EmailResult> {
  try {
    const template = deathClaimReceivedTemplate(data);
    
    const { data: result, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('[Email] Death claim received notification failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Death claim received notification sent:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (err) {
    console.error('[Email] Death claim received error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendDeathClaimStatusEmail(data: DeathClaimStatusEmailData): Promise<EmailResult> {
  try {
    const template = deathClaimStatusTemplate(data);
    
    const { data: result, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('[Email] Death claim status notification failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Death claim status notification sent:', result?.id);
    return { success: true, messageId: result?.id };
  } catch (err) {
    console.error('[Email] Death claim status error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendAdminNotificationEmail(data: AdminNotificationEmailData): Promise<EmailResult> {
  try {
    const { data: result, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: data.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6366f1; margin: 0;">YoursTruly Admin</h1>
            </div>
            <div style="white-space: pre-wrap;">${data.content}</div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              This is an automated admin notification from YoursTruly.
            </p>
          </body>
        </html>
      `,
      text: data.content,
    });

    if (error) {
      console.error('[Email] Admin notification failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (err) {
    console.error('[Email] Admin notification error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Re-export types for consumers
export type {
  CircleInviteEmailData,
  DeathClaimReceivedEmailData,
  DeathClaimStatusEmailData,
  AdminNotificationEmailData,
  EmailResult,
};
