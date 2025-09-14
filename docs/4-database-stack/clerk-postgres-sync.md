# Test Synchronisation Clerk ↔ PostgreSQL

## 🔧 **Configuration Webhook (Prod & Développement)**

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

## 📊 **Points de Validation**

### **✅ Synchronisation Fonctionnelle**
- Connexion via frontend → Utilisateur créé en PostgreSQL
- Modification profil Clerk → Mise à jour base automatique
- Suppression Clerk Dashboard → Supprimé de PostgreSQL

### **✅ APIs Opérationnelles**
- `GET /api/users` → Liste utilisateurs synchronisés
- `GET /api/internal/health` → Status système + nombre utilisateurs
- Logs webhooks visibles dans terminal `npm run dev`



---



## 🧪 **Scripts de Test Rapides et ## 📋 **Outils de Debug Avancés****

### **Comptes de Test**
```bash
# Créer comptes test Clerk (admin@test.com, client@test.com, marie@test.com)
npm run sync-clerk create
# Mot de passe : A_dmin_P@ssw0rd!123

# Reset complet si nécessaire
npm run db:reset
```

### **Tests Manuels APIs**
```bash
# Test rapide tous endpoints
npm run test:manual

# Test base de données
npm run test:db
```

---



*Ces outils sont utiles pour le développement mais ne remplacent pas les interfaces Clerk et Neon.*

### **Serveur webhook debug local**
```bash
# Terminal 3 : Serveur de debug
npm run test:webhook  # → http://localhost:3001

# Terminal 4 : Exposer serveur debug
ngrok http 3001

# Configurer Clerk avec : https://debug-url.ngrok.io/test-webhook
# Permet de voir les détails bruts des webhooks
```

### **Tests clients webhook**
```bash
# Tester le serveur debug
npm run test:webhook:client
```

**✅ Synchronisation 100% automatique - Prête pour production !**
