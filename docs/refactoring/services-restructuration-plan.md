# Plan de Refactorisation : Service Layer Architecture

**Date** : 29 janvier 2026  
**Objectif** : Restructurer `src/lib/services/` selon les principes SOLID et Domain-Driven Design  
**Durée estimée** : 4-6 heures  
**Priorité** : Moyenne (amélioration qualité, non-critique)

---

## 🎯 Problème Actuel

### Fichiers monolithiques

| Fichier | Lignes | Responsabilités | Problème |
|---------|--------|-----------------|----------|
| `order.service.ts` | 923 | Création, mise à jour, expédition, emails, remboursements | **God Object** - Viole SRP |
| `cart.service.ts` | ~400 | Panier invité, panier user, calculs, merge | Trop couplé |
| `product.service.ts` | ~350 | CRUD, traductions, variantes, inventaire | Mélange niveau Admin/Client |

### Conséquences

- ❌ Difficile à tester (trop de dépendances)
- ❌ Difficile à maintenir (changements impactent tout)
- ❌ Couplage fort entre domaines différents
- ❌ Responsabilités floues

---

## 🏗️ Architecture Cible

### Principe : Découpage par Domaine Métier (pas par rôle utilisateur)

```
src/lib/services/
├── orders/
│   ├── order-creation.service.ts      # createOrderFromCart, generateOrderNumber
│   ├── order-management.service.ts    # getOrders, updateStatus, getOrderById
│   ├── order-fulfillment.service.ts   # generateLabel, purchaseLabel, tracking
│   ├── order-refunds.service.ts       # processRefund, requestRefund, getRefundHistory
│   ├── order-notifications.service.ts # sendOrderEmail, sendAdminAlert
│   └── index.ts                        # Barrel export
│
├── products/
│   ├── product-catalog.service.ts     # Lecture (getProducts, getBySlug)
│   ├── product-admin.service.ts       # Écriture (create, update, delete)
│   ├── product-inventory.service.ts   # checkStock, reserveStock, decrementStock
│   └── index.ts
│
├── cart/
│   ├── cart-core.service.ts           # getCart, addItem, removeItem
│   ├── cart-calculation.service.ts    # calculateCart, applyDiscount
│   └── index.ts
│
├── customers/
│   ├── customer.service.ts            # Gestion clients (fusionné depuis user.service.ts)
│   └── index.ts
│
├── shared/
│   ├── attribute.service.ts           # Unchanged (petit et stable)
│   ├── variant.service.ts             # Unchanged (petit et stable)
│   ├── webhook.service.ts             # Unchanged
│   └── webhook-alert.service.ts       # Unchanged
│
└── checkout.service.ts                 # Unchanged (déjà petit et cohérent)
```

---

## 📋 Plan de Migration (Étape par Étape)


#### Étape 1.1 : Analyse du code existant
```bash
# Lister toutes les fonctions exportées par service
grep -E "^export (async )?function" src/lib/services/*.service.ts

# Analyser les dépendances entre services
grep -r "from.*service" src/lib/services/
```

**Livrable** : Tableau des fonctions avec leurs responsabilités

#### Étape 1.2 : Créer la structure vide
```bash
mkdir -p src/lib/services/{orders,products,cart,customers,shared}
touch src/lib/services/orders/index.ts
touch src/lib/services/products/index.ts
# etc.
```

**Checkpoint** : Vérifier que le build passe toujours (`npm run build`)

---

### Phase 2 : Migration `order.service.ts` (2h)

#### Étape 2.1 : Identifier les groupes de fonctions

**Groupe "Creation"** (→ `order-creation.service.ts`)
- `generateOrderNumber()`
- `createOrderFromCart()`
- `createOrderItems()`

**Groupe "Management"** (→ `order-management.service.ts`)
- `getOrderById()`
- `getUserOrders()`
- `updateOrderStatus()`
- `getOrderHistory()`

**Groupe "Fulfillment"** (→ `order-fulfillment.service.ts`)
- `generateShippingLabel()`
- `purchaseShippingLabel()`
- `getShippingRates()`
- `createShippoTransaction()`

**Groupe "Refunds"** (→ `order-refunds.service.ts`)
- `processRefund()`
- `requestRefund()`
- `getRefundHistory()`

**Groupe "Notifications"** (→ `order-notifications.service.ts`)
- `sendOrderConfirmationEmail()`
- `sendAdminNewOrderAlert()`
- `sendShippedEmail()`
- `sendDeliveredEmail()`
- `sendRefundedEmail()`

#### Étape 2.2 : Copier (pas déplacer) les fonctions

**Important** : Ne PAS supprimer l'ancien fichier tant que tous les imports ne sont pas migrés.

```typescript
// src/lib/services/orders/order-creation.service.ts
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
// ... imports existants

export async function generateOrderNumber(): Promise<string> {
  // CODE COPIÉ depuis order.service.ts
}

export async function createOrderFromCart(input: CreateOrderInput) {
  // CODE COPIÉ depuis order.service.ts
}
```

#### Étape 2.3 : Créer le barrel export

```typescript
// src/lib/services/orders/index.ts
export * from './order-creation.service';
export * from './order-management.service';
export * from './order-fulfillment.service';
export * from './order-refunds.service';
export * from './order-notifications.service';
```

#### Étape 2.4 : Migrer les imports progressivement

**Stratégie** : Migrer fichier par fichier, tester entre chaque

```typescript
// AVANT
import { createOrderFromCart } from '@/lib/services/order.service';

// APRÈS
import { createOrderFromCart } from '@/lib/services/orders';
```

**Commandes pour trouver tous les imports**
```bash
grep -r "from '@/lib/services/order.service'" src/app/
grep -r "from '@/lib/services/order.service'" src/components/
```

**Checkpoint après chaque fichier migré** : `npm run build`

#### Étape 2.5 : Supprimer l'ancien fichier

Une fois TOUS les imports migrés :
```bash
git rm src/lib/services/order.service.ts
npm run build  # Vérification finale
```

---

### Phase 3 : Migration `product.service.ts` (1h)

**Suivre le même processus que Phase 2**

Groupes identifiés :
- `product-catalog.service.ts` : getProducts, getBySlug, getFeatured
- `product-admin.service.ts` : createProduct, updateProduct, deleteProduct
- `product-inventory.service.ts` : Déjà existant, fusion avec celui-ci

---

### Phase 4 : Migration `cart.service.ts` (45 min)

Groupes identifiés :
- `cart-core.service.ts` : CRUD du panier
- `cart-calculation.service.ts` : Déjà existant (`calculation.service.ts`), fusion


---

## ⚠️ Règles de Sécurité (À RESPECTER ABSOLUMENT)

### ❌ À NE JAMAIS FAIRE

1. **Ne JAMAIS supprimer un fichier avant que tous ses imports soient migrés**
2. **Ne JAMAIS modifier plusieurs fichiers en parallèle**
3. **Ne JAMAIS committer sans avoir testé le build**





### Si bloqué

- Revenir à l'étape précédente
- Relire la section "Règles de Sécurité"
- Ne pas hésiter à demander de l'aide

---


