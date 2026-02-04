# 🚀 Test Rapide Stripe

## 📋 Prérequis

✅ Clés Stripe configurées dans `.env` :
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Test minimal (via API)

### Étape 1 : Démarrer le serveur

```bash
npm run dev
```

### Étape 2 : Créer un Payment Intent (Achat Direct)

**Via Postman ou cURL :**

```bash
POST http://localhost:3000/api/checkout/create-intent
Content-Type: application/json

{
  "directItem": {
    "variantId": "clxxx",  # Remplacer par un variantId réel de votre DB
    "quantity": 1
  },
  "locale": "fr"
}
```

**Réponse attendue :**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "amount": 25.00,
  "currency": "cad",
  "requestId": "..."
}
```

### Étape 3 : Simuler le paiement

Puisque nous utilisons le **Stripe Payment Element**, le paiement se fait normalement via l'interface UI. Pour tester le flux backend sans UI compliquée :

1. Suivez le tunnel de checkout sur le site (`/checkout`).

---

## 🪝 Test avec Webhooks (Essentiel)

### 1. Démarrer Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Important :** Vérifiez que le `STRIPE_WEBHOOK_SECRET` affiché correspond à celui dans votre `.env`.

### 2. Effectuer un paiement

Une fois le paiement effectué (via le site ou le script), surveillez votre terminal Stripe CLI. Vous devriez voir :

```
<- payment_intent.succeeded [evt_xxx]
-> POST http://localhost:3000/api/webhooks/stripe [200]
```

### 3. Vérifier les effets de bord

Vérifiez dans la console ou dans la base de données :
- La commande est créée (`Order`).
- Le paiement est associé (`Payment`).
- Le stock est décrémenté.

---

## 🐛 Debugging

### Vérifier les logs
Les logs détaillés apparaissent dans le terminal `npm run dev` grâce à **Pino**. Recherchez les actions :
- `payment_intent_created`
- `stripe_webhook_received`
- `order_created_successfully`

### Vérifier dans la DB
```sql
-- Commandes et leur statut
SELECT id, "orderNumber", status, "totalAmount" FROM "Order" ORDER BY "createdAt" DESC;

-- Statut du paiement
SELECT id, status, "stripePaymentIntentId" FROM "Payment" ORDER BY "createdAt" DESC;
```
