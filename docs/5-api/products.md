# API Products - Gestion des produits

Documentation complète des endpoints API pour la gestion des produits, attributs et variantes.

---

## 📦 Produits

### GET /api/products
**Fichier**: `src/app/api/products/route.ts`  
**Accès**: Public  
**Utilité**: Liste les produits actifs avec pagination et filtres  

**Query params**:
- `status`: DRAFT | ACTIVE | INACTIVE | ARCHIVED
- `isFeatured`: boolean
- `categorySlug`: string
- `language`: EN | FR
- `search`: string
- `page`: number (défaut: 1)
- `limit`: number (défaut: 20)
- `sortBy`: createdAt | updatedAt | name | price
- `sortOrder`: asc | desc

**Usage front**: Page boutique, recherche produits, filtres

---

### GET /api/products/[slug]
**Fichier**: `src/app/api/products/[slug]/route.ts`  
**Accès**: Public  
**Utilité**: Récupère un produit par son slug avec toutes les variantes

**Usage front**: Page détail produit, affichage variantes, sélection options

---

### POST /api/admin/products
**Fichier**: `src/app/api/admin/products/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Crée un nouveau produit

**Body**:
```json
{
  "slug": "soil-sensor",
  "status": "DRAFT",
  "isFeatured": false,
  "sortOrder": 0,
  "translations": [
    { "language": "EN", "name": "...", "description": "..." },
    { "language": "FR", "name": "...", "description": "..." }
  ]
}
```

**Usage front**: Formulaire création produit

---

### GET /api/admin/products/[id]
**Fichier**: `src/app/api/admin/products/[id]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Récupère un produit par ID (tous statuts)

**Usage front**: Page édition produit

---

### PUT /api/admin/products/[id]
**Fichier**: `src/app/api/admin/products/[id]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Met à jour un produit

**Body**:
```json
{
  "slug": "new-slug",
  "status": "ACTIVE",
  "isFeatured": true,
  "sortOrder": 10
}
```

**Usage front**: Formulaire édition produit

---

### DELETE /api/admin/products/[id]
**Fichier**: `src/app/api/admin/products/[id]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Supprime définitivement un produit (hard delete)

**Usage front**: Bouton supprimer dans liste produits

---

## 🎨 Attributs

### GET /api/admin/attributes
**Fichier**: `src/app/api/admin/attributes/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Liste tous les attributs avec leurs valeurs

**Query params**:
- `language`: EN | FR (filtre les traductions)

**Usage front**: Sélecteur d'attributs pour variantes

---

### POST /api/admin/attributes
**Fichier**: `src/app/api/admin/attributes/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Crée un nouvel attribut

**Body**:
```json
{
  "key": "color",
  "inputType": "select",
  "isRequired": true,
  "sortOrder": 1,
  "translations": [
    { "language": "EN", "name": "Color" },
    { "language": "FR", "name": "Couleur" }
  ]
}
```

**Usage front**: Formulaire création attribut

---

### POST /api/admin/attributes/[id]/values
**Fichier**: `src/app/api/admin/attributes/[id]/values/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Ajoute une valeur à un attribut

**Body**:
```json
{
  "value": "green",
  "translations": [
    { "language": "EN", "displayName": "Green" },
    { "language": "FR", "displayName": "Vert" }
  ]
}
```

**Usage front**: Formulaire gestion valeurs d'attributs

---

## 🔀 Variantes

### GET /api/admin/products/[id]/variants
**Fichier**: `src/app/api/admin/products/[id]/variants/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Liste toutes les variantes d'un produit

**Usage front**: Page édition produit, tableau des variantes

---

### POST /api/admin/products/[id]/variants
**Fichier**: `src/app/api/admin/products/[id]/variants/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Crée des variantes (mode manuel OU auto-génération)

**Mode auto-génération**:
```json
{
  "generate": true,
  "config": {
    "attributeId": "attr-color-id",
    "defaultPricing": {
      "price": 49.99,
      "currency": "CAD"
    },
    "defaultInventory": {
      "stock": 0,
      "trackInventory": true
    },
    "skuPattern": "PROD-{attr}"
  }
}
```

**Mode manuel**:
```json
{
  "variants": [
    {
      "sku": "PROD-GREEN",
      "attributeValueIds": ["color-green-id"],
      "pricing": { "price": 49.99 },
      "inventory": { "stock": 100 }
    }
  ]
}
```

**Usage front**: 
- Formulaire création produit (auto-génération)
- Ajout manuel de variantes

---

### GET /api/admin/products/[id]/variants/[variantId]
**Fichier**: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Récupère une variante spécifique

**Usage front**: Détails d'une variante

---

### PUT /api/admin/products/[id]/variants/[variantId]
**Fichier**: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Met à jour une variante

**Body**:
```json
{
  "sku": "NEW-SKU",
  "pricing": {
    "price": 59.99,
    "currency": "CAD"
  },
  "inventory": {
    "stock": 50,
    "trackInventory": true,
    "allowBackorder": false
  }
}
```

**Usage front**: Formulaire édition variante, tableau variantes

---

### DELETE /api/admin/products/[id]/variants/[variantId]
**Fichier**: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`  
**Accès**: Admin uniquement  
**Utilité**: Supprime définitivement une variante

