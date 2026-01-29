import { Language } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';

/**
 * Récupère une commande par son ID
 * Vérifie que la commande appartient bien à l'utilisateur
 */
export async function getOrderById(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      shipments: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized: This order does not belong to you');
  }

  return order;
}

/**
 * Récupère les données minimales d'une commande pour SEO/Metadata
 */
export async function getOrderMetadata(idOrNumber: string) {
  return prisma.order.findFirst({
    where: {
      OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
    },
    select: {
      orderNumber: true,
    },
  });
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
    throw new Error('Order not found');
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized: This order does not belong to you');
  }

  return order;
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

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      slug: true,
      translations: {
        where: { language: locale.toUpperCase() as Language },
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

  return { order, productData };
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
 * Récupère une commande par ID pour l'admin (sans restriction utilisateur)
 */
export async function getOrderByIdAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          clerkId: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              translations: true,
              media: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
            },
          },
        },
      },
      payments: true,
      shipments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  return order;
}
