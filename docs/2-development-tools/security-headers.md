# Headers HTTP de Sécurité - Guide Simple

Ce document explique comment les headers de sécurité protègent votre site web contre les attaques courantes.

---

## 🎓 **Comment ça fonctionne - Guide débutant**

### **🔄 Processus étape par étape**

**Étape 1 :** Un utilisateur visite votre site web  
**Étape 2 :** Le serveur envoie la page ET des headers de sécurité  
**Étape 3 :** Le navigateur lit ces headers et applique les règles de sécurité  
**Étape 4 :** Les attaques sont automatiquement bloquées par le navigateur

### **🛡️ Quelles attaques sont bloquées**

**🚫 Clickjacking** → `X-Frame-Options: SAMEORIGIN`

- Empêche les pirates d'embarquer votre site dans une iframe invisible
- L'utilisateur ne peut pas cliquer sur des éléments cachés

**🚫 MIME Sniffing** → `X-Content-Type-Options: nosniff`

- Empêche le navigateur d'exécuter des fichiers de manière incorrecte
- Un fichier image ne peut pas devenir un script malveillant

**🚫 Fuites d'informations** → `Referrer-Policy: strict-origin-when-cross-origin`

- Contrôle les informations envoyées aux sites externes
- Protège la vie privée de vos utilisateurs

**🚫 Connexions non sécurisées** → `Strict-Transport-Security (HSTS)`

- Force HTTPS sur toutes les futures connexions
- Bloque les attaques "man-in-the-middle"

---

## ⚙️ **Configuration actuelle**

### **🔐 Headers actifs automatiquement**

**🤖 Sur toutes les pages :**

- ✅ **Anti-clickjacking** → `X-Frame-Options: SAMEORIGIN` bloque les iframes malveillantes
- ✅ **Anti-MIME sniffing** → `X-Content-Type-Options: nosniff` empêche l'exécution incorrecte
- ✅ **Protection vie privée** → `Referrer-Policy` contrôle les infos envoyées aux sites externes
- ✅ **Force HTTPS** → `Strict-Transport-Security` bloque les connexions non sécurisées

**🌍 CORS dynamique :**

- ✅ **Développement** → `Access-Control-Allow-Origin: *` (tous domaines autorisés)
- ✅ **Production** → `Access-Control-Allow-Origin: votre-domaine.com` (sécurisé)

### **🔧 Headers configurés dans next.config.ts**

```javascript
// ✅ IMPLÉMENTÉ - Headers actifs sur toutes les pages
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Access-Control-Allow-Origin',
    value: process.env.NEXT_PUBLIC_CORS_ORIGIN || '*',
  },
];
```

---

## 🛠️ **Configuration CORS**

### **Comment CORS fonctionne**

**🌍 Le problème :** Par défaut, les navigateurs bloquent les requêtes entre différents domaines
**✅ La solution :** CORS autorise explicitement certains domaines

### **Variables d'environnement**

```env
# 🔧 À ajouter dans votre .env
NEXT_PUBLIC_CORS_ORIGIN=https://www.mon-ecommerce.com

# 🟢 Développement (par défaut)
# Si non défini = "*" (tous domaines autorisés)

# 🟡 Production (recommandé)
# Spécifier votre domaine exact pour la sécurité
```

### **Comportement selon l'environnement**

```typescript
// 🟢 npm run dev
// CORS = "*" (tous domaines) - Facile pour développer

// 🟡 npm run build + start
// CORS = variable d'environnement - Sécurisé pour production
```

---

## 📊 **Fichiers concernés**

### **🎯 Rôle des fichiers**

**🏗️ `next.config.ts` - Configuration centrale**

- Configure tous les headers de sécurité HTTP
- Gère le CORS selon la variable d'environnement
- Applique les headers automatiquement à toutes les pages

**🛡️ `src/middleware.ts` - Traçage des requêtes**

- Ajoute `x-request-id` unique pour chaque requête
- Gère les redirections i18n (langues)
- Log les redirections importantes

---

## 🚀 **Plan d'implémentation Phase 2**

### **🛡️ Content Security Policy (CSP) - Futur**

```typescript
// Protection avancée contre XSS (injection de scripts)
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;
```

### **📋 Checklist pour l'implémentation**

- [x] **Étape 1 :** Ajouter les headers de base dans `next.config.ts` ✅
- [ ] **Étape 2 :** Tester les headers avec des outils en ligne
- [ ] **Étape 3 :** Configurer CORS pour production
- [ ] **Étape 4 :** Implémenter CSP (Content Security Policy) - Phase 2
- [ ] **Étape 5 :** Audit de sécurité complet - Phase 2

---

## ✅ **Comment vérifier**

### **🔍 Vérifier les headers dans le navigateur**

```bash
# 1. Ouvrir les DevTools (F12)
# 2. Onglet "Network"
# 3. Rafraîchir la page
# 4. Cliquer sur le premier fichier
# 5. Regarder "Response Headers"
```

### **🌐 Outils en ligne pour tester**

- **SecurityHeaders.com** - Scanner gratuit de headers
- **Mozilla Observatory** - Audit sécurité complet
- **HSTS Preload** - Vérifier la configuration HSTS

### **📱 Commandes pour tester localement**

```bash
# Vérifier les headers avec curl
curl -I http://localhost:3000

# Chercher un header spécifique
curl -I http://localhost:3000 | grep -i "x-frame-options"
```

---

## 🎯 **Référence rapide**

### **Headers de sécurité essentiels**

- `X-Frame-Options` → Anti-clickjacking
- `X-Content-Type-Options` → Anti-MIME sniffing
- `Referrer-Policy` → Protection vie privée
- `Strict-Transport-Security` → Force HTTPS

### **Variables d'environnement**

- `NEXT_PUBLIC_CORS_ORIGIN` → Domaine autorisé pour CORS

### **Fichiers à modifier**

- `next.config.ts` → Configuration headers de sécurité
- `.env` → Variables d'environnement CORS
