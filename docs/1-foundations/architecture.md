# Architecture du Projet

## 🏗️ **Vue d'Ensemble**

**Stack** : Next.js 15 + TypeScript + Clerk + PostgreSQL + Prisma + next-intl

## 📁 **Structure Complète du Projet**

```
/home/ulbo/Dev/ecommerce-starter-v2/
├── .env                                     # Variables environnement locales
├── .env.exemple                             # Template variables environnement
├── .gitignore                               # Fichiers ignorés par Git
├── .prettierrc.json                         # Configuration formatage code
├── dev.log                                  # Logs développement local
├── eslint.config.mjs                        # Configuration ESLint moderne
├── jest.config.js                           # Configuration tests Jest
├── next-env.d.ts                            # Types NextJS environnement
├── next.config.ts                           # Configuration NextJS application
├── package.json                             # Dépendances npm projet
├── package-lock.json                        # Lock versions exactes
├── postcss.config.mjs                       # Configuration PostCSS Tailwind
├── README.md                                # Documentation principale projet
├── tsconfig.json                            # Configuration TypeScript principale
├── tsconfig.eslint.json                     # Types TypeScript ESLint
│
├── docs/                                    # Documentation technique complète
│   ├── INDEX.md                             # Index navigation documentation
│   ├── 1-foundations/                       # Concepts base architecture
│   │   ├── architecture.md                  # Architecture technique système
│   │   ├── Roadmap.md                       # Feuille route développement
│   │   └── setup.md                         # Guide installation configuration
│   ├── 2-Language_internationalization/    # Système multi-langues i18n
│   │   ├── language-config.md               # Configuration langues système
│   │   └── seo_guidelines.md                # Guide SEO multilingue
│   ├── 3-development-tools/                # Outils qualité développement
│   │   ├── eslint-prettier.md               # Formatage automatique code
│   │   ├── logging.md                       # Système logs structurés
│   │   ├── theming.md 
│   │   └── security-headers.md              # Headers sécurité HTTP
│   └── 4-database-stack/                   # Base données PostgreSQL
│       ├── clerk-postgres-sync.md           # Synchronisation Clerk database
│       └── prisma-migrations.md             # Migrations schema database
│
├── prisma/                                  # ORM base données
│   ├── schema.prisma                        # Définition schema base
│   ├── seed.ts                              # Données initiales test
│   └── migrations/                          # Historique migrations SQL
│       ├── migration_lock.toml              # Lock migrations Prisma
│       └── 20250909181335_init/             # Migration initiale database
│           └── migration.sql                # Code SQL migration
│
├── public/                                  # Assets statiques publics  
│   ├── next.svg                             # Logo NextJS
│     
├── scripts/                                 # Scripts utilitaires développement
│   ├── reset-local.ts                       # Reset environnement local
│   ├── sync-clerk-users.ts                  # Synchronisation utilisateurs Clerk
│
├── src/                                     # Code source application
│   ├── middleware.ts                        # Middleware NextJS i18n
│   │
│   ├── app/                                 # NextJS App Router
│   │   ├── favicon.ico                      # Icône site navigateur
│   │   ├── globals.css                      # Styles CSS globaux
│   │   ├── [locale]/                        # Pages internationalisées
│   │   │   ├── layout.tsx                   # Layout principal Clerk
│   │   │   └── page.tsx                     # Page accueil multilingue
│   │   └── api/                             # Routes API REST
│   │       ├── internal/                    # APIs internes privées
│   │       │   └── health/                  # Health check system
│   │       │       └── route.ts             # Endpoint santé système
│   │       ├── users/                       # API publique utilisateurs
│   │       │   └── route.ts                 # CRUD endpoints utilisateurs
│   │       └── webhooks/                    # Webhooks externes
│   │           └── clerk/                   # Webhook synchronisation Clerk
│   │               └── route.ts             # Handler événements Clerk
│   │
│   ├── components/                          # Composants React réutilisables
│   │   └── layout/                          # Composants mise page
│   │       └── navbar.tsx                   # Navigation principale Clerk
│   │
│   ├── generated/                           # Code généré automatiquement
│   │   └── prisma/                          # Client Prisma généré
│   │       ├── client.d.ts                  # Types client principal
│   │       ├── client.js                    # Client JavaScript principal
│   │       ├── default.d.ts                 # Types export défaut
│   │       ├── default.js                   # Export défaut JavaScript
│   │       ├── edge.d.ts                    # Types runtime edge
│   │       ├── edge.js                      # Runtime edge computing
│   │       ├── index-browser.js             # Client navigateur web
│   │       ├── index.d.ts                   # Types index principal
│   │       ├── index.js                     # Point entrée principal
│   │       ├── libquery_engine-debian-openssl-3.0.x.so.node # Moteur binaire Linux
│   │       ├── package.json                 # Package client généré
│   │       ├── runtime/                     # Runtime execution différents
│   │       │   ├── edge-esm.js              # Runtime edge ESM
│   │       │   ├── edge.js                  # Runtime edge standard
│   │       │   ├── index-browser.d.ts       # Types navigateur
│   │       │   ├── index-browser.js         # Client navigateur
│   │       │   ├── library.d.ts             # Types librairie
│   │       │   ├── library.js               # Code librairie
│   │       │   ├── react-native.js          # Runtime React Native
│   │       │   ├── wasm-compiler-edge.js    # Compilateur WASM edge
│   │       │   └── wasm-engine-edge.js      # Moteur WASM edge
│   │       ├── schema.prisma                # Schema copié
│   │       ├── wasm.d.ts                    # Types WebAssembly
│   │       └── wasm.js                      # Runtime WebAssembly
│   │
│   └── lib/                                 # Logique métier utilitaires
│       ├── db/                              # Couche accès données
│       │   └── prisma.ts                    # Client Prisma singleton
│       ├── i18n/                            # Système internationalisation
│       │   ├── config.ts                    # Configuration langues supported
│       │   ├── utils.ts                     # Utilitaires next-intl
│       │   └── dictionaries/                # Traductions par langue
│       │       ├── en.json                  # Dictionnaire anglais
│       │       └── fr.json                  # Dictionnaire français
│       ├── logger.ts                        # Système logging structuré
│       ├── middleware/                      # Middlewares réutilisables
│       │   └── withError.ts                 # Gestion erreurs centralisée
│       └── services/                        # Couche logique métier
│           ├── user.service.ts              # Service CRUD utilisateurs
│           └── webhook.service.ts           # Service traitement webhooks
│
├── test-results/                            # Résultats exécution tests
│   └── .last-run.json                       # Cache dernière exécution
│
└── tests/                                   # Suite tests complète
    ├── README.md                            # Guide tests documentation
    ├── jest.setup.js                        # Configuration Jest globale
    ├── fixtures/                            # Données test statiques
    │   └── user-data.json                   # Jeu données utilisateurs
    ├── scripts/                             # Scripts outils tests
    │   ├── database-test.js                 # Tests connexion database
    │   ├── install-test-deps.js             # Installation dépendances tests
    │   ├── test-manual.js                   # Tests manuels debugging
    │   ├── test-webhook-client.js           # Client test webhooks
    │   └── webhook-debug.js                 # Debug webhooks développement
    ├── __tests__/                           # Tests organisés par
    │   ├── api/                             # Tests routes API
    │   │   ├── health.test.js               # Tests endpoint santé
    │   │   ├── users.test.js                # Tests API utilisateurs
    │   │   └── webhooks.test.js             # Tests webhooks Clerk
    │   ├── e2e/                             # Tests bout bout
    │   │   └── endpoints.test.js            # Tests intégration endpoints
    │   └── integration/                     # Tests intégration systèmes
    │       ├── clerk-sync.test.js           # Tests synchronisation Clerk
    │       └── database.test.js             # Tests connexion base
    └── utils/                               # Utilitaires tests partagés
        ├── mock-data.js                     # Données mock tests
        ├── setup.js                         # Configuration environnement tests
        └── test-client.js                   # Client HTTP tests
```

