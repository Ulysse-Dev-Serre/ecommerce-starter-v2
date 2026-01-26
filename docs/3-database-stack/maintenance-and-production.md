#  Maintenance & Production (DB)

Ce guide détaille les commandes de maintenance de la base de données et le protocole à suivre pour faire évoluer le schéma sans risquer de perdre les données clients.

---

## 1. Phase de Développement (Le "Bac à Sable")

En développement, on modifie souvent le schéma. On peut se permettre de "casser" la base car les données sont fictives.

### Commandes Radicales
- **`npm run db:push`** : Synchronise immédiatement le schéma `schema.prisma` avec la DB. **Attention** : Peut supprimer des données si une table est renommée ou supprimée.
- **`npm run db:reset`** : Efface TOUT, recrée les tables et relance le seed (données de test). À utiliser pour repartir sur une base propre.
- **`npm run db:studio`** : Ouvre une interface visuelle pour manipuler les données.

---

## 2. Phase de Production (Le Protocole "Zéro Perte")

Lorsque vous avez des clients réels (ex: 300 clients fidèles), vous ne pouvez plus utiliser `db:push`. Il faut utiliser les **Migrations**.

### Pourquoi utiliser les Migrations ?
Une migration est un script SQL qui décrit précisément le changement (ex: *"Ajouter une colonne 'phone' sans supprimer les autres"*). Cela permet de garder un historique et de tester le changement avant de l'appliquer en production.

### Protocole de mise à jour sécurisé :
1. **Modifier le schéma** dans `schema.prisma`.
2. **Générer la migration** (en local) :
   ```bash
   # Remplacez 'nom_du_changement' par une description courte (ex: ajouter_tel)
   npx prisma migrate dev --name nom_du_changement
   ```
3. **Vérifier le fichier généré** : Allez dans le dossier `/prisma/migrations/DATE_NOM/migration.sql` pour vérifier que Prisma ne va pas supprimer de données par erreur.
4. **Déployer** : Poussez votre code sur Git (le build Vercel appliquera la migration en sécurité).

---

## 3.  Règles d'Or pour la Production (300+ clients)

Pour ne jamais perdre de données client lors d'une évolution :

*   **Règle #1 (Ajout)** : Toujours définir une valeur par défaut (`@default`) lors de l'ajout d'un champ obligatoire sur une table qui contient déjà des données.
*   **Règle #2 (Suppression)** : Ne jamais supprimer une colonne (`DROP COLUMN`) en même temps que tu ajoutes sa remplaçante. Fais-le en deux migrations séparées (une pour ajouter, une pour supprimer une semaine plus tard après avoir migré les données).
*   **Règle #3 (Renommage)** : Prisma peut parfois interpréter un renommage comme "Supprimer + Créer". **Vérifie toujours le fichier .sql** avant de valider.

---

## 4. Nettoyage et Optimisation

### Données Orphelines
Parfois, des utilisateurs Clerk ne sont pas présents en DB (ou vice versa). 
- Utilisez `npm run sync-clerk sync` pour rééquilibrer sans rien casser.

### Stratégie de Backup (Neon)
Votre base de données sur Neon.tech inclut des snapshots automatiques. Avant toute grosse mise à jour de schéma en production, il est conseillé de :
1. Déclencher un snapshot manuel sur le dashboard Neon.
2. Tester la migration sur une branche de base de données séparée (Preview branch).

---

## 5. Commandes de "Secours" & Référence
| Besoin | Commande | Contexte | Danger |
| :--- | :--- | :--- | :--- |
| Voir les données | `npm run db:studio` | Dev/Prod | Faible |
| **Archiver changements** | `npx prisma migrate dev` | **Dev** | Moyen |
| **Sécuriser Schéma** | `npx prisma migrate dev --name sync_state` | **Dev** | Aucun |
| Appliquer Migrations | `npx prisma migrate deploy` | **Production** | Faible |
| Forcer le schéma | `npm run db:push` | Dev uniquement | **EXTRÊME** |
| Réparer Clerk Sync | `npm run sync-clerk sync` | Maintenance | Aucun |
