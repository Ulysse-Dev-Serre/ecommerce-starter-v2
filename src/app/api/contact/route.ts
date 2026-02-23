import { render } from '@react-email/render';
import { NextResponse } from 'next/server';

import { SITE_NAME, ADMIN_EMAIL, ADMIN_LOCALE } from '@/lib/config/site';
import { env } from '@/lib/core/env';
import { logger } from '@/lib/core/logger';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { resend, FROM_EMAIL } from '@/lib/integrations/resend/client';
import { withError } from '@/lib/middleware/withError';
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

import AdminContactMessageEmail from '@/components/emails/admin-contact-message';

async function handleContactForm(req: Request) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    // Validation basique
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!ADMIN_EMAIL) {
      logger.error(
        { action: 'contact_config_error' },
        'ADMIN_EMAIL is not configured in site.ts'
      );
      return NextResponse.json(
        { error: 'Internal server configuration error' },
        { status: 500 }
      );
    }

    // Chargement du dictionnaire pour le sujet et le rendu
    const dict = await getDictionary(ADMIN_LOCALE);
    const subjectTemplate = dict.Emails.contact_form.subject;
    const subject = subjectTemplate
      .replace('{name}', name)
      .replace('{siteName}', SITE_NAME);

    // Rendu de l'email
    const emailHtml = await render(
      AdminContactMessageEmail({
        name,
        email,
        message,
        siteName: SITE_NAME,
        locale: ADMIN_LOCALE,
      })
    );

    // Envoi de l'email à l'admin
    // SIMULATION pour les tests smoke (on ne veut pas vider le quota Resend en CI/test)
    const isTest =
      process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost');

    if (isTest && !env.RESEND_API_KEY) {
      logger.info(
        { email: { to: ADMIN_EMAIL, subject } },
        'Simulated contact email sent (Test Mode)'
      );
      return NextResponse.json({ success: true, simulated: true });
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      // Check if error is rate limit from Resend
      const isResendRateLimit =
        error &&
        typeof error === 'object' &&
        'statusCode' in error &&
        error.statusCode === 429;

      if (isResendRateLimit) {
        logger.warn({ error }, 'Resend API rate limit exceeded');
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again later.' },
          { status: 503 }
        );
      }

      logger.error({ error }, 'Failed to send contact email via Resend');
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    logger.info(
      { emailId: data?.id, from: email },
      'Contact message sent successfully'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      { error, action: 'contact_api_error' },
      'Error in contact API route'
    );
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export const POST = withError(
  withRateLimit(handleContactForm, RateLimits.PUBLIC)
);
