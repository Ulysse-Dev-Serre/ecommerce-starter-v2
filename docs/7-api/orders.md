# API Orders

## Endpoints

### Client
- `GET /api/orders` - Liste mes commandes
  - **Auth**: User connecté
  - **Fichier**: `src/app/api/orders/route.ts`

- `GET /api/orders/[id]` - Détail ma commande
  - **Auth**: User connecté (ownership check)
  - **Params**: id (orderId)
  - **Fichier**: `src/app/api/orders/[id]/route.ts`

- `GET /api/orders/verify` - Vérifie création après paiement Stripe
  - **Auth**: User connecté
  - **Query**: paymentIntentId
  - **Fichier**: `src/app/api/orders/verify/route.ts`

### Admin
- `GET /api/admin/orders` - Liste toutes les commandes
  - **Auth**: Admin
  - **Query**: page, limit, status, search
  - **Fichier**: `src/app/api/admin/orders/route.ts`

- `GET /api/admin/orders/[id]` - Détail commande (sans restriction)
  - **Auth**: Admin
  - **Params**: id
  - **Fichier**: `src/app/api/admin/orders/[id]/route.ts`

- `PATCH /api/admin/orders/[id]` - Change statut commande
  - **Auth**: Admin
  - **Body**: status, comment (optionnel)
  - **Transitions**: PENDING→PAID/CANCELLED, PAID→SHIPPED/REFUNDED, SHIPPED→DELIVERED, DELIVERED→REFUNDED
  - **Audit**: Enregistre createdBy + timestamp
  - **Fichier**: `src/app/api/admin/orders/[id]/route.ts`

## Notes
- Statuts: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED
- Commandes créées par webhook Stripe (source unique de vérité)
- OrderNumber format: ORD-YYYY-XXXXXX (unique)
- StatusHistory immutable (audit trail)
- Pas de rollback transitions
