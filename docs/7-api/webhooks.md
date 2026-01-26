# API Webhooks

## Endpoints

### Clerk
- `POST /api/webhooks/clerk` - Sync utilisateurs Clerk → PostgreSQL
  - **Source**: Clerk (signature-based)
  - **Événements**: user.created, user.updated, user.deleted
  - **Actions**: Ajoute/modifie/supprime user en BDD
  - **Fichier**: `src/app/api/webhooks/clerk/route.ts`

### Stripe
- `POST /api/webhooks/stripe` - Traite événements paiement Stripe
  - **Source**: Stripe (signature-based)
  - **Événements**: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
  - **Actions**: Crée commande, vide panier, libère stocks
  - **Sécurité**: Signature validée + idempotence (hash payload)
  - **Fichier**: `src/app/api/webhooks/stripe/route.ts`

- `GET /api/webhooks/stripe/status` - Liste événements Stripe reçus
  - **Auth**: Aucune (internal)
  - **Query**: limit, processed (true|false)
  - **Usage**: Debugging, vérifier webhook processing
  - **Fichier**: `src/app/api/webhooks/stripe/status/route.ts`

## Notes
- Webhooks toujours retournent 200 (même si erreur) pour idempotence
- Signature Stripe validée: STRIPE_WEBHOOK_SECRET
- Signature Clerk validée: CLERK_WEBHOOK_SECRET
- WebhookEvent table stocke eventId + hash + processed flag
- Chaque webhook enregistré dans logs + BDD pour audit
