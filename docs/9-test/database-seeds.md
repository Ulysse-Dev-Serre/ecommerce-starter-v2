# 🗄️ Scripts de base de données et Seeds

## Scripts de base de données

### `npm run db:migrate`
Crée et applique une nouvelle migration Prisma après modification du schema.

### `npm run db:push`
Synchronise le schéma Prisma avec la base de données sans créer de migration (prototypage rapide).

### `npm run db:studio`
Lance Prisma Studio sur `http://localhost:5555` pour visualiser et modifier la base de données via interface graphique.

---

## Seeds Prisma

### `npm run db:seed`
**Fichier:** `prisma/seed.ts`

Seed complet : nettoie la DB et crée utilisateurs de test, catégories, attributs, 3 produits avec variantes, paramètres système et coupon de test.

**⚠️ Important:** Créez d'abord les utilisateurs dans Clerk (`admin@test.com`, `client@test.com`, `marie@test.com`) et mettez à jour les `clerkId` dans prisma/seed.ts.

### `npm run db:seed-products`
**Fichier:** `scripts/seed-products.ts`

Ajoute 6 produits supplémentaires sans réinitialiser les données existantes (Samsung, MacBook Pro, Dell, Hoodie, Jeans, Pixel).

**Cas d'usage:** Enrichir le catalogue, tester la pagination.

---

## Scripts de gestion

### `npm run db:reset`
**Fichier:** `scripts/reset-local.ts`

Réinitialise complètement l'environnement local : supprime les utilisateurs Clerk de test et recrée la base de données.

**⚠️ Attention:** Commande destructive !

**Workflow recommandé après reset:**
```bash
npm run db:reset          # Nettoie tout
npm run sync-clerk create # Recrée les utilisateurs Clerk
npm run sync-clerk sync   # Synchronise vers la DB
npm run db:seed           # Seed complet
npm run db:seed-products  # Ajoute plus de produits (optionnel)
```

### `npx tsx scripts/get-admin-id.ts`
Récupère l'ID de l'utilisateur admin depuis la base de données.
