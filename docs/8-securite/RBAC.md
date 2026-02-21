# 🔐 Gestion des Rôles (RBAC)

Ce document détaille la politique de contrôle d'accès basée sur les rôles (Role-Based Access Control) de l'application.

---

## 1. Définition des Rôles

Le système s'appuie sur deux niveaux d'autorisation distincts :

| Rôle | Cible | Description des Droits |
| :--- | :--- | :--- |
| **CLIENT** | Utilisateur final | Peut acheter, gérer ses paniers, voir son historique de commandes personnelles. |
| **ADMIN** | Gestionnaire | Accès total au catalogue, à la gestion des ventes, aux médias et à l'annuaire client. |

---

## 2. Hiérarchie et Permissions

### 🔓 Accès Public
Certaines données sont accessibles sans authentification pour favoriser le SEO et l'expérience utilisateur :
- Catalogue produits (consultation uniquement).
- Panier d'achat temporaire.
- Santé du système (Health Check).

### 🔑 Accès Client (Standard)
Requiert une connexion via Clerk :
- Consultation des détails personnels de commande.
- Demande de remboursement.
- Accès aux préférences de profil utilisateur.

### 🛡️ Accès Admin (Restreint)
Protégé par le middleware `withAdmin` :
- Modification des prix et des stocks.
- Génération d'étiquettes de transport Shippo.
- Promotion d'autres utilisateurs au rang d'Admin.

---

## 3. Mécanisme Technique

Le rôle d'un utilisateur est géré de deux manières pour garantir performance et sécurité :

1.  **Dans Clerk (Source de Vérité)** : Le rôle est stocké dans les `public_metadata` de l'utilisateur sur Clerk. Cela permet au client (frontend) de savoir instantanément s'il doit afficher le menu Admin.
2.  **En BDD locale (Vérification)** : Lors de chaque requête API sensible, le système vérifie le rôle enregistré dans notre base de données PostgreSQL pour empêcher toute usurpation via le client.

---

## 4. Promotion au rang d'Admin

Pour transformer un compte Client en compte Administrateur :
- **Via l'API/Admin** : Un administrateur existant utilise le bouton "Promouvoir" sur la fiche client.
- **Effet** : Le système met à jour simultanément les métadonnées Clerk et la base de données locale.

---

## 5. Sécurité Transversale : Ownership
En plus du rôle, le système vérifie toujours la **propriété** des données.
*Exemple : Un utilisateur ayant le rôle `CLIENT` ne pourra JAMAIS voir la commande d'un autre `CLIENT`, car le service vérifie que l'`userId` de la commande correspond à l'utilisateur connecté.*
