export const API_ROUTES = {
  CART: {
    LINES: (id?: string) => (id ? `/api/cart/lines/${id}` : '/api/cart/lines'),
    MERGE: '/api/cart/merge',
  },
  CHECKOUT: {
    CREATE_INTENT: '/api/checkout/create-intent',
    UPDATE_INTENT: '/api/checkout/update-intent',
    CREATE_SESSION: '/api/checkout/create-session',
  },
  SHIPPING: {
    RATES: '/api/shipping/rates',
  },
  ORDERS: {
    VERIFY: '/api/orders/verify',
    REFUND_REQUEST: '/api/orders/refund-request',
  },
  PRODUCTS: {
    LIST: '/api/products',
  },
  ANALYTICS: {
    EVENTS: '/api/analytics/events',
  },
  CONTACT: '/api/contact', // À créer
  ADMIN: {
    PRODUCTS: {
      BASE: '/api/admin/products',
      ITEM: (id: string) => `/api/admin/products/${id}`,
      REORDER: '/api/admin/products/reorder',
      VARIANTS: (id: string) => `/api/admin/products/${id}/variants`,
      VARIANT_ITEM: (id: string, variantId: string) =>
        `/api/admin/products/${id}/variants/${variantId}`,
      VARIANTS_SIMPLE: (id: string) =>
        `/api/admin/products/${id}/variants/simple`,
    },
    MEDIA: {
      BASE: '/api/admin/media',
      ITEM: (id: string) => `/api/admin/media/${id}`,
      UPLOAD: '/api/admin/media/upload',
      REORDER: '/api/admin/media/reorder',
    },
    LOGISTICS: {
      BASE: '/api/admin/logistics/locations',
      ITEM: (id: string) => `/api/admin/logistics/locations/${id}`,
    },
    ORDERS: {
      STATUS: (id: string) => `/api/admin/orders/${id}/status`,
      PURCHASE_LABEL: (id: string) => `/api/admin/orders/${id}/purchase-label`,
      RETURN_LABEL: (id: string) => `/api/admin/orders/${id}/return-label`,
    },
  },
};
