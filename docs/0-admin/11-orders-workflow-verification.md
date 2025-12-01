# Vérification de cohérence - Workflow des commandes

## ✅ Checklist Issue #45 - Gestion des Commandes (admin)

- [x] Page liste des commandes avec filtres (status, date, client)
- [x] Page détail commande (produits, prix, adresse, paiement)
- [x] Boutons changement de statut
- [x] Historique des statuts (timeline)
- [x] Vérifier cohérence avec Stripe webhook

---

## 📋 État d'implémentation

### Pages Admin

| Élément | Fichier | Status |
|---------|---------|--------|
| Liste commandes | `src/app/[locale]/admin/orders/page.tsx` | ✅ |
| Détail commande | `src/app/[locale]/admin/orders/[id]/page.tsx` | ✅ |
| Filtres (status, date, client) | `src/components/admin/orders/filters.tsx` | ✅ |
| Badge statut | `src/components/admin/orders/status-badge.tsx` | ✅ |

### Changement de Statut

| Élément | Fichier | Status |
|---------|---------|--------|
| API endpoint | `src/app/api/admin/orders/[id]/status/route.ts` | ✅ |
| Composant UI | `src/components/admin/orders/status-actions.tsx` | ✅ |
| Wrapper client | `src/components/admin/orders/order-detail-client.tsx` | ✅ |
| Service métier | `src/lib/services/order.service.ts` | ✅ |

### Historique des Statuts

| Élément | Fichier | Status |
|---------|---------|--------|
| Affichage timeline | `src/app/[locale]/admin/orders/[id]/page.tsx` (ligne 241-267) | ✅ |
| Enregistrement | `src/app/api/admin/orders/[id]/status/route.ts` (ligne 115-122) | ✅ |
| Service métier | `src/lib/services/order.service.ts` (fonction updateOrderStatus) | ✅ |

---

## 🔄 Cohérence Stripe Webhook

### Création de commande via Stripe

**Fichier**: `src/app/api/webhooks/stripe/route.ts`

**Flux**:
1. Webhook reçoit l'événement Stripe (`checkout.session.completed` ou `payment_intent.succeeded`)
2. Valide la signature de Stripe (ligne 50)
3. Déduplique les webhooks avec hash du payload (ligne 73)
4. Appelle `createOrderFromCart()` (ligne 334)

**Statut initial défini**:
```typescript
// src/lib/services/order.service.ts, ligne 49
status: OrderStatus.PAID,
```

✅ **Cohérence** : Les commandes créées par Stripe commencent avec le statut `PAID`

### Validation du workflow

**Transitions autorisées** (synchronisées frontend/backend):

```typescript
// API Backend: src/app/api/admin/orders/[id]/status/route.ts, ligne 14-20
const VALID_STATUS_TRANSITIONS = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

// Composant Frontend: src/components/admin/orders/status-actions.tsx, ligne 14-20
// IDENTIQUE AU BACKEND ✅
```

✅ **Cohérence** : Les transitions sont dupliquées et identiques frontend/backend

### Enregistrement des changements

**Processus**:
1. Admin clique bouton changement de statut
2. API valide la transition (backend)
3. Mise à jour du statut + création entry `OrderStatusHistory`
4. Enregistrement de `createdBy` (ID admin) et commentaire optionnel
5. Timeline se met à jour côté client

**Audit trail**:
```typescript
// src/lib/services/order.service.ts, ligne 330-336
statusHistory: {
  create: {
    status,           // Nouveau statut
    comment,          // Optionnel
    createdBy: userId, // ID de l'admin
  },
}
```

✅ **Cohérence** : Tous les changements sont traçables et immuables

---

## 📊 Tableau de cohérence détaillé

### Statuts supportés

| Statut | Création | Webhook Stripe | Édition Admin | Historique |
|--------|----------|-----------------|---------------|------------|
| `PENDING` | ❌ | N/A | ✅ (transition) | ✅ |
| `PAID` | ✅ (webhook) | ✅ | ✅ (transition) | ✅ |
| `SHIPPED` | ❌ | N/A | ✅ (transition) | ✅ |
| `DELIVERED` | ❌ | N/A | ✅ (transition) | ✅ |
| `CANCELLED` | ❌ | N/A | ✅ (transition) | ✅ |
| `REFUNDED` | ❌ | N/A | ✅ (transition) | ✅ |

### Workflow Stripe

```
Panier → Checkout → Paiement → Webhook Stripe
                    |
                    └─→ Order créée avec status=PAID
                         |
                         └─→ Admin peut changer: PAID → SHIPPED → DELIVERED
                              (ou PAID → REFUNDED)
```

---

## 🔐 Sécurité

| Aspect | Implémentation | Status |
|--------|-----------------|--------|
| Auth RBAC | `withAdmin` middleware | ✅ |
| Ownership check | Pas applicable (admin view) | ✅ |
| Validation transition | Côté serveur | ✅ |
| Audit trail | `createdBy` + `timestamp` | ✅ |
| Rate limiting | RateLimits.ADMIN appliqué | ✅ |
| Idempotence | Webhook avec deduplication | ✅ |

---

## 🧪 Points de test

### Test unitaire - Transitions d'état
```bash
# Vérifier que les transitions invalides sont rejetées
PATCH /api/admin/orders/[id]/status
{
  "status": "PAID",  # Invalide si current=DELIVERED
  "comment": "test"
}
# Attendu: 400 "Invalid status transition"
```

### Test intégration - Webhook Stripe
```bash
# Vérifier que le webhook crée une commande avec status=PAID
POST /api/webhooks/stripe
Headers: stripe-signature=...
# Attendu: Order créée avec status=PAID
```

### Test end-to-end - Changement statut admin
```bash
# 1. Charger la page détail
GET /admin/orders/[id]
# Attendu: Boutons de transition valides

# 2. Changer le statut
PATCH /api/admin/orders/[id]/status
{"status":"SHIPPED"}
# Attendu: Statut mis à jour, timeline enrichie

# 3. Vérifier l'historique
GET /api/admin/orders/[id]
# Attendu: statusHistory inclut le nouveau changement
```

---

## 📝 Notes

1. **Immuabilité** : L'historique des statuts est immutable (pas de modification possible)
2. **Synchronisation** : Les transitions frontend et backend sont synchronisées (DRY)
3. **Audit** : Chaque changement enregistre qui l'a fait et quand
4. **Performance** : Pas de queries N+1, inclusion des relations optimisée
5. **Rate limiting** : Protégé contre les abus (RateLimits.ADMIN)

---

## 🚀 Prochaines étapes (Phase 2)

- [ ] Intégration UPS Tracking
- [ ] Webhooks UPS pour auto-transition des statuts
- [ ] Synchronisation Shipment ↔ Order status
- [ ] Auto-completion de "SHIPPED" → "DELIVERED" via tracking UPS
