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
- Créer un projet Clerk, configurer et appliquer les 2 clés :
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

## **Étape 5 : Synchronisation en temps réel (méthode personnelle Linux)**

Cette étape utilise **ngrok** pour exposer votre serveur local et permettre la synchronisation automatique entre Clerk et PostgreSQL lors de la création d'utilisateurs via la navbar frontend. Cela simule le comportement réel de l'application déployée.

### **Principe de fonctionnement :**
1. **ngrok** expose votre serveur local (`localhost:3000`) avec une URL publique
2. Cette URL est configurée comme **webhook endpoint** dans Clerk
3. Lorsqu'un utilisateur est créé/modifié dans Clerk, un webhook est envoyé à votre application
4. Votre application synchronise automatiquement les données avec PostgreSQL

### **Installation et configuration :**
```bash
# Installation ngrok (Linux)
sudo snap install ngrok

# Configuration avec votre token
ngrok config add-authtoken YOUR_TOKEN

# Exposition du serveur local
ngrok http 3000
```

### **Résultat attendu :**
- ✅ Création d'utilisateur via navbar → Synchronisation automatique en base
- ✅ Test des webhooks en environnement de développement
- ✅ Comportement identique à la production

### **Alternative Windows :** 
Déployez le site sur Vercel pour obtenir une URL publique.

📖 **Documentation complète :** [clerk-postgres-sync.md](4-database-stack/clerk-postgres-sync.md) 




<br>
<br>




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
```bash
# Utilisateurs synchronisés
curl http://localhost:3000/api/users

# Santé système
curl http://localhost:3000/api/internal/health
```

### **Interface Database**
```bash
npm run db:studio  # → http://localhost:5555
```

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


