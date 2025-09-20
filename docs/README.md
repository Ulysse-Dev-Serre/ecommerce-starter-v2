# E-Commerce Starter V2 - Documentation

**Next.js 15 + Clerk + PostgreSQL + Prisma + i18n**

---

## 🚀 **Étapes à suivre pour le premier démarrage**

### **Étape 0 : Installation des dépendances**
```bash
npm install
```

### **Configuration du fichier .env**
```env
# Base de données Neon PostgreSQL
DATABASE_URL=

# Projet Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Pour synchroniser Clerk avec la base de données ( avec linux etape 5)
CLERK_WEBHOOK_SECRET=
```

---

## **Étape 1 : Base de données**
- Créer la base de données sur [Neon](https://neon.com/)
- Ajouter la clé de connexion au fichier `.env` → `DATABASE_URL=`

---

## **Étape 2 : Création des tables avec Prisma**
```bash
# Génère le client Prisma basé sur le schéma
npx prisma generate

# Crée/met à jour les tables dans la base de données
npx prisma db push
```

---

## **Étape 3 : Projet Clerk**
- Créer un projet Clerk, configurer et appliquer les 2 clés [Clerk](https://clerk.com/nextjs-authentication) :
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=`
  - `CLERK_SECRET_KEY=`

À ce stade, Clerk est fonctionnel. Vous pouvez ajouter un utilisateur via la navbar frontend ou en exécutant le script de test `scripts/sync-clerk-users.ts` avec la fonction `createTestUsersInClerk()` (lignes 94-151) :

```bash
npm run sync-clerk create
```

---

## **Étape 4 : Synchronisation entre Clerk et PostgreSQL**
Il est également possible d'utiliser le fichier `scripts/sync-clerk-users.ts` pour synchroniser nos utilisateurs Clerk avec notre base de données via la fonction `syncClerkUsers()` (lignes 20-89) :

```bash
npm run sync-clerk sync
```

## **Étape 5 : Synchronisation du front-end en temps réel avec Vercel**

**Cette partie est complétée, mais je n’ai pas eu le temps de la documenter.**  
Le principe est : déployer le site sur Vercel afin d’obtenir une URL accessible en ligne, puis l’intégrer dans notre webhook clerk et ensuite view le webhook clerk ajouter le CLERK_WEBHOOK_SECRET= dans le .env.

Le but de cette étape est simplement d’avoir un front-end fonctionnel en premier. 

Je développe ce projet sur la partition Linux de mon PC et, plutôt que d’utiliser Vercel, j’utilise un framework appelé Ngrok pour remplacer Vercel, qui n’est pas adapté à Windows. Bref, l’objectif ici est surtout d’obtenir un un syncho postgress et vercel lorsqu’on connecte un utilisateur via le login du front-end. C’est pour cette raison que je ne me suis pas attardé sur la documentation. Donc ici, on synchronise manuellement grâce à la méthode que nous avons vue précédemment a l'tape 4.

 



<br>
<br>


---

---

## **Étape 6 : Tests de l'API Users avec Postman**

Une fois l'application configurée et démarrée, on peut tester l'API de gestion des utilisateurs.

###  **GET** /api/users - Lister tous les utilisateurs

Dans Postman :
- **Méthode :** GET
- **URL :** `http://localhost:3000/api/users`

**Réponse attendue :**
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

**Note :** Copiez un des ID affichés (ex: `cmfpj7dyk0002syd4wrqkzfl7`) pour le test suivant.

---

###  **POST** /api/users/[id]/promote - Changer le rôle d'un utilisateur

Bascule le rôle entre CLIENT et ADMIN. Si l'utilisateur est CLIENT, il devient ADMIN et vice versa.

Dans Postman :
- **Méthode :** POST  
- **URL :** `http://localhost:3000/api/users/cmfpj7dyk0002syd4wrqkzfl7/promote`
  (Remplacez `cmfpj7dyk0002syd4wrqkzfl7` par l'ID copié du test précédent)
- **Headers :** `Content-Type: application/json`
- **Body :** Aucun (sélectionner "none")

**Réponse attendue :**
```json
{
  "success": true,
  "message": "User promoted to ADMIN successfully",
  "previousRole": "CLIENT",
  "newRole": "ADMIN",
  "user": { ... },
  "timestamp": "2025-09-18T15:10:32.123Z"
}
```

**Pour retourner au rôle précédent :** Répétez la même requête POST avec la même URL.

---

###  **GET** /api/internal/health - Diagnostic système

Cette route permet de vérifier rapidement l'état de  l'application et de la base de données.

Dans Postman :
- **Méthode :** GET
- **URL :** `http://localhost:3000/api/internal/health`

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-18T15:17:41.607Z",
    "database": {
      "connected": true,
      "userCount": 3
    },
    "environment": "development",
    "version": "0.1.0"
  }
}
```

**Utilité :** Confirme que le serveur Next.js et la base de données PostgreSQL fonctionnent correctement. Le `userCount` prouve que la connexion à la base est active.



---

## **Étape 7 : Tests automatisés avec Jest**

Après avoir validé manuellement l'API avec Postman (Étape 6), cette étape ajoute des tests automatisés pour prouver le bon fonctionnement de l'API via des tests reproductibles.

### **Architecture de test existante**

Le projet utilise Jest avec une architecture professionnelle plutôt qu'axios car ceci est une partie de mon projet personnelle que j'ai tenté de redocumenter pour ce TP :

```
tests/
├── utils/
│   ├── setup.js           # Configuration globale des tests
│   └── test-client.js     # Client HTTP réutilisable  
└── __tests__/api/
    ├── users.test.js      # Tests API Users
    └── health.test.js     # Tests API Health
```

**Terminal 1 :** `npm run dev`  
**Terminal 2 :** Exécuter les commandes suivantes

#### **Exécution des tests :**
```bash
# Tests spécifiques
npm test users.test.js
npm test health.test.js
```

### **Résultats attendus**

#### **Tests users.test.js :**
```
PASS tests/__tests__/api/users.test.js
Users API
  GET /api/users
    ✓ should return users list successfully (495 ms)
    ✓ should have correct response structure (335 ms)
  POST /api/users/[id]/promote
    ✓ should switch user role successfully (1602 ms)
    ✓ should toggle back to original role (1076 ms)
    ✓ should return 404 for invalid user ID (657 ms)

Test Suites: 1 passed, 1 total
Tests: 5 passed, 5 total
```

#### **Tests health.test.js :**
```
PASS tests/__tests__/api/health.test.js  
Health API
  GET /api/internal/health
    ✓ should return health status successfully (331 ms)
    ✓ should have correct health data structure (326 ms) 
    ✓ should report healthy database connection (340 ms)

Test Suites: 1 passed, 1 total
Tests: 3 passed, 3 total
```

### **Validation complète du fonctionnement**

Les tests automatisés prouvent :

#### **Cas de succès :**
- Récupération de la liste des utilisateurs
- Changement de rôle CLIENT → ADMIN
- Toggle retour ADMIN → CLIENT  
- Health check avec connectivité base de données

#### **Cas d'erreur :**
- Gestion appropriée des erreurs 404
- Logs d'avertissement pour utilisateurs inexistants
- Réponses d'erreur structurées

#### **Performance :**
- Temps de réponse acceptables (< 2 secondes)
- Cohérence entre les appels

Les tests automatisés Jest prouvent le fonctionnement correct avec logs détaillés.
---


---

## 🏗️ **Stack & Architecture**

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Frontend** | Next.js 15 + TypeScript | App Router + SSR |
| **Auth** | Clerk | Authentification + webhooks |
| **Database** | PostgreSQL + Prisma | ORM + migrations |
| **i18n** | next-intl | FR/EN routing |
| **Styling** | Tailwind CSS | Design system |

> **📋 Architecture complète** : Voir [`architecture.md`](./1-foundations/architecture.md) pour structure détaillée

---

## 🧪 **Validation & Tests**

### **APIs Disponibles**


> **📋 Tests complets** : Voir [`clerk-postgres-sync.md`](./4-database-stack/clerk-postgres-sync.md) pour webhooks

---



### **Qualité**
```bash
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Tests Jest
```

---

## 📚 **Documentation Détaillée**

### **Configuration & Setup**
- 📋 **[INDEX.md](./INDEX.md)** - Navigation complète documentation
- ⚙️ **[Setup](./1-foundations/setup.md)** - Variables environnement détaillées
- 🏗️ **[Architecture](./1-foundations/architecture.md)** - Structure système complète

### **Fonctionnalités**
- 🌐 **[i18n Configuration](./2-Language_internationalization/language-config.md)** - Système multilingue
- 👤 **[Clerk Sync](./4-database-stack/clerk-postgres-sync.md)** - Webhooks utilisateurs
- 🛠️ **[Logging](./3-development-tools/logging.md)** - Debug structuré

### **Développement**
- 🚀 **[Roadmap](./1-foundations/Roadmap.md)** - Évolution projet
- 🔒 **[Sécurité](./3-development-tools/security-headers.md)** - Protection HTTP

---


