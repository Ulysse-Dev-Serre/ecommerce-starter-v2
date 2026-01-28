import { CartStatus } from '../../generated/prisma';
import { prisma } from '../db/prisma';
import { logger } from '../logger';
import { SITE_CURRENCY } from '../constants';

export interface AddToCartInput {
  variantId: string;
  quantity: number;
}

export interface UpdateCartLineInput {
  quantity: number;
}

export interface CartProjection {
  id: string;
  userId: string | null;
  anonymousId: string | null;
  status: CartStatus;
  currency: string;
  items: {
    id: string;
    variantId: string;
    quantity: number;
    variant: {
      id: string;
      sku: string;
      product: {
        id: string;
        slug: string;
        translations: {
          language: string;
          name: string;
        }[];
      };
      pricing: {
        price: string;
        currency: string;
      }[];
      inventory: {
        stock: number;
        trackInventory: boolean;
        allowBackorder: boolean;
      } | null;
      media: {
        url: string;
        alt: string | null;
        isPrimary: boolean;
      }[];
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get detailed cart data for the cart page (including translations and primary media)
 */
export async function getCartPageData(
  userId?: string,
  anonymousId?: string,
  locale?: string
): Promise<any | null> {
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
  };
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
 * Add product to cart or update quantity if already exists
 */
export async function addToCart(
  input: AddToCartInput,
  userId?: string,
  anonymousId?: string
): Promise<CartProjection> {
  if (input.quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    include: {
      inventory: true,
      product: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  if (variant.product.status !== 'ACTIVE') {
    throw new Error('Product is not available');
  }

  if (variant.inventory?.trackInventory) {
    if (
      variant.inventory.stock < input.quantity &&
      !variant.inventory.allowBackorder
    ) {
      throw new Error(
        `Insufficient stock. Available: ${variant.inventory.stock}`
      );
    }
  }

  const cart = await getOrCreateCart(userId, anonymousId);

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: cart.id,
        variantId: input.variantId,
      },
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + input.quantity;

    if (variant.inventory?.trackInventory) {
      if (
        variant.inventory.stock < newQuantity &&
        !variant.inventory.allowBackorder
      ) {
        throw new Error(
          `Insufficient stock. Available: ${variant.inventory.stock}, requested: ${newQuantity}`
        );
      }
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });

    logger.info(
      {
        action: 'cart_item_updated',
        cartId: cart.id,
        cartItemId: existingItem.id,
        variantId: input.variantId,
        oldQuantity: existingItem.quantity,
        newQuantity,
      },
      'Cart item quantity updated'
    );
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: input.variantId,
        quantity: input.quantity,
      },
    });

    logger.info(
      {
        action: 'cart_item_added',
        cartId: cart.id,
        variantId: input.variantId,
        quantity: input.quantity,
      },
      'Item added to cart'
    );
  }

  return getOrCreateCart(userId, anonymousId);
}

/**
 * Update cart item quantity
 */
export async function updateCartLine(
  cartItemId: string,
  input: UpdateCartLineInput,
  userId?: string,
  anonymousId?: string
): Promise<CartProjection> {
  if (input.quantity < 1) {
    throw new Error('Quantity must be at least 1');
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      variant: {
        include: {
          inventory: true,
        },
      },
    },
  });

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  if (userId && cartItem.cart.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (anonymousId && cartItem.cart.anonymousId !== anonymousId) {
    throw new Error('Unauthorized');
  }

  if (cartItem.variant.inventory?.trackInventory) {
    if (
      cartItem.variant.inventory.stock < input.quantity &&
      !cartItem.variant.inventory.allowBackorder
    ) {
      throw new Error(
        `Insufficient stock. Available: ${cartItem.variant.inventory.stock}`
      );
    }
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: input.quantity },
  });

  logger.info(
    {
      action: 'cart_line_updated',
      cartItemId,
      cartId: cartItem.cartId,
      oldQuantity: cartItem.quantity,
      newQuantity: input.quantity,
    },
    'Cart line quantity updated'
  );

  return getOrCreateCart(userId, anonymousId);
}

/**
 * Remove item from cart
 */
