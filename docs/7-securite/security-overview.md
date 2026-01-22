# Vue d'ensemble de la Sécurité

Ce document récapitule les mesures de sécurité implémentées dans l'E-Commerce Starter v2 et sert de point d'entrée pour la maintenance technique.

---

## 1. Mesures de Sécurité Implémentées

### Authentification et Autorisation (Clerk)
- Toutes les routes admin sont protégées par le middleware `withAdmin()`.
- Vérification du rôle ADMIN obligatoire (`UserRole.ADMIN`) via Clerk et synchronisation PostgreSQL.
- Validation des webhooks Clerk avec la signature Svix.
- Journalisation (logging) de toutes les tentatives d'accès non autorisées.

**Documentation détaillée :**
- [Gestion des rôles (RBAC)](./RBAC.md)

---

### Protection des Routes API
Toutes les routes API sensibles utilisent une pile de middlewares :
1. `withError` : Gestion d'erreurs sécurisée pour éviter les fuites d'informations en production.
2. `withAdmin` ou `withAuth` : Vérification de l'identité et du rôle.
3. `withRateLimit` : Protection contre les attaques par force brute et les abus.

**Documentation détaillée :**
- [Rate Limiting](./rate-limiting.md)
- [Validation des données (Zod)](./zod-validation.md)

---

### Gestion des Secrets
- Aucun secret ou clé API n'est stocké en dur dans le code.
- Utilisation stricte des variables d'environnement (`process.env`).
- Configuration du fichier `.gitignore` pour exclure les fichiers `.env`.
- Le fichier `.env.example` sert de modèle pour les nouvelles installations sans exposer de valeurs réelles.

---

### Règles de Qualité et Sécurité (Linters)
Erreurs bloquantes en CI pour garantir la sécurité du code :
- Interdiction des Promises non gérées (`no-floating-promises`).
- Interdiction des commentaires `@ts-ignore` non justifiés.
- Suppression automatique des instructions `debugger`.
- Utilisation de `const` ou `let` pour éviter les problèmes de portée de `var`.

---

## 2. Checklist Pré-Production

Avant tout déploiement en environnement réel, les points suivants doivent être validés :

### Paiements (Stripe)
- [x] Validation des signatures des webhooks Stripe (`STRIPE_WEBHOOK_SECRET`).
- [x] Activation du Strong Customer Authentication (SCA / 3D Secure) via Stripe Elements.
- [ ] S'assurer que les clés de production (`sk_live_`) sont configurées sur le serveur de production.

### Infrastructure et Réseau
- [ ] Certificat SSL/TLS valide (HTTPS obligatoire sur le domaine final).
- [x] Configuration restrictive des origines CORS via `next.config.ts`.
- [x] Activation des headers de sécurité (CSP, HSTS, X-Frame-Options) via `next.config.ts`.

### Monitoring
- [x] Centralisation des logs d'erreurs et d'accès refusés (système de logging structuré).
- [ ] Mise en place de sauvegardes automatiques périodiques de la base de données de production.
- [ ] Plan de rotation périodique des clés et secrets.

---

## 3. Signalement de Vulnérabilités

Pour signaler une faille de sécurité, veuillez contacter l'administrateur technique directement. Ne créez pas d'issue publique pour des raisons de sécurité évidentes.

**Dernière révision technique :** Janvier 2026
