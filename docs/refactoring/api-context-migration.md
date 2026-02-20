# Migration vers Architecture ApiContext 100% Type-Safe

Ce document suit la progression de la refactorisation des middlewares et des routes API pour éliminer l'utilisation de `any` et adopter un objet de contexte unique (`ApiContext`).

## Objectifs
- [x] Supprimer `any[]` et `unknown[]` des signatures de middleware.
- [x] Centraliser `params`, `auth` et `validatedData` dans un objet unique.
- [x] Garantir un build 100% Type-Safe pour les transactions e-commerce.

---

## 1. Socle Technique (Middlewares)
- [x] `src/lib/middleware/types.ts`
- [x] `src/lib/middleware/withAuth.ts`
- [x] `src/lib/middleware/withError.ts`
- [x] `src/lib/middleware/withRateLimit.ts`
- [x] `src/lib/middleware/withValidation.ts`

---

## 2. Routes API (Handlers)

### Admin - Attributs & Logistique
- [x] `src/app/api/admin/attributes/[id]/values/route.ts`
- [x] `src/app/api/admin/attributes/route.ts`
- [x] `src/app/api/admin/logistics/locations/[id]/route.ts`
- [x] `src/app/api/admin/logistics/locations/route.ts`

### Admin - Media
- [x] `src/app/api/admin/media/[id]/route.ts`
- [x] `src/app/api/admin/media/reorder/route.ts`
- [x] `src/app/api/admin/media/route.ts`
- [x] `src/app/api/admin/media/upload/route.ts`

### Admin - Commandes
- [x] `src/app/api/admin/orders/[id]/purchase-label/route.ts`
- [x] `src/app/api/admin/orders/[id]/return-label/route.ts`
- [x] `src/app/api/admin/orders/[id]/route.ts`
- [x] `src/app/api/admin/orders/route.ts`

### Admin - Produits & Utilisateurs
- [x] `src/app/api/admin/products/[id]/route.ts`
- [x] `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`
- [x] `src/app/api/admin/products/[id]/variants/route.ts`
- [x] `src/app/api/admin/products/[id]/variants/simple/route.ts`
- [x] `src/app/api/admin/products/reorder/route.ts`
- [x] `src/app/api/admin/products/route.ts`
- [x] `src/app/api/admin/users/route.ts`

### Boutique - Panier (Cart)
- [x] `src/app/api/cart/calculate/route.ts`
- [x] `src/app/api/cart/lines/route.ts`
- [x] `src/app/api/cart/lines/[id]/route.ts`
- [x] `src/app/api/cart/merge/route.ts`
- [x] `src/app/api/cart/route.ts`

### Boutique - Checkout & Commandes
- [x] `src/app/api/checkout/create-intent/route.ts`
- [x] `src/app/api/checkout/update-intent/route.ts`
- [x] `src/app/api/orders/[id]/route.ts`
- [x] `src/app/api/orders/refund-request/route.ts`
- [x] `src/app/api/orders/verify/route.ts`

### Boutique - Produits & Divers
- [x] `src/app/api/products/[id]/route.ts`
- [x] `src/app/api/products/route.ts`
- [x] `src/app/api/shipping/rates/route.ts`
- [x] `src/app/api/tracking/events/route.ts`
- [x] `src/app/api/users/route.ts`

### Webhooks
- [x] `src/app/api/webhooks/clerk/route.ts`
- [x] `src/app/api/webhooks/shippo/route.ts`
- [x] `src/app/api/webhooks/stripe/route.ts`
- [x] `src/app/api/webhooks/stripe/status/route.ts`

### Interne & Santé
- [x] `src/app/api/internal/cleanup-analytics/route.ts`
- [x] `src/app/api/internal/health/route.ts`
