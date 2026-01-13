import Link from 'next/link';
import { ArrowLeft, Package, CreditCard, User, MapPin } from 'lucide-react';

import { StatusBadge } from '@/components/admin/orders/status-badge';
import { OrderDetailClient } from '@/components/admin/orders/order-detail-client';
import { ShippingManagement } from '@/components/admin/orders/shipping-management';
import { getOrderByIdAdmin } from '@/lib/services/order.service';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { locale, id } = await params;

  const order = await getOrderByIdAdmin(id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/admin/orders`}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Order {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order items */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Package className="h-5 w-5" />
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map(item => {
                const translation = item.product?.translations?.[0];
                const image = item.product?.media?.[0]?.url;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    {image && (
                      <img
                        src={image}
                        alt={translation?.name || item.variant?.sku || ''}
                        className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {translation?.name || 'Product'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        SKU: {item.variant?.sku || 'N/A'}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {item.totalPrice.toString()} {item.currency}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.unitPrice.toString()} each
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {order.subtotalAmount.toString()} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">
                    {order.taxAmount.toString()} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {order.shippingAmount.toString()} {order.currency}
                  </span>
                </div>
                {parseFloat(order.discountAmount.toString()) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>
                      -{order.discountAmount.toString()} {order.currency}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>
                    {order.totalAmount.toString()} {order.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h2>
            {order.payments.length > 0 ? (
              <div className="space-y-3">
                {order.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Method</p>
                        <p className="font-medium">{payment.method}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-medium">{payment.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Amount</p>
                        <p className="font-medium">
                          {payment.amount.toString()} {payment.currency}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Transaction ID</p>
                        <p className="font-mono text-xs">
                          {payment.externalId || 'N/A'}
                        </p>
                      </div>
                      {payment.processedAt && (
                        <div className="col-span-2">
                          <p className="text-gray-600">Processed At</p>
                          <p className="font-medium">
                            {new Date(payment.processedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No payment information available</p>
            )}
          </div>

          {/* Shipping Management */}
          {(() => {
            const payment = order.payments.find(
              p => p.method === 'STRIPE' && p.status === 'COMPLETED'
            );
            const metadata = payment?.transactionData
              ? (payment.transactionData as any).metadata
              : null;

            return (
              <ShippingManagement
                orderId={order.id}
                shipment={order.shipments[0]}
                shippingRateId={metadata?.shipping_rate_id}
                shippingCost={metadata?.shipping_cost}
                currency={order.currency}
                debugMetadata={metadata}
              />
            );
          })()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5" />
              Customer
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">Name</p>
                <p className="font-medium">
                  {order.user.firstName && order.user.lastName
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{order.user.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Customer ID</p>
                <p className="font-mono text-xs">{order.user.id}</p>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </h2>
            <div className="text-sm">
              {(() => {
                const addr = order.shippingAddress as Record<
                  string,
                  string
                > | null;
                if (!addr)
                  return (
                    <p className="text-gray-500 italic">
                      No shipping address provided
                    </p>
                  );

                // Helper phone
                const formatPhone = (phone: string) => {
                  if (!phone) return '';
                  const cleaned = phone.replace(/\D/g, '');
                  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
                  if (match) return `+1 (${match[2]}) ${match[3]}-${match[4]}`;
                  return phone;
                };

                return (
                  <div className="flex flex-col gap-4">
                    {/* CONTENU ADRESSE */}
                    <div className="text-gray-900 space-y-1">
                      <p className="font-semibold capitalize text-base border-b border-gray-100 pb-2 mb-2">
                        {addr.name}
                      </p>

                      <div className="text-gray-600 leading-relaxed">
                        <p>{addr.street1 || addr.line1}</p>
                        {(addr.street2 || addr.line2) && (
                          <p className="text-gray-500">
                            Apt / Suite {addr.street2 || addr.line2}
                          </p>
                        )}
                        <p>
                          {addr.city}, {addr.state}{' '}
                          <span className="text-gray-400">|</span>{' '}
                          <span className="font-mono font-medium text-gray-800">
                            {addr.postalCode || addr.postal_code || addr.zip}
                          </span>
                        </p>
                        <p className="uppercase text-xs font-bold text-gray-400 mt-1 tracking-wider">
                          {addr.country}
                        </p>
                      </div>

                      {/* Contact séparé légèrement */}
                      {addr.phone && (
                        <p className="pt-3 text-gray-900 font-medium flex items-center gap-2">
                          <span className="text-xs text-gray-400 uppercase tracking-widest">
                            Tel
                          </span>
                          {formatPhone(addr.phone)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Status actions */}
          <OrderDetailClient orderId={order.id} currentStatus={order.status} />

          {/* Status history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Status History</h2>
              <div className="space-y-3">
                {order.statusHistory.map((history, index) => (
                  <div
                    key={history.id}
                    className={`border-l-2 pl-4 ${
                      index === 0 ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      <StatusBadge status={history.status as any} />
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {new Date(history.createdAt).toLocaleString()}
                    </p>
                    {history.comment && (
                      <p className="mt-1 text-sm text-gray-600">
                        {history.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
