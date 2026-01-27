import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArrowLeft, Check, ExternalLink, Package } from 'lucide-react';

import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db/prisma';
import { getOrderById } from '@/lib/services/order.service';
import { RefundRequestForm } from '@/components/orders/refund-request-form';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { formatDate } from '@/lib/utils/date';
import { formatPrice } from '@/lib/utils/currency';
import { StatusBadge } from '@/components/ui/status-badge';
import { SUPPORTED_LOCALES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'Orders.detail' });

  return {
    title: `${t('orderNumber')} #${id}`,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${locale}/orders/${id}`,
      languages: Object.fromEntries(
        SUPPORTED_LOCALES.map(loc => [loc, `/${loc}/orders/${id}`])
      ),
    },
  };
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  setRequestLocale(locale);
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
    try {
      const orderByNumber = await prisma.order.findUnique({
        where: { orderNumber: id },
        include: {
          items: true,
          payments: true,
          shipments: true,
        },
      });

      if (!orderByNumber || orderByNumber.userId !== user.id) {
        return notFound();
      }
      order = orderByNumber;
    } catch {
      return notFound();
    }
  }

  const productIds = order.items
    .map((item: any) => item.productId)
    .filter((id: string | null): id is string => !!id);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        where: { language: locale.toUpperCase() as any },
        select: {
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
      acc[product.id] = {
        image: product.media[0]?.url,
        slug: product.slug,
        name: product.translations[0]?.name,
      };
      return acc;
    },
    {} as Record<string, { image?: string; slug: string; name?: string }>
  );

  return (
    <OrderDetailContent
      order={order}
      locale={locale}
      productData={productData}
    />
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

  const getItemName = (item: any) => {
    const snapshot = item.productSnapshot as any;
    const currentProduct = item.productId ? productData[item.productId] : null;

    if (currentProduct?.name) return currentProduct.name;
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
    return t('productFallback');
  };

  const currentStep = ['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].indexOf(
    order.status
  );

  const shippingAddr = order.shippingAddress as Record<string, any> | null;
  const billingAddr = order.billingAddress as Record<string, any> | null;

  return (
    <div className="min-h-screen bg-muted/20 py-12 animate-in fade-in duration-700">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link
          href={`/${locale}/orders`}
          className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {t('backToOrders')}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              {t('orderNumber')} #{order.orderNumber}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {t('date')} : {formatDate(order.createdAt, locale)}
            </p>
          </div>
          <StatusBadge
            status={order.status}
            label={statusLabels[order.status]}
            className="px-6 py-2.5 text-base font-black uppercase tracking-widest"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* 1. Progress Stepper */}
            <div className="vibe-container bg-background">
              <div className="relative flex justify-between">
                {['PAID', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].map(
                  (step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 ${
                            isCompleted
                              ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                              : 'bg-background border-border text-muted-foreground'
                          } ${isCurrent ? 'ring-4 ring-primary/10 scale-110' : ''}`}
                        >
                          {isCompleted ? (
                            <Check className="h-6 w-6 stroke-[3px]" />
                          ) : (
                            <span className="font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-black mt-4 uppercase tracking-tighter transition-colors ${isCompleted ? 'text-foreground' : 'text-muted-foreground opacity-50'}`}
                        >
                          {statusLabels[step]}
                        </span>
                      </div>
                    );
                  }
                )}
                <div className="absolute top-6 left-0 w-full h-1 bg-border -z-0 rounded-full" />
                <div
                  className="absolute top-6 left-0 h-1 bg-primary transition-all duration-1000 -z-0 rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                  style={{ width: `${Math.max(0, (currentStep / 3) * 100)}%` }}
                />
              </div>
            </div>

            {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
              <div className="vibe-info-box bg-info/5 border-info/20 text-info">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingTitle')
                    : tRefund('refundDoneTitle')}
                </h3>
                <p className="whitespace-pre-wrap leading-relaxed font-medium">
                  {order.status === 'CANCELLED'
                    ? tRefund('refundPendingMessage', {
                        name:
                          order.user?.firstName ||
                          shippingAddr?.name?.split(' ')[0] ||
                          tRefund('clientFallback'),
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
                        currency: order.currency,
                      })}
                </p>
              </div>
            )}

            {order.shipments && order.shipments.length > 0 && (
              <div className="vibe-container border-primary/20 bg-primary/5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-extrabold text-primary flex items-center gap-3">
                    <Package className="h-6 w-6" /> {t('tracking')}
                  </h2>
                </div>
                <div className="space-y-6">
                  {order.shipments.map((shipment: any) => (
                    <div
                      key={shipment.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-4 bg-background rounded-xl border border-primary/10"
                    >
                      <div>
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
                          {shipment.carrier || t('standardShipping')}
                        </p>
                        <p className="font-mono text-xl text-foreground font-bold tracking-wider select-all">
                          {shipment.trackingCode}
                        </p>
                      </div>
                      <a
                        href={
                          shipment.trackingUrl ||
                          `https://parcelsapp.com/tracking/${shipment.trackingCode}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                      >
                        {t('trackPackage')}
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="vibe-container bg-background p-0 overflow-hidden">
              <div className="px-8 py-6 border-b border-border bg-muted/10">
                <h2 className="text-xl font-bold text-foreground">
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
                    <li
                      key={item.id}
                      className="p-8 flex flex-col sm:flex-row items-center gap-8 hover:bg-muted/5 transition-colors"
                    >
                      <div className="w-24 h-24 bg-muted rounded-2xl overflow-hidden flex-shrink-0 border border-border shadow-sm">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-3xl">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        {slug ? (
                          <Link
                            href={`/${locale}/product/${slug}`}
                            className="text-xl font-extrabold text-foreground hover:text-primary hover:underline underline-offset-4 decoration-2 transition-colors"
                          >
                            {itemName}
                          </Link>
                        ) : (
                          <p className="text-xl font-extrabold text-foreground">
                            {itemName}
                          </p>
                        )}
                        <p className="text-base text-muted-foreground mt-2 font-medium">
                          {tCommon('quantity')} :{' '}
                          <span className="text-foreground font-bold">
                            {item.quantity}
                          </span>{' '}
                          ×{' '}
                          {formatPrice(
                            item.unitPrice,
                            order.currency as any,
                            locale
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-foreground">
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

            <RefundRequestForm
              orderId={order.id}
              orderNumber={order.orderNumber}
              locale={locale}
              status={order.status}
              hasLabel={order.shipments.some((s: any) => !!s.labelUrl)}
            />
          </div>

          <div className="space-y-10">
            <div className="vibe-container bg-foreground text-background shadow-2xl shadow-foreground/20 border-none">
              <h2 className="text-xl font-black mb-8 border-b border-background/20 pb-4">
                {t('summary')}
              </h2>
              <div className="space-y-5 text-base font-medium">
                <div className="flex justify-between opacity-80">
                  <span>{t('subtotal')}</span>
                  <span>
                    {formatPrice(
                      order.subtotalAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between opacity-80">
                  <span>{t('shipping')}</span>
                  <span>
                    {formatPrice(
                      order.shippingAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
                <div className="flex justify-between opacity-80">
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
                  <div className="flex justify-between text-success-foreground">
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
                <div className="pt-6 border-t border-background/20 flex justify-between items-end">
                  <span className="text-lg font-black">{t('total')}</span>
                  <span className="text-4xl font-black leading-none">
                    {formatPrice(
                      order.totalAmount,
                      order.currency as any,
                      locale
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="vibe-container space-y-10">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
                  📍 {t('shippingAddress')}
                </h3>
                <div className="text-foreground font-bold leading-relaxed space-y-1">
                  <p className="text-xl mb-2">{shippingAddr?.name}</p>
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
                  <p className="uppercase tracking-widest opacity-60 text-sm">
                    {shippingAddr?.country}
                  </p>
                  {shippingAddr?.phone && (
                    <p className="text-sm font-medium text-muted-foreground mt-4 pt-4 border-t border-border/50">
                      📞 {shippingAddr.phone}
                    </p>
                  )}
                </div>
              </div>

              {billingAddr && billingAddr.name && (
                <div className="space-y-4 pt-10 border-t border-border">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-2">
                    📄 {t('billingAddress')}
                  </h3>
                  <div className="text-foreground font-bold leading-relaxed space-y-1 opacity-80">
                    <p className="text-lg mb-2">{billingAddr.name}</p>
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
