# Configuration Initiale

## Installation

```bash
npm install
```

## Variables d'environnement

Créer `.env` à partir du template :

```bash
cp .env.exemple .env
```

Configurer les variables selon [.env.exemple](../../.env.exemple).

---

## Étape 1 : Base de données

1. **Créer une base PostgreSQL** sur [Neon](https://neon.com/)
2. **Copier l'URL de connexion** dans `.env` → `DATABASE_URL=`

---

## Étape 2 : Création des tables avec Prisma

```bash
# Génère le client Prisma basé sur le schéma
npx prisma generate

# Crée/met à jour les tables dans la base de données
npx prisma db push
```

### Migrations Prisma (développement)

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name [nom_migration]

# Migration initiale
npx prisma migrate dev --name init
```

---

## Étape 3 : Projet Clerk

1. **Créer un projet Clerk** sur [clerk.com](https://clerk.com/)
2. **Configurer les clés** dans `.env` :
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`
   - `CLERK_SECRET_KEY=`

À ce stade, l'authentification Clerk est fonctionnelle.

**Test utilisateur** via script :

```bash
npm run sync-clerk create
```

---

## Étape 4 : Synchronisation Clerk ↔ PostgreSQL

Synchroniser manuellement les utilisateurs existants :

```bash
npm run sync-clerk sync
```

---

## Étape 5 : Synchronisation temps réel (webhooks)

Configuration webhooks Clerk pour synchronisation automatique en développement.

**Guide complet** : [Workflow d'Authentification](../4-authentication/authentication-workflow.md)

---

## Validation installation

### Démarrer l'application

```bash
npm run dev
```

Accès : `http://localhost:3000`

---

## Stack technique

| Couche          | Technologie             | Rôle                        |
| --------------- | ----------------------- | --------------------------- |
| **Frontend**    | Next.js 15 + TypeScript | App Router + SSR            |
| **Auth**        | Clerk                   | Authentification + webhooks |
| **Database**    | PostgreSQL + Prisma     | ORM + migrations            |
| **Traductions** | next-intl (FR/EN)       | Routage multilingue         |
| **Styling**     | Tailwind CSS            | Design system               |

---

## Configuration automatique (optionnelle)


```bash
npm run dev:setup
```

 `npm run db:push` - Synchronise schéma Prisma

---

## Prochaines étapes

1. **[Architecture système](architecture.md)** - Comprendre la structure
2. **[Workflow Authentification](../4-authentication/authentication-workflow.md)** - Flux Clerk ↔ Postgres
3. **[Architecture i18n](../9-Language_internationalization/i18n-architecture.md)** - Multilingue
4. **[Thèmes CSS](../10-frontend/theming.md)** - Personnaliser l'apparence
