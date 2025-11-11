# Scripts de test manuels

Ces scripts sont des alternatives à Jest pour tester manuellement certaines fonctionnalités.

## database-test.js
```bash
npm run test:db
```
Teste les opérations CRUD de base de données avec Prisma.

## webhook-debug.js
```bash
npm run test:webhook
```
Lance un serveur de debug pour les webhooks Clerk.

## test-product-crud.js
```bash
node tests/scripts/test-product-crud.js
```
Teste le workflow complet CRUD des produits.

## test-simple-variant-workflow.js
```bash
node tests/scripts/test-simple-variant-workflow.js
```
Teste le workflow simplifié de gestion des variantes produit.

## test-variant-workflow.js
```bash
node tests/scripts/test-variant-workflow.js
```
Teste le workflow complet de gestion des variantes produit.

## validate-features.js
```bash
node tests/scripts/validate-features.js
```
Valide tous les endpoints critiques de l'application.
