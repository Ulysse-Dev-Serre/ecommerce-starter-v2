# Scripts de gestion et maintenance

Ces scripts permettent de gérer l'infrastructure et la maintenance du projet. Les anciens scripts de validation JavaScript ont été supprimés au profit de **Vitest** (unitaire) et prochainement **Playwright** (E2E).

## Reset de la base de données
```bash
npm run db:reset
```
**Fichier:** `scripts/reset-database.ts`  
Réinitialise complètement la base de données et applique les migrations/seeds. Utile pour repartir sur une base saine avant des tests.

## Synchronisation Clerk
```bash
npm run sync-clerk sync
```
**Fichier:** `scripts/sync-clerk-users.ts`  
Synchronise les utilisateurs depuis Clerk vers la base de données locale.

---

## Note sur la validation
Pour valider les tunnels critiques (Produits, Panier, Checkout), utilisez :
1. **Tests Unitaires** : `npm run test:unit`
2. **Tests E2E** : `npm run test:e2e` (Installations en cours...)
