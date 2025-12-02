# API Media

## Endpoints

### Admin
- `GET /api/admin/media` - Liste médias avec filtres
  - **Auth**: Admin
  - **Query**: productId, variantId, type (IMAGE|VIDEO|DOCUMENT), limit, offset
  - **Fichier**: `src/app/api/admin/media/route.ts`

- `POST /api/admin/media/upload` - Upload fichier média
  - **Auth**: Admin
  - **Body**: FormData { file, productId?, variantId?, type?, alt?, title?, isPrimary? }
  - **Formats**: JPEG, PNG, WebP, GIF, MP4, WebM, PDF (max 50MB)
  - **Storage**: Path=products/YYYY/{id} ou variants/YYYY/{id}
  - **Fichier**: `src/app/api/admin/media/upload/route.ts`

- `DELETE /api/admin/media/[id]` - Supprime média (BDD + storage)
  - **Auth**: Admin
  - **Params**: id (mediaId)
  - **Fichier**: `src/app/api/admin/media/[id]/route.ts`

- `PUT /api/admin/media/reorder` - Réordonne médias (batch)
  - **Auth**: Admin
  - **Body**: media[{ id, sortOrder }]
  - **Fichier**: `src/app/api/admin/media/reorder/route.ts`

## Notes
- 1 image primaire par produit/variante
- SortOrder contrôle ordre affichage
- Suppression stockage ignorée si fichier déjà absent (graceful)
- Types: IMAGE, VIDEO, DOCUMENT
- Organized par année pour scalabilité