export async function removeCartLine(
  cartItemId: string,
  userId?: string,
  anonymousId?: string
): Promise<CartProjection> {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
    },
  });

  if (!cartItem) {
    throw new Error('Cart item not found');
  }

  if (userId && cartItem.cart.userId !== userId) {
    throw new Error('Unauthorized');
  }

  if (anonymousId && cartItem.cart.anonymousId !== anonymousId) {
    throw new Error('Unauthorized');
  }

  await prisma.cartItem.delete({
    where: { id: cartItemId },
  });

  logger.info(
    {
      action: 'cart_line_removed',
      cartItemId,
      cartId: cartItem.cartId,
    },
    'Cart line removed'
  );

  return getOrCreateCart(userId, anonymousId);
}

/**
 * Merge anonymous cart into user cart on login
 * - Merge cart lines by variant (sum quantities with stock cap)
 * - Delete anonymous cart after successful merge
 * - Idempotent: won't merge same cart twice
 */
export async function mergeAnonymousCartToUser(
  userId: string,
  anonymousId: string
): Promise<CartProjection> {
  const anonymousCart = await prisma.cart.findFirst({
    where: {
      anonymousId,
      status: CartStatus.ACTIVE,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              inventory: true,
            },
          },
        },
      },
    },
  });

  if (!anonymousCart || anonymousCart.items.length === 0) {
    logger.info(
      {
        action: 'merge_cart_skipped',
        userId,
        anonymousId,
        reason: 'no_anonymous_cart_or_empty',
      },
      'No anonymous cart to merge'
    );
    return getOrCreateCart(userId, undefined);
  }

  if (anonymousCart.status === CartStatus.CONVERTED) {
    logger.info(
      {
        action: 'merge_cart_skipped',
        userId,
        anonymousId,
        cartId: anonymousCart.id,
        reason: 'already_merged',
      },
      'Cart already merged (idempotence)'
    );
    return getOrCreateCart(userId, undefined);
  }

  const userCart = await getOrCreateCart(userId, undefined);

  logger.info(
    {
      action: 'merge_cart_started',
      userId,
      anonymousId,
      anonymousCartId: anonymousCart.id,
      userCartId: userCart.id,
      anonymousItemsCount: anonymousCart.items.length,
      userItemsCount: userCart.items.length,
    },
    'Merging anonymous cart to user cart'
  );

  for (const anonymousItem of anonymousCart.items) {
    const existingUserItem = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: userCart.id,
          variantId: anonymousItem.variantId,
        },
      },
    });

    let newQuantity = anonymousItem.quantity;

    if (existingUserItem) {
      newQuantity = existingUserItem.quantity + anonymousItem.quantity;
    }

    if (anonymousItem.variant.inventory?.trackInventory) {
      const maxStock = anonymousItem.variant.inventory.stock;
      if (
        newQuantity > maxStock &&
        !anonymousItem.variant.inventory.allowBackorder
      ) {
        newQuantity = maxStock;
        logger.warn(
          {
            action: 'merge_quantity_capped',
            variantId: anonymousItem.variantId,
            requestedQuantity: existingUserItem
              ? existingUserItem.quantity + anonymousItem.quantity
              : anonymousItem.quantity,
            cappedQuantity: newQuantity,
            availableStock: maxStock,
          },
          'Quantity capped to available stock during merge'
        );
      }
    }

    if (newQuantity === 0) continue;

    if (existingUserItem) {
      await prisma.cartItem.update({
        where: { id: existingUserItem.id },
        data: { quantity: newQuantity },
      });

      logger.info(
        {
          action: 'cart_item_merged',
          variantId: anonymousItem.variantId,
          oldQuantity: existingUserItem.quantity,
          addedQuantity: anonymousItem.quantity,
          newQuantity,
        },
        'Cart item quantity merged'
      );
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          variantId: anonymousItem.variantId,
          quantity: newQuantity,
        },
      });

      logger.info(
        {
          action: 'cart_item_added_from_merge',
          variantId: anonymousItem.variantId,
          quantity: newQuantity,
        },
        'Cart item added from anonymous cart'
      );
    }
  }

  await prisma.cart.update({
    where: { id: anonymousCart.id },
    data: { status: CartStatus.CONVERTED },
  });

  logger.info(
    {
      action: 'merge_cart_completed',
      userId,
      anonymousCartId: anonymousCart.id,
      userCartId: userCart.id,
      mergedItemsCount: anonymousCart.items.length,
    },
    'Anonymous cart merged successfully'
  );

  return getOrCreateCart(userId, undefined);
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
