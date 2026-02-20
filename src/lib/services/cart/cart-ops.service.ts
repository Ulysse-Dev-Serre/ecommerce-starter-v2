import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { cartRepository } from '@/lib/repositories/cart.repository';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import {
  AddToCartInput,
  UpdateCartLineInput,
  CartProjection,
} from '@/lib/types/domain/cart';

import { CartStatus } from '@/generated/prisma';

import { getOrCreateCart } from './cart-management.service';

/**
 * Add product to cart or update quantity if already exists
 */
export async function addToCart(
  input: AddToCartInput,
  userId?: string,
  anonymousId?: string
): Promise<CartProjection> {
  if (input.quantity < 1) {
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'Quantity must be at least 1',
      400
    );
  }

  const variant = await cartRepository.findVariantForCart(input.variantId);

  if (!variant) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Product variant not found', 404);
  }

  if (variant.product.status !== 'ACTIVE') {
    throw new AppError(ErrorCode.FORBIDDEN, 'Product is not available', 400);
  }

  if (variant.inventory?.trackInventory) {
    if (
      variant.inventory.stock < input.quantity &&
      !variant.inventory.allowBackorder
    ) {
      throw new AppError(
        ErrorCode.INSUFFICIENT_STOCK,
        `Insufficient stock. Available: ${variant.inventory.stock}`,
        400
      );
    }
  }

  const cart = await getOrCreateCart(userId, anonymousId);

  const existingItem = await cartRepository.findCartItem(
    cart.id,
    input.variantId
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + input.quantity;

    if (variant.inventory?.trackInventory) {
      if (
        variant.inventory.stock < newQuantity &&
        !variant.inventory.allowBackorder
      ) {
        throw new AppError(
          ErrorCode.INSUFFICIENT_STOCK,
          `Insufficient stock. Available: ${variant.inventory.stock}, requested: ${newQuantity}`,
          400
        );
      }
    }

    await cartRepository.updateItemQuantity(existingItem.id, newQuantity);

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
    await cartRepository.addItem({
      cartId: cart.id,
      variantId: input.variantId,
      quantity: input.quantity,
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
    throw new AppError(
      ErrorCode.INVALID_INPUT,
      'Quantity must be at least 1',
      400
    );
  }

  const cartItem = await cartRepository.findItemWithContext(cartItemId);

  if (!cartItem) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Cart item not found', 404);
  }

  if (userId && cartItem.cart.userId !== userId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Unauthorized', 403);
  }

  if (anonymousId && cartItem.cart.anonymousId !== anonymousId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Unauthorized', 403);
  }

  if (cartItem.variant.inventory?.trackInventory) {
    if (
      cartItem.variant.inventory.stock < input.quantity &&
      !cartItem.variant.inventory.allowBackorder
    ) {
      throw new AppError(
        ErrorCode.INSUFFICIENT_STOCK,
        `Insufficient stock. Available: ${cartItem.variant.inventory.stock}`,
        400
      );
    }
  }

  await cartRepository.updateItemQuantity(cartItemId, input.quantity);

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
  const cartItem = await cartRepository.findItemWithContext(cartItemId);

  if (!cartItem) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Cart item not found', 404);
  }

  if (userId && cartItem.cart.userId !== userId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Unauthorized', 403);
  }

  if (anonymousId && cartItem.cart.anonymousId !== anonymousId) {
    throw new AppError(ErrorCode.FORBIDDEN, 'Unauthorized', 403);
  }

  await cartRepository.removeItem(cartItemId);

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
  // We still use prisma directly for transaction to avoid passing prisma client around
  // This is acceptable as the high-level logic remains decoupled from specific table queries
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
        reason: anonymousCart ? 'empty_cart' : 'no_cart',
      },
      'No anonymous cart to merge'
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
      itemsCount: anonymousCart.items.length,
    },
    'Merging anonymous cart to user cart'
  );

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async tx => {
    for (const anonymousItem of anonymousCart.items) {
      const existingUserItem = await tx.cartItem.findUnique({
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

      // Check stock
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
            },
            'Quantity capped during merge due to stock'
          );
        }
      }

      if (newQuantity <= 0) continue;

      if (existingUserItem) {
        await tx.cartItem.update({
          where: { id: existingUserItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: anonymousItem.variantId,
            quantity: newQuantity,
          },
        });
      }
    }

    // Mark anonymous cart as converted
    await tx.cart.update({
      where: { id: anonymousCart.id },
      data: { status: CartStatus.CONVERTED },
    });
  });

  logger.info(
    {
      action: 'merge_cart_completed',
      userId,
      anonymousCartId: anonymousCart.id,
      userCartId: userCart.id,
    },
    'Anonymous cart merged successfully'
  );

  return getOrCreateCart(userId, undefined);
}
