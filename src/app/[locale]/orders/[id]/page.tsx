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
      unitPrice: 'Prix',
      total: 'Total',
      subtotal: 'Sous-total',
      shipping: 'Livraison',
      tax: 'Taxes',
      orderTotal: 'Total Payé',
      shippingAddress: 'Adresse de livraison',
      billingAddress: 'Adresse de facturation',
      payment: 'Paiement',
      tracking: 'Suivi de commande',
      trackPackage: 'Suivre le colis',
    },
    en: {
      backToOrders: '← Back to orders',
      orderNumber: 'Order',
      status: 'Status',
      date: 'Date',
      items: 'Items',
      quantity: 'Qty',
      unitPrice: 'Price',
      total: 'Total',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      orderTotal: 'Total Paid',
      shippingAddress: 'Shipping address',
      billingAddress: 'Billing address',
      payment: 'Payment',
      tracking: 'Order Tracking',
      trackPackage: 'Track package',
    },
  }[locale] || {
    backToOrders: '← Back to orders',
    orderNumber: 'Order',
    status: 'Status',
    date: 'Date',
    items: 'Items',
    quantity: 'Qty',
    unitPrice: 'Price',
    total: 'Total',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    tax: 'Tax',
    orderTotal: 'Total Paid',
    shippingAddress: 'Shipping address',
    billingAddress: 'Billing address',
    payment: 'Payment',
    tracking: 'Order Tracking',
    trackPackage: 'Track package',
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // --- LOGIQUE RÉCUPÉRATION IMAGE PRODUIT ---
  // On récupère les images des produits en fonction de leur ID (productId)
  // C'est la méthode "simple" qui évite de toucher au order.service.ts
  const productIds = order.items
    .map(item => item.productId)
    .filter((id): id is string => !!id);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      media: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const productData = products.reduce(
    (acc, product) => {
      acc[product.id] = {
        image: product.media[0]?.url,
        slug: product.slug,
      };
      return acc;
    },
    {} as Record<string, { image?: string; slug: string }>
  );
  // ------------------------------------------

  const shippingAddr = order.shippingAddress as Record<string, string> | null;
  const billingAddr = order.billingAddress as Record<string, string> | null;

  // Helper pour formater l'adresse proprement
  const formatAddress = (addr: Record<string, string> | null) => {
    if (!addr) return null;
    return (
      <div className="text-sm text-gray-600 leading-relaxed">
        <p className="font-semibold text-gray-900 mb-1">{addr.name}</p>
        <p>{addr.street1 || addr.line1}</p>
        {addr.street2 || addr.line2 ? (
          <p>{addr.street2 || addr.line2}</p>
        ) : null}
        <p>
          {addr.city}, {addr.state}{' '}
          {addr.postalCode || addr.postal_code || addr.zip}
        </p>
        <p>{addr.country}</p>
        {addr.phone && (
          <p className="text-xs mt-2 text-gray-500 flex items-center gap-1">
            <span className="opacity-70">Tel:</span> {addr.phone}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 py-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec Navigation et Statut */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <Link
              href={`/${locale}/orders`}
              className="text-sm text-gray-500 hover:text-gray-900 hover:underline mb-2 inline-flex items-center gap-1 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t.backToOrders}
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
              {t.orderNumber} #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t.date}:{' '}
              {new Date(order.createdAt).toLocaleDateString(
                locale === 'fr' ? 'fr-CA' : 'en-CA',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm border ${getStatusColor(order.status)}`}
          >
            {statusLabels[locale]?.[order.status] || order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNE GAUCHE (2/3) : Tracking & Produits */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Module de Tracking Highlight (si dispo) */}
            {order.shipments && order.shipments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden ring-1 ring-blue-50">
                <div className="bg-blue-50/50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                  <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    {t.tracking}
                  </h2>
                </div>
                <div className="p-6 divide-y divide-gray-100">
                  {order.shipments.map(shipment => (
                    <div
                      key={shipment.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {shipment.carrier || 'Transporteur'}
                        </p>
                        <p className="font-mono text-lg text-gray-900 tracking-wide select-all flex items-center gap-2">
                          {shipment.trackingCode}
                        </p>
                      </div>
                      {shipment.trackingCode && (
                        <a
                          href={`https://parcelsapp.com/fr/tracking/${shipment.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-4 py-2 border border-blue-600 text-sm font-semibold rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors shadow-sm"
                        >
                          {t.trackPackage}
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Liste des Produits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">{t.items}</h2>
                <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                  {order.items.length}
                </span>
              </div>
              <ul className="divide-y divide-gray-100">
                {order.items.map(item => {
                  const snapshot = item.productSnapshot as Record<string, any>;
                  const currentProduct = item.productId
                    ? productData[item.productId]
                    : null;

                  const slug = currentProduct?.slug || snapshot?.slug;
                  const imageUrl = currentProduct?.image || snapshot?.image;
                  const hasLink = !!slug;

                  return (
                    <li
                      key={item.id}
                      className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 hover:bg-gray-50/50 transition-all duration-200"
                    >
                      {/* Image Thumbnail (Cliquable) */}
                      <div className="w-20 h-20 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group">
                        {imageUrl ? (
                          hasLink ? (
                            <Link
                              href={`/${locale}/product/${slug}`}
                              className="block w-full h-full relative"
                              title="Voir le produit"
                            >
                              <img
                                src={imageUrl}
                                alt={snapshot.name}
                                className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
                              />
                              {/* Overlay subtil au survol pour indiquer l'action */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center"></div>
                            </Link>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={snapshot.name}
                              className="w-full h-full object-contain object-center"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 text-center sm:text-left space-y-1">
                        <h3 className="text-base font-bold text-gray-900 leading-tight flex items-center gap-2 justify-center sm:justify-start">
                          {hasLink ? (
                            <Link
                              href={`/${locale}/product/${slug}`}
                              className="hover:text-primary hover:underline decoration-2 underline-offset-2 flex items-center gap-2 group/link"
                            >
                              {snapshot?.name || 'Produit'}
                              {/* Icône oeil au survol */}
                              <svg
                                className="w-4 h-4 text-gray-400 group-hover/link:text-primary transition-colors opacity-0 group-hover/link:opacity-100"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                          ) : (
                            snapshot?.name || 'Produit'
                          )}
                        </h3>
                        {/* Description snippet if we wanted, but keeping clean for now */}

                        <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            Qté: {item.quantity}
                          </span>
                          <span className="text-gray-300">|</span>
                          <span>
                            {item.unitPrice.toString()} {item.currency} / u
                          </span>
                        </div>
                      </div>

                      {/* Price Total */}
                      <div className="text-right">
                        <span className="block font-bold text-gray-900 text-lg">
                          {item.totalPrice.toString()} {item.currency}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* COLONNE DROITE (1/3) : Résumé & Adresses */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
              <h2 className="font-semibold text-lg mb-6 text-gray-900 border-b border-gray-100 pb-2 flex justify-between">
                {t.orderTotal}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t.subtotal}</span>
                  <span className="font-medium text-gray-900">
                    {order.subtotalAmount.toString()} {order.currency}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.shipping}</span>
                  <span className="font-medium text-gray-900">
                    {Number(order.shippingAmount) > 0
                      ? `${order.shippingAmount.toString()} ${order.currency}`
                      : "Calculé à l'étape suiv."}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.tax}</span>
                  <span className="font-medium text-gray-900">
                    {order.taxAmount.toString()} {order.currency}
                  </span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-900 text-lg">
                      {t.total}
                    </span>
                    <span className="font-extrabold text-gray-900 text-xl tracking-tight">
                      {order.totalAmount.toString()} {order.currency}
                    </span>
                  </div>
                  <p className="text-xs text-right text-gray-400">
                    Taxes incluses
                  </p>
                </div>
              </div>
            </div>

            {/* Addresses Blocks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Shipping Address */}
              <div className="p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {t.shippingAddress}
                </h3>
                {shippingAddr && Object.keys(shippingAddr).length > 0 ? (
                  formatAddress(shippingAddr)
                ) : (
                  <p className="text-gray-400 italic text-sm">Non spécifiée</p>
                )}
              </div>

              {/* Billing Address (if different or present) */}
              {billingAddr && Object.keys(billingAddr).length > 0 && (
                <div className="p-5 border-t border-gray-100 bg-gray-50/30">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    {t.billingAddress}
                  </h3>
                  {formatAddress(billingAddr)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
