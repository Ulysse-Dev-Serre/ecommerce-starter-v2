# Décisions Techniques et Architecturales

Ce document recense les choix techniques structurants faits au cours du développement, leurs justifications ("pourquoi"), et les implications pour la maintenance future.

## 1. Authentication & API Calls dans l'Admin Dashboard

### Contexte
L'application utilise **Next.js App Router** avec l'authentification **Clerk** et des API internes (`/api/admin/...`).

### Problème rencontré
Les pages d'administration (comme `/admin/orders`) implémentées en tant que **Server Components** (`async function Page()`) échouaient à appeler les API internes (`/api/admin/orders`) avec une erreur `401 Unauthorized`.
*   **Cause** : Lors d'un appel API interne côté serveur (fetch SSR), les cookies d'authentification de l'utilisateur ne sont pas transmis automatiquement par Next.js, contrairement aux appels côté client (navigateur).

### Décision (ADR-001)
**Passage des pages Admin listant des données dynamiques en "Client Components" (`'use client'`).**

*   **Page concernée** : `src/app/[locale]/admin/orders/page.tsx`
*   **Implémentation** :
    *   Utilisation de `'use client'`.
    *   Fetching des données via `useEffect` et `fetch()` standard.
    *   Gestion de l'état local (`loading`, `error`, `data`).

### Justification
1.  **Cohérence** : Les autres pages admin interactives (édition produit, upload média) étaient déjà des Client Components.
2.  **Simplicité** : Le navigateur gère automatiquement l'attachement des cookies de session Clerk lors des requêtes fetch.
3.  **Expérience Utilisateur** : Permet une interactivité future plus fluide (filtres dynamiques, rafraîchissement sans rechargement de page) adaptée à un dashboard.

### Dette Technique / Optimisation Future
Si le besoin de performance (SEO, First Contentful Paint) devient critique pour ces pages admin (peu probable car elles sont privées), on pourra envisager de revenir aux **Server Components**.
Pour cela, il faudra :
*   Utiliser `headers()` de `next/headers` pour récupérer le header `Cookie` de la requête entrante.
*   Passer manuellement ce header `Cookie` dans les options du `fetch` interne vers l'API.

---

## 2. Gestion des Rôles Admin (Sécurité)

### Décision (ADR-002)
**Suppression des mécanismes d'auto-promotion et enforcement strict de l'attribution manuelle du rôle ADMIN.**

*   **Fichiers supprimés** : Scripts d'auto-promotion non sécurisés.
*   **Procédure** : Le rôle ADMIN ne peut être attribué que via un accès direct à la base de données (Prisma Studio ou SQL).
*   **Raison** : "Zero Trust" security. Empêcher toute élévation de privilège accidentelle via l'API ou des scripts de dev.

### Note sur les Clés de Test
Le système supporte des `TEST_API_KEY` pour les tests E2E.
*   **Règle** : Ces clés (`TEST_API_KEY`) doivent impérativement être **commentées/désactivées** dans le fichier `.env` en développement standard et en production pour éviter tout conflit d'authentification ou faille de sécurité.
