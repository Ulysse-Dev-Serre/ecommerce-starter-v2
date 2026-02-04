'use client';

import { VIBE_HOVER_GROUP } from '@/lib/config/vibe-styles';

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
import React, { type MouseEvent } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

import { logger } from '../../lib/core/logger';
import { i18n } from '../../lib/i18n/config';
import { siteConfig } from '@/lib/config/site';

interface NavbarProps {
  locale: string;
  userRole?: string;
}

export function Navbar({ locale, userRole }: NavbarProps): React.JSX.Element {
  const tNavbar = useTranslations('navbar');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const handleLanguageChange = (newLocale: string, event: MouseEvent): void => {
    event.preventDefault();
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
    window.location.href = pathname.replace(`/${locale}`, `/${newLocale}`);
  };

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

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between vibe-h-20">
          <div className="flex items-center">
            <Link
              href={`/${locale}`}
              onClick={() => handleNavigationClick(`/${locale}`)}
              className={VIBE_HOVER_GROUP}
            >
              <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tighter transition-colors group-hover:text-primary">
                {siteConfig.name}
              </h1>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href={`/${locale}`}
              className={cn(
                'px-4 py-2 text-sm font-bold transition-all rounded-md text-muted-foreground hover:text-foreground',
                pathname === `/${locale}` && 'text-primary'
              )}
              onClick={() => handleNavigationClick(`/${locale}`)}
            >
              {tCommon('home')}
            </Link>

            <Link
              href={`/${locale}/shop`}
              className={cn(
                'px-4 py-2 text-sm font-bold transition-all rounded-md text-muted-foreground hover:text-foreground',
                pathname.includes('/shop') && 'text-primary'
              )}
              onClick={() => handleNavigationClick(`/${locale}/shop`)}
            >
              {tNavbar('shop')}
            </Link>

            <Link
              href={`/${locale}/contact`}
              className={cn(
                'px-4 py-2 text-sm font-bold transition-all rounded-md text-muted-foreground hover:text-foreground',
                pathname.includes('/contact') && 'text-primary'
              )}
              onClick={() => handleNavigationClick(`/${locale}/contact`)}
            >
              {tCommon('contact')}
            </Link>

            {isSignedIn && (
              <Link
                href={`/${locale}/orders`}
                className={cn(
                  'px-4 py-2 text-sm font-bold transition-all rounded-md text-muted-foreground hover:text-foreground',
                  pathname.includes('/orders') && 'text-primary'
                )}
                onClick={() => handleNavigationClick(`/${locale}/orders`)}
              >
                {tNavbar('orders')}
              </Link>
            )}

            {isSignedIn && userRole === 'ADMIN' && (
              <Link
                href={`/${locale}/admin`}
                className="bg-secondary/10 text-secondary px-4 py-2 rounded-md text-sm font-bold hover:bg-secondary/20 transition-all ml-4"
                onClick={() => handleNavigationClick(`/${locale}/admin`)}
              >
                {tNavbar('dashboard')}
              </Link>
            )}

            <div className="flex items-center gap-1 border-l border-border ml-6 pl-6 h-6">
              {i18n.locales.map(loc => (
                <button
                  key={loc}
                  onClick={e => handleLanguageChange(loc, e)}
                  className={cn(
                    'w-8 h-8 text-[10px] font-black rounded-md transition-all uppercase',
                    locale === loc
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href={`/${locale}/cart`}
              className="text-foreground hover:bg-muted p-2 rounded-md transition-all"
              title={tNavbar('cart')}
              onClick={() => handleNavigationClick(`/${locale}/cart`)}
            >
              <ShoppingCart className="h-16 w-16" />
            </Link>

            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="vibe-button-primary h-10 px-6 text-sm"
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
                  {tCommon('signIn')}
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
