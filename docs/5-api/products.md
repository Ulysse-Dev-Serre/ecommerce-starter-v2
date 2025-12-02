# API Products

## Endpoints

### Public
- `GET /api/products` - Liste produits actifs avec filtres
  - **Query**: status, isFeatured, categorySlug, language, search, page, limit, sortBy, sortOrder
  - **Fichier**: `src/app/api/products/route.ts`

- `GET /api/products/[id]` - Détail produit avec variantes
  - **Params**: id (slug ou UUID)
  - **Fichier**: `src/app/api/products/[id]/route.ts`

### Admin - Produits
- `POST /api/admin/products` - Crée produit
  - **Auth**: Admin
  - **Body**: slug, status, isFeatured, sortOrder, translations[]
  - **Fichier**: `src/app/api/admin/products/route.ts`

- `GET /api/admin/products/[id]` - Détail produit (tous statuts)
  - **Auth**: Admin
  - **Params**: id
  - **Fichier**: `src/app/api/admin/products/[id]/route.ts`

- `PUT /api/admin/products/[id]` - Édite produit
  - **Auth**: Admin
  - **Body**: slug, status, isFeatured, sortOrder
  - **Fichier**: `src/app/api/admin/products/[id]/route.ts`

- `DELETE /api/admin/products/[id]` - Supprime produit (hard delete, cascade)
  - **Auth**: Admin
  - **Params**: id
  - **Fichier**: `src/app/api/admin/products/[id]/route.ts`

- `PUT /api/admin/products/reorder` - Réordonne produits (batch)
  - **Auth**: Admin
  - **Body**: products[{ id, sortOrder }]
  - **Fichier**: `src/app/api/admin/products/reorder/route.ts`

### Admin - Attributs
- `GET /api/admin/attributes` - Liste attributs avec valeurs
  - **Auth**: Admin
  - **Query**: language
  - **Fichier**: `src/app/api/admin/attributes/route.ts`

- `POST /api/admin/attributes` - Crée attribut
  - **Auth**: Admin
  - **Body**: key, inputType, isRequired, sortOrder, translations[]
  - **Fichier**: `src/app/api/admin/attributes/route.ts`

- `POST /api/admin/attributes/[id]/values` - Ajoute valeur à attribut
  - **Auth**: Admin
  - **Body**: value, translations[]
  - **Fichier**: `src/app/api/admin/attributes/[id]/values/route.ts`

### Admin - Variantes
- `GET /api/admin/products/[id]/variants` - Liste variantes produit
  - **Auth**: Admin
  - **Params**: id (productId)
  - **Fichier**: `src/app/api/admin/products/[id]/variants/route.ts`

- `POST /api/admin/products/[id]/variants` - Crée variantes (auto-gen ou manuel)
  - **Auth**: Admin
  - **Body**: generate + config OU variants[]
  - **Fichier**: `src/app/api/admin/products/[id]/variants/route.ts`

- `POST /api/admin/products/[id]/variants/simple` - Crée variantes (UI simple EN/FR)
  - **Auth**: Admin
  - **Body**: variants[{ nameEN, nameFR, priceCAD, priceUSD, stock }]
  - **Fichier**: `src/app/api/admin/products/[id]/variants/simple/route.ts`

- `GET /api/admin/products/[id]/variants/[variantId]` - Détail variante
  - **Auth**: Admin
  - **Params**: id, variantId
  - **Fichier**: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`

- `PUT /api/admin/products/[id]/variants/[variantId]` - Édite variante
  - **Auth**: Admin
  - **Body**: sku, pricing, inventory
  - **Fichier**: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`

- `DELETE /api/admin/products/[id]/variants/[variantId]` - Supprime variante
  - **Auth**: Admin
  - **Params**: id, variantId
  - **Fichier**: `src/app/api/admin/products/[id]/variants/[variantId]/route.ts`

## Notes
- SKU doit être unique dans toute la base
- 1 attribut par variante (généralement couleur)
- Packs/configurations = produits séparés
- Pricing actif seulement si isActive: true