## 🔄 **Flux de Données**



## 🎯 **Principes Architecture**

### **Separation of Concerns**
- **Routes API** : Thin controllers (validation + response)
- **Services** : Business logic pure (testable)
- **Prisma** : Data access layer (singleton)
- **Middleware** : Cross-cutting concerns (erreurs, logs)

### **Single Responsibility**
- **1 service = 1 domaine métier** (users, webhooks, etc.)
- **1 route = 1 endpoint** (pas de logique complexe)
- **1 middleware = 1 responsabilité** (erreurs, auth, etc.)

### **Dependency Injection**
```typescript

// ✅ Après (singleton réutilisable)
import { prisma } from '@/lib/db/prisma'
```

## 🛠️ **Patterns Implémentés**

### **Singleton Pattern** (Prisma)
```typescript
// lib/db/prisma.ts
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
})
```

### **Service Layer Pattern**
```typescript
// lib/services/user.service.ts
export async function getAllUsers() {
  return prisma.user.findMany({ /* ... */ })
}

export async function createUserFromClerk(data: CreateUserData) {
  return prisma.user.create({ /* ... */ })
}
```

### **Error Handling Pattern**
```typescript
// lib/middleware/withError.ts
export function withError(handler: ApiHandler) {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (error) {
      logger.error(error)
      return NextResponse.json({ error: '...' }, { status: 500 })
    }
  }
}
```

## 📊 **Performance & Scalabilité**

### **Optimisations Implémentées**
- **Prisma Singleton** : Évite les fuites de connexion
- **Logging Structuré** : JSON logs pour monitoring
- **Error Boundaries** : Gestion centralisée des erreurs
- **Service Layer** : Code réutilisable et testable

### **Prêt pour Scale**
- **Horizontal** : Services isolés → microservices faciles
- **Vertical** : Prisma connection pooling ready
- **Monitoring** : Logs structurés → APM integration
- **Testing** : Services mockables → CI/CD ready

## 🧪 **Testabilité**

### **Unit Tests** (Services)
```typescript
// __tests__/services/user.service.test.ts
import { createUserFromClerk } from '@/lib/services/user.service'

// Mock Prisma
jest.mock('@/lib/db/prisma')

test('should create user from Clerk data', async () => {
  const userData = { clerkId: 'user_123', email: 'test@example.com' }
  const result = await createUserFromClerk(userData)
  expect(result.email).toBe('test@example.com')
})
```

### **Integration Tests** (APIs)
```typescript
// __tests__/api/users.test.ts
import { GET } from '@/app/api/users/route'

test('GET /api/users should return users list', async () => {
  const request = new Request('http://localhost:3000/api/users')
  const response = await GET(request)
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data.success).toBe(true)
})
```

