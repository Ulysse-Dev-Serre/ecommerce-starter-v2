// src/app/[locale]/layout.tsx
import { env } from '@/lib/env';
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getTranslations, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { siteConfig } from '@/lib/config/site';
import { i18n } from '@/lib/i18n/config';
import { prisma } from '@/lib/db/prisma';
import { Navbar } from '@/components/layout/navbar';
import { ConditionalNavbar } from '@/components/layout/conditional-navbar';
import { ConditionalFooter } from '@/components/layout/conditional-footer';
import GoogleTagManager from '@/components/analytics/GoogleTagManager';
import CookieConsentComponent from '@/components/analytics/CookieConsent';
import { AnalyticsTracker } from '@/components/analytics/AnalyticsTracker';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });
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
        fr: '/fr',
        en: '/en',
        'x-default': '/en',
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

  // Vérifier si on a une vraie clé Clerk (pas une clé mock pour CI)
  const clerkKey = env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const hasValidClerkKey =
    clerkKey?.startsWith('pk_live_') ||
    (clerkKey?.startsWith('pk_test_') &&
      clerkKey !== 'pk_test_mock_key_for_ci_build_only');

  if (!hasValidClerkKey) {
    // Mode CI/build sans Clerk
    return (
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <GoogleTagManager />
          <CookieConsentComponent />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <ToastProvider>
            {children}
            <ConditionalFooter locale={locale} />
          </ToastProvider>
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${clerkKey ? env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY : ''}&libraries=places&loading=async`}
            strategy="afterInteractive"
          />
        </body>
      </html>
    );
  }

  // Récupérer le rôle de l'utilisateur
  let userRole: string | undefined;
  try {
    const { userId: clerkId } = await auth();
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { role: true },
      });
      userRole = user?.role;
    }
  } catch (error) {
    // Ignorer les erreurs (utilisateur non connecté, etc.)
    userRole = undefined;
  }

  // Mode normal avec Clerk
  const messages = await getMessages({ locale });

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
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
              {children}
              <ConditionalFooter locale={locale} />
            </ToastProvider>
            <Script
              src={`https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&loading=async`}
              strategy="afterInteractive"
            />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
