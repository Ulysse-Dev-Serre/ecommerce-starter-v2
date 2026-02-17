import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { prisma } from '@/lib/core/db';
import { OrderHeader } from '@/components/admin/orders/order-header';
import { OrderItemsTable } from '@/components/admin/orders/order-items-table';
import { OrderSummary } from '@/components/admin/orders/order-summary';
import { OrderPaymentInfo } from '@/components/admin/orders/order-payment-info';
import { OrderCustomerCard } from '@/components/admin/orders/order-customer-card';
import { OrderShippingCard } from '@/components/admin/orders/order-shipping-card';
import { OrderPackingCard } from '@/components/admin/orders/order-packing-card';
import { OrderHistoryTimeline } from '@/components/admin/orders/order-history-timeline';
import { ShippingManagement } from '@/components/admin/orders/shipping-management';

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id, locale } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            include: {
              media: true,
              product: {
                include: {
                  media: true,
                  translations: true,
                },
              },
            },
          },
          product: {
            include: {
              media: true,
              translations: true,
            },
          },
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

  return (
    <div className="space-y-6">
      <OrderHeader order={order} locale={locale} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-0 overflow-hidden">
            <OrderItemsTable
              items={order.items.map(item => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
              }))}
              currency={order.currency}
            />
            <OrderSummary
              subtotal={Number(order.subtotalAmount)}
              tax={Number(order.taxAmount)}
              shipping={Number(order.shippingAmount)}
              discount={Number(order.discountAmount)}
              total={Number(order.totalAmount)}
              currency={order.currency}
            />
          </div>

          <OrderPaymentInfo payments={order.payments} />

          <ShippingManagement
            orderId={order.id}
            shipment={order.shipments[0]}
            shippingCost={Number(order.shippingAmount)}
            currency={order.currency}
            shippingRateId={((order as any).metadata as any)?.shipping_rate_id}
            debugMetadata={(order as any).metadata}
          />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <OrderCustomerCard user={order.user} />
          <OrderShippingCard
            address={order.shippingAddress}
            user={order.user}
          />
          <OrderPackingCard packingResult={order.packingResult} />
          <OrderHistoryTimeline statusHistory={order.statusHistory} />
        </div>
      </div>
    </div>
  );
}
