'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  FileText,
  BarChart3,
  Tag,
  Home,
  Truck,
} from 'lucide-react';
import { i18n } from '@/lib/i18n/config';

export function AdminSidebar() {
  const pathname = usePathname();
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

  if (!messages) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-gray-200 px-6">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
        </div>
      </aside>
    );
  }

  const t = messages.admin.sidebar;

  const menuItems = [
    {
      title: t.dashboard,
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
    },
    {
      title: t.products,
      href: `/${locale}/admin/products`,
      icon: Package,
    },
    {
      title: t.orders,
      href: `/${locale}/admin/orders`,
      icon: ShoppingCart,
    },
    {
      title: t.customers,
      href: `/${locale}/admin/customers`,
      icon: Users,
    },
    {
      title: t.analytics,
      href: `/${locale}/admin/analytics`,
      icon: BarChart3,
    },
    {
      title: t.logistics,
      href: `/${locale}/admin/logistics`,
      icon: Truck,
    },
    {
      title: t.settings,
      href: `/${locale}/admin/settings`,
      icon: Settings,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-gray-900">{t.adminPanel}</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map(item => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Home className="h-5 w-5" />
            {t.backToSite || 'Back to site'}
          </Link>
          <div className="text-xs text-gray-500">{t.version}</div>
        </div>
      </div>
    </aside>
  );
}
