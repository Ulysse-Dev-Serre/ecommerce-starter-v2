import { Language } from '@/generated/prisma';
import { logger } from '@/lib/core/logger';
import { CartProjection } from '@/lib/types/domain/cart';
import { Cart } from '@/lib/types/ui/cart';
import { cartRepository } from '@/lib/repositories/cart.repository';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

/**
 * Get detailed cart data for the cart page (including translations and primary media)
 */
export async function getCartPageData(
  userId?: string,
  anonymousId?: string,
  locale?: string
): Promise<Cart | null> {
  const language = (locale?.toUpperCase() || 'FR') as Language;
  return cartRepository.getRichCart({ userId, anonymousId, language });
}

/**
 * Get or create cart for anonymous user or authenticated user
 */
export async function getOrCreateCart(
  userId?: string,
  anonymousId?: string
): Promise<CartProjection> {
  if (!userId && !anonymousId) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'Either userId or anonymousId is required',
      400
    );
  }

  let cart = await cartRepository.findActiveCart({ userId, anonymousId });

  if (!cart) {
    cart = await cartRepository.createCart({ userId, anonymousId });

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

  return cart;
}

/**
 * Clean invalid cart items (deleted products, out of stock without backorder)
 */
export async function cleanInvalidCartItems(cartId: string): Promise<number> {
  const invalidItems = await cartRepository.getInvalidItems(cartId);

  if (invalidItems.length > 0) {
    for (const item of invalidItems) {
      await cartRepository.removeItem(item.id);
    }

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
  await cartRepository.clearCartItems(cartId);

  logger.info(
    {
      action: 'cart_cleared',
      cartId,
    },
    'Cart cleared after successful payment'
  );
}
