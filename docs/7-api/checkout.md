# API Checkout

## Endpoints

### Client
- `POST /api/checkout/create-intent` - Initialise paiement (Stripe Elements)
  - **Auth**: Aucune (Session panier ou User connecté)
  - **Body**: cartId (optionnel), currency (CAD|USD)
  - **Actions**:
    1. Récupère panier
    2. Réserve stock
    3. Crée Stripe PaymentIntent (Montant = Sous-total produits)
  - **Retourne**: clientSecret, amount, currency
  - **Fichier**: `src/app/api/checkout/create-intent/route.ts`

- `POST /api/checkout/update-intent` - Met à jour montant total (Livraison)
  - **Auth**: Aucune
  - **Body**: paymentIntentId, shippingRate { amount, object_id }, currency
  - **Actions**:
    1. Récupère PaymentIntent existant
    2. Calcule Nouveau Total = (Sous-total initial + Frais livraison)
    3. Met à jour metadata Stripe (shipping_rate_id, shipping_cost)
  - **Retourne**: success: true, amount (nouveau total)
  - **Fichier**: `src/app/api/checkout/update-intent/route.ts`

### Webhook (Interne)
- `POST /api/webhooks/stripe` - Confirmation paiement
  - **Voir**: [Documentation Webhooks](./webhooks.md)

## Workflow Checkout Personnalisé

1. **Page Load** : Frontend appelle `create-intent` → Reçoit `clientSecret`.
2. **User** : Remplit adresse (Stripe Address Element).
3. **Frontend** : Appelle shipping API pour tarifs.
4. **User** : Choisit tarif (ex: 15$).
5. **Frontend** : Appelle `update-intent` → Stripe met à jour le montant à prélever.
6. **User** : Paie via Stripe Payment Element.
7. **Stripe** : Valide paiement -> Redirige user vers `/checkout/success`.
8. **Async** : Webhook `payment_intent.succeeded` -> Backend crée commande + Achète label (Option B: label manuel).

## Notes
- **Stock** : Réservé dès le `create-intent`.
- **Total** : Dynamique (Produits + Livraison choisie).
- **Sécurité** : Le backend vérifie toujours les montants avant update.
