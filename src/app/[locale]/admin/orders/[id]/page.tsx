import { notFound } from 'next/navigation';

import { prisma } from '@/lib/core/db';
import { OrderHeader } from '@/components/admin/orders/order-header';
import {
  OrderItemsTable,
  AdminOrderItem,
} from '@/components/admin/orders/order-items-table';
import { OrderSummary } from '@/components/admin/orders/order-summary';
import { OrderPaymentInfo } from '@/components/admin/orders/order-payment-info';
import { OrderCustomerCard } from '@/components/admin/orders/order-customer-card';
import { OrderShippingCard } from '@/components/admin/orders/order-shipping-card';
import { OrderPackingCard } from '@/components/admin/orders/order-packing-card';
import { OrderHistoryTimeline } from '@/components/admin/orders/order-history-timeline';
import { ShippingManagement } from '@/components/admin/orders/shipping-management';
import {
  OrderWithIncludes,
  Address as OrderAddress,
  OrderPayment,
} from '@/lib/types/domain/order';
import { User, OrderStatusHistory, Shipment } from '@/generated/prisma';

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
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      shipments: {
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Extraction sécurisée des métadonnées depuis le dernier paiement (Stripe metadata)
  const lastPayment = order.payments[0];
  const transactionData =
    (lastPayment?.transactionData as Record<string, unknown>) || {};
  const metadata = (transactionData?.metadata as Record<string, unknown>) || {};
  const shippingRateId = metadata?.shipping_rate_id as string | undefined;

  return (
    <div className="space-y-6">
      <OrderHeader
        order={order as unknown as OrderWithIncludes}
        locale={locale}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-0 overflow-hidden">
            <OrderItemsTable
              items={
                order.items.map(item => ({
                  ...item,
                  unitPrice: Number(item.unitPrice),
                  totalPrice: Number(item.totalPrice),
                })) as AdminOrderItem[]
              }
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OrderPaymentInfo
              payments={order.payments as unknown as OrderPayment[]}
            />
            <ShippingManagement
              orderId={order.id}
              shipment={order.shipments[0] as unknown as Shipment | null}
              shippingCost={Number(order.shippingAmount)}
              currency={order.currency}
              shippingRateId={shippingRateId}
              debugMetadata={metadata}
            />
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <OrderCustomerCard user={order.user as User | null} />
          <OrderShippingCard
            address={order.shippingAddress as unknown as OrderAddress | null}
            user={order.user as User | null}
          />
          <OrderPackingCard packingResult={order.packingResult} />
          <OrderHistoryTimeline
            statusHistory={order.statusHistory as OrderStatusHistory[]}
          />
        </div>
      </div>
    </div>
  );
}
