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
│   ├── analytics/    # Dashboard analytique
│   ├── categories/   # Gestion des catégories
│   ├── customers/    # Liste et détails clients
│   ├── logistics/    # Lieux d'origine et stocks
│   ├── orders/       # Gestion des commandes admin
│   ├── products/     # Catalogue et édition produits
│   ├── settings/     # Paramètres boutique
│   └── layout.tsx
├── cart/           # Panier client
├── checkout/       # Tunnel d'achat
├── contact/        # Page contact
├── (legal)/        # CGV, Confidentialité, Retours
├── orders/         # Mes commandes (Client)
├── product/        # Page produit détaillée
├── shop/           # Catalogue public
└── layout.tsx
```

#### Composants (`src/components`)
Blocs UI réutilisables organisés par domaine.

```
src/components
├── admin
│   ├── analytics   # Charts (Revenue, Conversion, Sources)
│   ├── dashboard   # Stats Grid, Recent Orders
│   ├── layout      # Header et Sidebar Admin
│   ├── logistics   # Modals et clients logistique
│   ├── orders      # Tables, Filters, Packing, Timeline, Status
│   └── products    # Form, Media, Variants, Stats
├── analytics/      # Tracker, Cookie Consent, GTM
├── cart/           # Buttons, Items, Summary, Merge Handler
├── checkout/       # Sections: Address, Payment, Shipping, Summary
├── contact/        # Formulaire contact
├── emails/         # Templates Resend (React Email)
├── layout/         # Navbar et Footer Storefront
├── legal/          # Templates pages légales
├── orders/         # Stepper, Tracking, Refund Form
├── product/        # Gallery, Card, Skeletons
├── seo/            # JSON-LD Metadata
├── shop/           # Pagination
└── ui/             # Design System (Buttons, Badges, Inputs, Modals)
```

### 2. BACKEND

#### Routes API (`src/app/api`)
Points d'entrée REST pour le frontend et les webhooks externes.

```
src/app/api
├── admin
│   ├── logistics/  # Gestion des entrepôts
│   ├── media/      # Upload/Reorder d'images
│   ├── orders/     # Status et labels d'expédition
│   ├── products/   # CRUD Catalogue et variants
│   └── users/      # Gestion admins
├── cart/           # Opérations panier (Calculate, Merge, Lines)
├── checkout/       # Stripe Payment Intents
├── internal/       # Maintenance (Health, Cleanup)
├── orders/         # Public Orders & Refunds
├── products/       # Public Catalog
├── shipping/       # Shipping Rates calculation
├── tracking/       # Internal Event Tracking
├── users/          # Profile & User data
└── webhooks/       # Clerk, Shippo, Stripe
```

#### Configuration & Logique (`src/lib`)
Configuration centrale, services métier, et utilitaires.

```
src/lib
├── client/          # Services client-side (Cart, Checkout, Shipping)
├── config/          # Centralized Config (Site, API, Nav, Events)
├── core/            # Singletons (DB, Logger, Cache, Env)
├── i18n/            # Translations & Middleware
├── integrations/    # SDK Wrappers (Stripe, Shippo, Resend, Storage)
├── middleware/      # API Wrappers (Auth, RateLimit, Validation)
├── services/        # Business Logic (Domain-Driven)
│   ├── admin/       # Admin specific ops
│   ├── cart/        # Cart logic
│   ├── inventory/   # Stock management
│   ├── logistics/   # Origin, Tax, Zones
│   ├── orders/      # Orders & Notifications
│   ├── shipping/    # Packing (3D), Customs, Rates
│   ├── users/       # Auth & Profile
│   ├── variants/    # Variant Ops & Generator
│   └── webhooks/    # Webhook handlers
├── types/           # TS Interfaces (API, Domain, UI)
├── utils/           # Shared Helpers (Currency, Date, Unit)
└── validators/      # Zod Schemas (Product, Order, Checkout)
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

**Version** : 2.3 (Architecture synchronisée avec le codebase réel)
**Dernière mise à jour** : Février 2026
