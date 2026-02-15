/**
 * Playwright E2E Test Routes Configuration
 */
export const TEST_ROUTES = {
  ADMIN: {
    DASHBOARD: /\/admin/,
    LOGIN: /\/sign-in/,
    LOGISTICS: /\/admin\/logistics/,
    PRODUCTS: /\/admin\/products/,
    PRODUCT_CREATE: /\/admin\/products\/new/,
  },
  PUBLIC: {
    HOME: /(\/en|\/fr|\/$)/, // Accepts root, /en, or /fr
  },
  // Define expected behavior after specific actions here
  // Adjust this based on your application logic (e.g. redirect to home vs login)
  POST_LOGOUT_REDIRECT: /(\/sign-in|\/en|\/$)/,
};