**Usage front**: Bouton supprimer dans tableau variantes

---

## 🔄 Workflow typique

### Création d'un produit avec variantes

1. **Créer les attributs** (une fois)
   ```
   POST /api/admin/attributes → Couleur
   POST /api/admin/attributes/[id]/values → Vert, Blanc, Noir
   ```

2. **Créer le produit**
   ```
   POST /api/admin/products → Produit "Soil Sensor - Single"
   ```

3. **Générer les variantes automatiquement**
   ```
   POST /api/admin/products/[id]/variants
   {
     "generate": true,
     "config": {
       "attributeId": "couleur-id",
       ...
     }
   }
   → Génère 3 variantes (1 par couleur : vert, blanc, noir)
   ```

4. **Ajuster les prix/stocks individuellement**
   ```
   PUT /api/admin/products/[id]/variants/[variantId]
   → Modifier le prix ou le stock d'une couleur spécifique
   ```

5. **Pour les packs/configurations différentes** : créer de nouveaux produits
   ```
   POST /api/admin/products → Produit "Soil Sensor - 3 Pack"
   POST /api/admin/products/[id]/variants → Générer variantes couleur
   ```

---

## 📊 Structure des données

### ProductProjection (retourné par GET /api/products)
```typescript
{
  id: string
  slug: string
  status: ProductStatus
  isFeatured: boolean
  translations: [
    { language: "EN", name: "...", description: "..." }
  ]
  variants: [
    {
      id: string
      sku: string
      pricing: [{ price: Decimal, currency: string }]
      inventory: { stock: number, trackInventory: boolean }
      attributeValues: [
        {
          attributeValue: {
            value: "green",
            attribute: { key: "color" },
            translations: [{ language: "EN", displayName: "Green" }]
          }
        }
      ]
    }
  ]
  categories: [...]
  media: [...]
}
```

---

## 🎯 Cas d'usage front-end

### Page boutique publique
```typescript
// Lister les produits actifs
GET /api/products?status=ACTIVE&language=FR&page=1

// Afficher un produit avec ses variantes
GET /api/products/soil-sensor
// → Affiche couleurs et quantités disponibles
// → Calcule le prix selon la sélection
```

### Page admin - Création produit
```typescript
// 1. Charger les attributs disponibles
GET /api/admin/attributes?language=FR

// 2. Créer le produit
POST /api/admin/products

// 3. Générer toutes les variantes
POST /api/admin/products/[id]/variants
{
  generate: true,
  config: { attribute1Id, attribute2Id, ... }
}

// 4. Ajuster certaines variantes
PUT /api/admin/products/[id]/variants/[variantId]
```

### Page admin - Édition produit
```typescript
// 1. Charger le produit
GET /api/admin/products/[id]

// 2. Charger les variantes
GET /api/admin/products/[id]/variants

// 3. Modifier le produit
PUT /api/admin/products/[id]

// 4. Modifier une variante
PUT /api/admin/products/[id]/variants/[variantId]

// 5. Supprimer une variante
DELETE /api/admin/products/[id]/variants/[variantId]
```

---

## ⚠️ Notes importantes

1. **SKU unique**: Chaque variante doit avoir un SKU unique dans toute la base
2. **1 attribut par variante**: Chaque variante a exactement 1 attribut (généralement couleur)
3. **Configurations = produits séparés**: Les packs/quantités différentes sont des produits distincts
4. **Hard delete**: Les suppressions sont définitives (pas de soft delete)
5. **Cascade**: Supprimer un produit supprime toutes ses variantes
6. **Pricing actif**: Seuls les pricing avec `isActive: true` sont retournés
7. **Inventory tracking**: Si `trackInventory: false`, le stock est illimité

---

## 🔐 Authentification

- Routes `/api/products/*`: Public (lecture seule)
- Routes `/api/admin/*`: Nécessite rôle ADMIN
- Auth bypass pour tests: header `x-test-api-key` (dev uniquement)
