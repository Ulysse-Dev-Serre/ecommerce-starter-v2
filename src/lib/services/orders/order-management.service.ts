import { cache } from '@/lib/core/cache';
import { prisma } from '@/lib/core/db';
import {
  orderRepository,
  OrderFilters,
  PaginationParams,
} from '@/lib/repositories/order.repository';
import { updateOrderStatus as updateOrderLogic } from '@/lib/services/payments/payment-refund.service';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  OrderWithIncludes,
  OrderItem,
  OrderPayment,
  Address,
} from '@/lib/types/domain/order';

import {
  Language,
  OrderStatus,
  Order,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  Shipment,
} from '@/generated/prisma';

import { sendStatusChangeEmail } from './order-notifications.service';

/**
 * Workflow de transition d'état valide
 */
export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [
    OrderStatus.SHIPPED,
    OrderStatus.REFUNDED,
    OrderStatus.REFUND_REQUESTED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SHIPPED]: [
    OrderStatus.IN_TRANSIT,
    OrderStatus.REFUNDED,
    OrderStatus.REFUND_REQUESTED,
  ],
  [OrderStatus.IN_TRANSIT]: [
    OrderStatus.DELIVERED,
    OrderStatus.REFUNDED,
    OrderStatus.REFUND_REQUESTED,
  ],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED, OrderStatus.REFUND_REQUESTED],
  [OrderStatus.REFUND_REQUESTED]: [
    OrderStatus.REFUNDED,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

type PrismaOrderWithIncludes = Order & {
  items: PrismaOrderItem[];
  payments: PrismaPayment[];
  shipments: Shipment[];
};

/**
 * Mapping de Decimal Prisma vers number pour le domaine
 */
function mapToOrderWithIncludes(
  order: PrismaOrderWithIncludes
): OrderWithIncludes {
  return {
    ...order,
    shippingAddress: order.shippingAddress as unknown as Address,
    billingAddress: order.billingAddress as unknown as Address,
    subtotalAmount: Number(order.subtotalAmount),
    taxAmount: Number(order.taxAmount),
    shippingAmount: Number(order.shippingAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    items: (order.items?.map(item => ({
      ...item,
      variantId: item.variantId,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })) || []) as OrderItem[],
    payments: (order.payments?.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
    })) || []) as OrderPayment[],
    shipments: order.shipments,
  };
}

/**
 * Récupère une commande par son ID
 * Vérifie que la commande appartient bien à l'utilisateur
 */
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<OrderWithIncludes> {
  const order = (await orderRepository.findById(
    orderId
  )) as PrismaOrderWithIncludes | null;

  if (!order) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Order not found', 404);
  }

  if (order.userId !== userId) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Unauthorized: This order does not belong to you',
      403
    );
  }

  return mapToOrderWithIncludes(order);
}

/**
 * Récupère les données minimales d'une commande pour SEO/Metadata
 */
export async function getOrderMetadata(idOrNumber: string) {
  const cacheKey = `order:metadata:${idOrNumber}`;
  const cached = await cache.get<{ orderNumber: string } | null>(cacheKey);

  if (cached) {
    return cached;
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
    },
    select: {
      orderNumber: true,
    },
  });

  if (order) {
    // Cache for 24 hours as order number never changes
    await cache.set(cacheKey, order, 24 * 60 * 60);
  }

  return order;
}

/**
 * Récupère une commande par son numéro public
 * Vérifie que la commande appartient bien à l'utilisateur
 */
export async function getOrderByNumber(orderNumber: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Order not found', 404);
  }

  if (order.userId !== userId) {
    throw new AppError(
      ErrorCode.FORBIDDEN,
      'Unauthorized: This order does not belong to you',
      403
    );
  }

  return mapToOrderWithIncludes(order as PrismaOrderWithIncludes);
}

/**
 * Récupère les détails enrichis d'une commande avec médias et traductions produits
 * Centralize la logique utilisée dans la page Order Detail
 */
