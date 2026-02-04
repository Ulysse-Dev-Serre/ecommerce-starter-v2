# Documentation des Scripts et Tests

Cette section regroupe tous les scripts, tests et utilitaires du projet.

## Architecture de Tests

### 0. [Workflow de Refactorisation](./refactor-workflow.md)
Guide étape par étape pour migrer une route vers le pattern **Service/Validator/Vitest**.

> [!NOTE]
> Le projet a été entièrement migré vers **Vitest** pour les tests unitaires et **Playwright** pour les tests E2E. Les anciens tests JavaScript ont été supprimés.

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

Les tests utilisent les variables d'environnement configurées dans `.env.local`.
