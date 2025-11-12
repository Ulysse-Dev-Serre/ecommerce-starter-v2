# 🚀 Test Rapide Stripe

## 📋 Prérequis

✅ Clés Stripe configurées dans `.env` :
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 🧪 Test minimal (sans webhook pour commencer)

### Étape 1 : Démarrer le serveur

```bash
npm run dev
```

### Étape 2 : Ajouter un produit au panier

**Via Postman ou cURL :**

```bash
POST http://localhost:3000/api/cart/items
Content-Type: application/json

{
  "variantId": "clxxx",  # Remplacer par un variantId réel de votre DB
  "quantity": 1
}
```

### Étape 3 : Créer une session Stripe

```bash
POST http://localhost:3000/api/checkout/create-session
Content-Type: application/json

{
  "successUrl": "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "http://localhost:3000/cart"
}
```

**Réponse attendue :**
```json
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

### Étape 4 : Ouvrir l'URL Stripe

Copier l'`url` retournée et l'ouvrir dans votre navigateur.

### Étape 5 : Payer avec une carte test

**✅ Paiement réussi :**
- Numéro : `4242 4242 4242 4242`
- Date : N'importe quelle date future (ex: `12/25`)
- CVC : N'importe quel 3 chiffres (ex: `123`)
- Postal code : N'importe quel code (ex: `12345`)

**❌ Paiement refusé (pour tester) :**
- Numéro : `4000 0000 0000 0002`

### Étape 6 : Vérifier la redirection

Après paiement réussi, vous serez redirigé vers :
```
http://localhost:3000/checkout/success?session_id=cs_test_xxx
```

### Étape 7 : Vérifier la session

```bash
GET http://localhost:3000/api/checkout/success?session_id=cs_test_xxx
```

**Réponse attendue :**
```json
{
  "success": true,
  "session": {
    "id": "cs_test_xxx",
    "paymentStatus": "paid",
    "customerEmail": "test@example.com",
    "amountTotal": 29.99,
    "currency": "cad"
  }
}
```

---

## 🪝 Test avec Webhooks (étape suivante)

### 1. Installer Stripe CLI

```bash
# Windows (Scoop)
scoop install stripe

# Ou télécharger depuis https://stripe.com/docs/stripe-cli
```

### 2. Se connecter

```bash
stripe login
```

### 3. Écouter les webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Important :** Copier le `whsec_xxx` affiché et l'ajouter dans `.env` :
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4. Tester un paiement complet

Refaire les étapes 2-5. Cette fois, dans votre terminal Stripe CLI, vous verrez :

```
<- payment_intent.created [evt_xxx]
<- checkout.session.completed [evt_xxx]
<- payment_intent.succeeded [evt_xxx]
-> POST http://localhost:3000/api/webhooks/stripe [200]
```

### 5. Vérifier la commande créée

```bash
GET http://localhost:3000/api/orders/{orderId}
```

---

## 🐛 Debugging

### Vérifier les logs

Les logs apparaissent dans votre terminal Next.js :
```
[INFO] Checkout session created successfully
[INFO] Webhook event received: payment_intent.succeeded
[INFO] Order created successfully
```

### Vérifier dans Stripe Dashboard

[Stripe Dashboard > Events](https://dashboard.stripe.com/test/events)

### Vérifier dans la DB

```sql
-- Webhooks reçus
SELECT * FROM webhook_events WHERE source = 'stripe' ORDER BY created_at DESC;

-- Commandes créées
SELECT * FROM orders ORDER BY created_at DESC;

-- Paiements
SELECT * FROM payments ORDER BY created_at DESC;
```

---

## ✅ Checklist test minimal

- [ ] Serveur Next.js lancé (`npm run dev`)
- [ ] Produit ajouté au panier
- [ ] Session Stripe créée (`POST /api/checkout/create-session`)
- [ ] URL Stripe ouverte
- [ ] Paiement effectué avec `4242 4242 4242 4242`
- [ ] Redirection vers `/checkout/success`
- [ ] Session vérifiée (`paymentStatus: "paid"`)

## ✅ Checklist test avec webhooks

- [ ] Stripe CLI installé
- [ ] `stripe listen` lancé
- [ ] `STRIPE_WEBHOOK_SECRET` configuré dans `.env`
- [ ] Paiement effectué
- [ ] Webhook reçu (visible dans Stripe CLI)
- [ ] Commande créée dans la DB
- [ ] Stock décrémenté
