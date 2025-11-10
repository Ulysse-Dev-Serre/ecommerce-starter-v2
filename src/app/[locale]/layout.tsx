// src/app/[locale]/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { Navbar } from '../../components/layout/navbar';
import { ConditionalFooter } from '../../components/layout/conditional-footer';
import { prisma } from '@/lib/db/prisma';
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
          {children}
          <ConditionalFooter />
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
  return (
    <ClerkProvider>
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <Navbar locale={locale} userRole={userRole} />
          {children}
          <ConditionalFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
