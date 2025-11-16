# 🔧 Dépannage Stripe

## Problème 1 : Le paiement réussit mais pas de commande créée

### Symptôme
Un client se plaint que son paiement a été accepté sur Stripe mais qu'il n'a pas reçu de confirmation de commande.

### Étapes de diagnostic

#### 1. Vérifier dans Stripe Dashboard
- Aller sur [Stripe Dashboard > Paiements](https://dashboard.stripe.com/test/payments)
- Chercher le paiement par email client ou montant
- Vérifier le statut : Est-il "Succeeded" ?
- Noter le **Payment Intent ID** (ex: `pi_xxxxx`)

#### 2. Vérifier si le webhook a été envoyé
- Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
- Chercher l'événement `payment_intent.succeeded` correspondant
- Vérifier s'il a été envoyé à votre endpoint
- Regarder le code de réponse HTTP (200 = OK, 4xx/5xx = erreur)

#### 3. Vérifier dans votre base de données

```sql
-- Vérifier si le webhook a été reçu
SELECT * FROM webhook_events 
WHERE source = 'stripe' 
  AND event_type = 'payment_intent.succeeded'
  AND payload LIKE '%pi_xxxxx%'  -- Remplacer par votre Payment Intent ID
ORDER BY created_at DESC;
```

**Si le webhook existe :**
- Vérifier `processed = true` → Le webhook a été traité
- Vérifier `processed = false` → Il y a eu une erreur

```sql
-- Vérifier si une commande a été créée
SELECT * FROM orders 
WHERE created_at >= '2025-01-15'  -- Date approximative
ORDER BY created_at DESC;
```

#### 4. Vérifier les logs de votre serveur

Chercher dans vos logs (terminal où `npm run dev` tourne) :

```
[ERROR] Webhook processing failed
[ERROR] Failed to create order
```

Si vous voyez une erreur, elle vous dira exactement ce qui a échoué (ex: stock insuffisant, DB erreur, etc.)

#### 5. Vérifier manuellement l'état du webhook

Si le webhook existe mais `processed = false` :

```sql
-- Voir l'erreur détaillée (si loggée)
SELECT * FROM webhook_events 
WHERE event_id = 'evt_xxxxx';  -- L'ID de l'événement Stripe
```

### Solutions possibles

| Cause | Solution |
|-------|----------|
| Webhook pas envoyé | Vérifier que l'endpoint est configuré dans Stripe Dashboard |
| Webhook échoué (4xx/5xx) | Vérifier les logs serveur, corriger l'erreur, retry le webhook |
| Stock insuffisant | Vérifier `ProductVariantInventory.stock` |
| Erreur DB | Vérifier les contraintes de la DB, les logs d'erreur |
| Webhook traité mais pas de commande | Bug dans `handlePaymentIntentSucceeded()` |

### Retry manuel d'un webhook

Si le webhook a échoué, vous pouvez le renvoyer depuis Stripe Dashboard :
1. Aller dans l'événement concerné
2. Cliquer sur "Resend event"
3. Vérifier que cette fois il retourne 200 OK

---

## Problème 2 : Session Stripe créée mais client ne voit rien

### Symptôme
Le client clique sur "Passer commande" et rien ne se passe.

### Étapes de diagnostic

#### 1. Vérifier dans la console du navigateur (F12)
- Ouvrir les DevTools (F12)
- Onglet "Network"
- Chercher la requête `POST /api/checkout/create-session`
- Vérifier le code de réponse :
  - 200 OK → La session a été créée
  - 400/409 → Erreur (panier vide, stock insuffisant, etc.)
  - 500 → Erreur serveur

#### 2. Vérifier la réponse de l'API

Si la réponse est 200, elle devrait contenir :
```json
{
  "success": true,
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx"
}
```

Si l'URL manque → Bug dans le backend.

#### 3. Vérifier le code frontend

Dans `cart-client.tsx`, vérifier que la redirection se fait bien :
```typescript
if (data.success && data.url) {
  window.location.href = data.url; // ← Cette ligne doit s'exécuter
}
```

Ajouter un `console.log` pour débugger :
```typescript
console.log('Stripe URL:', data.url);
window.location.href = data.url;
```

---

## Problème 3 : Stock pas décrémenté après paiement

### Symptôme
Un paiement réussit mais le stock ne baisse pas.

### Diagnostic

```sql
-- Vérifier l'état du stock
SELECT * FROM product_variant_inventory 
WHERE variant_id = 'cmhsi9ekp000gksfj0fsr7adk';  -- Remplacer par votre variant ID
```

Comparer `stock` et `reservedStock` :
- Si `reservedStock` a augmenté mais pas `stock` décrémenté → Le webhook n'a pas décrémenté
- Si rien n'a changé → Le stock n'a jamais été réservé (erreur lors de la création de session)

### Solution

Vérifier dans `handlePaymentIntentSucceeded()` si la fonction `decrementStock()` est bien appelée et s'exécute sans erreur.

---

## Problème 4 : Erreur "Invalid webhook signature"

### Symptôme
Logs : `Webhook signature validation failed`

### Cause
Le `STRIPE_WEBHOOK_SECRET` dans `.env` ne correspond pas au secret du webhook configuré.

### Solutions

#### Si vous utilisez Stripe CLI (développement local)
1. Relancer `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
2. Copier le nouveau `whsec_xxxxx` affiché
3. Mettre à jour `.env` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
4. Redémarrer le serveur (`npm run dev`)

#### Si vous utilisez un webhook configuré dans Stripe Dashboard
1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Cliquer sur votre endpoint
3. Cliquer sur "Reveal" pour voir le signing secret
4. Copier dans `.env` → `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`
5. Redémarrer le serveur

---

## Problème 5 : Paiements en double (même commande créée 2 fois)

### Symptôme
Un client a 2 commandes identiques pour un seul paiement.

### Cause
L'idempotence n'est pas implémentée correctement dans le webhook.

### Solution
Vérifier que le code vérifie si le webhook a déjà été traité :

```typescript
// Dans handlePaymentIntentSucceeded()
const existing = await prisma.webhookEvent.findUnique({
  where: { eventId: event.id }
});

if (existing?.processed) {
  return; // Ne pas retraiter
}
```

**Note :** Si ce code n'existe pas encore, il faut l'ajouter dans `src/lib/stripe/webhooks.ts`.

---

## Problème 6 : Rate limit dépassé

### Symptôme
Erreur 429 : "Too many requests"

### Cause
Un utilisateur essaie de créer trop de sessions de paiement en peu de temps.

### Solution
C'est normal, le rate limiting protège votre API. L'utilisateur doit attendre 1 minute.

Si c'est vous qui testez, vous pouvez temporairement désactiver le rate limiting en commentant le middleware :

```typescript
// src/app/api/checkout/create-session/route.ts
export const POST = withError(
  // withRateLimit(createCheckoutSessionHandler, RateLimits.PUBLIC)  // ← Commenté
  createCheckoutSessionHandler  // ← Sans rate limit (dev seulement!)
);
```

**⚠️ Attention :** Réactiver avant la production !

---

## Checklist de dépannage rapide

- [ ] Vérifier Stripe Dashboard (paiement réussi ?)
- [ ] Vérifier Stripe Dashboard (webhook envoyé ?)
- [ ] Vérifier la table `webhook_events` (webhook reçu ?)
- [ ] Vérifier la table `orders` (commande créée ?)
- [ ] Vérifier les logs serveur (erreurs ?)
- [ ] Vérifier la console navigateur (erreurs frontend ?)
- [ ] Vérifier le `STRIPE_WEBHOOK_SECRET` (correct ?)

---

## Contact support

Si aucune de ces solutions ne fonctionne :
1. Copier l'ID du paiement Stripe (`pi_xxxxx`)
2. Copier les logs d'erreur de votre serveur
3. Copier le contenu de la table `webhook_events` pour cet événement
4. Contacter votre équipe technique avec ces informations
