export const NAV_ROUTES = {
  HOME: '/',
  SHOP: '/shop',
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SUCCESS: '/checkout/success',
  ORDERS: '/orders',
  PRODUCTS: '/product',
  CONTACT: '/contact',
} as const;

export const CHECKOUT_URL_PARAMS = {
  DIRECT_VARIANT_ID: 'directVariantId',
  DIRECT_QUANTITY: 'directQuantity',
} as const;
