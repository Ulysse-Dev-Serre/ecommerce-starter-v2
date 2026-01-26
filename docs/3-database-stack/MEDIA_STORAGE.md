# 📁 Gestion du stockage des médias

## Vue d'ensemble

Ce projet utilise une **architecture abstraite** pour la gestion des fichiers médias (images, vidéos). Cela permet de démarrer avec un stockage local simple et de migrer facilement vers S3 ou Cloudinary plus tard.

## Architecture

```
src/lib/storage/
├── types.ts                      # Interfaces et types
├── storage.service.ts            # Factory et configuration
└── providers/
    ├── local.provider.ts         # Stockage local (implémenté)
    └── s3.provider.ts           # Stockage S3 (skeleton)

src/app/api/admin/media/
├── route.ts                      # GET /api/admin/media
├── upload/route.ts               # POST /api/admin/media/upload
└── [id]/route.ts                 # DELETE /api/admin/media/[id]
```

## Configuration

### Stockage local (par défaut)

Ajoutez à votre `.env` :

```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_UPLOAD_DIR=public/uploads
STORAGE_LOCAL_PUBLIC_PATH=/uploads
```

Les fichiers seront stockés dans `public/uploads/` avec cette structure :
```
public/uploads/
├── products/2024/product-id/
│   ├── 1704067200000-abc123.jpg
│   └── 1704067300000-def456.png
├── variants/2024/variant-id/
│   └── 1704067400000-ghi789.jpg
└── general/2024/
    └── 1704067500000-jkl012.jpg
```

### Migration vers S3

1. Installez le SDK AWS :
```bash
npm install @aws-sdk/client-s3
```

2. Implémentez la méthode `upload()` dans `s3.provider.ts` (instructions incluses dans les commentaires)

3. Configurez vos variables d'environnement :
```env
STORAGE_PROVIDER=s3
STORAGE_S3_BUCKET=your-bucket-name
STORAGE_S3_REGION=us-east-1
STORAGE_S3_ACCESS_KEY_ID=your-access-key
STORAGE_S3_SECRET_ACCESS_KEY=your-secret-key
# Optionnel pour DigitalOcean Spaces, Backblaze B2, etc.
STORAGE_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

4. **C'est tout !** Aucun changement de code nécessaire dans les endpoints.

## Endpoints API

### Upload d'un fichier

**POST** `/api/admin/media/upload`

FormData :
- `file` (File, required) : Le fichier à uploader
- `productId` (string, optional) : ID du produit
- `variantId` (string, optional) : ID de la variante
- `type` (IMAGE|VIDEO|DOCUMENT, optional) : Type de média (auto-détecté si non fourni)
- `alt` (string, optional) : Texte alternatif
- `title` (string, optional) : Titre
- `isPrimary` (boolean, optional) : Image principale ?

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('productId', 'prod_123');
formData.append('isPrimary', 'true');

const response = await fetch('/api/admin/media/upload', {
  method: 'POST',
  body: formData,
});
```

Réponse :
```json
{
  "success": true,
  "data": {
    "id": "media_123",
    "url": "/uploads/products/2024/prod_123/image.jpg",
    "type": "IMAGE",
    "sortOrder": 0,
    "isPrimary": true
  },
  "upload": {
    "filename": "1704067200000-abc123.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

### Liste des médias

**GET** `/api/admin/media?productId=prod_123`

Query params :
- `productId` (optional) : Filtrer par produit
- `variantId` (optional) : Filtrer par variante
- `type` (optional) : Filtrer par type (IMAGE, VIDEO, DOCUMENT)
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

### Suppression d'un média

**DELETE** `/api/admin/media/[id]`

Supprime le fichier du stockage ET de la base de données.

## Base de données

Le modèle `ProductMedia` dans Prisma :

```prisma
model ProductMedia {
  id        String    @id @default(cuid())
  variantId String?   // Optionnel : média lié à une variante
  productId String?   // Optionnel : média lié au produit
  url       String    // URL ou chemin du fichier
  type      MediaType @default(IMAGE)
  alt       String?
  title     String?
  sortOrder Int       @default(0)
  isPrimary Boolean   @default(false)
  createdAt DateTime  @default(now())
}
```

## Sécurité

- **Validation des types MIME** : Seuls images/vidéos/PDF autorisés
- **Limite de taille** : 50MB par fichier (configurable)
- **Authentification admin** : Tous les endpoints nécessitent le rôle ADMIN
- **Rate limiting** : Protection contre les abus

## Évolution future

- ✅ Stockage local implémenté
- 🔲 Stockage S3 (skeleton prêt)
- 🔲 Cloudinary (à implémenter)
- 🔲 Optimisation d'images automatique
- 🔲 Génération de thumbnails
- 🔲 Support CDN

## Exemple d'utilisation complète

```typescript
// 1. Upload d'une image pour un produit
const formData = new FormData();
formData.append('file', imageFile);
formData.append('productId', 'prod_abc123');
formData.append('alt', 'Photo principale du produit');
formData.append('isPrimary', 'true');

const uploadResponse = await fetch('/api/admin/media/upload', {
  method: 'POST',
  body: formData,
});

const { data: media } = await uploadResponse.json();
console.log('URL:', media.url); // /uploads/products/2024/prod_abc123/...

// 2. Récupérer toutes les images d'un produit
const listResponse = await fetch('/api/admin/media?productId=prod_abc123');
const { data: mediaList } = await listResponse.json();

// 3. Supprimer une image
await fetch(`/api/admin/media/${media.id}`, {
  method: 'DELETE',
});
```
