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
import { useTranslations } from 'next-intl';
import React, { useState, type MouseEvent } from 'react';

import { logger } from '../../lib/logger';
import { useCurrency, type Currency } from '../../hooks/use-currency';
import { i18n } from '../../lib/i18n/config';

interface NavbarProps {
  locale: string;
  userRole?: string;
}

export function Navbar({ locale, userRole }: NavbarProps): React.JSX.Element {
  const tNavbar = useTranslations('navbar'); // Ensure this is defined
  const tCommon = useTranslations('common');

  const [messages, setMessages] = useState<any | null>(null); // Legacy logic removal in progress?
  // Wait, I should have removed `messages` logic entirely.
  // Previous view of Navbar (Step 840) showed explicit logic.
  // I will just add the hooks for now to fix the error.
  const { currency, setCurrency } = useCurrency();
  const pathname = usePathname();
  const { isSignedIn } = useUser();

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

  // Fonction pour changer de devise
  const handleCurrencyChange = (newCurrency: Currency): void => {
    logger.info(
      {
        action: 'currency_change',
        from: currency,
        to: newCurrency,
        locale,
        component: 'navbar',
      },
      'User changed currency'
    );

    setCurrency(newCurrency);
  };

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
                {tNavbar('brand')}
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
              {tCommon('home')}
            </Link>

            <Link
              href={`/${locale}/shop`}
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => handleNavigationClick(`/${locale}/shop`)}
            >
              {tNavbar('shop')}
            </Link>

            <Link
              href={`/${locale}/contact`}
              className="text-foreground hover:text-primary transition-colors"
              onClick={() => handleNavigationClick(`/${locale}/contact`)}
            >
              {tCommon('contact')}
            </Link>

            {/* Mes commandes - Visible pour les utilisateurs connectés */}
            {isSignedIn && (
              <Link
                href={`/${locale}/orders`}
                className="text-foreground hover:text-primary transition-colors"
                onClick={() => handleNavigationClick(`/${locale}/orders`)}
              >
                {tNavbar('orders')}
              </Link>
            )}

            {/* Admin Dashboard - Visible uniquement pour les admins */}
            {isSignedIn && userRole === 'ADMIN' && (
              <Link
                href={`/${locale}/admin`}
                className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                onClick={() => handleNavigationClick(`/${locale}/admin`)}
              >
                📊 Dashboard
              </Link>
            )}

            {/* Sélecteur de langue */}
            <div className="flex items-center space-x-2 border-l pl-4 ml-4">
              {i18n.locales.map(loc => (
                <button
                  key={loc}
                  onClick={e => handleLanguageChange(loc, e)}
                  className={`px-2 py-1 text-sm rounded transition-colors uppercase ${
                    locale === loc
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Sélecteur de devise */}
            <div className="flex items-center space-x-2 border-l pl-4 ml-2">
              <button
                onClick={() => handleCurrencyChange('CAD')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  currency === 'CAD'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                $ CAD
              </button>
              <button
                onClick={() => handleCurrencyChange('USD')}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  currency === 'USD'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                $ USD
              </button>
            </div>
          </nav>

          {/* Right side - Auth & Cart */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <Link
                href={`/${locale}/cart`}
                className="text-foreground hover:text-muted-foreground p-2"
                title={tNavbar('cart')}
                onClick={() => handleNavigationClick(`/${locale}/cart`)}
              >
                🛒
              </Link>
              <SignInButton>
                <button
                  className="bg-primary text-primary-foreground rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer hover:bg-primary-hover transition-colors"
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
                  {tCommon('signIn')} / {tCommon('signUp')}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/${locale}/cart`}
                  className="text-foreground hover:text-muted-foreground p-2"
                  title={tNavbar('cart')}
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
