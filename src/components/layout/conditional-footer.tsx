'use client';

import { usePathname } from 'next/navigation';

import { Footer } from './footer';

interface ConditionalFooterProps {
  locale?: string;
}

export function ConditionalFooter({
  locale,
}: ConditionalFooterProps): React.JSX.Element | null {
  const pathname = usePathname();

  if (pathname?.includes('/admin')) {
    return null;
  }

  return <Footer locale={locale || 'en'} />;
}
