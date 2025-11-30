import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getOrderById } from '@/lib/services/order.service';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect(`/${locale}/sign-in`);
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  let order;
  try {
    order = await getOrderById(id, user.id);
  } catch {
    notFound();
  }

  const t = {
    fr: {
      backToOrders: '← Retour aux commandes',
      orderNumber: 'Commande',
      status: 'Statut',
      date: 'Date',
      items: 'Articles',
      quantity: 'Qté',
      unitPrice: 'Prix unitaire',
      total: 'Total',
      subtotal: 'Sous-total',
      shipping: 'Livraison',
      tax: 'Taxes',
      orderTotal: 'Total commande',
      shippingAddress: 'Adresse de livraison',
      billingAddress: 'Adresse de facturation',
      payment: 'Paiement',
    },
    en: {
      backToOrders: '← Back to orders',
      orderNumber: 'Order',
      status: 'Status',
      date: 'Date',
      items: 'Items',
      quantity: 'Qty',
      unitPrice: 'Unit price',
      total: 'Total',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      orderTotal: 'Order total',
      shippingAddress: 'Shipping address',
      billingAddress: 'Billing address',
      payment: 'Payment',
    },
  }[locale] || {
    backToOrders: '← Back to orders',
    orderNumber: 'Order',
    status: 'Status',
    date: 'Date',
    items: 'Items',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    orderTotal: 'Order total',
    shippingAddress: 'Shipping address',
    billingAddress: 'Billing address',
    payment: 'Payment',
  };

  const statusLabels: Record<string, Record<string, string>> = {
    fr: {
      PENDING: 'En attente',
      PAID: 'Payée',
      SHIPPED: 'Expédiée',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
      REFUNDED: 'Remboursée',
    },
    en: {
      PENDING: 'Pending',
      PAID: 'Paid',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const shippingAddr = order.shippingAddress as Record<string, string> | null;
  const billingAddr = order.billingAddress as Record<string, string> | null;

  return (
    <div className="flex-1 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/orders`}
          className="text-primary hover:underline mb-6 inline-block"
        >
          {t.backToOrders}
        </Link>

        <div className="bg-white border rounded-lg p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {t.orderNumber} #{order.orderNumber}
              </h1>
              <p className="text-gray-600">
                {t.date}:{' '}
                {new Date(order.createdAt).toLocaleDateString(
                  locale === 'fr' ? 'fr-CA' : 'en-CA'
                )}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}
            >
              {statusLabels[locale]?.[order.status] || order.status}
            </span>
          </div>

          <h2 className="font-semibold text-lg mb-4">{t.items}</h2>
          <div className="border rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3">Produit</th>
                  <th className="text-center px-4 py-3">{t.quantity}</th>
                  <th className="text-right px-4 py-3">{t.unitPrice}</th>
                  <th className="text-right px-4 py-3">{t.total}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => {
                  const snapshot = item.productSnapshot as Record<
                    string,
                    string
                  >;
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {snapshot?.name || 'Produit'}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {snapshot?.sku}
                        </p>
                      </td>
                      <td className="text-center px-4 py-3">{item.quantity}</td>
                      <td className="text-right px-4 py-3">
                        {item.unitPrice.toString()} {item.currency}
                      </td>
                      <td className="text-right px-4 py-3 font-medium">
                        {item.totalPrice.toString()} {item.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span>
                  {order.subtotalAmount.toString()} {order.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t.shipping}</span>
                <span>
                  {order.shippingAmount.toString()} {order.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t.tax}</span>
                <span>
                  {order.taxAmount.toString()} {order.currency}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t.orderTotal}</span>
                <span>
                  {order.totalAmount.toString()} {order.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {shippingAddr && Object.keys(shippingAddr).length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-3">
                {t.shippingAddress}
              </h2>
              <div className="text-gray-600">
                {shippingAddr.name && <p>{shippingAddr.name}</p>}
                {shippingAddr.line1 && <p>{shippingAddr.line1}</p>}
                {shippingAddr.line2 && <p>{shippingAddr.line2}</p>}
                <p>
                  {shippingAddr.city}, {shippingAddr.state}{' '}
                  {shippingAddr.postal_code}
                </p>
                {shippingAddr.country && <p>{shippingAddr.country}</p>}
              </div>
            </div>
          )}

          {billingAddr && Object.keys(billingAddr).length > 0 && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-3">{t.billingAddress}</h2>
              <div className="text-gray-600">
                {billingAddr.name && <p>{billingAddr.name}</p>}
                {billingAddr.line1 && <p>{billingAddr.line1}</p>}
                {billingAddr.line2 && <p>{billingAddr.line2}</p>}
                <p>
                  {billingAddr.city}, {billingAddr.state}{' '}
                  {billingAddr.postal_code}
                </p>
                {billingAddr.country && <p>{billingAddr.country}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
