# API Categories - Gestion des catégories

## Vue d'ensemble

Endpoints pour lister et récupérer les catégories avec structure hiérarchique, breadcrumbs et comptage des produits.

---

## GET /api/categories

Liste les catégories avec arborescence complète (racine → enfants).

### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `language` | string | Filtrer traductions (`FR`, `EN`) |

### Requête

```bash
# Toutes les langues
curl http://localhost:3000/api/categories

# Français uniquement
curl "http://localhost:3000/api/categories?language=FR"
```

### Réponse (200 OK)

```json
{
  "success": true,
  "requestId": "57bee048-f7d7-4724-9375-b7689df7e5c7",
  "data": [
    {
      "id": "cmgbhqatv0009ksct1u1dq1vy",
      "slug": "electronics",
      "parentId": null,
      "sortOrder": 0,
      "isActive": true,
      "translations": [
        {
          "language": "FR",
          "name": "Électronique",
          "description": "Tous nos appareils électroniques"
        },
        {
          "language": "EN",
          "name": "Electronics",
          "description": "All our electronic devices"
        }
      ],
      "productsCount": 0,
      "children": [
        {
          "id": "cmgbhqb0p000kksct4ik306p8",
          "slug": "smartphones",
          "parentId": "cmgbhqatv0009ksct1u1dq1vy",
          "sortOrder": 0,
          "isActive": true,
          "translations": [
            { "language": "FR", "name": "Smartphones", "description": "..." }
          ],
          "productsCount": 3,
          "children": []
        },
        {
          "slug": "laptops",
          "productsCount": 3,
          "children": []
        }
      ]
    },
    {
      "slug": "clothing",
      "productsCount": 0,
      "children": [
        {
          "slug": "mens-clothing",
          "productsCount": 3,
          "children": []
        }
      ]
    }
  ],
  "timestamp": "2025-10-04T00:35:43.076Z"
}
```

### Structure hiérarchique

L'API retourne une arborescence complète :
- **Catégories racines** : `parentId: null`
- **Sous-catégories** : dans `children[]`
- **Comptage** : `productsCount` sur chaque catégorie
- **Tri** : par `sortOrder` ASC

### Utilisation

- **Navigation menu** : `GET /api/categories?language=FR`
- **Breadcrumbs** : Utiliser `path` dans GET /api/categories/[slug]
- **SEO** : Filtrer sur `isActive: true`

---

## GET /api/categories/[slug]

Récupère une catégorie avec enfants, comptage produits et breadcrumb path.

### Paramètres

- `slug` (path, required) - Slug unique de la catégorie
- `language` (query, optional) - Filtrer traductions (`FR`, `EN`)

### Requête

```bash
# Toutes les langues
curl http://localhost:3000/api/categories/smartphones

# Français uniquement
curl "http://localhost:3000/api/categories/smartphones?language=FR"
```

### Réponse (200 OK)

```json
{
  "success": true,
  "requestId": "a3f8c1d2-4b6e-4a9c-8d2e-1f7a9b3c5e8d",
  "data": {
    "id": "cmgbhqb0p000kksct4ik306p8",
    "slug": "smartphones",
    "parentId": "cmgbhqatv0009ksct1u1dq1vy",
    "sortOrder": 0,
    "isActive": true,
    "translations": [
      {
        "language": "FR",
        "name": "Smartphones",
        "description": "Téléphones intelligents"
      }
    ],
    "productsCount": 3,
    "children": [],
    "path": [
      {
        "slug": "electronics",
        "translations": [{ "language": "FR", "name": "Électronique" }]
      },
      {
        "slug": "smartphones",
        "translations": [{ "language": "FR", "name": "Smartphones" }]
      }
    ]
  },
  "meta": {
    "isActive": true,
    "hasChildren": false,
    "childrenCount": 0,
    "productsCount": 3,
    "pathLength": 2
  },
  "timestamp": "2025-10-04T00:36:00.123Z"
}
```

### Réponse d'erreur (404 Not Found)

```json
{
  "success": false,
  "requestId": "74ab1a98-886b-442a-8e65-365d972e1914",
  "error": "Category not found",
  "timestamp": "2025-10-04T00:36:04.204Z"
}
```

### Breadcrumb path (SEO/UX)

Le champ `path` contient le chemin complet de la racine à la catégorie actuelle :

```json
"path": [
  { "slug": "electronics", "translations": [...] },
  { "slug": "smartphones", "translations": [...] }
]
```

**Utilisation pour breadcrumbs :**
```javascript
const breadcrumbs = category.path.map(cat => ({
  name: cat.translations[0].name,
  url: `/categories/${cat.slug}`
}));
// → Électronique > Smartphones
```

### Métadonnées

- `isActive`: Catégorie visible (→ `false` = noindex SEO)
- `hasChildren`: Possède des sous-catégories
- `childrenCount`: Nombre de sous-catégories
- `productsCount`: Nombre de produits dans cette catégorie
- `pathLength`: Profondeur de l'arborescence
- `seoIndex`: (optionnel) `false` si catégorie inactive

### Gestion des statuts

**Catégorie inactive :**
```json
{
  "data": { "isActive": false },
  "meta": {
    "isActive": false,
    "seoIndex": false
  }
}
```

---

## Tester avec Postman

### Collection recommandée

**1. Liste catégories arborescence**
```
GET http://localhost:3000/api/categories
```

**2. Catégories en français**
```
GET http://localhost:3000/api/categories?language=FR
```

**3. Détail catégorie racine**
```
GET http://localhost:3000/api/categories/electronics?language=FR
```

**4. Détail sous-catégorie avec path**
```
GET http://localhost:3000/api/categories/smartphones?language=FR
```

**5. Catégorie inexistante (404)**
```
GET http://localhost:3000/api/categories/slug-invalide
```

---

## Notes techniques

### Headers de réponse

- `X-Request-ID`: UUID unique pour traçabilité

### Journalisation

Toutes les requêtes sont loggées avec `requestId` pour debug.

### Arborescence optimisée

L'API construit l'arbre hiérarchique côté serveur :
- Requête unique vers la DB
- Construction récursive de l'arbre
- Tri par `sortOrder` ASC

### Filtres automatiques

- Soft delete: exclusion automatique des `deletedAt != null`
- Tri: toujours par `sortOrder` ASC
- Enfants: triés dans le même ordre

### Comptage produits

Le `productsCount` compte uniquement les produits **directs** de la catégorie (pas les produits des enfants).

### Performance

- Breadcrumb path: requêtes séquentielles (optimisable avec CTE)
- Cache recommandé: 1 heure (structure stable)
- Invalidation: sur création/modification catégorie
