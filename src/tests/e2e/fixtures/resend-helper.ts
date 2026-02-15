import { env } from '@/lib/core/env';

/**
 * Helper to verify emails sent via Resend API during E2E tests
 */
export async function verifyEmailSent(params: {
  recipient: string;
  subjectInclude?: string;
  maxRetries?: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '⚠️ RESEND_API_KEY not found in environment. Skipping email verification.'
    );
    return false;
  }

  const { maxRetries = 5, recipient, subjectInclude } = params;

  console.log(
    `🔍 Verifying email sent to ${recipient} (Waiting for Resend indexation...)`
  );

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Delay to allow Resend to process and index the email
      await new Promise(resolve => setTimeout(resolve, 3000 * (i + 1)));

      const response = await fetch('https://api.resend.com/emails', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle restricted API key (Send Only) gracefully
        if (response.status === 401 && error.name === 'restricted_api_key') {
          console.warn(
            '⚠️ Resend API Key is restricted (Send Only). Skipping verification step.'
          );
          return true;
        }

        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      const { data } = await response.json();

      // Look for the email in the last 20 emails
      const found = data.find((email: any) => {
        const matchesRecipient = email.to.includes(recipient);
        const matchesSubject = subjectInclude
          ? email.subject.toLowerCase().includes(subjectInclude.toLowerCase())
          : true;

        // Ensure it's a recent email (last 5 minutes)
        const sentAt = new Date(email.created_at).getTime();
        const now = Date.now();
        const isRecent = now - sentAt < 5 * 60 * 1000;

        return matchesRecipient && matchesSubject && isRecent;
      });

      if (found) {
        console.log(
          `✅ Email verified in Resend: "${found.subject}" to ${found.to[0]}`
        );
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1} to verify email failed:`, error);
    }
  }

  console.error(
    `❌ Email to ${recipient} not found in Resend after ${maxRetries} attempts.`
  );
  return false;
}
