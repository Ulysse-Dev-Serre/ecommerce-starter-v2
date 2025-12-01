# API Orders - Gestion des commandes

Documentation complète des endpoints API pour la gestion des commandes, incluant liste, détails et changement de statut.

---

## 📋 Commandes

### GET /api/orders
**Fichier**: `src/app/[locale]/orders/page.tsx`  
**Accès**: Authentifié (client)  
**Utilité**: Liste les commandes de l'utilisateur connecté

**Usage front**: Page "Mes commandes", historique utilisateur

---

### GET /api/orders/[id]
**Fichier**: `src/app/api/orders/[id]/route.ts`  
**Accès**: Authentifié (client)  
**Utilité**: Récupère une commande spécifique (vérification ownership)

**Response**:
```json
{
  "id": "order-uuid",
  "orderNumber": "ORD-2025-000001",
  "userId": "user-uuid",
  "status": "PAID",
  "currency": "CAD",
  "subtotalAmount": 99.99,
  "taxAmount": 0,
  "shippingAmount": 0,
  "discountAmount": 0,
  "totalAmount": 99.99,
  "shippingAddress": { "street": "123 Main St", "city": "Montreal", "country": "CA" },
  "billingAddress": {},
  "items": [
    {
      "id": "item-uuid",
      "variantId": "variant-uuid",
      "productId": "product-uuid",
      "quantity": 1,
      "unitPrice": 99.99,
      "totalPrice": 99.99,
      "currency": "CAD"
    }
  ],
  "payments": [
    {
      "id": "payment-uuid",
      "amount": 99.99,
      "currency": "CAD",
      "method": "STRIPE",
      "status": "COMPLETED",
      "externalId": "pi_xxxxx"
    }
  ],
  "createdAt": "2025-01-15T10:30:00Z"
}
```

**Erreurs**:
- `404`: Commande non trouvée
- `403`: La commande n'appartient pas à l'utilisateur

**Usage front**: Page détail commande utilisateur

---

### GET /api/orders/verify
**Fichier**: `src/app/api/orders/verify/route.ts`  
**Accès**: Authentifié  
**Utilité**: Vérifier qu'une commande a été créée après paiement Stripe

**Query params**:
- `paymentIntentId`: string (ID du PaymentIntent Stripe)

**Response**:
```json
{
  "success": true,
  "orderFound": true,
  "orderNumber": "ORD-2025-000001",
  "status": "PAID"
}
```

**Usage front**: Page succès de paiement, polling après checkout

---

## 👨‍💼 Admin - Gestion des commandes

### GET /api/admin/orders
**Fichier**: `src/app/api/admin/orders/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Liste toutes les commandes avec pagination et filtres

**Query params**:
- `page`: number (défaut: 1)
- `limit`: number (défaut: 20)
- `status`: PENDING | PAID | SHIPPED | DELIVERED | CANCELLED | REFUNDED
- `search`: string (recherche par orderNumber ou email client)

**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "orderNumber": "ORD-2025-000001",
        "status": "PAID",
        "totalAmount": 99.99,
        "currency": "CAD",
        "user": {
          "id": "user-uuid",
          "email": "client@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "items": [...],
        "payments": [...],
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Usage front**: Page liste commandes admin, tableau de bord

---

### GET /api/admin/orders/[id]
**Fichier**: `src/app/api/admin/orders/[id]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Récupère les détails complets d'une commande (sans restriction d'ownership)

**Response**: Même structure que GET /api/orders/[id] + statusHistory

```json
{
  "id": "order-uuid",
  "orderNumber": "ORD-2025-000001",
  "status": "SHIPPED",
  "items": [...],
  "payments": [...],
  "shipments": [...],
  "statusHistory": [
    {
      "id": "history-uuid",
      "status": "SHIPPED",
      "comment": "Colis remis au transporteur",
      "createdBy": "admin-uuid",
      "createdAt": "2025-01-16T14:22:00Z"
    },
    {
      "id": "history-uuid",
      "status": "PAID",
      "comment": null,
      "createdBy": "admin-uuid",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Usage front**: Page détail commande admin

---

### PATCH /api/admin/orders/[id]/status
**Fichier**: `src/app/api/admin/orders/[id]/status/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Change le statut d'une commande avec validation du workflow

**Body**:
```json
{
  "status": "SHIPPED",
  "comment": "Colis remis au transporteur UPS #1Z999AA10123456784"
}
```

