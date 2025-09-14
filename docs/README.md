# E-Commerce Starter V2 - Documentation

**Next.js 15 + Clerk + PostgreSQL + Prisma + i18n**

---

## 🚀 **Démarrage Ultra-Rapide**

```bash
# 1. Installation complète automatique
npm run dev:setup

# 2. Lancement développement
npm run dev
# → http://localhost:3000
```

> **📋 Configuration détaillée** : Voir [`setup.md`](./1-foundations/setup.md) pour variables d'environnement

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

## ⚙️ **Scripts Essentiels**

| Commande | Description | Usage |
|----------|-------------|-------|
| `npm run dev` | Développement Next.js | Application locale |
| `npm run dev:setup` | Configuration complète | Premier lancement |
| `npm run db:studio` | Interface database | Gestion données |
| `npm run build` | Build production | Déploiement |

### **Database**
```bash
npm run db:push      # Sync schéma
npm run db:seed      # Données test
npm run db:reset     # Reset complet
```

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

## 🆘 **Dépannage Express**

| Problème | Solution | Documentation |
|----------|----------|---------------|
| **Premier lancement** | `npm run dev:setup` | [Setup](./1-foundations/setup.md) |
| **Webhook ne fonctionne pas** | Vérifier ngrok + Clerk config | [Clerk Sync](./4-database-stack/clerk-postgres-sync.md) |
| **Erreur database** | `npm run db:push` | - |
| **Reset complet** | `npm run db:reset` puis `npm run dev:setup` | - |

---

**Version** : 2.0 (Architecture refactorisée)  
**Dernière MAJ** : Septembre 2025
