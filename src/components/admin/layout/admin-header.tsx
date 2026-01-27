'use client';

import { UserButton } from '@clerk/nextjs';
import { Bell, Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function AdminHeader() {
  const t = useTranslations('admin.header');

  return (
    <header className="admin-header">
      <div className="admin-header-content">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            className="admin-header-btn lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h2 className="admin-header-welcome">{t('welcome')}</h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="admin-header-btn" title={t('notifications')}>
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* User menu */}
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9 border-2 border-white',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
