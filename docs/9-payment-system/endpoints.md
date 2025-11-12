# 🔌 API Endpoints - Stripe

## 📍 POST `/api/checkout/create-session`

Crée une session Stripe Checkout à partir du panier actif.

### Request

**Headers:**
```
Authorization: Bearer {clerk_token}  (optionnel pour invités)
Cookie: cart_anonymous_id={uuid}     (si invité)
```

**Body:**
```json
{
  "successUrl": "https://example.com/checkout/success",
  "cancelUrl": "https://example.com/cart"
}
```

### Response

**200 OK**
```json
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

**400 Bad Request**
```json
{
  "error": "Cart is empty"
}
```

**409 Conflict**
```json
{
  "error": "Insufficient stock for variant: SKU-123"
}
```

### Logique

1. Récupérer le panier actif (utilisateur ou anonyme)
2. Valider que le panier n'est pas vide
3. Vérifier la disponibilité du stock
4. Réserver le stock (`reservedStock++`)
5. Créer la session Stripe avec:
   - `line_items` depuis le panier
   - `metadata.cartId`, `metadata.userId`
   - `payment_intent_data.metadata` pour traçabilité
6. Retourner l'URL de paiement

---

## 📍 GET `/api/checkout/success`

Page de redirection après paiement (affichage UI uniquement).

### Query Parameters

```
?session_id=cs_test_xxx
```

### Response

**200 OK** (HTML/React)
```
Affiche: "Merci ! Votre paiement est en cours de traitement..."
Redirige vers: /orders/{orderId} (si disponible)
```

### ⚠️ Important

Cette route **NE DOIT PAS** :
- Créer la commande (le webhook le fait)
- Changer le statut du paiement (le webhook le fait)

Elle sert uniquement à afficher une interface utilisateur.

---

## 📍 POST `/api/webhooks/stripe`

Reçoit les événements de Stripe (webhooks).

### Request

**Headers:**
```
stripe-signature: t=xxx,v1=yyy
```

**Body:** (raw JSON)
```json
{
  "id": "evt_xxx",
  "type": "payment_intent.succeeded",
  "data": {
    "object": { ... }
  }
}
```

### Response

**200 OK**
```json
{
  "received": true
}
```

**400 Bad Request**
```json
{
  "error": "Invalid signature"
}
```

### Événements gérés

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | Créer Order si mode `payment` |
| `payment_intent.succeeded` | Marquer Payment comme COMPLETED |
| `payment_intent.payment_failed` | Logger échec + libérer stock |
| `checkout.session.expired` | Libérer stock réservé |

### Logique (payment_intent.succeeded)

1. Valider la signature Stripe
2. Vérifier idempotence (`WebhookEvent.payloadHash`)
3. Récupérer `cartId` depuis `metadata`
4. Créer `Order` avec items du panier
5. Créer `Payment` avec `externalId = payment_intent_id`
6. Décrémenter stock (`stock--`, `reservedStock--`)
7. Logger dans `AuditLog`
8. Marquer `WebhookEvent.processed = true`

---

## 📍 GET `/api/orders/[orderId]`

Récupère les détails d'une commande.

### Request

**Headers:**
```
Authorization: Bearer {clerk_token}
```

**Path Parameters:**
```
orderId: string (CUID)
```

### Response

**200 OK**
```json
{
  "success": true,
  "order": {
    "id": "clxxx",
    "orderNumber": "ORD-2025-0001",
    "status": "PAID",
    "totalAmount": "99.99",
    "currency": "CAD",
    "items": [
      {
        "id": "clyyy",
        "productSnapshot": {
          "name": "T-Shirt Rouge",
          "sku": "TS-RED-M"
        },
        "quantity": 2,
        "unitPrice": "29.99",
        "totalPrice": "59.98"
      }
    ],
    "payments": [
      {
        "id": "clzzz",
        "method": "STRIPE",
        "status": "COMPLETED",
        "amount": "99.99",
        "processedAt": "2025-01-01T12:00:00Z"
      }
    ],
    "shippingAddress": { ... },
    "createdAt": "2025-01-01T12:00:00Z"
  }
}
```

**403 Forbidden**
```json
{
  "error": "This order does not belong to you"
}
```

**404 Not Found**
```json
{
  "error": "Order not found"
}
```

### Sécurité

- Vérifier que `order.userId === currentUser.id` (ou admin)
- Ne jamais exposer les données sensibles de paiement (seulement statut)
