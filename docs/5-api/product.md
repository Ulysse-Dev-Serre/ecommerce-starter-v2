# API Products - Gestion des produits

## Vue d'ensemble

Endpoints pour la gestion des produits avec support multilingue et soft delete.

---

## POST /api/products

Crée un nouveau produit avec support optionnel des traductions multilingues.

### Requête minimale

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "mon-produit-test"
  }'
```

### Requête complète

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "t-shirt-premium",
    "status": "ACTIVE",
    "isFeatured": true,
    "sortOrder": 10,
    "translations": [
      {
        "language": "FR",
        "name": "T-Shirt Premium",
        "description": "Un t-shirt de qualité supérieure",
        "shortDescription": "T-shirt premium en coton bio",
        "metaTitle": "T-Shirt Premium - Boutique",
        "metaDescription": "Découvrez notre t-shirt premium en coton bio"
      },
      {
        "language": "EN",
        "name": "Premium T-Shirt",
        "description": "A high-quality t-shirt",
        "shortDescription": "Premium organic cotton t-shirt"
      }
    ]
  }'
```

### Paramètres du body

- `slug` (string, **required**) - Identifiant unique du produit (URL-friendly)
- `status` (string, optional) - Statut du produit : `DRAFT` (défaut), `ACTIVE`, `INACTIVE`, `ARCHIVED`
- `isFeatured` (boolean, optional) - Produit mis en avant (défaut: `false`)
- `sortOrder` (number, optional) - Ordre d'affichage (défaut: `0`)
- `translations` (array, optional) - Tableau de traductions multilingues

#### Format des traductions

- `language` (string, **required**) - Code langue : `FR`, `EN`, `ES`, `DE`, `IT`
- `name` (string, **required**) - Nom du produit
- `description` (string, optional) - Description complète
- `shortDescription` (string, optional) - Description courte
- `metaTitle` (string, optional) - Titre SEO
- `metaDescription` (string, optional) - Description SEO

### Réponse (201 Created)

```json
{
  "success": true,
  "product": {
    "id": "cm123abc456def789",
    "slug": "t-shirt-premium",
    "status": "ACTIVE",
    "isFeatured": true,
    "sortOrder": 10,
    "deletedAt": null,
    "createdAt": "2025-11-08T10:30:00.000Z",
    "updatedAt": "2025-11-08T10:30:00.000Z",
    "translations": [
      {
        "id": "cm123xyz789abc456",
        "productId": "cm123abc456def789",
        "language": "FR",
        "name": "T-Shirt Premium",
        "description": "Un t-shirt de qualité supérieure",
        "shortDescription": "T-shirt premium en coton bio",
        "metaTitle": "T-Shirt Premium - Boutique",
        "metaDescription": "Découvrez notre t-shirt premium en coton bio"
      },
      {
        "id": "cm123xyz789abc457",
        "productId": "cm123abc456def789",
        "language": "EN",
        "name": "Premium T-Shirt",
        "description": "A high-quality t-shirt",
        "shortDescription": "Premium organic cotton t-shirt",
        "metaTitle": null,
        "metaDescription": null
      }
    ]
  },
  "message": "Product created successfully",
  "timestamp": "2025-11-08T10:30:00.123Z"
}
```

### Réponse d'erreur (400 Bad Request)

```json
{
  "success": false,
  "error": "Invalid request data",
  "timestamp": "2025-11-08T10:30:00.123Z"
}
```

### Utilisation

- Créer des produits en brouillon (`DRAFT`) pour édition ultérieure
- Publier directement avec statut `ACTIVE`
- Support multilingue pour sites internationaux
- Produits mis en avant pour page d'accueil (`isFeatured: true`)

---

## DELETE /api/products/[id]

Supprime un produit (soft delete - le produit reste en base avec `deletedAt` défini).

### Paramètres

- `id` (string, required) - ID du produit dans PostgreSQL

### Requête

```bash
# Récupérer l'ID d'un produit existant
curl http://localhost:3000/api/products

# Supprimer le produit (remplacer [ID] par un vrai ID)
curl -X DELETE http://localhost:3000/api/products/[ID]
```

