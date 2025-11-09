# API Users - Gestion des utilisateurs

## Vue d'ensemble

Endpoints pour la gestion des utilisateurs synchronisés avec Clerk et stockés en PostgreSQL.

---

## GET /api/users

Liste tous les utilisateurs synchronisés dans la base de données.

### Requête

```bash
curl http://localhost:3000/api/users
```

### Réponse (200 OK)

```json
{
  "success": true,
  "count": 3,
  "users": [
    {
      "id": "cmfpj7dyk0002syd4wrqkzfl7",
      "clerkId": "user_32sMQetRPq36eZjbezvIxLRtLxm",
      "email": "admin@test.com",
      "firstName": "Admin",
      "lastName": "Test",
      "role": "ADMIN",
      "createdAt": "2025-09-18T14:54:16.941Z",
      "updatedAt": "2025-09-18T14:54:16.941Z"
    }
  ],
  "timestamp": "2025-09-18T14:54:21.417Z"
}
```

### Utilisation

- Récupérer la liste complète des utilisateurs
- Obtenir les IDs pour autres opérations
- Vérifier la synchronisation Clerk ↔ PostgreSQL

---

## POST /api/users/[id]/promote

**Protection**: ADMIN uniquement

Bascule le rôle d'un utilisateur entre CLIENT et ADMIN.

### Comment promouvoir un utilisateur en administrateur

**Étape 1**: Récupérer l'ID de l'utilisateur
```bash
curl http://localhost:3000/api/users
```

**Étape 2**: Promouvoir l'utilisateur
```bash
curl -X POST http://localhost:3000/api/users/[ID]/promote \
  -H "Content-Type: application/json"
```

**Étape 3**: Répéter la même commande pour rétrograder (toggle)

### Paramètres

- `id` (string, required) - ID utilisateur dans PostgreSQL

### Requête

```bash
# Récupérer un ID utilisateur
curl http://localhost:3000/api/users

# Changer le rôle (remplacer [ID] par un vrai ID)
curl -X POST http://localhost:3000/api/users/[ID]/promote \
  -H "Content-Type: application/json"
```

### Réponse (200 OK)

```json
{
  "success": true,
  "user": {
    "id": "cmfpj7dyk0002syd4wrqkzfl7",
    "clerkId": "user_32sMQetRPq36eZjbezvIxLRtLxm",
    "email": "admin@test.com",
    "firstName": "Admin",
    "lastName": "Test",
    "role": "ADMIN",
    "createdAt": "2025-09-18T14:54:16.941Z",
    "updatedAt": "2025-09-18T15:10:32.123Z"
  },
  "message": "User promoted to ADMIN successfully",
  "previousRole": "CLIENT",
  "newRole": "ADMIN",
  "timestamp": "2025-09-18T15:10:32.123Z"
}
```

### Réponse d'erreur (404 Not Found)

```json
{
  "success": false,
  "error": "User not found",
  "timestamp": "2025-09-18T15:10:32.123Z"
}
```

### Logique de promotion

- **CLIENT → ADMIN** : `"User promoted to ADMIN successfully"`
- **ADMIN → CLIENT** : `"User demoted to CLIENT successfully"`
- **Toggle automatique** : Répéter la requête bascule le rôle
- **Logs détaillés** : Toutes les opérations sont loggées

### Implémentation

- Service : `promoteUser()` dans `user.service.ts`
- Validation : Vérification existence utilisateur
- Sécurité : Middleware `withError` pour gestion erreurs
- Audit : Logs structurés pour traçabilité

---

## Tests automatisés

### Jest

```bash
# Tests spécifiques users
npm test users.test.js
```

### Cas testés

**Succès :**

- Récupération liste utilisateurs
- Structure de réponse correcte
- Changement de rôle CLIENT → ADMIN
- Retour ADMIN → CLIENT

**Erreurs :**

- ID utilisateur invalide (404)
- Gestion appropriée des erreurs

### Résultats attendus

```
PASS tests/__tests__/api/users.test.js
Users API
  GET /api/users
    ✓ should return users list successfully
    ✓ should have correct response structure
  POST /api/users/[id]/promote
    ✓ should switch user role successfully
    ✓ should toggle back to original role
    ✓ should return 404 for invalid user ID

Test Suites: 1 passed, 1 total
Tests: 5 passed, 5 total
```

---

## Notes techniques

### Synchronisation Clerk

- Utilisateurs créés via Clerk webhook automatiquement
- Modification manuelle possible via `/promote`
- Suppression via Clerk Dashboard synchronisée

### Sécurité

- Aucune authentification requise (développement)
- En production : ajouter middleware auth
- Logs automatiques des changements de rôle

### Base de données

- Table `User` avec enum `Role` (CLIENT, ADMIN)
- Contraintes : email unique, clerkId unique
- Timestamps automatiques (createdAt, updatedAt)
