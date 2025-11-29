# 🛡️ Validation Zod - Sécurité des données

## Vue d'ensemble

Zod est une librairie de validation TypeScript qui vérifie les données **à l'exécution**. Elle complète le RBAC (qui contrôle *qui* peut accéder) en validant *quoi* est envoyé.

**Version utilisée :** `zod@4.1.13`

---

## Pourquoi Zod ?

| Sans validation | Avec Zod |
|-----------------|----------|
| Prix négatif accepté → vente à perte | `z.number().positive()` → rejet |
| Stock décimal → bug inventaire | `z.number().int().min(0)` → rejet |
| Slug avec espaces → URL cassée | `z.regex(/^[a-z0-9-]+$/)` → rejet |
| SKU vide → confusion commandes | `z.string().min(1)` → rejet |

---

## Schémas implémentés

**Fichier :** `src/lib/schemas/product.schema.ts`

### CreateProductSchema

```typescript
{
  slug: string,           // lowercase, hyphens, 1-100 chars
  status?: ProductStatus, // DRAFT | ACTIVE | INACTIVE | ARCHIVED
  isFeatured?: boolean,
  sortOrder?: number,     // >= 0
  translations?: [{
    language: 'EN' | 'FR' | ...,
    name: string,         // 1-200 chars
    description?: string, // max 5000 chars
    metaTitle?: string,   // max 70 chars (SEO)
    metaDescription?: string // max 160 chars (SEO)
  }]
}
```

### CreateVariantSchema

```typescript
{
  sku: string,            // UPPERCASE, alphanumeric, 1-50 chars
  pricing: {
    price: number,        // > 0, max 999,999.99
    currency: string,     // 3 lettres (CAD, USD, EUR)
  },
  inventory?: {
    stock: number,        // entier >= 0
    lowStockThreshold?: number,
    trackInventory?: boolean,
    allowBackorder?: boolean
  }
}
```

---

## Routes protégées

| Route | Méthode | Schéma |
|-------|---------|--------|
| `/api/admin/products` | POST | `CreateProductSchema` |
| `/api/admin/products/[id]` | PUT | `UpdateProductSchema` |
| `/api/admin/products/[id]/variants` | POST | `CreateVariantsSchema` |

---

## Réponse d'erreur

Quand la validation échoue, l'API retourne :

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "slug", "message": "Slug must be lowercase with hyphens only" },
    { "field": "sortOrder", "message": "Sort order must be >= 0" }
  ],
  "timestamp": "2025-11-29T21:18:31.261Z"
}
```

**Status code :** `400 Bad Request`

---

## Utilisation dans une route

```typescript
import { CreateProductSchema, formatZodErrors } from '@/lib/schemas/product.schema';

async function handler(request: NextRequest) {
  const body = await request.json();
  
  const validation = CreateProductSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: formatZodErrors(validation.error),
    }, { status: 400 });
  }
  
  // validation.data contient les données validées et typées
  const product = await createProduct(validation.data);
}
```

---

## Couche de sécurité complète

```
Requête API
    ↓
[1] withRateLimit() → limite les requêtes par IP
    ↓
[2] withAdmin()     → vérifie le rôle ADMIN (RBAC)
    ↓
[3] Zod.safeParse() → valide le format des données
    ↓
[4] Service Layer   → logique métier
    ↓
[5] Prisma          → base de données
```

---

## Voir aussi

- [RBAC.md](./RBAC.md) - Contrôle d'accès par rôle
- [rate-limiting.md](./rate-limiting.md) - Protection contre les abus
