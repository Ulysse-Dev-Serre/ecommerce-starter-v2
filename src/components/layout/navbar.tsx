// src/components/layout/navbar.tsx
'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState, type MouseEvent } from 'react';

import { logger } from '../../lib/logger';
import { useCurrency, type Currency } from '../../hooks/use-currency';

interface NavbarProps {
  locale: string;
  userRole?: string;
}

export function Navbar({ locale, userRole }: NavbarProps): React.JSX.Element {
  const [messages, setMessages] = useState<any | null>(null);
  const { currency } = useCurrency();
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
      <header className="bg-background border-b border-border theme-border relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-xl font-bold theme-primary">Loading...</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar-footer-style theme-border relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              onClick={() => handleNavigationClick(`/${locale}`)}
              className="flex items-center"
            >
              <img
                src="/ManorLeaf_transparent.png"
                alt="ManorLeaf Logo"
                className="h-16 w-auto cursor-pointer"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href={`/${locale}`}
              className="text-foreground hover:text-[#9d8e7e] transition-colors"
              onClick={() => handleNavigationClick(`/${locale}`)}
            >
              {messages.common.home}
            </Link>

            <Link
              href={`/${locale}/shop`}
              className="text-foreground hover:text-[#9d8e7e] transition-colors"
              onClick={() => handleNavigationClick(`/${locale}/shop`)}
            >
              {messages.navbar.shop}
            </Link>

            <Link
              href={`/${locale}/contact`}
              className="text-foreground hover:text-[#9d8e7e] transition-colors"
              onClick={() => handleNavigationClick(`/${locale}/contact`)}
            >
              {messages.common.contact}
            </Link>

            {/* Mes commandes - Visible pour les utilisateurs connectés */}
            {isSignedIn && (
              <Link
                href={`/${locale}/orders`}
                className="text-foreground hover:text-[#9d8e7e] transition-colors"
                onClick={() => handleNavigationClick(`/${locale}/orders`)}
              >
                {messages.navbar?.orders ||
                  (locale === 'fr' ? 'Mes commandes' : 'My orders')}
              </Link>
            )}

            {/* Sélecteur de langue */}
            <div className="flex items-center space-x-2 border-l pl-4 ml-4">
              <button
                onClick={e => handleLanguageChange('fr', e)}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  locale === 'fr'
                    ? 'bg-[#7a7a7a] text-white hover:bg-[#696969]'
                    : 'text-foreground hover:bg-[#7a7a7a]/30'
                }`}
              >
                FR
              </button>
              <button
                onClick={e => handleLanguageChange('en', e)}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  locale === 'en'
                    ? 'bg-[#7a7a7a] text-white hover:bg-[#696969]'
                    : 'text-foreground hover:bg-[#7a7a7a]/30'
                }`}
              >
                EN
              </button>
            </div>
          </nav>

          {/* Right side - Auth & Cart */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <Link
                href={`/${locale}/cart`}
                className="bg-[#7a7a7a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#696969] transition-colors"
                title={messages.navbar.cart}
                onClick={() => handleNavigationClick(`/${locale}/cart`)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
              </Link>
              <SignInButton>
                <button
                  className="bg-[#7a7a7a] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-[#696969] transition-colors"
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
              {/* Admin Dashboard - Visible uniquement pour les admins */}
              {userRole === 'ADMIN' && (
                <Link
                  href={`/${locale}/admin`}
                  className="dashboard-extreme-right"
                  onClick={() => handleNavigationClick(`/${locale}/admin`)}
                >
                  Dashboard
                </Link>
              )}
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/${locale}/cart`}
                  className="bg-[#7a7a7a] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#696969] transition-colors"
                  title={messages.navbar.cart}
                  onClick={() => handleNavigationClick(`/${locale}/cart`)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                  </svg>
                </Link>
                <UserButton />
                {/* Admin Dashboard - Visible uniquement pour les admins */}
                {userRole === 'ADMIN' && (
                  <Link
                    href={`/${locale}/admin`}
                    className="dashboard-extreme-right"
                    onClick={() => handleNavigationClick(`/${locale}/admin`)}
                  >
                    Dashboard
                  </Link>
                )}
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
