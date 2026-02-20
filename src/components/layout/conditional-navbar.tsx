'use client';

import React from 'react';

import { usePathname } from 'next/navigation';

import { Navbar } from './navbar';

interface ConditionalNavbarProps {
  locale: string;
  userRole?: string;
}

export function ConditionalNavbar({
  locale,
  userRole,
}: ConditionalNavbarProps): React.JSX.Element | null {
  const pathname = usePathname();

  // On cache la Navbar si on est dans l'admin
  if (pathname?.includes('/admin')) {
    return null;
  }

  return <Navbar locale={locale} userRole={userRole} />;
}
