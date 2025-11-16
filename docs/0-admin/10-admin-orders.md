# Admin Orders Management

## Overview

La gestion des commandes dans le dashboard admin permet de visualiser, suivre et gérer toutes les commandes créées via Stripe.

## Features

### 1. Liste des commandes (`/admin/orders`)

**Fonctionnalités :**
- ✅ Tableau complet avec toutes les commandes
- ✅ Pagination (20 commandes par page)
- ✅ Filtres par statut (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- ✅ Recherche par numéro de commande ou email client
- ✅ Affichage : numéro, client, date, montant total, statut, paiement
- ✅ Lien vers page détails

**Colonnes affichées :**
- Order Number (ex: ORD-2025-000001)
- Customer (nom + email)
- Date
- Total Amount (montant + devise)
- Status (badge coloré)
- Payment Method + Stripe ID
- Actions (bouton View)

### 2. Détails d'une commande (`/admin/orders/[id]`)

**Sections :**

#### Order Items
- Liste des produits commandés
- Image, nom, SKU, quantité, prix unitaire, prix total
- Résumé : subtotal, tax, shipping, discount, total

#### Payment Information
- Méthode de paiement (STRIPE)
- Statut du paiement
- Montant
- Transaction ID Stripe
- Date de traitement

#### Customer Information
- Nom complet
- Email
- Customer ID

#### Shipping Address
- Adresse complète de livraison

#### Status History
- Timeline des changements de statut
- Date et heure de chaque changement
- Commentaires optionnels

## Data Flow

### Création de commande (via Stripe webhook)

```
1. Client paie sur Stripe
2. Webhook payment_intent.succeeded reçu
3. createOrderFromCart() appelé
4. Commande créée en DB (tables: orders, order_items, payments)
5. Stock décrémenté
6. Panier vidé
7. ✅ Commande visible dans /admin/orders
```

### Tables utilisées

**orders**
- orderNumber (unique)
- userId
- status (PENDING, PAID, etc.)
- currency, amounts (subtotal, tax, shipping, discount, total)
- shippingAddress, billingAddress (JSON)
- createdAt, updatedAt

**order_items**
- orderId
- productId, variantId
- productSnapshot (JSON - snapshot au moment de la commande)
- quantity, unitPrice, totalPrice, currency

**payments**
- orderId
- amount, currency
- method (STRIPE)
- externalId (Stripe payment_intent_id)
- status (COMPLETED, FAILED, etc.)
- transactionData (JSON complet de Stripe)
- processedAt

**order_status_history**
- orderId
- status
- comment
- createdBy (userId de l'admin)
- createdAt

## Services

### `order.service.ts`

**Fonctions ajoutées :**

```typescript
// Récupérer toutes les commandes (admin)
getAllOrders({
  page?: number,
  limit?: number,
  status?: string,
  search?: string,
})

// Récupérer une commande par ID (admin, sans restriction utilisateur)
getOrderByIdAdmin(orderId: string)

// Mettre à jour le statut d'une commande
updateOrderStatus(
  orderId: string,
  status: string,
  comment?: string,
  userId?: string
)
```

## Composants

### StatusBadge
`/components/admin/orders/status-badge.tsx`

Badge coloré pour afficher le statut de commande :
- PENDING → Jaune
- PAID → Vert
- SHIPPED → Bleu
- DELIVERED → Violet
- CANCELLED → Rouge
- REFUNDED → Gris

### OrderFilters
`/components/admin/orders/filters.tsx`

Composant client pour filtrer les commandes :
- Recherche par texte
- Filtre par statut
- Gestion des query params

## Dashboard Updates

Le dashboard principal (`/admin/page.tsx`) affiche maintenant :

**Stats réelles :**
- Total Revenue : somme de tous les paiements COMPLETED
- Orders : nombre total de commandes
- Products : nombre de produits ACTIVE
- Customers : nombre total d'utilisateurs

**Recent Orders :**
- 5 dernières commandes
- Affichage : orderNumber, email client, temps écoulé, montant, statut
- Liens cliquables vers les détails

## Prochaines améliorations possibles

- [ ] Changement de statut inline (dropdown dans la liste)
- [ ] Export CSV des commandes
- [ ] Génération de factures PDF
- [ ] Filtres avancés (date range, montant min/max)
- [ ] Graphiques de ventes par période
- [ ] Notifications email admin lors de nouvelle commande
- [ ] Intégration transporteur (tracking shipment)
- [ ] Gestion des remboursements Stripe
- [ ] Notes internes sur les commandes
- [ ] Impression bon de livraison

## Testing

Pour tester la fonctionnalité :

1. Créer une commande via le frontend
2. Effectuer un paiement Stripe (carte test : 4242 4242 4242 4242)
3. Vérifier que le webhook crée la commande
4. Aller sur `/admin/orders`
5. Voir la commande listée
6. Cliquer sur "View" pour voir les détails

## Security

- ✅ Toutes les pages admin sont protégées par le `layout.tsx`
- ✅ Vérification du rôle ADMIN en base de données
- ✅ Les clients ne peuvent pas accéder aux commandes des autres
- ✅ Seuls les admins peuvent voir toutes les commandes
