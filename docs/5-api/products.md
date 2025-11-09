# API Products - Gestion des produits

## Vue d'ensemble

Endpoints pour lister et récupérer les produits du catalogue avec pagination, filtres, tri et gestion des états d'indisponibilité.

---

## GET /api/products

Liste les produits avec pagination, filtres et tri.

### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | `1` | Numéro de page |
| `limit` | number | `20` | Max 100 produits/page |
| `status` | string | `ACTIVE` | `DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `featured` | boolean | - | Produits mis en avant |
| `category` | string | - | Slug de catégorie |
| `search` | string | - | Recherche (requiert `language`) |
| `language` | string | - | `FR`, `EN` |
| `sortBy` | string | `createdAt` | `createdAt`, `updatedAt`, `name`, `price` |
| `sortOrder` | string | `desc` | `asc`, `desc` |

### Requête

```bash
# Liste basique
curl http://localhost:3000/api/products

# Avec pagination et filtres
curl "http://localhost:3000/api/products?page=1&limit=10&featured=true&language=FR"

# Par catégorie
curl "http://localhost:3000/api/products?category=smartphones&sortBy=price&sortOrder=asc"

# Recherche
curl "http://localhost:3000/api/products?search=iPhone&language=FR"
```

### Réponse (200 OK)

```json
{
  "success": true,
  "requestId": "7eaac2d9-056d-40a6-b77b-f0c7b93ca1d1",
  "data": [
    {
      "id": "cmgbhqta8002xkspro4e68y1l",
      "slug": "iphone-15-pro",
      "status": "ACTIVE",
      "isFeatured": true,
      "translations": [
        {
          "language": "FR",
          "name": "iPhone 15 Pro",
          "description": "Le dernier iPhone avec puce A17 Pro...",
          "shortDescription": "Smartphone Apple dernière génération"
        }
      ],
      "variants": [
        {
          "id": "cmgbhqtdk0033ksprcli2w698",
          "sku": "IPH15PRO-128-BLACK",
          "pricing": [{ "price": "1299.99", "currency": "CAD", "priceType": "base" }],
          "inventory": { "stock": 50, "lowStockThreshold": 10 },
          "attributeValues": [
            {
              "attributeValue": {
                "value": "black",
                "attribute": { "key": "color" },
                "translations": [{ "language": "FR", "displayName": "Noir" }]
              }
            }
          ],
          "media": [{ "url": "https://...", "alt": "...", "isPrimary": true }]
        }
      ],
      "categories": [
        { "category": { "slug": "smartphones", "translations": [...] } }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 9,
    "totalPages": 1
  },
  "timestamp": "2025-10-03T23:45:32.123Z"
}
```

### Utilisation

- **Storefront** : `GET /api/products?status=ACTIVE&page=1&limit=12&language=FR`
- **Admin** : `GET /api/products?sortBy=updatedAt&sortOrder=desc`
- **Featured** : `GET /api/products?featured=true&limit=4`
- **Catégorie** : `GET /api/products?category=smartphones&language=FR`

---

## GET /api/products/[slug]

Récupère un produit par son slug avec tous les détails.

### Paramètres

- `slug` (path, required) - Slug unique du produit
- `language` (query, optional) - Filtrer traductions (`FR`, `EN`)

### Requête

```bash
# Toutes les langues
curl http://localhost:3000/api/products/iphone-15-pro

# Français uniquement
curl "http://localhost:3000/api/products/iphone-15-pro?language=FR"
```

### Réponse (200 OK)

```json
{
  "success": true,
  "requestId": "a3f8c1d2-4b6e-4a9c-8d2e-1f7a9b3c5e8d",
  "data": {
    "id": "cmgbhqta8002xkspro4e68y1l",
    "slug": "iphone-15-pro",
    "status": "ACTIVE",
    "isFeatured": true,
    "translations": [
      { "language": "FR", "name": "iPhone 15 Pro", "description": "..." }
    ],
    "variants": [
      {
        "sku": "IPH15PRO-128-BLACK",
        "pricing": [{ "price": "1299.99", "currency": "CAD" }],
        "inventory": { "stock": 50 },
        "attributeValues": [...],
        "media": [...]
      }
    ],
    "categories": [...]
  },
  "meta": {
    "isAvailable": true,
    "isDraft": false,
    "hasStock": true,
    "variantsCount": 3
  },
  "timestamp": "2025-10-03T23:50:15.789Z"
}
```

### Réponse d'erreur (404 Not Found)

```json
{
  "success": false,
  "requestId": "b7d9e2f3-5c8a-4b1d-9e3f-2a6b8c4d7e9f",
  "error": "Product not found",
  "timestamp": "2025-10-03T23:51:20.456Z"
}
```

### Métadonnées

- `isAvailable`: Disponible à l'achat (ACTIVE + stock ou backorder)
- `isDraft`: Produit en brouillon (→ noindex SEO)
- `hasStock`: Au moins une variante en stock
- `variantsCount`: Nombre de variantes
- `stockStatus`: `out_of_stock` si aucun stock

---

## Tester avec Postman

### Collection recommandée

**1. Liste produits actifs**
```
GET http://localhost:3000/api/products?status=ACTIVE&language=FR
```

**2. Produits paginés**
```
GET http://localhost:3000/api/products?page=1&limit=5
```

**3. Produits featured**
```
GET http://localhost:3000/api/products?featured=true
```

**4. Recherche par catégorie**
```
GET http://localhost:3000/api/products?category=smartphones
```

**5. Détail produit**
```
GET http://localhost:3000/api/products/iphone-15-pro?language=FR
```

**6. Produit inexistant (404)**
```
GET http://localhost:3000/api/products/slug-invalide
```

---

## Notes techniques

### Headers de réponse

- `X-Request-ID`: UUID unique pour traçabilité

### Journalisation

Toutes les requêtes sont loggées avec `requestId` pour debug.

### Projection optimisée

- ✅ Inclus: id, slug, status, translations, variants actifs, prix actifs, stock
- ❌ Exclus: deletedAt, metadata internes

### Filtres automatiques

- Statut par défaut: `ACTIVE` (si non spécifié)
- Soft delete: exclusion automatique des `deletedAt != null`
- Prix: uniquement `isActive: true`

### Limites

- Max pagination: 100 produits/page
- Recommandé: 12-24 (storefront), 50 (admin)

---

## POST /api/products

**Protection**: ADMIN uniquement

Crée un nouveau produit.

### Requête

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "nouveau-produit",
    "status": "DRAFT",
    "isFeatured": false,
    "sortOrder": 0,
    "translations": [
      {
        "language": "FR",
        "name": "Nouveau Produit",
        "description": "Description complète",
        "shortDescription": "Description courte"
      }
    ]
  }'
```

### Réponse (201 Created)

```json
{
  "success": true,
  "product": {
    "id": "...",
    "slug": "nouveau-produit",
    "status": "DRAFT",
    "translations": [...]
  },
  "message": "Product created successfully",
  "timestamp": "2025-10-03T23:55:00.000Z"
}
```

---

## PUT /api/products/[id]

**Protection**: ADMIN uniquement

Modifie un produit existant.

### Requête

```bash
curl -X PUT http://localhost:3000/api/products/cmgbhqta8002xkspro4e68y1l \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE",
    "isFeatured": true
  }'
```

### Réponse (200 OK)

```json
{
  "success": true,
  "requestId": "...",
  "data": {
    "id": "cmgbhqta8002xkspro4e68y1l",
    "slug": "nouveau-produit",
    "status": "ACTIVE",
    "isFeatured": true
  },
  "message": "Product updated successfully",
  "timestamp": "2025-10-03T23:56:00.000Z"
}
```

---

## DELETE /api/products/[id]

**Protection**: ADMIN uniquement

Supprime un produit (soft delete).

### Requête

```bash
curl -X DELETE http://localhost:3000/api/products/cmgbhqta8002xkspro4e68y1l
```

### Réponse (200 OK)

```json
{
  "success": true,
  "product": {
    "id": "cmgbhqta8002xkspro4e68y1l",
    "slug": "nouveau-produit",
    "deletedAt": "2025-10-03T23:57:00.000Z"
  },
  "message": "Product deleted successfully",
  "timestamp": "2025-10-03T23:57:00.000Z"
}
```
