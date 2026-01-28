export const API_ROUTES = {
  CART: {
    LINES: (id?: string) => (id ? `/api/cart/lines/${id}` : '/api/cart/lines'),
  },
};
