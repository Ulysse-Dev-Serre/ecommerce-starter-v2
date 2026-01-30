import { Resend } from 'resend';
import { env } from '@/lib/core/env';

const resendApiKey = env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn(
    '⚠️ RESEND_API_KEY is missing in environment variables. Emails will not be sent.'
  );
}

// Use a dummy key during build if the real key is missing.
// This prevents the build from crashing in CI environments where secrets might not be available.
// The service will fail at runtime if the key is invalid, which is expected behavior.
export const resend = new Resend(resendApiKey || 're_dummy_key_for_build');

export const FROM_EMAIL = env.FROM_EMAIL;
