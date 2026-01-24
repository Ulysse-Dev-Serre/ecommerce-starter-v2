import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  Package,
  Truck,
  User,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { prisma } from '@/lib/db/prisma';
import { StatusBadge } from '@/components/admin/orders/status-badge';
import { formatPrice, type SupportedCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { StatusActions } from '@/components/admin/orders/status-actions';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders.detail',
  });
  const tOrders = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders',
  });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: true,
        },
      },
      user: true,
      payments: true,
      shipments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddr = order.shippingAddress as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/orders`}
            className="admin-btn-secondary p-2 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="admin-page-title">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="admin-page-subtitle">
              {t('placedOn', {
                date: formatDate(order.createdAt, locale, {
                  dateStyle: 'long',
                  timeStyle: 'short',
                }),
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusActions
            orderId={order.id}
            orderNumber={order.orderNumber}
            customerName={`${order.user?.firstName} ${order.user?.lastName}`}
            totalAmount={order.totalAmount.toString()}
            currency={order.currency}
            currentStatus={order.status}
            onStatusChange={() => {}} // This is a server component, so we don't need a real callback here, just for TS
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                {t('orderItems')}
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items.map(item => {
                const snapshot = item.productSnapshot as any;
                const productName =
                  snapshot?.name?.[locale] ||
                  snapshot?.name?.en ||
                  'Unnamed product';

                return (
                  <div key={item.id} className="px-6 py-4 flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                      {snapshot?.image && (
                        <img
                          src={snapshot.image}
                          alt={productName}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="font-medium text-gray-900">{productName}</p>
                      <p className="text-sm text-gray-500">
                        SKU: {item.variant?.sku || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {item.quantity} ×{' '}
                        {formatPrice(
                          item.unitPrice,
                          order.currency as SupportedCurrency,
                          locale
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatPrice(
                          item.totalPrice,
                          order.currency as SupportedCurrency,
                          locale
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col gap-2 max-w-xs ml-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('summary.subtotal')}</span>
                  <span className="text-gray-900">
                    {formatPrice(
                      order.subtotalAmount,
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('summary.tax')}</span>
                  <span className="text-gray-900">
                    {formatPrice(
                      order.taxAmount,
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('summary.shipping')}</span>
                  <span className="text-gray-900">
                    {formatPrice(
                      order.shippingAmount,
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </span>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t('summary.discount')}</span>
                    <span>
                      -
                      {formatPrice(
                        order.discountAmount,
                        order.currency as SupportedCurrency,
                        locale
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-1">
                  <span>{t('summary.total')}</span>
                  <span>
                    {formatPrice(
                      order.totalAmount,
                      order.currency as SupportedCurrency,
                      locale
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="admin-card p-0 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                {t('paymentInfo')}
              </h3>
            </div>
            <div className="p-6">
              {order.payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payment data found</p>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {order.payments.map((p, idx) => (
                    <div
                      key={p.id}
                      className={
                        idx > 0
                          ? 'pt-6 border-t border-gray-100 md:border-t-0 md:pt-0'
                          : ''
                      }
                    >
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-gray-500">{t('payment.method')}</dt>
                        <dd className="font-medium text-gray-900">
                          {p.method}
                        </dd>

                        <dt className="text-gray-500">{t('payment.status')}</dt>
                        <dd>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </dd>

                        <dt className="text-gray-500">{t('payment.amount')}</dt>
                        <dd className="text-gray-900">
                          {formatPrice(
                            p.amount,
                            p.currency as SupportedCurrency,
                            locale
                          )}
                        </dd>

                        <dt className="text-gray-500">
                          {t('payment.transactionId')}
                        </dt>
                        <dd className="text-gray-900 break-all font-mono text-[10px]">
                          {p.externalId}
                        </dd>

                        <dt className="text-gray-500">
                          {t('payment.processedAt')}
                        </dt>
                        <dd className="text-gray-900">
                          {formatDate(p.createdAt, locale)}
                        </dd>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="admin-card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-gray-500" />
              {tOrders('table.customer')}
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                {order.user?.firstName?.[0] ||
                  order.user?.email?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {order.user?.firstName} {order.user?.lastName}
                </p>
                <Link
                  href={`/${locale}/admin/customers/${order.user?.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {tOrders('table.viewDetails') || 'Voir le profil'}
                </Link>
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                {order.user?.email}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="admin-card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-gray-500" />
              {t('shippingAddress')}
            </h3>
            {shippingAddr ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">
                  {shippingAddr.name ||
                    order.user?.firstName + ' ' + order.user?.lastName}
                </p>
                <p>{shippingAddr.line1 || shippingAddr.street1}</p>
                {(shippingAddr.line2 || shippingAddr.street2) && (
                  <p>{shippingAddr.line2 || shippingAddr.street2}</p>
                )}
                <p>
                  {shippingAddr.city}
                  {shippingAddr.state ? `, ${shippingAddr.state}` : ''}{' '}
                  {shippingAddr.postal_code || shippingAddr.zip}
                </p>
                <p className="uppercase">{shippingAddr.country}</p>
                {shippingAddr.phone && (
                  <p className="mt-2 pt-2 border-t border-gray-100">
                    📞 {shippingAddr.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No shipping address provided
              </p>
            )}
          </div>

          {/* History / Timeline */}
          <div className="admin-card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-gray-500" />
              {t('history')}
            </h3>
            <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
              {order.statusHistory.map((h, idx) => (
                <div key={h.id} className="relative pl-8">
                  <div
                    className={`absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-primary' : 'bg-gray-300'}`}
                  />
                  <div>
                    <span className="text-xs font-bold uppercase text-gray-500 block">
                      {h.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(h.createdAt, locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    {h.comment && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {h.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
