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
  BarChart3,
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
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h1 className="admin-sidebar-logo-text">Admin Panel</h1>
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
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="admin-sidebar-logo">
        <h1 className="admin-sidebar-logo-text">{t.adminPanel}</h1>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-nav">
        {menuItems.map(item => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <Link href={`/${locale}`} className="admin-sidebar-nav-item">
          <Home className="h-5 w-5" />
          {t.backToSite || 'Back to site'}
        </Link>
        <div className="text-xs text-gray-500 mt-2">{t.version}</div>
      </div>
    </aside>
  );
}
