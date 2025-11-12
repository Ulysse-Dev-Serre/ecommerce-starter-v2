# 🧪 Guide de Test - Stripe

## 🔑 Clés de test

Récupérer depuis [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/apikeys) :

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Depuis Stripe CLI ou Dashboard
```

## 💳 Cartes de test

| Carte | Comportement |
|-------|--------------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Carte refusée |
| `4000 0025 0000 3155` | 🔐 Nécessite 3D Secure |
| `4000 0000 0000 9995` | ⏳ Paiement incomplet |

**CVV :** N'importe quel 3 chiffres  
**Date expiration :** N'importe quelle date future  
**Postal code :** N'importe quel code

[Toutes les cartes de test Stripe](https://stripe.com/docs/testing)

---

## 🛠️ Setup initial

### 1. Installer Stripe CLI

**macOS :**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows :**
```bash
scoop install stripe
```

**Linux :**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.0/stripe_1.19.0_linux_x86_64.tar.gz
tar -xvf stripe_1.19.0_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### 2. Se connecter

```bash
stripe login
```

### 3. Écouter les webhooks en local

```bash
# Terminal 1 : Lancer Next.js
npm run dev

# Terminal 2 : Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Résultat attendu :**
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

Copier le `whsec_xxxxx` dans `.env` → `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## 🧪 Scénarios de test

### Test 1 : Paiement réussi basique

**1. Ajouter un produit au panier**
```bash
POST http://localhost:3000/api/cart/items
{
  "variantId": "clxxx",
  "quantity": 2
}
```

**2. Créer une session checkout**
```bash
POST http://localhost:3000/api/checkout/create-session
{
  "successUrl": "http://localhost:3000/checkout/success",
  "cancelUrl": "http://localhost:3000/cart"
}
```

**Résultat attendu :**
```json
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

**3. Ouvrir l'URL Stripe et payer**
- Carte : `4242 4242 4242 4242`
- Vérifier dans le terminal 2 : webhook `payment_intent.succeeded` reçu

**4. Vérifier la commande créée**
```bash
GET http://localhost:3000/api/orders/{orderId}
```

---

### Test 2 : Paiement refusé

- Utiliser carte `4000 0000 0000 0002`
- Vérifier webhook `payment_intent.payment_failed` reçu
- Vérifier que le stock réservé a été libéré

---

### Test 3 : Session expirée

**1. Créer une session checkout**

**2. NE PAS payer**

**3. Forcer l'expiration (via Stripe CLI)**
```bash
stripe trigger checkout.session.expired
```

**4. Vérifier que le stock réservé a été libéré**

---

### Test 4 : Idempotence webhook

**1. Créer un paiement réussi**

**2. Renvoyer manuellement le webhook**
```bash
stripe trigger payment_intent.succeeded
```

**3. Vérifier qu'une seule commande a été créée** (pas de doublon)

---

## 🔍 Debugging

### Logs Stripe Dashboard

[Stripe Dashboard > Developers > Events](https://dashboard.stripe.com/test/events)

### Logs WebhookEvent

```sql
SELECT * FROM webhook_events 
WHERE source = 'stripe' 
ORDER BY created_at DESC;
```

### Logs AuditLog

```sql
SELECT * FROM audit_logs 
WHERE action = 'CREATE' AND table_name = 'orders'
ORDER BY created_at DESC;
```

---

## 🚀 Tests automatisés (futur)

```typescript
// tests/stripe/checkout.test.ts
describe('Stripe Checkout', () => {
  it('should create a checkout session', async () => {
    const res = await POST('/api/checkout/create-session', {
      body: { successUrl: '...', cancelUrl: '...' }
    });
    
    expect(res.status).toBe(200);
    expect(res.body.url).toContain('checkout.stripe.com');
  });
  
  it('should handle payment_intent.succeeded webhook', async () => {
    const payload = mockStripeWebhook('payment_intent.succeeded');
    const signature = stripe.webhooks.generateTestHeaderString(payload);
    
    const res = await POST('/api/webhooks/stripe', {
      body: payload,
      headers: { 'stripe-signature': signature }
    });
    
    expect(res.status).toBe(200);
    
    const order = await prisma.order.findFirst({
      where: { /* ... */ }
    });
    expect(order?.status).toBe('PAID');
  });
});
```

---

## ✅ Checklist avant production

- [ ] Tester tous les webhooks avec Stripe CLI
- [ ] Vérifier idempotence (renvoyer 2x le même webhook)
- [ ] Tester avec 3D Secure (`4000 0025 0000 3155`)
- [ ] Vérifier gestion du stock (réservation + décrémentation)
- [ ] Vérifier création `Order` + `Payment` + `AuditLog`
- [ ] Tester carte refusée + libération du stock
- [ ] Configurer webhook endpoint sur Stripe Dashboard
- [ ] Passer aux clés live (`sk_live_`, `pk_live_`)
