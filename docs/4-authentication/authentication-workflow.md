## 1. Clerk + DB Locale

Notre système repose sur une séparation claire des responsabilités :
- **Clerk** : Est le "Maître de l'Identité". Il gère les mots de passe, les tokens sécurisés (JWT), les sessions et les providers sociaux (Google, etc.).
- **PostgreSQL** : Stocke une **copie locale** des informations essentielles (e-mail, nom, rôle) pour permettre de lier les commandes et les paniers à un utilisateur.

### Pourquoi cette synchronisation ?
Sans copie locale, nous ne pourrions pas faire de requêtes SQL performantes comme : *"Donne-moi toutes les commandes de l'utilisateur X"*.

---

## 2. Le Flux du "First Sign-In"

C'est l'étape la plus critique. Voici ce qui se passe lorsqu'un nouveau client crée un compte :

1. **Inscription** : L'utilisateur s'inscrit sur l'interface Clerk.
2. **Webhook (Le déclencheur)** : Immédiatement après la création, Clerk envoie un message (Webhook `user.created`) à notre API : `/api/webhooks/clerk`.
3. **Synchronisation** : Notre serveur reçoit ce message, extrait les informations (Clerk ID, email, nom) et crée une ligne correspondante dans notre table `User` via Prisma.
4. **Indépendance** : Une fois cette ligne créée, notre base de données est autonome pour gérer les relations métier (commandes, adresses).

> 💡 **Observation Technique (Ngrok)** : En développement, c'est uniquement lors de ce premier "Sign-In" (ou lors d'une mise à jour de profil) que Clerk appelle votre URL Ngrok. Une fois l'utilisateur créé en base locale, la navigation fluide ne nécessite plus d'appel externe de synchronisation.

---

## 3. Validation des Sessions (Runtime)

Lorsqu'un utilisateur navigue sur le site après s'être connecté :
- Clerk n'intervient plus pour écrire en base de données.
- Notre Middleware (`middleware.ts`) vérifie simplement le jeton sécurisé (Session Token) que l'utilisateur porte dans ses cookies.
- Cette vérification est extrêmement rapide et ne dépend pas de webhooks.

---

## 4. Maintenance des Utilisateurs

### Synchronisation Manuelle
Si un webhook a été manqué (ex: serveur éteint pendant une inscription), vous pouvez forcer la resynchronisation :
```bash
npm run sync-clerk sync
```

### Gestion des Rôles
Par défaut, tout nouvel utilisateur est créé avec le rôle **CLIENT**. La modification vers le rôle **ADMIN** doit être faite manuellement en base de données pour plus de sécurité (via Prisma Studio).
