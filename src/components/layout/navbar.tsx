// src/components/layout/navbar.tsx
"use client";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const [messages, setMessages] = useState<any>(null);
  const pathname = usePathname();

  // Charger les messages pour la locale actuelle
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(`../../lib/i18n/dictionaries/${locale}.json`);
        setMessages(msgs.default);
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        // Fallback vers français
        const msgs = await import(`../../lib/i18n/dictionaries/fr.json`);
        setMessages(msgs.default);
      }
    };
    loadMessages();
  }, [locale]);

  // Fonction pour changer de langue
  const getLocalizedPath = (newLocale: string) => {
    return pathname.replace(`/${locale}`, `/${newLocale}`);
  };

  // Afficher un loading si les messages ne sont pas encore chargés
  if (!messages) {
    return (
      <header className="bg-background border-b border-border theme-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold theme-primary">Loading...</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background border-b border-border theme-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href={`/${locale}`}>
              <h1 className="text-xl font-bold theme-primary cursor-pointer">
                {messages.navbar.brand}
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href={`/${locale}`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {messages.common.home}
            </Link>
            
            <Link 
              href={`/${locale}/products`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {messages.products.title}
            </Link>
            
            <Link 
              href={`/${locale}/contact`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {messages.common.contact}
            </Link>

            {/* Sélecteur de langue */}
            <div className="flex items-center space-x-2 border-l pl-4 ml-4">
              <Link 
                href={getLocalizedPath('fr')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  locale === 'fr' 
                    ? 'bg-primary text-white' 
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                FR
              </Link>
              <Link 
                href={getLocalizedPath('en')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  locale === 'en' 
                    ? 'bg-primary text-white' 
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                EN
              </Link>
            </div>
          </nav>

          {/* Right side - Auth & Cart */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button className="bg-primary text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-primary-hover transition-colors">
                  {messages.common.signIn} / {messages.common.signUp}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-2">
                <Link 
                  href={`/${locale}/cart`}
                  className="text-foreground hover:text-muted-foreground p-2"
                  title={messages.navbar.cart}
                >
                  🛒
                </Link>
                <UserButton />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
