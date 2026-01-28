'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { logger } from '../../lib/logger';
import { siteConfig } from '@/lib/config/site';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps): React.JSX.Element {
  const t = useTranslations('footer');
  const tShop = useTranslations('shop');
  const tCart = useTranslations('cart');
  const tNavbar = useTranslations('navbar');

  const year = new Date().getFullYear();
  const storeName = siteConfig.name;

  return (
    <footer className="vibe-footer">
      <div className="vibe-layout-container vibe-section-py">
        <div className="vibe-footer-grid">
          {/* Brand & Copyright */}
          <div>
            <h3 className="vibe-footer-title">{storeName}</h3>
            <p className="vibe-text-xs vibe-text-muted">
              {t('copyright', { year: year.toString(), storeName })}
            </p>
          </div>

          {/* Links Column 1: Shop */}
          <div>
            <h4 className="vibe-footer-subtitle">{tShop('title')}</h4>
            <ul className="vibe-list-stack-sm vibe-text-xs vibe-text-muted">
              <li>
                <Link href={`/${locale}/shop`} className="vibe-footer-link">
                  {tShop('title')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/cart`} className="vibe-footer-link">
                  {tCart('title')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Legal */}
          <div>
            <h4 className="vibe-footer-subtitle">{t('legal')}</h4>
            <ul className="vibe-list-stack-sm vibe-text-xs vibe-text-muted">
              <li>
                <Link href={`/${locale}/privacy`} className="vibe-footer-link">
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="vibe-footer-link">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/refund`} className="vibe-footer-link">
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
