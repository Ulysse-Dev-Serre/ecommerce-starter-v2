# Admin API - Index

Index des endpoints admin. Voir les fichiers spécifiques pour détails.

## Endpoints par catégorie

### Produits
- `POST /api/admin/products` - Crée → [products.md](products.md)
- `GET /api/admin/products/[id]` - Détail → [products.md](products.md)
- `PUT /api/admin/products/[id]` - Édite → [products.md](products.md)
- `DELETE /api/admin/products/[id]` - Supprime → [products.md](products.md)
- `PUT /api/admin/products/reorder` - Réordonne → [products.md](products.md)

### Variantes
- `GET /api/admin/products/[id]/variants` - Liste → [products.md](products.md)
- `POST /api/admin/products/[id]/variants` - Crée (avancé) → [products.md](products.md)
- `POST /api/admin/products/[id]/variants/simple` - Crée (simple) → [products.md](products.md)
- `GET /api/admin/products/[id]/variants/[variantId]` - Détail → [products.md](products.md)
- `PUT /api/admin/products/[id]/variants/[variantId]` - Édite → [products.md](products.md)
- `DELETE /api/admin/products/[id]/variants/[variantId]` - Supprime → [products.md](products.md)

### Attributs
- `GET /api/admin/attributes` - Liste → [products.md](products.md)
- `POST /api/admin/attributes` - Crée → [products.md](products.md)
- `POST /api/admin/attributes/[id]/values` - Ajoute valeur → [products.md](products.md)

### Commandes
- `GET /api/admin/orders` - Liste → [orders.md](orders.md)
- `GET /api/admin/orders/[id]` - Détail → [orders.md](orders.md)
- `PATCH /api/admin/orders/[id]/status` - Change statut → [orders.md](orders.md)

### Médias
- `GET /api/admin/media` - Liste → [media.md](media.md)
- `POST /api/admin/media/upload` - Upload → [media.md](media.md)
- `DELETE /api/admin/media/[id]` - Supprime → [media.md](media.md)
- `PUT /api/admin/media/reorder` - Réordonne → [media.md](media.md)

## Codes HTTP
- 200/201: Succès
- 400: Validation échouée
- 401: Non authentifié
- 403: Non admin
- 404: Non trouvé
- 429: Rate limit
- 500: Erreur serveur

## Format réponse
```json
{ "success": true/false, "data": {...}, "error": "...", "requestId": "uuid", "timestamp": "..." }
```
