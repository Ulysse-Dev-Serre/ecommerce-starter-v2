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
│  • Validation des requêtes (Zod)                   │
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

## Statistiques du Projet

| Métrique | Nombre |
| --- | --- |
| **Total de fichiers** | 74 |
| **Pages Frontend** (`page.tsx`) | 24 |
| **Routes API** (`route.ts`) | 39 |
| **Fichiers TypeScript** (`.ts`, `.tsx`) | 129 + |

---

## Organisation du Code (Détails)

### 1. FRONTEND

#### Pages Principales (`src/app/[locale]`)
Structure de navigation du site utilisateur et administrateur.

```
src/app/[locale]
├── admin
│   ├── analytics
│   │   └── page.tsx
│   ├── categories
│   │   └── page.tsx
│   ├── customers
│   │   ├── [id]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── logistics
│   │   └── page.tsx
│   ├── orders
│   │   ├── [id]
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── products
│   │   ├── [id]
│   │   │   └── edit
│   │   │       └── page.tsx
│   │   ├── new
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
│ 
├── cart
│   ├── cart-client.tsx
│   └── page.tsx
├── checkout
│   ├── success
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── contact
│   └── page.tsx
├── (legal)
│   ├── privacy
│   │   └── page.tsx
│   ├── refund
│   │   └── page.tsx
│   ├── terms
│   │   └── page.tsx
│   └── layout.tsx
├── orders
│   ├── [id]
│   │   └── page.tsx
│   └── page.tsx
├── product
│   └── [slug]
│       ├── page.tsx
│       └── product-client.tsx
├── shop
│   └── page.tsx
├── layout.tsx
├── not-found.tsx
└── page.tsx
```

#### Composants (`src/components`)
Blocs UI réutilisables organisés par domaine.

```
src/components
├── admin
│   ├── analytics
│   │   ├── conversion-funnel.tsx
│   │   ├── revenue-chart.tsx
│   │   └── source-table.tsx
│   ├── customers
│   ├── layout
│   │   ├── admin-header.tsx
│   │   └── admin-sidebar.tsx
│   ├── logistics
│   │   ├── add-location-modal.tsx
│   │   └── logistics-client.tsx
│   └── orders
│       ├── filters.tsx
│       ├── order-detail-client.tsx
│       ├── shipping-management.tsx
│       └── status-actions.tsx
├── analytics
│   ├── AnalyticsTracker.tsx
│   ├── CookieConsent.tsx
│   └── GoogleTagManager.tsx
├── cart
│   ├── add-to-cart-button.tsx
│   ├── cart-merge-handler.tsx
│   ├── product-actions.tsx
│   └── quantity-selector.tsx
├── checkout
│   ├── AddressAutocomplete.tsx
│   ├── checkout-client.tsx
│   └── checkout-success-client.tsx
├── emails
│   ├── admin-new-order.tsx
│   ├── order-confirmation.tsx
│   ├── order-delivered.tsx
│   ├── order-refunded.tsx
│   ├── order-return-label.tsx
│   ├── order-shipped.tsx
│   ├── refund-request-admin.tsx
│   └── styles.ts
├── layout
│   ├── conditional-footer.tsx
│   ├── conditional-navbar.tsx
│   ├── footer.tsx
│   └── navbar.tsx
├── orders
│   └── refund-request-form.tsx
├── product
│   ├── image-gallery.tsx
│   ├── product-card.tsx
│   └── related-products.tsx
├── seo
│   └── json-ld.tsx
├── ui
│   ├── status-badge.tsx
│   └── toast-provider.tsx
└── price-display.tsx
```

### 2. BACKEND

#### Routes API (`src/app/api`)
Points d'entrée REST pour le frontend et les webhooks externes.

```
src/app/api
├── admin
│   ├── attributes
│   │   └── [id]
│   │       └── values
│   │           └── route.ts
│   ├── logistics
│   │   └── locations
│   │       ├── [id]
│   │       │   └── route.ts
│   │       └── route.ts
│   ├── media
│   │   ├── [id]
│   │   │   └── route.ts
│   │   ├── reorder
│   │   │   └── route.ts
│   │   └── upload
│   │       └── route.ts
│   ├── orders
│   │   ├── [id]
│   │   │   ├── purchase-label
│   │   │   │   └── route.ts
│   │   │   ├── return-label
│   │   │   │   └── route.ts
│   │   │   └── status
│   │   │       └── route.ts
│   │   └── route.ts
│   └── products
│       ├── [id]
│       │   ├── variants
│       │   │   ├── simple
│       │   │   │   └── route.ts
│       │   │   └── [variantId]
│       │   │       └── route.ts
│       │   └── route.ts
│       ├── reorder
│       │   └── route.ts
│       └── route.ts
├── analytics
│   └── events
│       └── route.ts
├── cart
│   ├── calculate
│   │   └── route.ts
│   ├── lines
│   │   ├── [id]
│   │   │   └── route.ts
│   │   └── route.ts
│   ├── merge
│   │   └── route.ts
│   └── route.ts
├── checkout
│   ├── create-intent
│   │   └── route.ts
│   └── update-intent
│       └── route.ts
├── internal
│   └── health
│       └── route.ts
├── orders
│   ├── [id]
│   │   └── route.ts
│   ├── refund-request
│   │   └── route.ts
│   └── verify
│       └── route.ts
├── products
│   ├── [id]
│   │   └── route.ts
│   └── route.ts
├── shipping
│   └── rates
│       └── route.ts
├── users
│   └── route.ts
└── webhooks
    ├── clerk
    │   └── route.ts
    ├── shippo
    │   └── route.ts
    └── stripe
        ├── status
        │   └── route.ts
        └── route.ts
```

