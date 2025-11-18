# Architecture du Projet

##  Architecture en Couches

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND (React 19 + Next.js App Router)          │
│  • Pages internationalisées [locale]/              │
│  • Composants UI réutilisables                     │
│  • Client-side state management                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  API LAYER (Next.js Route Handlers)                │
│  • Validation des requêtes                         │
│  • Gestion des réponses HTTP                       │
│  • Middleware d'authentification (RBAC)            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  SERVICE LAYER (Business Logic)                    │
│  • Services métier isolés et testables             │
│  • Logique de calcul et validation                 │
│  • Orchestration des opérations complexes          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  DATA ACCESS LAYER (Prisma ORM)                    │
│  • Client Prisma singleton                         │
│  • Requêtes base de données                        │
│  • Gestion des transactions                        │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│  DATABASE (PostgreSQL)                             │
│  • Données structurées relationnelles              │
│  • Migrations versionnées                          │
└─────────────────────────────────────────────────────┘
```

---

## Organisation du Code

### **Structure simplifiée**

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # Routes internationalisées (FR/EN)
│   │   ├── admin/          # Dashboard administration
│   │   ├── cart/           # Panier utilisateur
│   │   ├── checkout/       # Processus paiement
│   │   ├── product/        # Pages produits
│   │   └── shop/           # Catalogue boutique
│   └── api/                # API Routes REST
│       ├── admin/          # Endpoints admin (CRUD)
│       ├── cart/           # Gestion panier
│       ├── checkout/       # Sessions Stripe
│       ├── orders/         # Commandes
│       ├── products/       # Catalogue public
│       └── webhooks/       # Clerk + Stripe
│
├── components/             # Composants React
│   ├── admin/              # Interface administration
│   ├── cart/               # Composants panier
│   ├── layout/             # Header, Footer, Navigation
│   ├── product/            # Fiches produits
│   └── ui/                 # UI primitives (shadcn/ui)
│
└── lib/                    # Logique métier & utilitaires
    ├── db/                 # Prisma client singleton
    ├── i18n/               # Internationalisation (next-intl)
    ├── middleware/         # Middlewares réutilisables
    ├── services/           # Services métier
    │   ├── user.service.ts
    │   ├── product.service.ts
    │   ├── cart.service.ts
    │   ├── order.service.ts
    │   ├── inventory.service.ts
    │   ├── variant.service.ts
    │   └── attribute.service.ts
    ├── storage/            # Upload et gestion fichiers
    ├── stripe/             # Intégration paiement Stripe
    ├── utils/              # Fonctions utilitaires
    └── logger.ts           # Système logs structurés
```

---

## Principes Architecturaux

### **1. Separation of Concerns**

Chaque couche a une responsabilité unique :

- **Routes API** : Controllers minces (validation + réponse HTTP)
- **Services** : Logique métier pure et testable
- **Prisma** : Accès données uniquement
- **Middleware** : Préoccupations transversales (auth, logs, erreurs)


### **2. Single Responsibility**

- **1 service = 1 domaine métier** (users, products, cart, orders)
- **1 route = 1 endpoint** (pas de logique complexe)
- **1 middleware = 1 responsabilité** (auth, erreurs, logs)

### **3. Dependency Injection**

Utilisation de singletons et imports explicites :

```typescript
// Client Prisma réutilisable partout
import { prisma } from '@/lib/db/prisma';

// Services importés directement
import { createProduct } from '@/lib/services/product.service';
```

---

## Patterns Implémentés

### **Pattern 1 : Singleton (Prisma Client)**

Évite les fuites de connexion en développement avec Hot Module Replacement :

```typescript
// lib/db/prisma.ts
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### **Pattern 2 : Service Layer**

Services métier isolés et testables :

```typescript
// lib/services/product.service.ts
export async function getProducts(filters: ProductFilters) {
  return prisma.product.findMany({
    where: buildProductFilters(filters),
    include: { translations: true, variants: true },
  });
}

