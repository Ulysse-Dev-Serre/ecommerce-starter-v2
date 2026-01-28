'use client';

import { VIBE_HOVER_GROUP } from '@/lib/vibe-styles';

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

import { logger } from '../../lib/logger';
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
    <header className="vibe-nav-header">
      <div className="vibe-layout-container">
        <div className="vibe-flex-between-items-center vibe-h-20">
          <div className="vibe-flex-items-center">
            <Link
              href={`/${locale}`}
              onClick={() => handleNavigationClick(`/${locale}`)}
              className={VIBE_HOVER_GROUP}
            >
              <h1 className="vibe-logo-text">{siteConfig.name}</h1>
            </Link>
          </div>

          <nav className="vibe-nav-main">
            <Link
              href={`/${locale}`}
              className={cn(
                'vibe-nav-link',
                pathname === `/${locale}` && 'vibe-nav-link-active'
              )}
              onClick={() => handleNavigationClick(`/${locale}`)}
            >
              {tCommon('home')}
            </Link>

            <Link
              href={`/${locale}/shop`}
              className={cn(
                'vibe-nav-link',
                pathname.includes('/shop') && 'vibe-nav-link-active'
              )}
              onClick={() => handleNavigationClick(`/${locale}/shop`)}
            >
              {tNavbar('shop')}
            </Link>

            <Link
              href={`/${locale}/contact`}
              className={cn(
                'vibe-nav-link',
                pathname.includes('/contact') && 'vibe-nav-link-active'
              )}
              onClick={() => handleNavigationClick(`/${locale}/contact`)}
            >
              {tCommon('contact')}
            </Link>

            {isSignedIn && (
              <Link
                href={`/${locale}/orders`}
                className={cn(
                  'vibe-nav-link',
                  pathname.includes('/orders') && 'vibe-nav-link-active'
                )}
                onClick={() => handleNavigationClick(`/${locale}/orders`)}
              >
                {tNavbar('orders')}
              </Link>
            )}

            {isSignedIn && userRole === 'ADMIN' && (
              <Link
                href={`/${locale}/admin`}
                className="vibe-nav-admin-link"
                onClick={() => handleNavigationClick(`/${locale}/admin`)}
              >
                📊 {tNavbar('dashboard')}
              </Link>
            )}

            <div className="vibe-nav-lang-divider">
              {i18n.locales.map(loc => (
                <button
                  key={loc}
                  onClick={e => handleLanguageChange(loc, e)}
                  className={cn(
                    'vibe-nav-lang-btn',
                    locale === loc
                      ? 'vibe-nav-lang-btn-active'
                      : 'vibe-nav-lang-btn-inactive'
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </nav>

          <div className="vibe-nav-spacing">
            <Link
              href={`/${locale}/cart`}
              className="vibe-nav-icon-btn"
              title={tNavbar('cart')}
              onClick={() => handleNavigationClick(`/${locale}/cart`)}
            >
              <ShoppingCart className="vibe-icon-md" />
            </Link>

            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="vibe-button-auth"
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
