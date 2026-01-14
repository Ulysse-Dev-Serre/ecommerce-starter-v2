import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn(
    '⚠️ RESEND_API_KEY is missing in environment variables. Emails will not be sent.'
  );
}

export const resend = new Resend(resendApiKey);

export const FROM_EMAIL = 'Acme <onboarding@resend.dev>';
