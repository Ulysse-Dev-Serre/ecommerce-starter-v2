# 📦 Admin Orders Management

## Overview

Le dashboard admin permet de visualiser, suivre et gérer toutes les commandes créées via Stripe. Chaque commande passe par un workflow de statuts validés, avec historique complet des changements et audit trail.

---

## Features principales

- ✅ **Liste** : Pagination (20 par page), filtres par statut, recherche par numéro/email
- ✅ **Détail** : Produits commandés, adresse, paiement, historique des changements
- ✅ **Changement de statut** : Transitions validées, enregistrement des changements
- ✅ **Dashboard** : Stats (Revenue, Orders count, Active Products, Customers) + Recent Orders

---

## Architecture & Implémentation

### Tables de données

| Table | Rôle |
|-------|------|
| `orders` | Header commande (orderNumber, userId, status, amounts, addresses) |
| `order_items` | Produits commandés (productId, variantId, productSnapshot, quantité, prix) |
| `payments` | Info paiement Stripe (method, externalId, status, transactionData) |
| `order_status_history` | Audit trail des changements (status, comment, createdBy, createdAt) |

**Fichier schema** : `prisma/schema.prisma`

---

### Statuts et Transitions d'état

**Concept** : Une commande traverse des statuts définies, avec transitions strictement validées pour éviter les états incohérents.

```
PENDING ──┬─→ PAID ──┬─→ SHIPPED → DELIVERED ─┐
          │          │                          │
          └→ CANCELLED  REFUNDED ←─────────────┘
```

**Transitions valides** :
- `PENDING` → `PAID`, `CANCELLED`
- `PAID` → `SHIPPED`, `REFUNDED`
- `SHIPPED` → `DELIVERED`
- `DELIVERED` → `REFUNDED`
- `CANCELLED` / `REFUNDED` → (terminal)

**Valeurs des statuts** : `src/generated/prisma` (généré depuis `prisma/schema.prisma` lignes 24-31, enum `OrderStatus`)

**Implémentation Backend** (`src/app/api/admin/orders/[id]/status/route.ts`, lignes 13-20):

```typescript
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [], // État terminal
  [OrderStatus.REFUNDED]: [], // État terminal
};
```

**Implémentation Frontend** (`src/components/admin/orders/status-actions.tsx`, lignes 15-22):

```typescript
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};
```

⚠️ **À synchroniser** : Le frontend et backend ont le même objet `VALID_STATUS_TRANSITIONS`. Si tu ajoutes une transition, **ajoute-la aux DEUX endroits** (lignes 13-20 backend ET lignes 15-22 frontend).

---

### Création de commande (Webhook Stripe)

**Flux** :
```
1. Client paie sur Stripe
2. Webhook payment_intent.succeeded reçu
3. Validation signature Stripe
4. Déduplication par eventId Stripe (empêche les doublons)
5. Appel createOrderFromCart()
6. Commande créée avec status=PAID
7. Stock décrémenté
8. Panier vidé
```

**Fichier webhook** : `src/app/api/webhooks/stripe/route.ts`
- Validation signature (ligne 50)
- Déduplication par eventId (lignes 74-89) :
  - Vérifier si webhook déjà traité via couple unique `(source, eventId)`
  - Si déjà `processed=true`, skip (retourner 200 sans retraiter)
  - `payloadHash` est stocké pour audit/debug, pas utilisé pour la dédup
- Appel createOrderFromCart() (lignes 334 ou 446)

**Service métier** : `src/lib/services/order.service.ts`, fonction `createOrderFromCart()`
- Crée orders + order_items + payments en transaction
- Décrémente stock
- Initialise status à `PAID`

**Statut initial** : Les commandes créées par webhook Stripe commencent toujours avec `status=PAID` (elles sont déjà payées).

---

### Services & API Endpoints

**Service** : `src/lib/services/order.service.ts`

```typescript
// Créer une commande depuis le panier (appelé par webhook)
createOrderFromCart(input: CreateOrderFromCartInput) // lignes 25-112
- Crée la commande avec status=PAID
- Crée les items et paiement en transaction
- Décrémente le stock

// Récupérer une commande par ID (avec vérification de propriété)
getOrderById(orderId: string, userId: string) // lignes 114-133

// Récupérer une commande par ID (admin, sans restriction)
getOrderByIdAdmin(orderId: string) // lignes 180-227
- Include: user, items (avec product + variant), payments, shipments, statusHistory

// Changer le statut + enregistrer changement dans l'historique
updateOrderStatus(orderId: string, status: string, comment?: string, userId?: string) // lignes 232-268
- Update order.status
- Create order_status_history entry avec createdBy
- Log le changement
```

**API Endpoints** :

| Endpoint | Fichier | Rôle |
|----------|---------|------|
| `GET /api/admin/orders` | `src/app/api/admin/orders/route.ts` | Liste avec filtres/pagination |
| `PATCH /api/admin/orders/[id]/status` | `src/app/api/admin/orders/[id]/status/route.ts` | Changer statut |

Tous les endpoints :
- ✅ Protégés par `withAdmin` middleware
- ✅ Middleware stack : `withError → withAdmin → withRateLimit`
- ✅ Rate limited (`RateLimits.ADMIN`)
- ✅ Enregistrent les changements avec logging

---

### Composants UI

