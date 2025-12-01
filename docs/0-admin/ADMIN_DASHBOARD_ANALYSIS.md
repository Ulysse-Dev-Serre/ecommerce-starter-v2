# 📊 Admin Dashboard - Analyse Complète

## 🏗️ Architecture Globale

### Layout Admin (`src/app/[locale]/admin/layout.tsx`)
- **Protection d'accès** : Authentification Clerk + vérification du rôle ADMIN
- **Composants** : AdminSidebar + AdminHeader
- **Layout** : Main content avec sidebar fixée à 256px et header fixé
- **Dynamic rendering** : `force-dynamic` (accès DB + Auth à chaque requête)

---

## 📍 Pages Frontend Admin

### 1. **Dashboard Principal** (`/admin`)
**File**: `src/app/[locale]/admin/page.tsx`

**Données affichées**:
- 📈 Total Revenue (requêtes COMPLETED)
- 📦 Total Orders count
- 📊 Active Products count
- 👥 Total Customers count
- 📋 Recent Orders (5 dernières)

**Composants**:
- 4 cartes de stats avec icônes
- Placeholder pour "Revenue Overview Chart"
- Tableau des commandes récentes avec lien vers `/admin/orders/[id]`

---

### 2. **Produits** (`/admin/products`)
**File**: `src/app/[locale]/admin/products/page.tsx`

**Features**:
- ✅ **Drag & Drop** pour réorganiser les produits (dnd-kit)
- 🔍 Recherche par nom/slug
- 🏷️ Filtrer par status (DRAFT, ACTIVE, INACTIVE, ARCHIVED)
- 📊 Statistiques : Total, Active, Draft, Featured
- 🖼️ Images miniatures avec fallback Package icon
- 💰 Affichage multi-devise (CAD/USD)
- 📦 Stock total par produit
- ✏️ Edit product → `/admin/products/[id]/edit`
- 🗑️ Delete product avec confirmation

**Colonnes du tableau**:
| Grip | Product | Status | Price | Stock | Variants | Actions |
|------|---------|--------|-------|-------|----------|---------|

**États de produit**:
- DRAFT → bg-gray-100
- ACTIVE → bg-green-100
- INACTIVE → bg-yellow-100
- ARCHIVED → bg-red-100

---

### 3. **Commandes** (`/admin/orders`)
**File**: `src/app/[locale]/admin/orders/page.tsx`

**Features**:
- 📑 Pagination (20 items/page)
- 🔍 Recherche (order number, email)
- 🏷️ Filtrer par status
- Appel à `GET /api/admin/orders`
- Lien vers détail : `/admin/orders/[id]`

**Colonnes du tableau**:
| Order # | Customer | Date | Total | Status | Payment Method | Actions |
|---------|----------|------|-------|--------|-----------------|---------|

---

### 4. **Clients** (`/admin/customers`)
**File**: `src/app/[locale]/admin/customers/page.tsx`

⚠️ À explorer en détail

---

### 5. **Analytique** (`/admin/analytics`)
**File**: `src/app/[locale]/admin/analytics/page.tsx`

⚠️ À explorer en détail

---

### 6. **Contenu** (`/admin/content`)
**File**: `src/app/[locale]/admin/content/page.tsx`

⚠️ À explorer en détail

---

### 7. **Paramètres** (`/admin/settings`)
**File**: `src/app/[locale]/admin/settings/page.tsx`

⚠️ À explorer en détail

---

## 🔌 Admin API Endpoints

### **Products Management**

#### `POST /api/admin/products`
**Crée un nouveau produit**
```typescript
Body: {
  slug: string (required, unique)
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  isFeatured?: boolean
  sortOrder?: number
  translations?: [
    { language: 'EN', name, description?, ... },
    { language: 'FR', name, description?, ... }
  ]
}

Response: { success: true, product, message, timestamp }
Status: 201
```

**Middleware Stack**:
1. `withRateLimit` (ADMIN limits)
2. `withAdmin` (vérifier ADMIN role)
3. `withError` (error handling)

