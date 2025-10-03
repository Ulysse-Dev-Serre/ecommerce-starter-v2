# 📜 Scripts de gestion du projet

Ce dossier documente tous les scripts utilitaires disponibles dans le projet pour la gestion de la base de données, la synchronisation avec Clerk et les opérations de développement.

---

## 📋 Table des matières

1. [Scripts de base de données](#scripts-de-base-de-données)
2. [Scripts Clerk](#scripts-clerk)
3. [Scripts de test](#scripts-de-test)
4. [Commandes utiles](#commandes-utiles)

---

## 🗄️ Scripts de base de données

### `npm run db:seed`

**Fichier:** `prisma/seed.ts`

**Description:** Script principal de seed qui initialise la base de données avec des données de test complètes.

**Ce qu'il fait:**
- Nettoie toutes les tables de la base de données
- Crée des utilisateurs de test (admin, clients)
- Crée les catégories de base (Electronics, Clothing, etc.)
- Crée les attributs produits (color, size, storage)
- Crée 3 produits d'exemple avec leurs variantes:
  - iPhone 15 Pro (3 variantes)
  - MacBook Air M3 (1 variante)
  - T-Shirt Classique (3 variantes)
- Crée des paramètres système
- Crée un coupon de test (`WELCOME10`)

**Utilisation:**
```bash
npm run db:seed
```

**⚠️ Important:** Avant d'exécuter ce script, assurez-vous d'avoir créé les utilisateurs suivants dans Clerk:
- `admin@test.com`
- `client@test.com`
- `marie@test.com`

Ensuite, mettez à jour les `clerkId` dans le fichier [prisma/seed.ts](file:///home/ulbo/Dev/ecommerce-starter-v2/prisma/seed.ts) avec les vrais IDs récupérés depuis Clerk.

---

### `npm run db:seed-products`

**Fichier:** `scripts/seed-products.ts`

**Description:** Script pour ajouter des produits supplémentaires à la base de données sans réinitialiser les données existantes.

**Ce qu'il fait:**
- Vérifie que les catégories existent
- Crée 6 nouveaux produits avec leurs variantes:
  - Samsung Galaxy S24 (2 variantes)
  - MacBook Pro 14" M3 (1 variante)
  - Dell XPS 15 (1 variante)
  - Hoodie Premium (3 variantes)
  - Jeans Slim Fit (3 variantes)
  - Google Pixel 8 Pro (2 variantes)
- Ignore les produits qui existent déjà (basé sur le slug)
- Crée automatiquement les traductions FR/EN
- Génère des images placeholder via Unsplash

**Utilisation:**
```bash
npm run db:seed-products
```

**Cas d'usage:**
- Enrichir le catalogue après le seed initial
- Ajouter des produits de test sans perdre les données existantes
- Tester la pagination avec plus de produits

---

### `npm run db:reset`

**Fichier:** `scripts/reset-local.ts`

**Description:** Réinitialise complètement l'environnement de développement local.

**Ce qu'il fait:**
1. Supprime les utilisateurs de test dans Clerk:
   - Tous les utilisateurs avec email `@test.com`
   - Les utilisateurs listés dans le tableau `testEmails`
2. Supprime et recrée la base de données via `prisma migrate reset`
3. **Note:** Le seed n'est PAS exécuté automatiquement (`--skip-seed`)

**Utilisation:**
```bash
npm run db:reset
```

**⚠️ Attention:** Cette commande est destructive ! Elle supprime:
- Tous les utilisateurs Clerk de test
- Toute la base de données locale

**Workflow recommandé après reset:**
```bash
npm run db:reset          # Nettoie tout
npm run sync-clerk create # Recrée les utilisateurs Clerk
npm run sync-clerk sync   # Synchronise vers la DB
npm run db:seed           # Seed complet
npm run db:seed-products  # Ajoute plus de produits (optionnel)
```

---

### `npm run db:migrate`

**Description:** Crée et applique une nouvelle migration Prisma.

**Utilisation:**
```bash
npm run db:migrate
```

**Quand l'utiliser:**
- Après modification du [schema.prisma](file:///home/ulbo/Dev/ecommerce-starter-v2/prisma/schema.prisma)
- Pour synchroniser le schéma avec la base de données en développement

---

### `npm run db:push`

**Description:** Synchronise le schéma Prisma avec la base de données sans créer de migration.

**Utilisation:**
```bash
npm run db:push
```

**Différence avec migrate:**
- `db:migrate`: Crée un fichier de migration (pour versionner les changements)
- `db:push`: Synchronisation directe sans historique (utile pour prototypage rapide)

---

### `npm run db:studio`

**Description:** Lance Prisma Studio pour visualiser et modifier la base de données via une interface graphique.

**Utilisation:**
```bash
npm run db:studio
```

**Interface:** Ouvre automatiquement `http://localhost:5555`

**Fonctionnalités:**
- Visualiser toutes les tables
- Modifier les données manuellement
- Tester les relations entre tables
- Déboguer les problèmes de données

---

## 👥 Scripts Clerk

### `npm run sync-clerk create`

**Fichier:** `scripts/sync-clerk-users.ts`

**Description:** Crée les utilisateurs de test directement dans Clerk.

**Ce qu'il fait:**
- Crée 3 utilisateurs de test dans Clerk:
  - `admin@test.com` (rôle admin)
  - `client@test.com` (rôle client)
  - `marie@test.com` (rôle client)
- Vérifie si les utilisateurs existent déjà avant de les créer
- Mot de passe par défaut: `A_dmin_P@ssw0rd!123`

**Utilisation:**
```bash
npm run sync-clerk create
```

**⚠️ Prérequis:** Variables d'environnement Clerk configurées dans `.env.local`

---

### `npm run sync-clerk sync`

**Fichier:** `scripts/sync-clerk-users.ts`

**Description:** Synchronise les utilisateurs Clerk vers la base de données PostgreSQL.

**Ce qu'il fait:**
1. Récupère tous les utilisateurs depuis Clerk (max 100)
2. Pour chaque utilisateur:
   - Si existe en DB: met à jour les informations
   - Si n'existe pas: crée un nouvel enregistrement
3. Détermine automatiquement le rôle (admin si email contient "admin")
4. Affiche les IDs Clerk pour référence

**Utilisation:**
```bash
npm run sync-clerk sync
```

**Cas d'usage:**
- Après création manuelle d'utilisateurs dans le Dashboard Clerk
- Pour récupérer les vrais `clerkId` après création
- Synchroniser les modifications d'utilisateurs

---

## 🧪 Scripts de test

### `npm run test`

**Description:** Exécute tous les tests unitaires Jest.

**Utilisation:**
```bash
npm run test
```

---

### `npm run test:watch`

**Description:** Exécute Jest en mode watch (re-test automatique sur changement).

**Utilisation:**
```bash
npm run test:watch
```

---

### `npm run test:e2e`

**Description:** Exécute les tests end-to-end avec Playwright.

**Utilisation:**
```bash
npm run test:e2e
```

---

## 🔧 Commandes utiles

### Build et développement

```bash
npm run dev          # Lance le serveur de développement
npm run build        # Build de production
npm run start        # Lance le serveur de production
```

### Qualité de code

```bash
npm run lint         # Lint du code
npm run format       # Formate le code avec Prettier
npm run typecheck    # Vérification TypeScript
npm run ci           # Exécute tous les checks (typecheck + lint + format + build)
npm run ci:fix       # Corrige automatiquement les problèmes de format et lint
```

---

## 📝 Workflow de développement recommandé

### Setup initial du projet

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Clerk et DATABASE_URL

# 3. Créer la base de données
npm run db:migrate

# 4. Créer les utilisateurs dans Clerk
npm run sync-clerk create

# 5. Synchroniser Clerk vers la DB
npm run sync-clerk sync

# 6. Seed initial
npm run db:seed

# 7. (Optionnel) Ajouter plus de produits
npm run db:seed-products
```

### Reset complet de l'environnement

```bash
# Réinitialiser tout (Clerk + DB)
npm run db:reset

# Puis refaire le workflow de setup
npm run sync-clerk create
npm run sync-clerk sync
npm run db:seed
npm run db:seed-products
```

### Ajouter une nouvelle fonctionnalité

```bash
# 1. Modifier le schema Prisma si nécessaire
# Éditer prisma/schema.prisma

# 2. Créer la migration
npm run db:migrate

# 3. Mettre à jour le seed si besoin
# Éditer prisma/seed.ts ou scripts/seed-products.ts

# 4. Tester
npm run db:reset
npm run sync-clerk create
npm run sync-clerk sync
npm run db:seed

# 5. Vérifier la qualité
npm run typecheck
npm run lint
npm run test
```

---

## 🐛 Dépannage

### "User not found" lors du seed

**Problème:** Les `clerkId` dans `prisma/seed.ts` ne correspondent pas aux utilisateurs Clerk réels.

**Solution:**
```bash
npm run sync-clerk sync
# Copier les vrais clerkId affichés dans le fichier prisma/seed.ts
```

---

### "Unique constraint violation" sur les slugs

**Problème:** Tentative de créer un produit avec un slug existant.

**Solution:**
```bash
# Option 1: Reset complet
npm run db:reset
npm run db:seed

# Option 2: Modifier le slug dans le script
```

---

### Prisma Client out of sync

**Problème:** Erreur "Prisma Client is out of sync with the schema".

**Solution:**
```bash
npx prisma generate
```

---

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Clerk](https://clerk.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Architecture du projet](file:///home/ulbo/Dev/ecommerce-starter-v2/docs/1-foundations/architecture.md)
- [Roadmap](file:///home/ulbo/Dev/ecommerce-starter-v2/docs/1-foundations/Roadmap.md)
