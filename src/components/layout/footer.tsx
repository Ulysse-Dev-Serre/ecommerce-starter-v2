'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import { logger } from '../../lib/logger';

interface FooterProps {
  locale?: string;
}

export function Footer({ locale = 'fr' }: FooterProps): React.JSX.Element {
  const [messages, setMessages] = useState<any | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(`../../lib/i18n/dictionaries/${locale}.json`);
        setMessages(msgs.default);
      } catch (error) {
        logger.error(
          { error, locale, component: 'footer' },
          'Failed to load footer translations'
        );
        // Fallback
        const msgs = await import(`../../lib/i18n/dictionaries/fr.json`);
        setMessages(msgs.default);
      }
    };
    void loadMessages();
  }, [locale]);

  const year = new Date().getFullYear();
  const storeName = messages?.navbar?.brand || 'AgTechNest';

  if (!messages) {
    return (
      <footer className="bg-background border-t border-border theme-border mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          Loading...
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-background border-t border-border theme-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Copyright */}
          <div>
            <h3 className="text-lg font-bold mb-4 theme-primary">
              {storeName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {messages.footer.copyright
                .replace('{year}', year.toString())
                .replace('{storeName}', storeName)}
            </p>
          </div>

          {/* Links Column 1: Shop */}
          <div>
            <h4 className="font-semibold mb-4">{messages.shop.title}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/shop`}
                  className="hover:text-primary transition-colors"
                >
                  {messages.shop.title}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/cart`}
                  className="hover:text-primary transition-colors"
                >
                  {messages.cart.title}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Legal */}
          <div>
            <h4 className="font-semibold mb-4">{messages.footer.legal}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-primary transition-colors"
                >
                  {messages.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="hover:text-primary transition-colors"
                >
                  {messages.footer.terms}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/refund`}
                  className="hover:text-primary transition-colors"
                >
                  {messages.footer.refund}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
