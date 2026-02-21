# Maintenance & Production (DB)

Ce guide détaille les protocoles de maintenance et les bonnes pratiques pour faire évoluer votre base de données sans interruption de service ni perte de données.

---

## 1. Phase de Développement (Le "Bac à Sable")

En développement, l'objectif est la rapidité. On peut se permettre de réinitialiser la base pour tester de nouvelles structures.

### Commandes Utiles
- **`npm run db:push`** : Synchronise immédiatement le schéma `schema.prisma` avec votre base locale. Utile pour prototyper rapidement. **Attention** : Peut supprimer des données si un champ est supprimé.
- **`npm run db:reset`** : Efface TOUTES les données, recrée les tables et relance le script de seed (via `scripts/reset-database.ts`). Idéal pour repartir sur un état propre et connu.
- **`npm run db:studio`** : Ouvre l'interface visuelle Prisma Studio pour visualiser et éditer vos données.

---

## 2. Phase de Production (Le Protocole "Zéro Perte")

Dès que votre application est en ligne avec de vrais utilisateurs, l'utilisation de `db:push` est **interdite**. Vous devez passer par les **Migrations**.

### Pourquoi utiliser les Migrations ?
Une migration est un script SQL versionné qui décrit précisément le changement. Cela permet de tester la transition sur une base de test avant de l'appliquer à la production.

### Protocole de mise à jour sécurisé :
1. **Modifier le schéma** dans `prisma/schema.prisma`.
2. **Générer la migration** (en local) :
   ```bash
   # Utilise le script configuré dans package.json
   npm run db:migrate -- --name nom_du_changement
   ```
3. **Vérifier le fichier SQL** : Inspectez le fichier généré dans `/prisma/migrations/DATE_NOM/migration.sql`. Assurez-vous qu'il ne contient pas de `DROP COLUMN` inattendu.
4. **Déploiement** : Poussez votre code sur Git. Le pipeline de déploiement (Vercel/GitHub Actions) appliquera automatiquement la migration via `prisma migrate deploy`.

---

## 3. Règles d'Or de l'Évolution de Schéma

Pour garantir une transition fluide avec des milliers d'utilisateurs :

- **Règle #1 (Ajout)** : Si vous ajoutez un champ obligatoire (`required`), définissez toujours une valeur par défaut (`@default`) pour que les lignes existantes restent valides.
- **Règle #2 (Destruction)** : Ne supprimez jamais une colonne en même temps que vous ajoutez sa remplaçante. Faites-le en deux étapes : 
    1. Ajoutez le nouveau champ et migrez les données via un script.
    2. Une fois que l'app utilise le nouveau champ, supprimez l'ancien dans une migration ultérieure.
- **Règle #3 (Backup)** : Neon.tech permet de créer des **Branches de base de données**. Testez toujours vos migrations lourdes sur une branche de preview avant de toucher à la branche `main`.

---

## 4. Outils de Maintenance & Nettoyage

### Synchronisation Clerk
Si vous constatez un décalage entre vos utilisateurs Clerk et votre base de données locale (ex: suite à une erreur de webhook) :
- **`npm run sync-clerk`** : Lance le script de synchronisation manuelle.

### Nettoyage des Analytics
Les événements de marketing (tracking) peuvent s'accumuler rapidement :
- **`npm run db:cleanup-analytics`** : Supprime les anciens événements marketing selon votre politique de rétention (défini dans `scripts/cleanup-analytics.ts`).

---

## 5. Récapitulatif des Commandes

| Besoin | Commande | Environnement | Risque |
| :--- | :--- | :--- | :--- |
| **Pousser schéma (rapide)** | `npm run db:push` | Dev | **ÉLEVÉ** |
| **Créer une migration** | `npm run db:migrate` | Dev | Moyen |
| **Réinitialiser tout** | `npm run db:reset` | Dev | Critique (Données) |
| **Voir les données** | `npm run db:studio` | Tous | Faible |
| **Sync utilisateurs** | `npm run sync-clerk` | Maintenance | Aucun |
| **Nettoyer logs** | `npm run db:cleanup-analytics` | Maintenance | Aucun |
