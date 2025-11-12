# 🪝 Webhooks Stripe

## 🎯 Pourquoi les webhooks ?

Les webhooks sont **LA SOURCE DE VÉRITÉ** pour les paiements. Ils permettent de :

- ✅ Confirmer un paiement **côté serveur** (sécurisé)
- ✅ Gérer les paiements asynchrones (3D Secure, virements)
- ✅ Gérer les échecs/remboursements automatiquement
- ✅ Éviter la fraude (le client ne peut pas falsifier)

## 📋 Événements à gérer

### 1️⃣ `checkout.session.completed`

**Quand :** La session Checkout est complétée (client a validé)

**Action :**
- Si `mode === 'payment'` et paiement immédiat → Créer Order
- Si `mode === 'subscription'` → Créer abonnement (futur)

**Exemple payload :**
```json
{
  "id": "evt_xxx",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_xxx",
      "payment_intent": "pi_xxx",
      "payment_status": "paid",
      "metadata": {
        "cartId": "clxxx",
        "userId": "clyyy"
      }
    }
  }
}
```

---

### 2️⃣ `payment_intent.succeeded`

**Quand :** Le paiement a réussi (après 3D Secure par exemple)

**Action :**
- Marquer `Payment.status = COMPLETED`
- Si Order n'existe pas encore → le créer
- Décrémenter le stock
- Envoyer email de confirmation

**Exemple payload :**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "amount": 9999,
      "currency": "cad",
      "status": "succeeded",
      "metadata": {
        "cartId": "clxxx",
        "userId": "clyyy"
      }
    }
  }
}
```

---

### 3️⃣ `payment_intent.payment_failed`

**Quand :** Le paiement a échoué

**Action :**
- Marquer `Payment.status = FAILED`
- Logger la raison (`failureReason`)
- Libérer le stock réservé (`reservedStock--`)
- Optionnel : Envoyer email "Votre paiement a échoué"

**Exemple payload :**
```json
{
  "type": "payment_intent.payment_failed",
  "data": {
    "object": {
      "id": "pi_xxx",
      "last_payment_error": {
        "message": "Your card was declined."
      }
    }
  }
}
```

---

### 4️⃣ `checkout.session.expired`

**Quand :** La session Checkout a expiré (client n'a pas payé dans le délai)

**Action :**
- Libérer le stock réservé (`reservedStock--`)
- Logger dans `WebhookEvent`

**Délai :** Par défaut 24h

---

### 5️⃣ `charge.refunded`

**Quand :** Un remboursement a été effectué

**Action :**
- Marquer `Payment.status = REFUNDED`
- Marquer `Order.status = REFUNDED`
- Remettre le stock en inventaire (`stock++`)
- Logger dans `AuditLog`

---

## 🔒 Sécurité : Validation de signature

**Toujours valider la signature Stripe pour éviter les webhooks frauduleux.**

```typescript
import Stripe from 'stripe';

const signature = request.headers.get('stripe-signature');
const secret = process.env.STRIPE_WEBHOOK_SECRET!;

try {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    secret
  );
  
  // ✅ Signature valide, on peut traiter
  await handleEvent(event);
  
} catch (err) {
  // ❌ Signature invalide = attaque potentielle
  logger.error({ error: err.message }, 'Invalid webhook signature');
  return new Response('Invalid signature', { status: 400 });
}
```

## 🔁 Idempotence : Éviter les doublons

Stripe peut renvoyer le même webhook plusieurs fois. On doit éviter de créer 2 commandes.

```typescript
const payloadHash = createHash('sha256')
  .update(JSON.stringify(event))
  .digest('hex');

const existingEvent = await prisma.webhookEvent.findUnique({
  where: {
    source_eventId: {
      source: 'stripe',
      eventId: event.id
    }
  }
});

if (existingEvent?.processed) {
  logger.info('Webhook already processed, skipping');
  return new Response('OK', { status: 200 }); // ✅ Toujours 200
}

// Créer l'événement pour traçabilité
await prisma.webhookEvent.create({
  data: {
    source: 'stripe',
    eventId: event.id,
    eventType: event.type,
    payloadHash,
    processed: false
  }
});

// Traiter l'événement...
await processEvent(event);

// Marquer comme traité
await prisma.webhookEvent.update({
  where: { source_eventId: { source: 'stripe', eventId: event.id } },
  data: { processed: true, processedAt: new Date() }
});
```

## 🧪 Tester les webhooks en local

### Option 1 : Stripe CLI (recommandé)

```bash
# Installer Stripe CLI
# https://stripe.com/docs/stripe-cli

# Se connecter
stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Dans un autre terminal, déclencher un événement test
stripe trigger payment_intent.succeeded
```

### Option 2 : Webhook de test Stripe Dashboard

1. Aller sur [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Créer un endpoint : `https://your-domain.com/api/webhooks/stripe`
3. Sélectionner les événements
4. Récupérer le `STRIPE_WEBHOOK_SECRET`

---

## 📊 Monitoring

### Vérifier les webhooks dans Stripe Dashboard

[Stripe Dashboard > Developers > Webhooks > Logs](https://dashboard.stripe.com/test/webhooks)

### Logger dans votre DB

```typescript
// Tous les webhooks dans WebhookEvent
await prisma.webhookEvent.findMany({
  where: { source: 'stripe' },
  orderBy: { createdAt: 'desc' }
});

// Webhooks échoués à retry
await prisma.webhookEvent.findMany({
  where: {
    source: 'stripe',
    processed: false,
    retryCount: { lt: 3 }
  }
});
```

---

## ⚡ Best Practices

1. **Toujours répondre 200 rapidement** : Stripe attend une réponse en < 5s
2. **Traiter de manière asynchrone** : Si long → queue (BullMQ, etc.)
3. **Logger tout** : Chaque webhook dans `WebhookEvent`
4. **Retry automatique** : Utiliser `retryCount` et `maxRetries`
5. **Alertes** : Monitorer les webhooks échoués (Sentry, etc.)
