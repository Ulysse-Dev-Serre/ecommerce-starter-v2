# 👥 Scripts Clerk

**Fichier:** `scripts/sync-clerk-users.ts`

## `npm run sync-clerk create`

Crée 3 utilisateurs de test dans Clerk (`admin@test.com`, `client@test.com`, `marie@test.com`).

**Mot de passe par défaut:** `A_dmin_P@ssw0rd!123`

**⚠️ Prérequis:** Variables d'environnement Clerk configurées dans `.env.local`.

---

## `npm run sync-clerk sync`

Synchronise les utilisateurs Clerk vers la base de données PostgreSQL.

**Ce qu'il fait:**
- Récupère tous les utilisateurs depuis Clerk (max 100)
- Met à jour ou crée les enregistrements en DB
- Détermine automatiquement le rôle (admin si email contient "admin")
- Affiche les IDs Clerk pour référence

**Cas d'usage:**
- Après création manuelle d'utilisateurs dans le Dashboard Clerk
- Pour récupérer les vrais `clerkId` après création
- Synchroniser les modifications d'utilisateurs
