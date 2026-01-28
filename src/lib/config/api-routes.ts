export const API_ROUTES = {
  CART: {
    LINES: (id?: string) => (id ? `/api/cart/lines/${id}` : '/api/cart/lines'),
    MERGE: '/api/cart/merge',
  },
  CHECKOUT: {
    CREATE_INTENT: '/api/checkout/create-intent',
    UPDATE_INTENT: '/api/checkout/update-intent',
  },
  SHIPPING: {
    RATES: '/api/shipping/rates',
  },
};
