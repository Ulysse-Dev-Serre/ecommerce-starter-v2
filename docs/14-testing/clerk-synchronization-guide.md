# Documentation de la synchronisation Clerk

### **Test de synchronisation des utilisateurs Clerk**

Pour tester l'ajout et la synchronisation des utilisateurs de Clerk avec la base de données locale, exécutez les scripts `sync-clerk-users.ts`. Ce processus prépare l'environnement pour le `seed` en s'assurant que les identifiants Clerk sont correctement liés.

- **Créer les utilisateurs de test** : Cette commande génère les utilisateurs dans le tableau de bord Clerk.
```bash
  npm run sync-clerk create
```

- **Synchroniser les clerkId** : Cette commande lie les utilisateurs créés dans Clerk à la base de données locale.
```bash
  npm run sync-clerk sync
```

- **Exécuter le seed de la base de données** : Une fois la synchronisation effectuée, vous pouvez exécuter le script de seed qui utilisera ces identifiants pour peupler les tables de test.
```bash
  npm run db:seed
```

- **Supprimer les bases de données Clerk et PostgreSQL.** Si on veut réinitialiser complètement les bases de données Clerk et PostgreSQL, il suffit d'exécuter le script   `reset-local.ts`.Bien vérifier les adresses courriel que vous souhaitez supprimer. Ligne 8 et 20
```bash
  npm npm run db:reset
```