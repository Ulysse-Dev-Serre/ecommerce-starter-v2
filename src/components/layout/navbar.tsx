// src/components/layout/navbar.tsx
'use client';

import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState, type MouseEvent } from 'react';

import { logger } from '../../lib/logger';

interface NavbarProps {
  locale: string;
  userRole?: string;
}

export function Navbar({ locale, userRole }: NavbarProps): React.JSX.Element {
  const [messages, setMessages] = useState<Record<
    string,
    Record<string, string>
  > | null>(null);
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  // Charger les messages pour la locale actuelle
  useEffect(() => {
    const loadMessages: () => Promise<void> = async () => {
      try {
        const msgs = await import(`../../lib/i18n/dictionaries/${locale}.json`);
        setMessages(msgs.default);

        // Logger le chargement réussi des traductions
        logger.info(
          {
            action: 'translations_loaded',
            locale,
            component: 'navbar',
          },
          'Translations loaded successfully'
        );
      } catch (error) {
        // Logger l'erreur de chargement
        logger.warn(
          {
            action: 'translations_fallback',
            locale,
            error: error instanceof Error ? error.message : 'Unknown error',
            component: 'navbar',
          },
          'Failed to load translations, falling back to French'
        );

        // Fallback vers français
        const msgs = await import(`../../lib/i18n/dictionaries/fr.json`);
        setMessages(msgs.default);
      }
    };
    void loadMessages();
  }, [locale]);

  // Fonction pour changer de langue avec logging
  const handleLanguageChange = (newLocale: string, event: MouseEvent): void => {
    event.preventDefault();

    // Logger le changement de langue
    logger.info(
      {
        action: 'language_change',
        from: locale,
        to: newLocale,
        path: pathname,
        component: 'navbar',
      },
      'User changed language'
    );

    // Redirection
    window.location.href = pathname.replace(`/${locale}`, `/${newLocale}`);
  };

  // Fonction pour logger les clics de navigation
  const handleNavigationClick = (destination: string): void => {
    logger.info(
      {
        action: 'navigation_click',
        from: pathname,
        to: destination,
        locale,
        component: 'navbar',
      },
      'User clicked navigation link'
    );
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
            <Link
              href={`/${locale}`}
              onClick={() => handleNavigationClick(`/${locale}`)}
            >
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
              onClick={() => handleNavigationClick(`/${locale}`)}
            >
              {messages.common.home}
            </Link>

            <Link
              href={`/${locale}/shop`}
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => handleNavigationClick(`/${locale}/shop`)}
            >
              {messages.navbar.shop}
            </Link>

            <Link
              href={`/${locale}/contact`}
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => handleNavigationClick(`/${locale}/contact`)}
            >
              {messages.common.contact}
            </Link>

            {/* Admin Dashboard - Visible uniquement pour les admins */}
            {isSignedIn && userRole === 'ADMIN' && (
              <Link
                href={`/${locale}/admin`}
                className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                onClick={() => handleNavigationClick(`/${locale}/admin`)}
              >
                📊 Dashboard
              </Link>
            )}

            {/* Sélecteur de langue */}
            <div className="flex items-center space-x-2 border-l pl-4 ml-4">
              <button
                onClick={e => handleLanguageChange('fr', e)}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  locale === 'fr'
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                FR
              </button>
              <button
                onClick={e => handleLanguageChange('en', e)}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  locale === 'en'
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                EN
              </button>
            </div>
          </nav>

          {/* Right side - Auth & Cart */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button
                  className="bg-primary text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-primary-hover transition-colors"
                  onClick={() => {
                    logger.info(
                      {
                        action: 'auth_button_click',
                        type: 'sign_in',
                        locale,
                        component: 'navbar',
                      },
                      'User clicked sign in button'
                    );
                  }}
                >
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
                  onClick={() => handleNavigationClick(`/${locale}/cart`)}
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