**Statuts valides**:
- `PENDING` → `PAID`, `CANCELLED`
- `PAID` → `SHIPPED`, `REFUNDED`
- `SHIPPED` → `DELIVERED`
- `DELIVERED` → `REFUNDED`
- `CANCELLED`, `REFUNDED` (états terminaux, aucune transition possible)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "SHIPPED",
    "statusHistory": [
      {
        "id": "history-uuid",
        "status": "SHIPPED",
        "comment": "Colis remis au transporteur UPS #1Z999AA10123456784",
        "createdBy": "admin-uuid",
        "createdAt": "2025-01-16T14:22:00Z"
      }
    ]
  }
}
```

**Erreurs**:

**400 - Transition invalide**:
```json
{
  "success": false,
  "error": "Invalid status transition",
  "message": "Cannot change status from DELIVERED to PAID. Valid transitions: [REFUNDED]"
}
```

**404 - Commande non trouvée**:
```json
{
  "success": false,
  "error": "Order not found"
}
```

**Usage front**: Boutons changement de statut sur page détail admin

---

## 🔄 Workflow de transition d'état

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼────┐             ┌──────▼─────┐
         │   PAID   │             │ CANCELLED  │
         └────┬────┘             └────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼────┐         ┌────▼──────┐
│ SHIPPED │         │ REFUNDED  │
└───┬────┘         └───────────┘
    │
┌───▼──────┐
│DELIVERED │
└───┬──────┘
    │
    └──────► REFUNDED
```

---

## 📊 Structure des données

### Order
```typescript
{
  id: string                    // UUID
  orderNumber: string           // Format: ORD-2025-000001
  userId: string                // UUID utilisateur
  status: OrderStatus           // PENDING | PAID | SHIPPED | DELIVERED | CANCELLED | REFUNDED
  currency: string              // CAD, USD, EUR, etc.
  subtotalAmount: Decimal       // Prix sans taxes/frais
  taxAmount: Decimal            // Taxes (géré par Stripe Tax)
  shippingAmount: Decimal       // Frais de port
  discountAmount: Decimal       // Réductions appliquées
  totalAmount: Decimal          // Total final
  shippingAddress: JSON         // Adresse de livraison
  billingAddress: JSON          // Adresse facturation
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  user: User
  items: OrderItem[]
  payments: Payment[]
  shipments: Shipment[]
  statusHistory: OrderStatusHistory[]
}
```

### OrderStatusHistory
```typescript
{
  id: string
  orderId: string
  status: OrderStatus
  comment: string | null        // Détails du changement
  createdBy: string | null      // Admin qui a fait le changement
  createdAt: DateTime
}
```

---

## 🔐 Authentification & Sécurité

| Endpoint | Auth | Role |
|----------|------|------|
| `GET /api/orders` | ✅ | CLIENT |
| `GET /api/orders/[id]` | ✅ | CLIENT (ownership check) |
| `GET /api/orders/verify` | ✅ | CLIENT |
| `GET /api/admin/orders` | ✅ | ADMIN |
| `GET /api/admin/orders/[id]` | ✅ | ADMIN |
| `PATCH /api/admin/orders/[id]/status` | ✅ | ADMIN |

**Rate limiting** : Appliqué à tous les endpoints admin

**Audit trail** : Tous les changements de statut enregistrés avec `createdBy`

---

## 🎯 Cas d'usage front-end

### Page utilisateur - Mes commandes
```typescript
// 1. Lister les commandes
GET /api/orders

// 2. Afficher une commande en détail
GET /api/orders/[id]
```

### Page utilisateur - Succès de paiement
```typescript
// 1. Récupérer le paymentIntentId depuis Stripe
const paymentIntentId = searchParams.get('payment_intent');

// 2. Vérifier que la commande a été créée
GET /api/orders/verify?paymentIntentId={id}

// 3. Afficher le numéro de commande
```

### Page admin - Liste commandes
```typescript
// 1. Lister avec filtres
GET /api/admin/orders?status=PAID&page=1&limit=20

// 2. Rechercher par client
GET /api/admin/orders?search=client@example.com

// 3. Pagination
GET /api/admin/orders?page=2&limit=20
```

### Page admin - Détail + changement statut
```typescript
// 1. Charger la commande
GET /api/admin/orders/[id]

// 2. Afficher le formulaire de changement de statut
// (sélectionner une transition valide selon current status)

// 3. Soumettre le changement
PATCH /api/admin/orders/[id]/status
{
  "status": "SHIPPED",
  "comment": "Expédié via UPS"
}

// 4. Historique se met à jour automatiquement
```

---

## ⚠️ Notes importantes

1. **Workflow strict**: Les transitions d'état sont strictement validées côté serveur
2. **Pas de rollback**: Une fois une transition effectuée, elle est enregistrée de façon immuable
3. **Audit trail**: Chaque changement de statut enregistre qui l'a fait et quand
4. **Ownership check**: Les clients ne peuvent voir que leurs propres commandes
5. **Numéro unique**: Le format `ORD-YYYY-XXXXXX` garantit l'unicité
6. **Sync Stripe**: Les commandes sont créées à partir du webhook Stripe après paiement
7. **Historique immutable**: L'historique des statuts ne peut pas être modifié

---

## 📝 Phase 2 - UPS Integration (Futur)

- [ ] Intégrer l'API UPS Tracking
- [ ] Webhooks UPS pour mises à jour automatiques
- [ ] Synchroniser `Shipment.trackingNumber` avec état de livraison
- [ ] Auto-transition de statut via webhooks UPS
