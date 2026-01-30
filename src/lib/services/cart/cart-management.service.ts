import { CartStatus } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { SITE_CURRENCY } from '@/lib/config/site';
import { CartProjection } from '@/lib/types/domain/cart';
import { Cart } from '@/lib/types/ui/cart';

/**
 * Get detailed cart data for the cart page (including translations and primary media)
 */
export async function getCartPageData(
  userId?: string,
  anonymousId?: string,
  locale?: string
): Promise<Cart | null> {
  const language = (locale?.toUpperCase() || 'FR') as any;

  const cart = await prisma.cart.findFirst({
    where: userId
      ? { userId, status: 'ACTIVE' }
      : { anonymousId, status: 'ACTIVE' },
    include: {
      items: {
        include: {
          variant: {
            include: {
              pricing: {
                where: { isActive: true, priceType: 'base' },
              },
              product: {
                include: {
                  translations: {
                    where: { language },
                  },
                  media: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) return null;

  // Manual serialization of Decimal and nested objects for Server -> Client pass
  return {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      variant: {
        ...item.variant,
        weight: item.variant.weight ? Number(item.variant.weight) : null,
        pricing: item.variant.pricing.map(p => ({
          ...p,
          price: p.price.toString(),
        })),
        product: {
          ...item.variant.product,
          weight: item.variant.product.weight
            ? Number(item.variant.product.weight)
            : null,
        },
      },
    })),
  } as unknown as Cart;
}

/**
 * Get or create cart for anonymous user or authenticated user
 */
export async function getOrCreateCart(
  userId?: string,
  anonymousId?: string
): Promise<CartProjection> {
  if (!userId && !anonymousId) {
    throw new Error('Either userId or anonymousId is required');
  }

  const where: any = {
    status: CartStatus.ACTIVE,
  };

  if (userId) {
    where.userId = userId;
  } else {
    where.anonymousId = anonymousId;
  }

  let cart = await prisma.cart.findFirst({
    where,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  translations: {
                    select: {
                      language: true,
                      name: true,
                    },
                  },
                },
              },
              pricing: {
                where: { isActive: true },
                select: {
                  price: true,
                  currency: true,
                },
              },
              inventory: {
                select: {
                  stock: true,
                  trackInventory: true,
                  allowBackorder: true,
                },
              },
              media: {
                where: { isPrimary: true },
                select: {
                  url: true,
                  alt: true,
                  isPrimary: true,
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: userId ?? null,
        anonymousId: anonymousId ?? null,
        status: CartStatus.ACTIVE,
        currency: SITE_CURRENCY,
        expiresAt: userId
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours pour invités
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    slug: true,
                    translations: {
                      select: {
                        language: true,
                        name: true,
                      },
                    },
                  },
                },
                pricing: {
                  where: { isActive: true },
                  select: {
                    price: true,
                    currency: true,
                  },
                },
                inventory: {
                  select: {
                    stock: true,
                    trackInventory: true,
                    allowBackorder: true,
                  },
                },
                media: {
                  where: { isPrimary: true },
                  select: {
                    url: true,
                    alt: true,
                    isPrimary: true,
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    logger.info(
      {
        action: 'cart_created',
        cartId: cart.id,
        userId: userId ?? null,
        anonymousId: anonymousId ?? null,
      },
      'Cart created'
    );
  }

  const serializedCart = {
    ...cart,
    items: cart.items.map(item => ({
      ...item,
      variant: {
        ...item.variant,
        pricing: item.variant.pricing.map(p => ({
          ...p,
          price: (p.price as any).toString(),
        })),
      },
    })),
  };

  return serializedCart as unknown as CartProjection;
}

/**
 * Clean invalid cart items (deleted products, out of stock without backorder)
 */
export async function cleanInvalidCartItems(cartId: string): Promise<number> {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              inventory: true,
              product: {
                select: {
                  status: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return 0;
  }

  const invalidItems = cart.items.filter(item => {
    const variant = item.variant;
    const product = variant.product;

    if (product.deletedAt !== null) return true;
    if (product.status !== 'ACTIVE') return true;

    if (
      variant.inventory?.trackInventory &&
      !variant.inventory.allowBackorder
    ) {
      if (variant.inventory.stock < item.quantity) return true;
    }

    return false;
  });

  if (invalidItems.length > 0) {
    await prisma.cartItem.deleteMany({
      where: {
        id: {
          in: invalidItems.map(item => item.id),
        },
      },
    });

    logger.info(
      {
        action: 'cart_cleaned',
        cartId,
        removedCount: invalidItems.length,
      },
      `Removed ${invalidItems.length} invalid cart items`
    );
  }

  return invalidItems.length;
}

/**
 * Clear all items from a cart after successful purchase
 */
export async function clearCart(cartId: string): Promise<void> {
  await prisma.cartItem.deleteMany({
    where: { cartId },
  });

  logger.info(
    {
      action: 'cart_cleared',
      cartId,
    },
    'Cart cleared after successful payment'
  );
}
