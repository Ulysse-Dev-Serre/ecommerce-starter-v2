'use client';

import { usePathname } from 'next/navigation';

import { Footer } from './footer';

export function ConditionalFooter(): React.JSX.Element | null {
  const pathname = usePathname();

  if (pathname?.includes('/admin')) {
    return null;
  }

  return <Footer />;
}
