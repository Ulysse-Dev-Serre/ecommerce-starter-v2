'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { logger } from '../../lib/logger';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps): React.JSX.Element {
  const t = useTranslations('footer');
  const tShop = useTranslations('shop');
  const tCart = useTranslations('cart');
  const tNavbar = useTranslations('navbar');

  const year = new Date().getFullYear();
  const storeName = tNavbar('brand') || 'AgTechNest';

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
              {t('copyright', { year: year.toString(), storeName })}
            </p>
          </div>

          {/* Links Column 1: Shop */}
          <div>
            <h4 className="font-semibold mb-4">{tShop('title')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/shop`}
                  className="hover:text-primary transition-colors"
                >
                  {tShop('title')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/cart`}
                  className="hover:text-primary transition-colors"
                >
                  {tCart('title')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-primary transition-colors"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="hover:text-primary transition-colors"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/refund`}
                  className="hover:text-primary transition-colors"
                >
                  {t('refund')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