export async function getOrderDetailsWithData(
  idOrNumber: string,
  userId: string,
  locale: string
) {
  // Essayer par ID interne d'abord, puis par numéro public
  let order;
  try {
    order = await getOrderById(idOrNumber, userId);
  } catch {
    order = await getOrderByNumber(idOrNumber, userId);
  }

  const productIds = order.items
    .map(item => item.productId)
    .filter((id): id is string => !!id);

  const variantIds = order.items
    .map(item => item.variantId)
    .filter((id): id is string => !!id);

  const [products, variants] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        slug: true,
        translations: {
          where: { language: locale.toUpperCase() as Language },
          select: { name: true },
        },
        media: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    }),
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        productId: true,
        attributeValues: {
          select: {
            attributeValue: {
              select: {
                value: true,
                attribute: {
                  select: {
                    key: true,
                    translations: {
                      where: { language: locale.toUpperCase() as Language },
                      select: { name: true },
                    },
                  },
                },
                translations: {
                  where: { language: locale.toUpperCase() as Language },
                  select: { displayName: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  // Créer un dictionnaire pour accès rapide par variantId
  const itemData = variants.reduce(
    (acc, variant) => {
      const product = products.find(p => p.id === variant.productId);
      const attributes = variant.attributeValues.map(av => ({
        name:
          av.attributeValue?.attribute.translations[0]?.name ||
          av.attributeValue?.attribute.key ||
          '',
        value:
          av.attributeValue?.translations[0]?.displayName ||
          av.attributeValue?.value ||
          '',
      }));

      acc[variant.id] = {
        image: product?.media[0]?.url,
        slug: product?.slug || '',
        name: product?.translations[0]?.name || '',
        attributes,
      };
      return acc;
    },
    {} as Record<
      string,
      {
        image?: string;
        slug: string;
        name: string;
        attributes: { name: string; value: string }[];
      }
    >
  );

  return { order, itemData };
}

/**
 * Récupère toutes les commandes d'un utilisateur
 */
export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      payments: {
        select: {
          status: true,
          method: true,
        },
      },
    },
  });

  return orders;
}

/**
 * Liste des commandes pour l'admin avec filtres et pagination
 */
export async function listOrdersAdmin(
  filters: OrderFilters,
  pagination: PaginationParams
) {
  const [orders, total] = await Promise.all([
    orderRepository.findMany(filters, pagination),
    orderRepository.count(filters),
  ]);

  const totalPages = Math.ceil(total / pagination.limit);

  return {
    orders,
    pagination: {
      ...pagination,
      total,
      totalPages,
    },
  };
}

/**
 * Récupère une commande par ID pour l'admin (sans restriction utilisateur)
 */
export async function getOrderByIdAdmin(orderId: string) {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Order not found', 404);
  }

  return order;
}

/**
 * Met à jour le statut d'une commande (Admin)
 * Inclut la validation du workflow de transition
 */
export async function updateOrderStatus(params: {
  orderId: string;
  status: OrderStatus;
  comment?: string;
  userId?: string;
}) {
  const { orderId, status: newStatus, comment, userId } = params;

  // 1. Récupérer l'état actuel
  const order = await orderRepository.findById(orderId);
  if (!order) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Order not found', 404);
  }

  // 2. Valider la transition
  const validTransitions =
    VALID_STATUS_TRANSITIONS[order.status as OrderStatus] || [];

  if (!validTransitions.includes(newStatus)) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `Invalid status transition from ${order.status} to ${newStatus}`,
      400
    );
  }

  // 3. Déléguer la logique complexe (Stripe/Stock) au service dédié
  const updatedOrder = await updateOrderLogic({
    orderId,
    status: newStatus,
    comment,
    userId,
  });

  // 4. Envoyer l'email de notification (Fire & Forget)
  // Casting to expected type for the notification service
  const emailPayload = mapToOrderWithIncludes(
    updatedOrder as PrismaOrderWithIncludes
  );
  sendStatusChangeEmail(emailPayload, newStatus).catch((error: unknown) => {
    console.error('Failed to send status change email:', error);
  });

  return updatedOrder;
}
