# 🛠️ Cartographie des Services (Service Layer)

Ce document associe les routes API aux services métier (`src/lib/services`) qui exécutent la logique. Cela permet de comprendre "qui fait quoi" derrière chaque endpoint.

---

## 🏗️ 1. Catalogue & Produits
Gestion de l'affichage, de la création et des médias liés aux produits.

| API Route | Méthode Service | Fichier Service | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/products` | `getProducts` | `products/product-catalog.service.ts` | Recherche et filtres catalogue. |
| `GET /api/products/[id]` | `getProductBySlug` | `products/product-catalog.service.ts` | Vue produit client. |
| `POST /api/admin/products` | `createProduct` | `products/product-admin.service.ts` | Initialisation produit. |
| `PUT /api/admin/products/[id]` | `updateProduct` | `products/product-admin.service.ts` | Mise à jour et validation shipping. |
| `GET /api/admin/media` | `productMediaService.list` | `products/product-media.service.ts` | Gestion bibliothèque images. |
| `POST /api/admin/products/.../variants` | `createSimpleVariants` | `variants/variant-generator.service.ts` | Génération de déclinaisons. |

---

## 🛒 2. Panier & Identité
Gestion du panier d'achat et transition invité/client.

| API Route | Méthode Service | Fichier Service | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/cart` | `resolveCartIdentity` | `cart/identity/cart-identity.service.ts` | Résolution Cookie vs Token. |
| `POST /api/cart/lines` | `addToCart` | `cart/cart.service.ts` | Ajout avec vérification stock. |
| `POST /api/cart/merge` | `mergeAnonymousCartToUser` | `cart/cart.service.ts` | Fusion lors du Login. |
| `GET /api/cart/calculate` | `calculateCartTotals` | `cart/cart.service.ts` | Calcul taxes et sous-total. |

---

## 💳 3. Ventes & Paiements
Flux critique de transformation d'un panier en commande.

| API Route | Méthode Service | Fichier Service | Description |
| :--- | :--- | :--- | :--- |
| `POST /api/checkout/create-intent` | `createPaymentIntent` | `payments/payment-intent.service.ts` | Init Stripe + Réservation stock. |
| `POST /api/checkout/update-intent` | `updatePaymentIntent` | `payments/payment-intent.service.ts` | Ajustement montant avec frais de port. |
| `POST /api/orders/refund-request` | `processRefund` | `payments/payment-refund.service.ts` | Déclenchement remboursement Stripe. |
| `GET /api/orders/verify` | `verifyOrderCreation` | `orders/order-management.service.ts` | Sécurité post-paiement. |

---

## 📦 4. Logistique & Expédition
Calcul des tarifs Shippo et gestion des colis physiques.

| API Route | Méthode Service | Fichier Service | Description |
| :--- | :--- | :--- | :--- |
| `POST /api/shipping/rates` | `ShippingService.getRates` | `shipping/shipping.service.ts` | Colisage 3D + Appel API Shippo. |
| `POST /api/admin/orders/.../purchase-label` | `createShipment` | `orders/order-fulfillment.service.ts` | Achat étiquette et MàJ Tracking. |
| `POST /api/admin/orders/.../return-label` | `createReturnLabel` | `orders/order-fulfillment.service.ts` | Étiquette retour (Pay-on-Use). |

---

## 🛡️ 5. Webhooks & Infrastructure
Synchronisation asynchrone avec les plateformes tierces.

| API Route | Méthode Service | Fichier Service | Description |
| :--- | :--- | :--- | :--- |
| `POST /api/webhooks/stripe` | `StripeWebhookService.handle` | `orders/stripe-webhook.service.ts` | Création commande post-paiement. |
| `POST /api/webhooks/clerk` | `UserClerkService.handle` | `users/user-clerk.service.ts` | Sync Profil User BDD locale. |
| `POST /api/webhooks/shippo` | `updateOrderStatus` | `orders/order-management.service.ts` | MàJ statut via tracking transporteur. |
| `GET /api/internal/health` | `getSystemHealth` | `health/health-check.service.ts` | Diagnostic BDD et environnement. |

---

## 👥 6. Utilisateurs & Administration
Gestion des droits et de l'annuaire.

| API Route | Méthode Service | Fichier Service | Description |
| :--- | :--- | :--- | :--- |
| `GET /api/admin/users` | `getAllUsersAdmin` | `users/user-admin.service.ts` | Vue d'ensemble CRM. |
| `POST /api/users/[id]/promote` | `toggleAdminRole` | `users/user-admin.service.ts` | Promotion RBAC (Metadata Clerk). |

---

## 🏗️ 7. Couche d'Intégration (Infrastructure)
Services supportés par des APIs tierces, utilisés par les services métier.

| Service Intégration | Fichier Source | Utilisé par | Rôle |
| :--- | :--- | :--- | :--- |
| **StorageService** | `integrations/storage/storage.service.ts` | `ProductMediaService` | Abstraction S3 / Stockage Local. |
| **StripeClient** | `integrations/stripe/client.ts` | `PaymentIntentService`, `StripeWebhookService` | Communication avec l'API Stripe. |
| **ShippoClient** | `integrations/shippo/client.ts` | `ShippingService`, `OrderFulfillmentSvc` | Communication avec l'API Shippo. |
| **ResendClient** | `integrations/resend/client.ts` | `OrderNotificationsService` | Envoi d'emails transactionnels. |
| **Prisma (DB)** | `src/lib/core/db.ts` | Tous les Services & Repositories | Interface avec la base PostgreSQL. |
| **Logger** | `src/lib/core/logger.ts` | Tout le Backend | Traçabilité et audit (RequestId). |