**Validation**: Zod schema + unique slug check

**Erreurs**:
- 400: Validation failed / Duplicate slug
- 500: Unknown error

---

#### `GET /api/admin/products?language=EN&status=...`
**Récupère les produits**

**Response**: Array of products with:
- id, slug, status, isFeatured, sortOrder
- translations[]
- variants[] (with pricing & inventory)
- media[] (url, isPrimary)
- timestamps

---

#### `DELETE /api/admin/products/[id]`
**Supprime un produit**

**Frontend calls**: `fetch('/api/admin/products/{id}', { method: 'DELETE' })`

---

#### `PUT /api/admin/products/reorder`
**Réorganise les produits (drag & drop)**
```typescript
Body: {
  products: [
    { id: string, sortOrder: number },
    ...
  ]
}
```

**Flow in Frontend**:
1. User drags product → `handleDragEnd`
2. Update local state with new sortOrder
3. POST to `/api/admin/products/reorder`
4. On error → reload products from server

---

#### `GET/POST/PUT /api/admin/products/[id]`
**Détail/édition d'un produit**

---

#### `POST/GET/PUT /api/admin/products/[id]/variants`
**Gestion des variantes**

---

#### `PUT /api/admin/products/[id]/variants/[variantId]`
**Éditer une variante spécifique**

---

### **Orders Management**

#### `GET /api/admin/orders?page=1&limit=20&status=...&search=...`
**Liste les commandes avec pagination et filtres**

**Query Validation** (Zod):
```typescript
{
  page: number (default: 1)
  limit: number (default: 20, max: 100)
  status?: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  search?: string (searches: orderNumber, email)
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    orders: [
      {
        id, orderNumber, totalAmount, currency, status, createdAt,
        user: { id, email, firstName, lastName },
        items: [
          { product: { slug, translations }, variant: { sku } }
        ],
        payments: [{ method, externalId, status }]
      }
    ],
    pagination: { page, limit, total, totalPages }
  }
}
```

**Middleware**: withRateLimit → withAdmin → withError

---

#### `PATCH /api/admin/orders/[id]/status`
**Change le statut d'une commande**

```typescript
Body: {
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED',
  comment?: string
}
```

**State Transitions** (validées côté serveur):
```
PENDING → [PAID, CANCELLED]
PAID → [SHIPPED, REFUNDED]
SHIPPED → [DELIVERED]
DELIVERED → [REFUNDED]
CANCELLED → [] (terminal)
REFUNDED → [] (terminal)
```

**Response**:
```typescript
{
  success: true,
  data: {
    id, orderNumber, status,
    statusHistory: [{ status, comment, createdBy, createdAt }]
  }
}
```

**Logging** : Chaque changement enregistré avec userId, previousStatus, newStatus

**Erreurs**:
- 400: Invalid transition (affiche les transitions valides)
- 404: Order not found
- 500: Server error

---

### **Media Management**

#### `POST /api/admin/media/upload`
**Upload une image**

---

#### `GET /api/admin/media`
**Liste les médias**

---

#### `DELETE /api/admin/media/[id]`
**Supprime un média**

---

#### `PUT /api/admin/media/reorder`
**Réorganise les médias**

---

### **Attributes Management**

#### `GET/POST /api/admin/attributes`
**Gestion des attributs produits**

#### `GET/POST /api/admin/attributes/[id]/values`
**Valeurs d'un attribut**

---

## 🎨 UI Components

### Admin Layout
- **AdminSidebar** (`src/components/admin/layout/admin-sidebar.tsx`)
  - Menu items : Dashboard, Products, Orders, Customers, Analytics, Content, Settings
  - Breadcrumb locale-aware
  - "Back to site" footer link
  - Current page highlight

- **AdminHeader** (`src/components/admin/layout/admin-header.tsx`)
  - Welcome message
  - Notification bell (placeholder)
  - Clerk UserButton

