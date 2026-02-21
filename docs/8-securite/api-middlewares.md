# 🛡️ Pipeline des Middlewares API

Ce document décrit les mécanismes de contrôle qui s'exécutent avant d'atteindre la logique métier de nos routes API. Nous utilisons une architecture de "Higher Order Functions" (Décorateurs) pour empiler les responsabilités.

---

## 🏗️ Architecture "Stack"
Dans nos fichiers `route.ts`, les middlewares sont empilés comme ceci :
```typescript
export const POST = withError(
  withAdmin(
    withRateLimit(handler, RateLimits.ADMIN)
  )
);
```

---

## 🧩 1. `withError` (Gestion Globale)
C'est le middleware le plus externe. Il garantit qu'aucune erreur brute ne fuite vers le client.
- **Rôle** : Capture les `AppError`, les erreurs de validation `Zod` et les erreurs système `500`.
- **Standardisation** : Formate toutes les erreurs en un JSON cohérent : `{ success: false, error: "CODE", message: "..." }`.
- **Logging** : Enregistre automatiquement la stack trace et génère un `requestId`.
- **Fichier** : `src/lib/middleware/withError.ts`

---

## 🔐 2. `withAuth` / `withAdmin` (Sécurité)
Gère l'identification Clerk et les droits d'accès en base de données.
- **`withAuth`** : Vérifie que l'utilisateur est connecté via Clerk et existe dans notre table `User`. Injecte le `authContext` dans le handler.
- **`withAdmin`** : Extension de `withAuth`. Bloque la requête si `role !== 'ADMIN'` (Erreur 403).
- **`withOptionalAuth`** : Identifie l'utilisateur s'il est connecté, mais autorise les requêtes anonymes (utile pour le Panier).
- **Fichier** : `src/lib/middleware/withAuth.ts`

---

## ⚖️ 3. `withRateLimit` (Protection)
Protège le serveur contre les abus et le spam.
- **Rôle** : Limite le nombre de requêtes par IP sur une période donnée (ex: 5 requêtes/min pour les webhooks).
- **Configuration** : Utilise des profils prédéfinis (`RateLimits.PUBLIC`, `RateLimits.ADMIN`, `RateLimits.WEBHOOK`).
- **Headers** : Ajoute les headers `X-RateLimit-Limit` et `X-RateLimit-Remaining`.
- **Fichier** : `src/lib/middleware/withRateLimit.ts`

---

## ✅ 4. `withValidation` (Zod)
Assure que les données entrantes respectent le contrat technique.
- **Rôle** : Valide `request.json()` ou `request.nextUrl.searchParams` contre un schéma Zod.
- **Avantage** : Si les données sont invalides, le handler n'est jamais exécuté, économisant des ressources.
- **Fichier** : `src/lib/middleware/withValidation.ts`

---

## 📊 Résumé des Dépendances
| Middleware | Dépendance | Risque couvert |
| :--- | :--- | :--- |
| `withError` | Logger, Env | Crash serveur, Fuite d'infos |
| `withAuth` | Clerk, Prisma | Accès non autorisé |
| `withRateLimit` | Redis/Memory | Attaques DoS, Brute force |
| `withValidation` | Zod | Injection de données corrompues |