| Composant | Fichier | Rôle |
|-----------|---------|------|
| **StatusBadge** | `src/components/admin/orders/status-badge.tsx` | Badge coloré (PENDING→jaune, PAID→vert, etc.) |
| **OrderFilters** | `src/components/admin/orders/filters.tsx` | Recherche + filtre par statut |
| **StatusActions** | `src/components/admin/orders/status-actions.tsx` | Boutons changement statut (transitions valides) |
| **OrderDetailClient** | `src/components/admin/orders/order-detail-client.tsx` | Wrapper client pour actions de changement |

**Pages** :
- `src/app/[locale]/admin/orders/page.tsx` → Liste
- `src/app/[locale]/admin/orders/[id]/page.tsx` → Détail + historique (timeline)

---

### Historique des changements (Audit Trail)

Chaque changement de statut crée une entrée dans `order_status_history` :

**Code** (`src/lib/services/order.service.ts`, lignes 242-248) :

```typescript
statusHistory: {
  create: {
    status: newStatus,         // Nouveau statut
    comment,                   // Optionnel
    createdBy: userId,         // ID de l'admin qui a changé
  },
}
```

**Affichage** : Timeline dans `src/app/[locale]/admin/orders/[id]/page.tsx`
- Date/heure du changement
- Ancien → Nouveau statut
- Commentaire (si fourni)
- Admin qui a changé (nom/email)

**Immuable** : L'historique ne peut pas être modifié ou supprimé (audit trail inviolable).

---

## Testing & Vérification

### Scénario complet : Créer une commande

```bash
1. Frontend : Client ajoute produit au panier
2. Frontend : Client clique "Passer commande"
   → POST /api/checkout/create-session (réserve stock)
   → Redirection Stripe Checkout
3. Stripe : Client paie (carte test 4242 4242 4242 4242)
4. Webhook : payment_intent.succeeded reçu
   → Appelle createOrderFromCart()
   → Crée order avec status=PAID
   → Décrémente stock
5. Admin : Va sur /admin/orders
   → Voit la commande avec status=PAID
6. Admin : Clique "Ship" (PAID → SHIPPED)
   → PATCH /api/admin/orders/[id]/status { status: "SHIPPED" }
   → Historique enrichi
7. Vérifier : SELECT * FROM order_status_history WHERE orderId=...
```

### Tester une transition invalide

```bash
# Essayer de passer de DELIVERED à PENDING (invalide)
PATCH /api/admin/orders/[orderId]/status
Body: { "status": "PENDING" }

# Attendu : 400 Bad Request
Response: {
  "success": false,
  "error": "Invalid status transition from DELIVERED to PENDING"
}
```

### Points de vérification

- [ ] Stock réservé lors création session
- [ ] Stock décrémenté après webhook
- [ ] Webhook enregistré dans `webhook_events` avec `processed=true`
- [ ] Commande visible dans `/admin/orders`
- [ ] Historique enregistre chaque changement
- [ ] Transitions invalides sont bloquées
- [ ] Rate limit appliqué (429 après trop de requêtes)

---

## Sécurité

**Authentification** :
- ✅ Toutes les pages admin protégées par `layout.tsx`
- ✅ Vérification Clerk + rôle ADMIN en base de données
- ✅ Redirection `/` si non admin

**Autorisation** :
- ✅ Seuls les admins voient toutes les commandes
- ✅ Clients ne voient que leurs propres commandes (via page client séparée)

**Validation transitions** :
- ✅ Côté serveur uniquement (backend fait autorité)
- ✅ Frontend affiche seulement les boutons valides
- ✅ Impossible de forcer une transition invalide via API

**Audit** :
- ✅ Chaque changement enregistré avec `createdBy` (ID admin)
- ✅ Immuable (pas de modification possible)
- ✅ Historique complet consultable

**Rate limiting** :
- ✅ Endpoints admin protégés par `RateLimits.ADMIN`
- ✅ Prévient les abus de changement de statut massif

---

## Débuggage

**Si une commande ne s'affiche pas** :
1. Vérifier Stripe Dashboard → Paiement "Succeeded" ?
2. Vérifier `webhook_events` table → Événement reçu avec `processed=true` ?
3. Vérifier `orders` table → Commande créée avec le bon `userId` ?
4. Vérifier logs serveur → Erreur lors de `createOrderFromCart()` ?

**Si une transition est bloquée** :
1. Vérifier statut actuel dans DB : `SELECT status FROM orders WHERE id=...`
2. Vérifier que transition existe dans `VALID_STATUS_TRANSITIONS`
3. Vérifier sync : Backend et Frontend ont le même objet

**Si historique ne s'enregistre pas** :
1. Vérifier `order_status_history` table
2. Vérifier que userId (admin) est fourni à `updateOrderStatus()`
3. Vérifier logs du serveur

---

## Next Steps (Phase 2)

- [ ] Intégration UPS/FedEx Tracking
- [ ] Auto-transition SHIPPED → DELIVERED via tracking webhook
- [ ] Génération de factures PDF
- [ ] Export CSV des commandes
- [ ] Filtres avancés (date range, montant min/max)
- [ ] Graphiques de ventes par période
- [ ] Notifications email admin sur nouvelle commande
- [ ] Gestion remboursements Stripe (refund API)
- [ ] Notes internes sur les commandes
- [ ] Impression bon de livraison
