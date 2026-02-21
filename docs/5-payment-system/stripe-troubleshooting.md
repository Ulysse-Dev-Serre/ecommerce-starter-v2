# 🔧 Dépannage Stripe (Payment Elements)

Ce guide permet de diagnostiquer et résoudre les problèmes liés au flux de paiement intégré (Stripe Elements).

> Pour comprendre l'architecture : [🔄 Flux de Paiement (Workflow)](stripe-payment-flow.md).

---

## Problème 1 : Paiement réussi sur Stripe, mais aucune commande en base

### Symptôme
Le client a été débité (vu dans le Dashboard Stripe), mais il n'a pas d'email de confirmation et la commande n'apparaît pas dans l'admin.

### Étapes de diagnostic

#### 1. Identification dans Stripe
- Allez sur [Stripe Dashboard > Payments](https://dashboard.stripe.com/payments).
- Cherchez le **Payment Intent ID** (ex: `pi_3Q...`).
- Vérifiez que le statut est bien **Succeeded**.

#### 2. Vérification du Webhook (Le suspect n°1)
- Allez sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks).
- Cherchez l'événement `payment_intent.succeeded`.
- **Code 200** : Le serveur a reçu le message. Le problème est dans la logique métier.
- **Code 4xx/5xx** : Le serveur a rejeté le message. Vérifiez les logs d'erreur.

#### 3. Diagnostic Base de Données
```sql
-- Le webhook a-t-il été enregistré ?
SELECT * FROM "webhook_events" 
WHERE "eventId" = 'evt_xxxxx'; -- ID de l'événement Stripe

-- La commande a-t-elle été créée ?
SELECT * FROM "orders" 
WHERE "stripePaymentIntentId" = 'pi_xxxxx';
```

**Fichier à vérifier :** `src/lib/services/orders/stripe-webhook.service.ts`

---

## Problème 2 : Erreur "Invalid signature" (Webhooks)

### Symptôme
Les logs affichent : `Webhook signature validation failed` ou `Invalid signature`.

### Causes & Solutions
1.  **Secret incorrect** : Vérifiez que `STRIPE_WEBHOOK_SECRET` dans votre `.env` correspond exactement au secret affiché dans le Dashboard Stripe (ou celui fourni par `stripe listen` en local).
2.  **Raw Body** : L'endpoint `/api/webhooks/stripe` doit lire le corps de la requête en format **RAW (texte brut)**. Si un middleware transforme le JSON avant la validation, la signature sera invalide.

---

## Problème 3 : Échec de création du "Payment Intent"

### Symptôme
Au moment de passer au paiement, le loader tourne indéfiniment ou une erreur "Payment failed" s'affiche avant même que le client saisisse sa carte.

### Diagnostic Frontend
- Ouvrez l'onglet **Network** (F12) du navigateur.
- Cherchez l'appel à `/api/checkout/create-intent`.
- **Erreurs courantes** :
    - `400 Bad Request` : Panier vide ou données manquantes.
    - `404 Not Found` : Un produit du panier a été supprimé ou désactivé entre-temps.
    - `429 Too Many Requests` : L'utilisateur a déclenché le **Rate Limiting**.

---

## Problème 4 : Taxes non calculées

### Symptôme
Le montant total ne change pas malgré une adresse de livraison saisie.

### Diagnostic
1.  **Mode Test** : Vérifiez si vous êtes en mode Test. [Stripe Tax a des limitations majeures en Sandbox](stripe-tax-configuration.md).
2.  **Logs Serveur** : Cherchez `Stripe Tax activation failed, falling back`. Si ce log apparaît, Stripe a refusé le calcul (souvent dû à une adresse incomplète ou invalide).
3.  **Config Dashboard** : Assurez-vous que les "Registrations" sont configurées dans vos paramètres Stripe Tax.

---

## Problème 5 : Stock non décrémenté

### Symptôme
La commande est créée mais le stock reste inchangé.

### Analyse
Le stock est **réservé** lors de la création de l'intent (`create-intent`) et **confirmé/décrémenté** lors du succès du webhook.
- Si la réservation échoue : Vérifiez `src/lib/services/inventory/stock-reservation.service.ts`.
- Si la décrémentation échoue : Vérifiez les logs du webhook `payment_intent.succeeded`.

---

## Checklist de survie rapide

- [ ] **Secret Webhook** : Est-il à jour ? (Surtout après un redémarrage de `stripe listen`).
- [ ] **Logs Prisma** : Y a-t-il une erreur de base de données (ex: contrainte d'unicité sur l'ID de commande) ?
- [ ] **Emails** : Le service Resend est-il configuré ? (Parfois la commande est créée mais c'est l'envoi d'email qui fait crash le webhook).
- [ ] **Stripe Dashboard** : L'événement est-il en "Pending" ? Stripe réessaie automatiquement pendant 3 jours.
