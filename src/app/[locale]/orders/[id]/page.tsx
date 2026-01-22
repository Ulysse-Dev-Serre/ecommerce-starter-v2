import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getOrderById } from '@/lib/services/order.service';
import { RefundRequestForm } from '@/components/orders/refund-request-form';
import { getTranslations, getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/ui/status-badge';

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

  // --- LOGIQUE RÉCUPÉRATION IMAGE PRODUIT ---
  const productIds = order.items
    .map((item: any) => item.productId)
    .filter((id: string | null): id is string => !!id);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        select: {
          language: true,
          name: true,
        },
      },
      media: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const productData = products.reduce(
    (acc, product) => {
      const translation =
        product.translations.find(t => t.language === locale.toUpperCase()) ||
        product.translations[0];
      acc[product.id] = {
        image: product.media[0]?.url,
        slug: product.slug,
        name: translation?.name,
      };
      return acc;
    },
    {} as Record<string, { image?: string; slug: string; name?: string }>
  );

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <OrderDetailContent
        order={order}
        locale={locale}
        productData={productData}
      />
    </NextIntlClientProvider>
  );
}

async function OrderDetailContent({
  order,
  locale,
  productData,
}: {
  order: any;
  locale: string;
  productData: Record<string, { image?: string; slug: string; name?: string }>;
}) {
  const t = await getTranslations({ locale, namespace: 'Orders.detail' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });
  const tRefund = await getTranslations({ locale, namespace: 'Orders.refund' });

  const statusLabels: Record<string, string> = {
    PENDING: t('statusPending'),
    PAID: t('statusPaid'),
    SHIPPED: t('statusShipped'),
    IN_TRANSIT: t('statusInTransit'),
    DELIVERED: t('statusDelivered'),
    CANCELLED: t('statusCancelled'),
    REFUNDED: t('statusRefunded'),
    REFUND_REQUESTED: t('statusRefundRequested'),
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const getItemName = (item: any) => {
    const snapshot = item.productSnapshot as any;
    const currentProduct = item.productId ? productData[item.productId] : null;

    // 1. Current name from DB (freshest)
    if (currentProduct?.name) return currentProduct.name;

    // 2. Snapshot (historical)
    if (snapshot?.name) {
      if (typeof snapshot.name === 'object') {
        return (
          snapshot.name[locale] ||
          snapshot.name.en ||
          Object.values(snapshot.name)[0]
        );
      }
      return snapshot.name;
    }

    return 'Product';
  };

  const currentStep = ['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].indexOf(
    order.status
  );

  const shippingAddr = order.shippingAddress as Record<string, any> | null;
  const billingAddr = order.billingAddress as Record<string, any> | null;

  return (
    <div className="min-h-screen bg-muted/30 pt-8 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* En-tête avec bouton retour */}
        <Link
          href={`/${locale}/orders`}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <span className="mr-2 group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          {t('backToOrders')}
        </Link>

        {/* Titre et ID de commande */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
              {t('orderNumber')} #{order.orderNumber}
            </h2>
            <p className="text-muted-foreground mt-1">
              {t('date')} : {formatDate(order.createdAt, locale)}
            </p>
          </div>
          <StatusBadge
            status={order.status}
            label={statusLabels[order.status]}
            className="px-4 py-2 font-bold"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLONNE GAUCHE (2/3) : Étapes & Articles */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Progress Stepper Visuel */}
            <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
              <div className="relative flex justify-between">
                {['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map(
                  (step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    const stepName = statusLabels[step];

                    return (
                      <div
                        key={step}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isCompleted
                              ? 'bg-foreground border-foreground text-background'
                              : 'bg-background border-border text-muted-foreground'
                          } ${isCurrent ? 'ring-4 ring-foreground/10' : ''}`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span
                          className={`text-xs font-bold mt-3 text-center transition-colors ${
                            isCompleted ? 'text-black' : 'text-gray-400'
                          }`}
                        >
                          {stepName}
                        </span>
                      </div>
                    );
                  }
                )}
                {/* Ligne de fond */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-0" />
                {/* Ligne de progression */}
                <div
                  className="absolute top-5 left-0 h-0.5 bg-foreground transition-all duration-1000 -z-0"
                  style={{
                    width: `${Math.max(0, (currentStep / 3) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Info Remboursement (si annulé ou remboursé) */}
            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
              <div className="bg-info/10 rounded-2xl p-8 border border-info/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-bold text-info mb-4 flex items-center gap-2">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingTitle')
                    : tRefund('refundDoneTitle')}
                </h3>
                <div className="text-info whitespace-pre-wrap leading-relaxed font-medium">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingMessage', {
                        name:
                          order.user?.firstName ||
                          (order.shippingAddress as any)?.name?.split(' ')[0] ||
                          'Client',
                        amount: formatPrice(
                          order.totalAmount,
                          order.currency as any,
                          locale
                        ),
                        orderNumber: order.orderNumber,
                      })
                    : tRefund('refundDoneMessage', {
                        amount: formatPrice(
                          order.totalAmount,
                          order.currency as any,
                          locale
                        ),
                      })}
                </div>
              </div>
            )}

            {/* 2. Tracking (si dispo) */}
            {order.shipments && order.shipments.length > 0 && (
              <div className="bg-background rounded-2xl shadow-sm border border-info/20 overflow-hidden ring-1 ring-info/20">
                <div className="bg-info/10 px-6 py-4 border-b border-info/20 flex justify-between items-center">
                  <h2 className="font-bold text-info flex items-center gap-2">
                    📦 {t('tracking')}
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {order.shipments.map((shipment: any) => (
                    <div
                      key={shipment.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                          {shipment.carrier || 'Standard Shipping'}
                        </p>
                        <p className="font-mono text-lg text-foreground tracking-wide select-all">
                          {shipment.trackingCode}
                        </p>
                      </div>
                      {shipment.trackingCode && (
                        <a
                          href={
                            shipment.trackingUrl ||
                            `https://parcelsapp.com/tracking/${shipment.trackingCode}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                        >
                          {t('trackPackage')}
                          <span>↗</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Liste des Articles */}
            <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="text-lg font-bold text-foreground">
                  {t('items')} ({order.items.length})
                </h2>
              </div>
              <ul className="divide-y divide-border">
                {order.items.map((item: any) => {
                  const snapshot = item.productSnapshot as any;
                  const currentProduct = item.productId
                    ? productData[item.productId]
                    : null;
                  const slug = currentProduct?.slug || snapshot?.slug;
                  const imageUrl = currentProduct?.image || snapshot?.image;

                  const itemName = getItemName(item);

                  return (
                    <li key={item.id} className="p-6 flex items-center gap-6">
                      <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {slug ? (
                          <Link
                            href={`/${locale}/product/${slug}`}
                            className="font-bold text-foreground hover:text-primary hover:underline underline-offset-4 decoration-2"
                          >
                            {itemName}
                          </Link>
                        ) : (
                          <p className="font-bold text-foreground">
                            {itemName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {tCommon('quantity')} : {item.quantity} ×{' '}
                          {formatPrice(
                            item.unitPrice,
                            order.currency as any,
                            locale
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {formatPrice(
                            item.totalPrice,
                            order.currency as any,
                            locale
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 4. Formulaire de Demande de Remboursement / Annulation */}
            <div className="mt-8">
              <RefundRequestForm
                orderId={order.id}
                orderNumber={order.orderNumber}
                locale={locale}
                status={order.status}
                hasLabel={order.shipments.some((s: any) => !!s.labelUrl)}
              />
            </div>
          </div>

          {/* COLONNE DROITE (1/3) : Résumé & Adresses */}
          <div className="space-y-8">
            {/* Résumé Financier */}
            <div className="bg-background text-foreground rounded-2xl p-8 border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {t('summary')}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('subtotal')}</span>
                  <span>
                    {formatPrice(
                      order.subtotalAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('shipping')}</span>
                  <span>
                    {formatPrice(
                      order.shippingAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('tax')}</span>
                  <span>
                    {formatPrice(
                      order.taxAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>{tCommon('discount')}</span>
                    <span>
                      -
                      {formatPrice(
                        order.discountAmount,
                        order.currency as any,
                        locale
                      )}
                    </span>
                  </div>
                )}
                <div className="pt-6 border-t border-border flex justify-between items-center">
                  <span className="text-lg font-bold">{t('total')}</span>
                  <span className="text-2xl font-black">
                    {formatPrice(
                      order.totalAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Adresses */}
            <div className="bg-background rounded-2xl shadow-sm border border-border p-8 space-y-8">
              <div>
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">
                  📍 {t('shippingAddress')}
                </h3>
                <div className="text-foreground font-medium leading-relaxed">
                  <p className="font-bold">{shippingAddr?.name}</p>
                  <p>{shippingAddr?.line1 || shippingAddr?.street1}</p>
                  {(shippingAddr?.line2 || shippingAddr?.street2) && (
                    <p>{shippingAddr?.line2 || shippingAddr?.street2}</p>
                  )}
                  <p>
                    {[
                      shippingAddr?.city,
                      shippingAddr?.state,
                      shippingAddr?.postal_code ||
                        shippingAddr?.postalCode ||
                        shippingAddr?.zip,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="uppercase">{shippingAddr?.country}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {formatPhoneNumber(shippingAddr?.phone)}
                  </p>
                </div>
              </div>

              {billingAddr && billingAddr.name && (
                <div>
                  <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">
                    {t('billingAddress')}
                  </h3>
                  <div className="text-foreground font-medium leading-relaxed">
                    <p className="font-bold">{billingAddr.name}</p>
                    <p>{billingAddr.line1 || billingAddr.street1}</p>
                    <p>
                      {[
                        billingAddr.city,
                        billingAddr.state,
                        billingAddr.postal_code ||
                          billingAddr.postalCode ||
                          billingAddr.zip,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