### Réponse (200 OK)

```json
{
  "success": true,
  "product": {
    "id": "cm123abc456def789",
    "slug": "t-shirt-premium",
    "status": "ACTIVE",
    "isFeatured": true,
    "sortOrder": 10,
    "deletedAt": "2025-11-08T11:00:00.000Z",
    "createdAt": "2025-11-08T10:30:00.000Z",
    "updatedAt": "2025-11-08T11:00:00.000Z"
  },
  "message": "Product deleted successfully",
  "timestamp": "2025-11-08T11:00:00.123Z"
}
```

### Réponse d'erreur (404 Not Found)

```json
{
  "success": false,
  "error": "Product not found",
  "timestamp": "2025-11-08T11:00:00.123Z"
}
```

### Logique de suppression

- **Soft delete** : Le produit n'est pas supprimé physiquement
- **deletedAt** : Timestamp de suppression enregistré
- **Masquage automatique** : Les produits supprimés n'apparaissent plus dans les listings
- **Récupération possible** : Modification manuelle de `deletedAt` en base si besoin
- **Intégrité référentielle** : Les relations (variants, médias, etc.) restent intactes

### Implémentation

- Service : `deleteProduct()` dans `product.service.ts`
- Validation : Vérification existence du produit
- Sécurité : Middleware `withError` pour gestion erreurs
- Audit : Logs structurés pour traçabilité

---

## Tests automatisés

### Jest

```bash
# Tests spécifiques products
npm test products.test.js
```

### Cas testés

**POST /api/products :**

- ✅ Création avec données minimales (slug uniquement)
- ✅ Création avec données complètes + traductions
- ✅ Structure de réponse correcte
- ✅ Erreur si slug manquant

**DELETE /api/products/[id] :**

- ✅ Suppression réussie avec soft delete
- ✅ Erreur 404 pour ID inexistant
- ✅ Erreur 404 pour produit déjà supprimé
- ✅ Structure de réponse correcte

### Résultats attendus

```
PASS tests/__tests__/api/products.test.js
Products API
  POST /api/products
    ✓ should create a product with minimal data successfully
    ✓ should create a product with full data successfully
    ✓ should have correct response structure
    ✓ should fail when slug is missing
  DELETE /api/products/[id]
    ✓ should delete a product successfully
    ✓ should return 404 for non-existent product
    ✓ should return 404 for already deleted product
    ✓ should have correct response structure

Test Suites: 1 passed, 1 total
Tests: 8 passed, 8 total
```

---

## Notes techniques

### Structure des données

- Table `Product` avec statut enum (`DRAFT`, `ACTIVE`, `INACTIVE`, `ARCHIVED`)
- Table `ProductTranslation` pour support multilingue
- Contrainte : slug unique
- Soft delete via champ `deletedAt`

### Multilingue

- Support de 5 langues : FR, EN, ES, DE, IT
- Traductions optionnelles à la création
- Relations cascade : suppression produit → suppression traductions
- Possibilité d'ajouter des traductions ultérieurement

### Évolutions futures

**Endpoints à ajouter :**

- `GET /api/products` - Lister tous les produits
- `GET /api/products/[id]` - Détails d'un produit
- `PATCH /api/products/[id]` - Modifier un produit
- `POST /api/products/[id]/translations` - Ajouter des traductions
- `GET /api/products/slug/[slug]` - Récupérer par slug

**Fonctionnalités prévues :**

- Upload et gestion des médias (images, vidéos)
- Variantes de produits (tailles, couleurs)
- Gestion des prix et promotions
- Gestion de l'inventaire
- Association aux catégories
- Avis clients et notes

### Sécurité

- Aucune authentification requise (développement)
- En production : ajouter middleware auth admin
- Logs automatiques de toutes les opérations CRUD
- Validation des données entrantes

### Base de données

- Relations : Product → Variants, Media, Categories, Reviews
- Indexation : slug, status, isFeatured, deletedAt
- Timestamps automatiques (createdAt, updatedAt)
- Soft delete pour traçabilité et récupération
