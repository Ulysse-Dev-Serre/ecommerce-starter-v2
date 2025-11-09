import { NextResponse } from 'next/server';

import { logger } from '../../../../lib/logger';
import { withError } from '../../../../lib/middleware/withError';
import {
  addToCart,
  AddToCartInput,
} from '../../../../lib/services/cart.service';

async function addToCartHandler(request: Request): Promise<NextResponse> {
  const body = await request.json();

  logger.info(
    { action: 'add_to_cart', variantId: body.variantId },
    'Adding item to cart'
  );

  const userId = body.userId;
  const anonymousId = body.anonymousId;

  if (!userId && !anonymousId) {
    return NextResponse.json(
      {
        success: false,
        error: 'Either userId or anonymousId is required',
      },
      { status: 400 }
    );
  }

  if (!body.variantId) {
    return NextResponse.json(
      {
        success: false,
        error: 'variantId is required',
      },
      { status: 400 }
    );
  }

  const cartInput: AddToCartInput = {
    variantId: body.variantId,
    quantity: body.quantity || 1,
  };

  const cart = await addToCart(cartInput, userId, anonymousId);

  logger.info(
    {
      action: 'item_added_to_cart_successfully',
      cartId: cart.id,
      variantId: body.variantId,
      itemCount: cart.items.length,
    },
    `Item added to cart ${cart.id}`
  );

  return NextResponse.json(
    {
      success: true,
      cart,
      message: 'Item added to cart successfully',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
}

export const POST = withError(addToCartHandler);
