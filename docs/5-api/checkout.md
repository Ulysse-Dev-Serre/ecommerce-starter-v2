# API Checkout

## Endpoints

### Client
- `POST /api/checkout/create-session` - Crée session Stripe
  - **Auth**: User connecté
  - **Body**: successUrl, cancelUrl, currency (CAD|USD), items[] (optionnel)
  - **Modes**: Mode panier existant OU items directs
  - **Actions**: Réserve stock, crée session Stripe, retourne url
  - **Fichier**: `src/app/api/checkout/create-session/route.ts`

- `GET /api/checkout/success` - Récupère détails session après paiement
  - **Auth**: Aucune
  - **Query**: session_id (depuis Stripe redirect)
  - **Fichier**: `src/app/api/checkout/success/route.ts`

## Workflow
1. User POST /api/checkout/create-session → récupère session.url
2. Frontend redirige vers Stripe Checkout
3. User paie et Stripe envoie webhook
4. Webhook crée commande + vide panier
5. Stripe redirige vers successUrl + session_id
6. Frontend GET /api/checkout/success pour confirmation

## Notes
- Stock réservé immédiatement (libéré si paiement échoue)
- Webhook Stripe crée commande (source unique de vérité)
- Session valide 24h
- Métadonnées: cartId + userId stockées dans session Stripe