---

### Status Badge Component
Used in Orders table :
- Color-coded by status
- Example: `<StatusBadge status="PAID" />`

---

### Order Filters Component
`<OrderFilters locale={locale} />`
- Search input
- Status dropdown
- Reset filters

---

## 🔐 Security & Permissions

1. **Authentication** (Clerk)
   - Every admin page requires `auth()` check
   - Redirect to `/sign-in` if not authenticated

2. **Authorization** (RBAC)
   - Only `UserRole.ADMIN` can access `/admin/*`
   - Checked in layout.tsx
   - Redirect to `/` if not admin

3. **Rate Limiting**
   - Admin endpoints use `RateLimits.ADMIN` profile
   - Stricter than user endpoints

4. **Middleware Stack** (for all admin endpoints)
   ```
   withError → withAdmin → withRateLimit → handler
   ```

---

## 📊 Data Flow Example: Créer un Produit

```
1. User clique "New Product" button
   ↓
2. Navigate to `/admin/products/new`
   ↓
3. Admin Product Form (client component)
   - Input: slug, translations (FR/EN), status, etc.
   ↓
4. Form Submit → POST /api/admin/products
   ↓
5. API validates with Zod schema
   - Check unique slug
   ↓
6. If valid → Create in Prisma
   - Product + ProductTranslation records
   ↓
7. Response with 201 + product object
   ↓
8. Frontend redirects to edit page or product list
   ↓
9. Product now visible in /admin/products table
```

---

## 📊 Data Flow Example: Changer le Statut d'une Commande

```
1. Admin opens /admin/orders/[id]
   ↓
2. Displays current order details + status
   ↓
3. Admin selects new status (e.g., PENDING → PAID)
   ↓
4. PATCH /api/admin/orders/[id]/status
   Body: { status: 'PAID', comment: 'Payment received' }
   ↓
5. Server validates:
   - Check current status
   - Check transition is valid (PENDING → PAID ✓)
   ↓
6. Update order + create StatusHistory record
   - Record: { status: 'PAID', comment, createdBy: adminId, createdAt }
   ↓
7. Log the change (info level)
   ↓
8. Return updated order with new statusHistory
   ↓
9. Frontend displays confirmation
   ↓
10. Order status badge updates in UI
```

---

## 🚨 Error Handling

### API Errors
- **400** : Bad request (validation, invalid state transition)
- **404** : Not found (product, order, etc.)
- **500** : Server error (unhandled exception)

All responses include:
- `success: boolean`
- `error?: string`
- `requestId?: string` (for tracing)
- `timestamp: ISO string`

### Frontend Errors
- Try/catch around fetch calls
- Alert user on failure
- Retry buttons available
- Loading states during async operations

---

## 📈 Performance Considerations

1. **Pagination** : Orders limited to 20 per page
2. **Query Optimization** : 
   - Select only needed fields
   - Include relationships selectively
3. **Caching** : None currently (force-dynamic on all admin pages)
4. **Images** : Miniatures shown in product table
5. **Drag & Drop** : Uses dnd-kit (efficient library)

---

## 🎯 Key Statistics

| Metric | Value |
|--------|-------|
| Total Admin Pages | 7 |
| API Endpoints | 15+ |
| Middleware Layers | 3 (Error → Admin → RateLimit) |
| Supported Languages | FR, EN |
| Order Status Values | 6 (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED) |
| Product Status Values | 4 (DRAFT, ACTIVE, INACTIVE, ARCHIVED) |

---

## ✅ TODO / Next Steps

- [ ] Explore `/admin/customers` page details
- [ ] Explore `/admin/analytics` page and data sources
- [ ] Explore `/admin/content` page
- [ ] Explore `/admin/settings` page
- [ ] Document product edit flow (`/admin/products/[id]/edit`)
- [ ] Document order details page (`/admin/orders/[id]`)
- [ ] Add integration tests for status transitions
- [ ] Add webhook logging for order status changes
