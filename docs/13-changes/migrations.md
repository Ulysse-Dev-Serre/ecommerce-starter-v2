# Guide des migrations de la base de données

Ce guide documente les procédures pour gérer les migrations de la base de données avec Prisma.

---

## 1. Procédure de développement (`prisma migrate dev`)

Utilisez cette commande pour créer une nouvelle migration et l'appliquer à votre base de données locale. Elle est conçue pour les environnements de développement.

### Commande :
```bash
npx prisma migrate dev --name [nom_de_votre_migration]
```

###  migration initiale 
```bash
npx prisma migrate dev --name init
```