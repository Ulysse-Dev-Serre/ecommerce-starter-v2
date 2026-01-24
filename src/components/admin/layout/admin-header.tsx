'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Bell, Menu } from 'lucide-react';
import { i18n } from '@/lib/i18n/config';

export function AdminHeader() {
  const params = useParams();
  const locale = (params.locale as string) || i18n.defaultLocale;
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(
          `../../../lib/i18n/dictionaries/${locale}.json`
        );
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        const msgs = await import(`../../../lib/i18n/dictionaries/en.json`);
        setMessages(msgs.default);
      }
    };
    void loadMessages();
  }, [locale]);

  const t = messages?.admin?.header;

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

          <h2 className="admin-header-welcome">
            {t?.welcome || 'Welcome back'}
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="admin-header-btn" title={t?.notifications}>
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
