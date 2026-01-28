// src/app/[locale]/layout.tsx
import { env } from '@/lib/core/env';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getTranslations, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { siteConfig } from '@/lib/config/site';
import { i18n } from '@/lib/i18n/config';
import { getCurrentUser } from '@/lib/services/user.service';
import { Navbar } from '@/components/layout/navbar';
import { ConditionalNavbar } from '@/components/layout/conditional-navbar';
import { ConditionalFooter } from '@/components/layout/conditional-footer';
import GoogleTagManager from '@/components/analytics/google-tag-manager';
import CookieConsentComponent from '@/components/analytics/cookie-consent';
import { AnalyticsTracker } from '@/components/analytics/analytics-tracker';
import { ToastProvider } from '@/components/ui/toast-provider';
import { CartMergeHandler } from '@/components/cart/cart-merge-handler';
import Script from 'next/script';
import { Suspense } from 'react';
import React from 'react';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/config/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const baseUrl = env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: t('description'),
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LOCALES.map((loc: string) => [loc, `/${loc}`])
        ),
        'x-default': `/${DEFAULT_LOCALE}`,
      },
    },
  };
}

// Générer les paramètres statiques pour les locales
export async function generateStaticParams(): Promise<{ locale: string }[]> {
  return i18n.locales.map(locale => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps): Promise<React.ReactElement> {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  // Vérifier si on a une vraie clé Clerk (pas une clé mock pour CI)
  const clerkKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerkKey =
    clerkKey?.startsWith('pk_live_') || clerkKey?.startsWith('pk_test_');

  // Récupérer le rôle de l'utilisateur si Clerk est actif
  let userRole: string | undefined;
  if (hasValidClerkKey) {
    const user = await getCurrentUser();
    userRole = user?.role;
  }

  const content = (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} vibe-antialiased vibe-flex vibe-flex-col vibe-min-h-screen`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GoogleTagManager />
          <CookieConsentComponent />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <ToastProvider>
            <CartMergeHandler />
            <ConditionalNavbar locale={locale} userRole={userRole} />
            <main className="vibe-flex-grow">{children}</main>
            <ConditionalFooter locale={locale} />
          </ToastProvider>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&loading=async`}
            strategy="afterInteractive"
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );

  if (!hasValidClerkKey) {
    return content;
  }

  return <ClerkProvider>{content}</ClerkProvider>;
}
