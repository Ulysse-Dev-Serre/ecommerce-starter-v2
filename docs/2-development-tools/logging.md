# Système de Logging - Guide Simple

Ce document décrit le système de logging structuré du projet pour un monitoring efficace et un debugging facilité. 

---

## 🎓 **Comment ça fonctionne - Guide technique**

### **🔄 Processus étape par étape**

**Étape 1 :** Une action se produit dans l'application (erreur, action utilisateur, etc.)  
**Étape 2 :** Le logger vérifie si ce niveau de log est autorisé dans l'environnement actuel (`LOG_LEVEL` dans `.env`)  
**Étape 3 :** **Anonymisation automatique** → Toutes les données sensibles (passwords, tokens, Stripe keys) sont masquées par `[REDACTED]`.  
**Étape 4 :** Création d'un objet JSON structuré (format standard cloud).  
**Étape 5 :** Affichage dans le terminal ou envoi vers un service de centralisation des logs.

---

## 🛡️ **Sécurité & Confidentialité (Règle d'Or)**

Notre logger possède une sécurité intégrée : il **masque automatiquement** les données sensibles.
- **Masqués par défaut** : `password`, `token`, `secret`, `authorization`, `cookie`, `stripe-signature`.
- **Règle** : Si vous ajoutez un nouveau champ sensible, vérifiez qu'il est bien inclus dans `SENSITIVE_KEYS` dans `src/lib/core/logger.ts`.

---

## 🛠️ **Utilisation pratique**

### **Fonctions principales**

```typescript
import {
  logger,
  logUserAction,
  logError,
  createRequestLogger,
} from '@/lib/core/logger';

// 1. Logger de base (Utilisation de l'objet de données + Message)
logger.info({ userId: '123' }, 'Action réussie');

// 2. Logger avec ID de requête (Recommandé pour les APIs)
// Permet de tracer TOUTES les étapes d'une même requête
const requestLogger = createRequestLogger(); 
requestLogger.info({ step: 'validation' }, 'Début validation');

// 3. Helpers spécialisés (Ajoutent automatiquement la catégorie)
logUserAction('purchase', { userId: '123', orderId: 'ord_1' });
logError(error, { component: 'checkout' });
```

### **🎯 Rôle des fichiers**

- **`src/lib/core/logger.ts`** : Le cerveau. Gère le formatage JSON, l'anonymisation et les niveaux.
- **`src/lib/middleware/withError.ts`** : Le garde du corps. Capture automatiquement les crashes API et les log avec le niveau `error`.
- **`src/lib/middleware/withLogging.ts`** : (Optionnel) Log le temps de réponse et le statut HTTP de chaque requête.

---

## 📋 **Référence & Standards**

### **Format de sortie (JSON)**
Chaque log génère une ligne JSON unique, facile à analyser par des outils comme Datadog ou CloudWatch :

```json
{
  "timestamp": "2025-09-28T10:30:15.123Z",
  "level": "info",
  "service": "ecommerce-frontend",
  "requestId": "id_1727516215123_xyz789",
  "userId": "123",
  "category": "user_action",
  "message": "User action: purchase"
}
```

### **Niveaux par environnement**
- 🟢 **Local** : `debug`, `info`, `warn`, `error`
- 🟡 **Production** : `warn`, `error` (pour éviter le bruit et réduire les coûts)
- 🔴 **Tests** : `error`

### **✅ Règle ESLint (`no-console`)**
Nous avons configuré ESLint pour **interdire `console.log`**.
- **Pourquoi ?** `console.log` n'est pas structuré, n'est pas anonymisé et pollue la production.
- **Exception** : Utilisez `logger.info`, `logger.warn` ou `logger.error`.

---

## ⚙️ **Commandes utiles (Terminal)**

```bash
# Voir uniquement les erreurs dans vos logs
npm run dev | grep '"level":"error"'

# Extraire les actions utilisateur
npm run dev | grep '"category":"user_action"'
```
