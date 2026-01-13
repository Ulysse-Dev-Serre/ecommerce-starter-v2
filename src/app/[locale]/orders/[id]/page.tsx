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
      apartment: 'App. / Bureau',
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
      apartment: 'Apt / Suite',
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
    apartment: 'Apt / Suite',
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

  // Helper pour formater l'adresse avec un design épuré (Style Apple/Stripe)
  const formatAddress = (
    addr: Record<string, string> | null,
    title: string
  ) => {
    if (!addr) return null;

    // Helper phone
    const formatPhone = (phone: string) => {
      if (!phone) return '';
      const cleaned = phone.replace(/\D/g, '');
      const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
      if (match) return `+1 (${match[2]}) ${match[3]}-${match[4]}`;
      return phone;
    };

    return (
      <div className="flex flex-col gap-4 text-sm">
        {/* TITRE SECTION */}
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
          {title}
        </h3>

        {/* CONTENU ADRESSE */}
        <div className="text-gray-900 space-y-1">
          <p className="font-semibold capitalize text-base">
            {addr.name.toLowerCase()}
          </p>

          <div className="text-gray-600 leading-relaxed">
            <p>{addr.street1 || addr.line1}</p>
            {(addr.street2 || addr.line2) && (
              <p className="text-gray-500">
                {t.apartment} {addr.street2 || addr.line2}
              </p>
            )}
            <p>
              {addr.city}, {addr.state} <span className="text-gray-400">|</span>{' '}
              {addr.postalCode || addr.postal_code || addr.zip}
            </p>
            <p className="uppercase text-xs font-bold text-gray-400 mt-1 tracking-wider">
              {addr.country}
            </p>
          </div>

          {/* Contact séparé légèrement */}
          {addr.phone && (
            <p className="pt-3 text-gray-900 font-medium">
              {formatPhone(addr.phone)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 py-10 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec Navigation et Statut */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <Link
              href={`/${locale}/orders`}
              className="text-sm text-gray-500 hover:text-gray-900 hover:underline mb-4 inline-flex items-center gap-1 transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {locale === 'fr' ? 'Détails de la commande' : 'Order Details'}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              <span>
                {t.orderNumber} #{order.orderNumber}
              </span>
              <span className="text-gray-300">|</span>
              <span>
                {t.date}:{' '}
                {new Date(order.createdAt).toLocaleDateString(
                  locale === 'fr' ? 'fr-CA' : 'en-CA',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </span>
            </p>
          </div>
          {/* Status Badge supprimé d'ici car intégré dans le stepper ou redondant */}
        </div>

        {/* --- STEPPER DE PROGRESSION (Amazon Style) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="relative">
            {/* Ligne de fond grise */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>

            {/* Ligne de progression colorée (Calculée) */}
            <div
              className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
              style={{
                width:
                  order.status === 'DELIVERED'
                    ? '100%'
                    : order.status === 'SHIPPED'
                      ? '66%'
                      : order.status === 'PAID'
                        ? '33%'
                        : '0%',
              }}
            ></div>

            <div className="relative z-10 flex justify-between w-full">
              {/* Étape 1: Acheté (Paid) */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {locale === 'fr' ? 'Commandé' : 'Ordered'}
                </span>
              </div>

              {/* Étape 2: Expédié (Shipped) */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                >
                  {['SHIPPED', 'DELIVERED'].includes(order.status) ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">2</span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {locale === 'fr' ? 'Expédié' : 'Shipped'}
                </span>
              </div>

              {/* Étape 3: En route (Transit) - Visuel intermédiaire */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                >
                  {order.status === 'DELIVERED' ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : order.status === 'SHIPPED' ? (
                    <svg
                      className="w-5 h-5 animate-pulse"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">3</span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${['SHIPPED', 'DELIVERED'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {locale === 'fr' ? 'En route' : 'On the Way'}
                </span>
              </div>

              {/* Étape 4: Livré (Delivered) */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                  ${order.status === 'DELIVERED' ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}
                >
                  {order.status === 'DELIVERED' ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">4</span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${order.status === 'DELIVERED' ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {locale === 'fr' ? 'Livré' : 'Delivered'}
                </span>
              </div>
            </div>
          </div>
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
              <div className="p-6">
                {shippingAddr && Object.keys(shippingAddr).length > 0 ? (
                  formatAddress(shippingAddr, t.shippingAddress)
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Adresse de livraison non spécifiée
                  </p>
                )}
              </div>

              {/* Billing Address (if different or present) */}
              {billingAddr && Object.keys(billingAddr).length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50/10">
                  {formatAddress(billingAddr, t.billingAddress)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
