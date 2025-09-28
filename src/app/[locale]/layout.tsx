// src/app/[locale]/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Navbar } from '../../components/layout/navbar';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Nom de votre site E-commerce',
  description: "Starter e-commerce universel, flexible et prêt à l'emploi.",
};

// Générer les paramètres statiques pour les locales
export async function generateStaticParams(): Promise<{ locale: string }[]> {
  return [{ locale: 'fr' }, { locale: 'en' }];
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
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const hasValidClerkKey =
    clerkKey?.startsWith('pk_live_') ||
    (clerkKey?.startsWith('pk_test_') &&
      clerkKey !== 'pk_test_mock_key_for_ci_build_only');

  if (!hasValidClerkKey) {
    // Mode CI/build sans Clerk
    return (
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    );
  }

  // Mode normal avec Clerk
  return (
    <ClerkProvider>
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navbar locale={locale} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
