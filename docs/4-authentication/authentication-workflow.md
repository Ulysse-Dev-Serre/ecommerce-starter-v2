# Workflow d'Authentification (Clerk + DB)

Ce document détaille le cycle de vie d'un utilisateur, de son inscription sur Clerk à sa synchronisation dans notre base de données locale.

---

## 1. Architecture Hybride : Clerk + DB Locale

Notre système repose sur une séparation claire des responsabilités :
- **Clerk (Maître de l'Identité)** : Gère les mots de passe, les tokens sécurisés (JWT), les sessions, les réseaux sociaux (Google, Apple) et l'authentification multi-facteurs (MFA). 
- **PostgreSQL (Données Métier)** : Stocke une **copie locale** synchronisée (ID Clerk, email, nom, rôle).

### Pourquoi cette synchronisation ?
Sans copie locale, nous ne pourrions pas faire de requêtes SQL performantes comme : *"Donne-moi toutes les commandes de l'utilisateur X"*. L'ID Clerk sert de clé de liaison entre le monde de l'identité et le monde du e-commerce.

---

## 2. Le Flux d'Inscription (Webhooks)

Voici ce qui se passe quand un nouveau client crée un compte :

1.  **Inscription** : L'utilisateur s'inscrit sur l'interface sécurisée de Clerk.
2.  **Webhook (Événement)** : Clerk génère un événement `user.created` signé numériquement.
3.  **Vérification (Svix)** : Notre API `/api/webhooks/clerk` reçoit l'événement et utilise la bibliothèque **Svix** pour vérifier la signature (garantissant que le message vient bien de Clerk).
4.  **Synchronisation** : `UserClerkService` extrait les données et crée l'entrée dans la table `User` via Prisma.
5.  **Indépendance** : L'utilisateur peut désormais passer des commandes ; sa session est gérée par Clerk, mais ses données métier sont dans notre DB.

> 💡 **Développement (Ngrok)** : En local, vous devez utiliser Ngrok pour exposer votre port 3000 afin que Clerk puisse envoyer les webhooks vers votre machine. Sans cela, aucun utilisateur ne sera créé dans votre base locale après l'inscription.

---

## 3. Gestion des Rôles et Permissions

Le système supporte deux rôles principaux : `CLIENT` et `ADMIN`.

### Comment changer le rôle d'un utilisateur ?
Il existe deux méthodes sécurisées :
1.  **Via le Dashboard Clerk (Recommandé)** : 
    - Allez dans la fiche de l'utilisateur sur Clerk.
    - Modifiez le champ `public_metadata` pour ajouter `{"role": "ADMIN"}`.
    - Le webhook `user.updated` se déclenchera et mettra à jour la base de données locale instantanément.
2.  **Via Prisma Studio** : Utile pour le premier administrateur du site.
    ```bash
    npm run db:studio
    ```

---

### 4. Maintenance & Synchronisation

Le Starter inclut un script utilitaire pour gérer la cohérence entre Clerk et votre base de données locale. 

**Commande principale :** `npm run sync-clerk [mode]`

| Mode | Action | Usage |
| :--- | :--- | :--- |
| **`sync`** | Récupère les utilisateurs Clerk et synchronise la DB locale. | Après des inscriptions webhooks manquées ou une migration. |
| **`create`** | Crée 3 comptes de test directement dans Clerk. | Pour peupler rapidement un nouvel environnement de test. |

#### Focus sur la Synchronisation (`sync`)
Si votre serveur était éteint ou si Ngrok a sauté pendant une inscription, vous aurez un utilisateur sur Clerk qui n'existe pas dans votre base locale. Le mode `sync` :
- Récupère les 100 derniers utilisateurs de Clerk.
- Crée les manquants en base de données (rôle `CLIENT` par défaut).
- Met à jour les emails, noms et images pour les utilisateurs existants.

#### Mode Création (`create`)
Ce mode crée trois profils types dans votre instance Clerk :
- `admin@test.com` (Rôle ADMIN via metadata Clerk)
- `client@test.com` (Rôle CLIENT)
- `marie@test.com` (Rôle CLIENT)
*Mot de passe par défaut : `A_dmin_P@ssw0rd!123`*

---

## 5. Sécurité et Sessions

### Validation en Temps Réel
Notre Middleware (`middleware.ts`) valide les sessions Clerk de manière atomique à chaque requête. Si un utilisateur est supprimé sur Clerk, son accès est immédiatement révoqué sur le site, puis supprimé en base locale lors de la réception du webhook `user.deleted`.

### Priorité à l'ID Clerk
Dans tout le code source, l'utilisateur n'est jamais identifié par son email ou un ID incrémental SQL, mais par son **`clerkId`**. C'est le contrat de confiance qui lie votre base de données à l'autorité d'authentification.
