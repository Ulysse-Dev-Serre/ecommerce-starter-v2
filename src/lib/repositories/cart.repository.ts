import { CartStatus, Language, Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { CartProjection } from '@/lib/types/domain/cart';
import { Cart } from '@/lib/types/ui/cart';
import { SITE_CURRENCY } from '@/lib/config/site';

/**
 * Standard include for CartProjection to ensure consistency across methods
 */
const CART_PROJECTION_INCLUDE = {
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
} as const;

export class CartRepository {
  /**
   * Find an active cart by user ID or anonymous ID
   */
  async findActiveCart(params: {
    userId?: string;
    anonymousId?: string;
  }): Promise<CartProjection | null> {
    const { userId, anonymousId } = params;

    const cart = await prisma.cart.findFirst({
      where: userId
        ? { userId, status: CartStatus.ACTIVE }
        : { anonymousId, status: CartStatus.ACTIVE },
      include: CART_PROJECTION_INCLUDE,
    });

    if (!cart) return null;
    return this.serializeCart(cart);
  }

  /**
   * Create a new active cart
   */
  async createCart(params: {
    userId?: string | null;
    anonymousId?: string | null;
  }): Promise<CartProjection> {
    const { userId, anonymousId } = params;

    const cart = await prisma.cart.create({
      data: {
        userId: userId ?? null,
        anonymousId: anonymousId ?? null,
        status: CartStatus.ACTIVE,
        currency: SITE_CURRENCY,
        expiresAt: userId
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: CART_PROJECTION_INCLUDE,
    });

    return this.serializeCart(cart);
  }

  /**
   * Find a specific cart item
   */
  async findCartItem(cartId: string, variantId: string) {
    return prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
    });
  }

  /**
   * Find an item with its cart and variant info (for updates/removals)
   */
  async findItemWithContext(cartItemId: string) {
    return prisma.cartItem.findUnique({
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
  }

  /**
   * Create/Add a new item to cart
   */
  async addItem(data: { cartId: string; variantId: string; quantity: number }) {
    return prisma.cartItem.create({
      data,
    });
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(cartItemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  /**
   * Remove item from cart
   */
  async removeItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  /**
   * Clear all items from a cart
   */
  async clearCartItems(cartId: string) {
    return prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  /**
   * Update cart status (e.g., to CONVERTED during merge)
   */
  async updateCartStatus(cartId: string, status: CartStatus) {
    return prisma.cart.update({
      where: { id: cartId },
      data: { status },
    });
  }

  /**
   * Get rich cart data for UI (including translations and full media)
   */
  async getRichCart(params: {
    userId?: string;
    anonymousId?: string;
    language: Language;
  }): Promise<Cart | null> {
    const { userId, anonymousId, language } = params;

    const cart = await prisma.cart.findFirst({
      where: userId
        ? { userId, status: CartStatus.ACTIVE }
        : { anonymousId, status: CartStatus.ACTIVE },
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

    // Manual serialization for Decimal/Date if needed by UI
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
   * Find a variant with its inventory and product status (for stock checks)
   */
  async findVariantForCart(variantId: string) {
    return prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        inventory: true,
        product: {
          select: {
            status: true,
          },
        },
      },
    });
  }

  /**
   * Get list of invalid items in a cart (deleted product, inactive, out of stock)
   */
  async getInvalidItems(cartId: string) {
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

    if (!cart) return [];

    return cart.items.filter(item => {
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
  }

  /**
   * Helper to serialize Decimal values from Prisma to Strings for the domain types
   */
  private serializeCart(
    cart: Prisma.CartGetPayload<{ include: typeof CART_PROJECTION_INCLUDE }>
  ): CartProjection {
    return {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        variant: {
          ...item.variant,
          pricing: item.variant.pricing.map(p => ({
            ...p,
            price: p.price.toString(),
          })),
        },
      })),
    } as unknown as CartProjection;
  }
}

export const cartRepository = new CartRepository();
