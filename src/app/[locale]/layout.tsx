// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "../../components/layout/navbar";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nom de votre site E-commerce",
  description: "Starter e-commerce universel, flexible et prêt à l'emploi.",
};

// Générer les paramètres statiques pour les locales
export async function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params
}: RootLayoutProps) {
  const { locale } = await params;
  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <Navbar locale={locale} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
