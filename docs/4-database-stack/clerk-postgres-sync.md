# Test Synchronisation Clerk ↔ PostgreSQL

## 🔧 **Configuration Webhook (Prod & Développement)**

### **Prérequis : Ngrok**

Pour recevoir les webhooks en local, votre serveur doit être accessible depuis internet.

👉 **[Voir le guide d'installation et configuration Ngrok](../3-development-tools/ngrok-setup.md)**

## <br>

### **1. Préparation environnement local**

```bash
# Terminal 1 : Lancer l'application
npm run dev  # → http://localhost:3000
```

### **2. Exposition publique avec ngrok**

```bash
# Terminal 2 : Exposer l'application Next.js
ngrok http 3000

# ⚠️ IMPORTANT : Port 3000 (Next.js app)
# Ngrok va donner une URL comme : https://abc123.ngrok.io
```

### **3. Configuration Clerk Dashboard**

1. **Aller sur** [Clerk Dashboard](https://dashboard.clerk.com)
2. **Webhooks** → **Add Endpoint**
3. **URL** : `https://abc123.ngrok.io/api/webhooks/clerk`
   - URL ngrok + `/api/webhooks/clerk`
4. **Events** : Cocher `user.created`, `user.updated`, `user.deleted`
5. **Copier le Secret** affiché (commençant par `whsec_...`)

### **4. Configuration .env**

```env
# Ajouter dans .env
CLERK_WEBHOOK_SECRET="whsec_abc123..." # Secret copié de Clerk
```

## 🎯 **Tests de Synchronisation**

### **Prérequis : Webhook configuré**

⚠️ **Les webhooks doivent être configurés avant de tester la synchronisation**

### **1. Test Ajout Utilisateur**

1. **Se connecter** sur http://localhost:3000
2. **Utiliser Google/Email** pour créer un compte
3. **Vérifier synchronisation** :
   - **Clerk Dashboard** → Users → Voir le nouvel utilisateur
   - **Neon Console** → Tables → Voir l'utilisateur en base PostgreSQL

### **2. Test Suppression Utilisateur**

1. **Clerk Dashboard** → Users → Supprimer un utilisateur
2. **Vérifier suppression** :
   - **Neon Console** → Tables → Utilisateur supprimé de PostgreSQL

### **3. Validation APIs**

```bash
# Lister utilisateurs synchronisés
curl http://localhost:3000/api/users

# Santé application
curl http://localhost:3000/api/internal/health
```

##  **Points de Validation**

### **✅ APIs Opérationnelles**

- `GET /api/users` → Liste utilisateurs synchronisés
- `GET /api/internal/health` → Status système + nombre utilisateurs
- Logs webhooks visibles dans terminal `npm run dev`

---

## 🧪 **Scripts de Validation**

### **Tests Base de Données**

```bash
# Reset complet de la DB (Schema + Seed)
npm run db:reset

# Validation des opérations CRUD (User, etc.)
npm run test:db
```

### **Outils de Debug Webhook**

```bash
# Lancer un serveur de réception de webhooks localement
npm run test:webhook

# Exposer ce serveur via ngrok
ngrok http 3000
# URL à configurer dans Clerk: https://...ngrok.io/test-webhook
```

---

## 🔐 **Gestion des Rôles (Admin)**

La synchronisation Clerk ↔ PostgreSQL attribue par défaut le rôle **CLIENT** à tous les nouveaux utilisateurs.

👉 **Pour créer votre premier Administrateur, suivez le guide :**
**[🚀 Initialisation Complète (Day 1 Protocol)](../1-foundations/setup-initial.md)**

### **Scripts de Synchronisation Manuelle**

Si les webhooks ne fonctionnent pas (ex: pas de ngrok), vous pouvez forcer la synchronisation :

```bash
# 1. Créer des utilisateurs de test dans Clerk (Dev)
npm run sync-clerk create

# 2. Forcer la synchronisation Clerk -> DB Locale
npm run sync-clerk sync
```

