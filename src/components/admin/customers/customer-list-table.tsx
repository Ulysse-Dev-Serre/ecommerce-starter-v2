import { Search } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { formatDate } from '@/lib/utils/date';

import { User } from '@/generated/prisma';

interface CustomerListTableProps {
  customers: User[];
  query?: string;
  locale: string;
  tSearchPlaceholder: string;
}

export async function CustomerListTable({
  customers,
  query,
  locale,
  tSearchPlaceholder,
}: CustomerListTableProps) {
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.customers',
  });

  return (
    <div className="admin-card p-0 overflow-hidden">
      <div className="border-b border-gray-200 p-4">
        <form className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={tSearchPlaceholder}
            className="admin-input pl-10"
          />
        </form>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead className="admin-table-thead">
            <tr>
              <th className="admin-table-th">{t('table.client')}</th>
              <th className="admin-table-th">{t('table.email')}</th>
              <th className="admin-table-th">{t('table.registrationDate')}</th>
              <th className="admin-table-th text-right">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center admin-text-subtle"
                >
                  {t('table.noCustomers')}
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="admin-table-tr">
                  <td className="admin-table-td">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {customer.firstName?.[0] ||
                          customer.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="admin-table-td admin-text-subtle">
                    {customer.email}
                  </td>
                  <td className="admin-table-td admin-text-subtle">
                    {formatDate(customer.createdAt, locale)}
                  </td>
                  <td className="admin-table-td text-right">
                    <Link
                      href={`/${locale}/admin/customers/${customer.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {t('table.viewDetails')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
