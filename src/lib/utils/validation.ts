export interface CreateCheckoutSessionInput {
  successUrl?: string;
  cancelUrl?: string;
}

export interface AddToCartInput {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export function validateCreateCheckoutSession(
  data: any
): CreateCheckoutSessionInput {
  if (data.successUrl && typeof data.successUrl !== 'string') {
    throw new Error('successUrl must be a string');
  }
  if (data.cancelUrl && typeof data.cancelUrl !== 'string') {
    throw new Error('cancelUrl must be a string');
  }
  return {
    successUrl: data.successUrl,
    cancelUrl: data.cancelUrl,
  };
}
