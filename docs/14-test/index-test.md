# Documentation des Scripts et Tests

Cette section regroupe tous les scripts, tests et utilitaires du projet.

## Architecture de Tests

> [!WARNING]
> Les tests d'intégration sont actuellement en cours de migration de JavaScript vers **TypeScript**. Les anciens tests `.js` dans `tests/integration` ne sont plus exécutés par le nouveau runner Vitest.

## Scripts de gestion

### 1. [Base de données et Seeds](./database-seeds.md)
Scripts Prisma pour gérer la base de données et peupler les données.

### 2. [Scripts Clerk](./clerk.md)
Scripts de synchronisation des utilisateurs avec Clerk.

## Tests

### 3. [Tests Vitest](./vitest.md)
Tests unitaires et logique métier automatisés avec Vitest (remplace Jest).

### 4. [Tests Playwright](./playwright.md)
Tests end-to-end avec Playwright (E2E).

### 5. [Scripts de test manuels](./scripts-tests.md)
Scripts Node.js pour tester manuellement des fonctionnalités spécifiques.

## Configuration requise

Voir [tests/README.md](../../tests/README.md) pour la configuration de `TEST_API_KEY`.
