# 🔒 RBAC - Role-Based Access Control

## Vue d'ensemble

Système de contrôle d'accès basé sur les rôles pour protéger les routes API et les pages de l'application.

**Rôles disponibles** :
- `CLIENT` : Utilisateur standard
- `ADMIN` : Administrateur avec accès complet

---

## Middlewares de sécurité

### withAuth()

Protège les routes nécessitant une authentification (n'importe quel utilisateur connecté).

**Fichier** : `src/lib/middleware/withAuth.ts` (lignes 1-50)

**Utilisation** :
```typescript
import { withAuth } from '@/lib/middleware/withAuth';

async function handler(request: Request, authContext: AuthContext) {
  // authContext contient: userId, clerkId, email, role
  return NextResponse.json({ user: authContext });
}

export const GET = withError(withAuth(handler));
```

**Flux** :
1. Vérifie la session Clerk via `auth()`
2. Charge l'utilisateur depuis la DB
3. Passe `authContext` au handler
4. Codes de réponse : 401 (non auth) | 403 (pas synchronisé) | 200 (OK)

### withAdmin()

Protège les routes réservées aux administrateurs uniquement.

**Fichier** : `src/lib/middleware/withAuth.ts` (lignes 51-120)

**Utilisation** :
```typescript
import { withAdmin } from '@/lib/middleware/withAuth';

async function adminHandler(request: Request, authContext: AuthContext) {
  // Seuls les ADMIN peuvent accéder ici
  return NextResponse.json({ data: 'Admin data' });
}

export const POST = withError(withAdmin(adminHandler));
```

**Flux** :
1. Appelle `withAuth()` en interne
2. Vérify que `role === UserRole.ADMIN`
3. Codes de réponse : 401 (non auth) | 403 (rôle != ADMIN) | 200 (OK)

---

## Tableau des routes protégées

### Routes API Publiques (pas de middleware)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/products` | GET | Liste des produits |
| `/api/products/[slug]` | GET | Détail d'un produit |
| `/api/categories` | GET | Liste des catégories |
| `/api/categories/[slug]` | GET | Détail d'une catégorie |
| `/api/webhooks/clerk` | POST | Webhook Clerk (signature vérifiée) |
| `/api/webhooks/stripe` | POST | Webhook Stripe (signature vérifiée) |
| `/api/internal/health` | GET | Health check |

### Routes authentifiées (withAuth)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/orders` | GET | Liste commandes utilisateur |
| `/api/orders/[id]` | GET | Détail commande (vérif propriété) |
| `/api/cart` | GET | Récupérer panier utilisateur |
| `/api/cart/lines` | POST/PUT/DELETE | Gérer panier |

### Routes Admin (withAdmin)

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/admin/products` | GET/POST | Liste/crée produits |
| `/api/admin/products/[id]` | GET/PUT/DELETE | Édite/supprime produit |
| `/api/admin/attributes` | GET/POST | Gère attributs |
| `/api/admin/orders` | GET | Liste toutes les commandes |
| `/api/admin/orders/[id]` | GET | Détail commande (admin) |
| `/api/admin/orders/[id]/status` | PATCH | Change statut commande |
| `/api/users` | GET | Liste utilisateurs |
| `/api/users/[id]/promote` | POST | Changer rôle utilisateur |

---

## Bonnes pratiques

### 1. Middleware stack order

Toujours appliquer `withError` en dernier :

```typescript
// ✅ Correct
export const POST = withError(withAdmin(withRateLimit(handler, RateLimits.ADMIN)));

// ❌ Incorrect
export const POST = withAdmin(withError(handler));
```

### 2. AuthContext dans les handlers

Le contexte d'authentification est passé en dernier paramètre :

```typescript
async function handler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
  authContext: AuthContext  // Ajouté par withAuth/withAdmin
) {
  console.log(authContext.userId);
  console.log(authContext.role);
}
```

### 3. Vérification de propriété

Pour les ressources utilisateur, vérifier que l'utilisateur en est propriétaire :

```typescript
async function getOrder(request: Request, { params }: {...}, authContext: AuthContext) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  
  // CLIENT peut voir seulement ses commandes
  if (authContext.role === 'CLIENT' && order.userId !== authContext.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // ADMIN peut tout voir
  return NextResponse.json({ data: order });
}

export const GET = withError(withAuth(getOrder));
```

### 4. Routes publiques vs privées

**Publiques** (pas de middleware) :
- Listing produits/catégories
- Détail produit
- Health checks
- Webhooks (avec vérification de signature)

**Authentifiées** (`withAuth`) :
- Panier utilisateur
- Commandes utilisateur
- Profil utilisateur

**Admin** (`withAdmin`) :
- Gestion utilisateurs
- CRUD produits
- Dashboard admin
- Vue globale commandes

---

## Synthèse du workflow

```
Requête API
  ↓
Non protégé ? → Traiter directement
  ↓
withAuth/withAdmin présent ?
  ↓
Clerk session valide ?
  ↓
User synchronisé en DB ?
  ↓
withAdmin check : role = ADMIN ?
  ↓
✅ Accès autorisé → Traiter requête
```

**Résultats possibles** :
- 401 : Non authentifié ou session Clerk expirée
- 403 : Authentifié mais rôle insuffisant ou pas propriétaire de la ressource
- 200 : Autorisé

---

## Fichiers sources

- **Middlewares** : `src/lib/middleware/withAuth.ts`
- **Exemple route admin** : `src/app/api/users/route.ts`
- **Exemple promotion utilisateur** : `src/app/api/users/[id]/promote/route.ts`
- **Exemple protégé avec propriété** : `src/app/api/orders/[id]/route.ts`

---

## Testing

**Tester une route admin sans auth** (401) :
```bash
curl http://localhost:3000/api/admin/products
# Attendu : 401 Unauthorized
```

**Tester une route admin avec CLIENT** (403) :
```bash
# Se connecter comme CLIENT dans Clerk, puis :
curl http://localhost:3000/api/admin/products
# Attendu : 403 Forbidden
```

**Tester une route admin avec ADMIN** (200) :
```bash
# Se connecter comme ADMIN dans Clerk, puis :
curl http://localhost:3000/api/admin/products
# Attendu : 200 OK
```

Pour tester avec API keys de test, voir `test-authentication.md`.
