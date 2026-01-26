import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MapPin,
  ShoppingBag,
  DollarSign,
  Package,
  ExternalLink,
  Target,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { prisma } from '@/lib/db/prisma';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/admin/orders/status-badge';
import { env } from '@/lib/env';
import { SITE_CURRENCY } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface CustomerDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { locale, id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          shipments: {
            select: {
              trackingCode: true,
              carrier: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const totalSpent = customer.orders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );
  // Note: Since orders could theoretically be in different currencies (even if env is fixed)
  // we use a safe currency for display in the stats, or just use 'CAD' as fallback.
  // Given the user's strategy, it's consistent with their CURRENT_CURRENCY.
  const displayCurrency = (env.NEXT_PUBLIC_CURRENCY as any) || SITE_CURRENCY;

  const totalOrders = customer.orders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/customers`}
            className="admin-btn-secondary p-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="admin-page-title">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="admin-page-subtitle">ID Client: {customer.id}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="admin-card">
              <div className="flex items-center gap-4 text-primary">
                <div className="rounded-lg bg-primary/10 p-2">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total dépensé
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalSpent, displayCurrency, locale)}
                  </p>
                </div>
              </div>
            </div>
            <div className="admin-card">
              <div className="flex items-center gap-4 text-blue-600">
                <div className="rounded-lg bg-blue-50 p-2">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Commandes totales
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalOrders}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                Historique des commandes
              </h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead className="admin-table-thead">
                  <tr>
                    <th className="admin-table-th">N° Commande</th>
                    <th className="admin-table-th">Date</th>
                    <th className="admin-table-th">Montant</th>
                    <th className="admin-table-th">Statut</th>
                    <th className="admin-table-th text-right">Suivi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customer.orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-500 italic"
                      >
                        Aucune commande passée
                      </td>
                    </tr>
                  ) : (
                    customer.orders.map(order => (
                      <tr key={order.id} className="admin-table-tr">
                        <td className="px-6 py-4 font-medium text-primary">
                          <Link
                            href={`/${locale}/admin/orders/${order.id}`}
                            className="hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(order.createdAt, locale)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatPrice(
                            Number(order.totalAmount),
                            order.currency as any,
                            locale
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} locale={locale} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.shipments?.[0]?.trackingCode ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-semibold text-gray-500 uppercase">
                                {order.shipments[0].carrier}
                              </span>
                              <span className="text-xs text-primary flex items-center gap-1">
                                {order.shipments[0].trackingCode}
                                <ExternalLink className="h-3 w-3" />
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Addresses */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                Adresses enregistrées
              </h3>
            </div>
            <div className="p-6 grid gap-6 sm:grid-cols-2">
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-gray-500 italic col-span-2">
                  Aucune adresse enregistrée
                </p>
              ) : (
                customer.addresses.map(addr => (
                  <div
                    key={addr.id}
                    className="rounded-lg border border-gray-100 p-4 bg-gray-50/50"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {addr.firstName} {addr.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{addr.street}</p>
                        {addr.street2 && (
                          <p className="text-sm text-gray-600">
                            {addr.street2}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {addr.city}, {addr.state} {addr.zipCode}
                        </p>
                        <p className="text-sm text-gray-600">{addr.country}</p>
                        {addr.phone && (
                          <p className="mt-2 text-xs text-gray-500">
                            📞 {addr.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="admin-card">
            <h3 className="font-semibold text-gray-900 mb-4">
              Informations de contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Inscrit le {formatDate(customer.createdAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Attribution Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-gray-900">
                Source d&apos;acquisition
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-500 text-xs uppercase font-medium">
                  Source
                </span>
                <span className="font-medium text-gray-900">
                  {customer.utmSource || 'Direct / Inconnue'}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-500 text-xs uppercase font-medium">
                  Medium
                </span>
                <span className="font-medium text-gray-900">
                  {customer.utmMedium || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-gray-50">
                <span className="text-gray-500 text-xs uppercase font-medium">
                  Campagne
                </span>
                <span className="font-medium text-gray-900">
                  {customer.utmCampaign || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="admin-card">
            <h3 className="font-semibold text-gray-900 mb-2 italic">
              Note Interne
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Utilisez cette section pour garder des notes sur les préférences
              du client ou les interactions passées.
            </p>
            <textarea
              className="mt-3 admin-input min-h-[100px]"
              placeholder="Ajouter une note..."
            ></textarea>
            <button className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
              Enregistrer la note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