export async function createProduct(data: CreateProductData) {
  // Validation métier
  // Transformation données
  // Appel Prisma
  return prisma.product.create({ data });
}
```

### **Pattern 3 : Middleware Pattern**

Gestion centralisée des erreurs :

```typescript
// lib/middleware/withError.ts
export function withError(handler: ApiHandler) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error('API Error', { error });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
```

### **Pattern 4 : RBAC (Role-Based Access Control)**

Protection des routes par middleware :

```typescript
// lib/middleware/withAuth.ts
export function withAuth(handler: ApiHandler) {
  return async (req: Request, ...args: any[]) => {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, ...args);
  };
}

// lib/middleware/withAdmin.ts
export function withAdmin(handler: ApiHandler) {
  return withAuth(async (req: Request, ...args: any[]) => {
    const user = await getCurrentUser();
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req, ...args);
  });
}
```

---

## Flux de Données Typiques

### **Exemple : Ajout au panier**

```
1. User clique "Ajouter au panier"
   ↓
2. Component → POST /api/cart/lines
   ↓
3. Route handler valide requête
   ↓
4. addToCart(cartId, variantId, quantity) [Service]
   ↓
5. Prisma vérifie stock et crée CartItem
   ↓
6. Response JSON retournée au client
   ↓
7. UI met à jour le panier
```

### **Exemple : Webhook Stripe (paiement)**

```
1. Stripe envoie webhook payment_intent.succeeded
   ↓
2. POST /api/webhooks/stripe vérifie signature
   ↓
3. Service handlePaymentSuccess(paymentIntentId)
   ↓
4. Prisma met à jour Order.status → PAID
   ↓
5. Service decrementStock() pour chaque item
   ↓
6. (Optionnel) Email confirmation envoyé
   ↓
7. Response 200 OK à Stripe
```

---

## Performance & Scalabilité

### **Optimisations Actuelles**

✅ **Prisma Singleton** : Évite fuites de connexion  
✅ **Logging Structuré** : JSON logs (Winston + Pino)  
✅ **Error Boundaries** : Gestion centralisée des erreurs  
✅ **Service Layer** : Code réutilisable et testable  
✅ **Database Indexes** : Index sur clés étrangères et champs recherchés  
✅ **Soft Deletes** : `deletedAt` au lieu de suppression physique

### **Prêt pour Scale**

- **Horizontal** : Services isolés → migration microservices facilitée
- **Vertical** : Prisma connection pooling configuré
- **Monitoring** : Logs structurés → intégration APM (Sentry, Datadog)
- **Caching** : Architecture prête pour Redis (sessions, panier)

---

## Testabilité

L'architecture en couches facilite les tests unitaires et d'intégration. Les services sont isolés et mockables.

**Pour plus de détails** : [Documentation Tests](../6-test/)

---

## Sécurité

L'application implémente plusieurs mesures de sécurité :

- **Authentication** : Clerk (sessions sécurisées)
- **Authorization** : RBAC avec middlewares `withAuth` / `withAdmin`
- **Input Validation** : Validation dans services + Prisma schema
- **Webhook Security** : Vérification signatures (Clerk + Stripe)
- **SQL Injection** : Protection native Prisma (parameterized queries)

**Pour plus de détails** : [Documentation Sécurité](../7-securite/)

---

## Internationalisation (i18n)

Architecture multilingue avec routing localisé et traductions en base de données.

- **Routing** : `/fr/shop`, `/en/shop` (next-intl)
- **Traductions UI** : Dictionnaires JSON (`en.json`, `fr.json`)
- **Contenu DB** : Tables `*_translations` (Product, Category, Attributes)

**Pour plus de détails** : [Configuration i18n](../2-Language_internationalization/language-config.md)

---

## Ressources Complémentaires

- [Stack Technique](./stack-tech.md) - Technologies utilisées
- [Setup](./setup.md) - Installation et configuration
- [Roadmap](./Roadmap.md) - Évolution du projet
- [Base de données](../4-database-stack/prisma-migrations.md) - Schéma et migrations
- [Tests](../6-test/) - Stratégie de tests
- [Sécurité](../7-securite/) - Mesures de sécurité
- [Internationalisation](../2-Language_internationalization/) - Configuration i18n

---

**Dernière mise à jour** : Novembre 2024  
**Version** : 2.1 (Architecture simplifiée)