#### Configuration & Logique (`src/lib`)
Configuration centrale, services métier, et utilitaires.

```
src/lib
├── analytics
│   ├── cookie-config.ts
│   ├── gtm.ts
│   └── tracker.ts
├── config
│   └── site.ts
├── db
│   └── prisma.ts
├── i18n
│   ├── dictionaries
│   │   ├── en.json
│   │   └── fr.json
│   ├── config.ts
│   └── request.ts
├── middleware
│   ├── withAuth.ts
│   ├── withError.ts
│   ├── withRateLimit.ts
│   └── withValidation.ts
├── schemas
│   └── product.schema.ts
├── services
│   ├── attribute.service.ts
│   ├── calculation.service.ts
│   ├── cart.service.ts
│   ├── inventory.service.ts
│   ├── order.service.ts
│   ├── product.service.ts
│   ├── shippo.ts
│   ├── user.service.ts
│   ├── variant.service.ts
│   ├── webhook-alert.service.ts
│   └── webhook.service.ts
├── storage
│   ├── providers
│   ├── storage.service.ts
│   └── types.ts
├── stripe
│   ├── checkout.ts
│   ├── client.ts
│   ├── payments.ts
│   └── webhooks.ts
├── types
├── utils
│   ├── checkout.ts
│   ├── cookies.ts
│   ├── currency.ts
│   ├── date.ts
│   ├── prisma-to-json.ts
│   ├── unit.ts
│   └── validation.ts
├── validators
│   ├── admin.ts
│   ├── cart.ts
│   ├── checkout.ts
│   ├── orders.ts
│   ├── shipping.ts
│   └── user.ts
├── constants.ts
├── env.ts
├── logger.ts
└── resend.ts
```

---

## Principes Architecturaux

### **1. Separation of Concerns**

Chaque couche a une responsabilité unique : la couche API gère le HTTP et la validation, la couche Service gère la logique pure, et Prisma gère l'accès aux données.

### **2. Single Responsibility**

Chaque fichier ou fonction doit avoir une seule raison de changer. Par exemple, un service ne gère qu'un seul domaine métier (ex: commandes), et une route API ne correspond qu'à un seul endpoint.

### **3. Dependency Injection & Configuration**

Les services et le client de base de données sont injectés via des imports directs ou des instances partagées (singletons), et toute la configuration est centralisée pour éviter les valeurs "en dur" dispersées.

---

## Patterns Implémentés

### **Pattern 1 : Singleton (Prisma Client)**
Utilisation d'une instance unique du client Prisma pour gérer efficacement les connexions à la base de données et éviter les fuites de mémoire, notamment lors du redémarrage fréquent en mode développement.

### **Pattern 2 : Service Layer**
La logique métier est encapsulée dans des fonctions de service indépendantes du contexte Web (HTTP). Cela permet de tester la logique métier (ex: créer un produit, valider un panier) sans avoir besoin de simuler des requêtes API complètes.

### **Pattern 3 : Middleware Pattern**
Les fonctions API sont enveloppées dans des "wrappers" (middlewares) qui gèrent automatiquement les aspects transversaux comme la gestion globale des erreurs, la journalisation et le formatage standardisé des réponses.

### **Pattern 4 : Centralized Configuration**
Toutes les variables d'environnement et constantes critiques (devises, limites, clés API) sont centralisées et validées au démarrage de l'application. Cela garantit que l'application ne démarre pas si la configuration est invalide.

### **Pattern 5 : RBAC (Role-Based Access Control)**
L'accès aux fonctionnalités sensibles (comme l'administration) est protégé par un système de contrôle qui vérifie l'authentification et le rôle de l'utilisateur (ex: ADMIN) avant même d'exécuter la logique de la route.

---

## Flux de Données Typiques

### **Exemple : Ajout au panier**

Le flux part de l'action utilisateur, passe par l'API pour validation, délègue la logique au Service, persiste les données via Prisma, et retourne une réponse JSON au client pour mettre à jour l'interface.

### **Exemple : Webhook Stripe (paiement)**

Stripe notifie l'API d'un paiement réussi. Le système vérifie la signature de sécurité, puis le Service met à jour le statut de la commande, ajuste les stocks et déclenche l'envoi d'un email de confirmation.

---

## Performance & Scalabilité

L'application utilise des stratégies éprouvées :
- **Optimisations** : Singleton pour la BDD, logs structurés, et gestion d'erreurs centralisée.
- **Évolutivité** : L'architecture modulaire permet de séparer facilement les services ou d'ajouter du cache (Redis) sans refondre l'application.

---

## Testabilité

Grâce à l'isolation des services ("Service Layer"), il est possible d'écrire des tests unitaires simples et rapides sans dépendre de l'infrastructure Web ou de la base de données réelle pour chaque test.

**Pour plus de détails** : [Documentation Tests](../14-test/)

---

## Sécurité

La sécurité est intégrée à chaque niveau : authentification robuste (Clerk), validation stricte des données entrantes (Zod), protection des routes admin, et sécurisation des webhooks de paiement.

**Pour plus de détails** : [Documentation Sécurité](../8-securite/)

---

## Internationalisation (i18n)

Le support multi-langues est natif : les URLs sont préfixées par la langue (`/fr`, `/en`) et le contenu dynamique (produits, catégories) est traduit directement en base de données.

**Pour plus de détails** : [Configuration i18n](../9-Language_internationalization/i18n-architecture.md)

---

**Version** : 2.2 (Architecture centralisée & sécurisée)
**Dernière mise à jour** : Janvier 2026
