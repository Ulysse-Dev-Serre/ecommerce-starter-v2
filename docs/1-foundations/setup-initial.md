# 🚀 Initialisation Complète (Day 1 Protocol)

Ce guide décrit la procédure à suivre pour réinitialiser complètement l'environnement de développement et configurer le premier administrateur du site.

## 1. Nettoyage Total (Reset)

Cette commande va :
1.  Supprimer **tous** les utilisateurs de test dans votre instance Clerk (Dev).
2.  Supprimer et recréer la base de données locale (PostgreSQL).

```bash
npm run db:reset
```

> **Note :** Le script utilisé est `scripts/reset-database.ts`.

## 2. Création du Premier Utilisateur

Une fois la base vide :
1.  Lancez le serveur de développement : `npm run dev`.
2.  Allez sur [http://localhost:3000](http://localhost:3000).
3.  Cliquez sur **"Se connecter"** ou **"S'inscrire"**.
4.  Créez un compte normalement (via Google ou Email).

Cet utilisateur sera créé dans Clerk et synchronisé automatiquement dans votre base de données locale avec le rôle **`CLIENT`**.

## 3. Promotion Administrateur (Méthode Manuelle)

Pour des raisons de sécurité, aucun script n'attribue le rôle Admin automatiquement. Vous devez le faire manuellement.

1.  Ouvrez l'interface de gestion de base de données :
    ```bash
    npm run db:studio
    ```
2.  Une interface web s'ouvre sur `http://localhost:5555`.
3.  Cliquez sur la table **`User`**.
4.  Trouvez votre utilisateur (vérifiez l'email).
5.  Double-cliquez sur la colonne **`role`**.
6.  Changez la valeur de `CLIENT` à **`ADMIN`**.
7.  Cliquez sur le bouton **"Save 1 change"** (souvent en haut à droite en vert).

Ou fait la meme chose directement dans l'interface de Neon Postgress
