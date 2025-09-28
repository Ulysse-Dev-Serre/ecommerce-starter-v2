# Système de Logging - Guide Simple

Ce document décrit le système de logging structuré du projet pour un monitoring efficace et un debugging facilité.

---

## 🎓 **Comment ça fonctionne - Guide débutant**

### **🔄 Processus étape par étape**

**Étape 1 :** Une action se produit dans l'application (erreur, action utilisateur, etc.)  
**Étape 2 :** Le logger vérifie si ce niveau de log est autorisé dans l'environnement actuel  
**Étape 3 :** Si autorisé → Création d'un objet JSON avec toutes les informations  
**Étape 4 :** Affichage dans la console (dev) ou envoi vers monitoring (production)

### **⚡ Quand les logs se déclenchent**

**🤖 Automatiquement :**

- ✅ **Erreurs API** → `withError.ts` attrape et log toutes les erreurs
- ✅ **Performance lente** → `logPerformance()` génère un warning si > 2 secondes

**👤 Manuellement :**

- ✅ **Actions utilisateur** → `logUserAction('purchase', { userId: '123' })`
- ✅ **Erreurs métier** → `logError('Paiement échoué', { orderId: '456' })`
- ✅ **Informations** → `logger.info({ step: 'validation' }, 'Début validation')`

### **🎯 Rôle des fichiers**

**🧠 `src/lib/logger.ts` - Le cerveau**

- Décide quels logs afficher selon l'environnement
- Formate tout en JSON avec `timestamp`, `requestId`, etc.
- Fournit les fonctions helper (`logUserAction`, `logError`, etc.)

**🛡️ `src/lib/middleware/withError.ts` - Le garde du corps**

- Protection automatique des API routes
- Capture TOUTES les erreurs non gérées
- Log l'erreur + retourne une réponse d'erreur propre

---

## 🛠️ **Utilisation pratique**

### **Fonctions principales**

```typescript
import {
  logger,
  logUserAction,
  logError,
  createRequestLogger,
} from '@/lib/logger';

// Logger de base
logger.info({ userId: '123' }, 'Action réussie');
logger.error({ error: 'Connection failed' }, 'Erreur de connexion');

// Logger avec contexte (recommandé pour APIs)
const requestLogger = createRequestLogger();
requestLogger.info({ step: 'validation' }, 'Début validation');

// Helpers spécialisés
logUserAction('product_view', { userId: '123', productId: '456' });
logError(error, { userId: '123', component: 'checkout' });
```

### **Exemple concret dans une API**

```typescript
import { createRequestLogger, logUserAction } from '@/lib/logger';

export async function POST(request: Request) {
  const logger = createRequestLogger(); // 🆔 ID unique pour tracer

  logUserAction('purchase_attempt', { userId: '123', productId: 'abc' });

  try {
    logger.info({ step: 'validation' }, 'Début validation commande');
    // ... logique métier
  } catch (error) {
    // 🚨 withError.ts va automatiquement logger cette erreur
    throw error;
  }
}
```

**Ce qui s'affiche :**

```json
{
  "timestamp": "2025-09-28T10:30:15.123Z",
  "level": "info",
  "service": "ecommerce-frontend",
  "requestId": "id_1727516215123_xyz789",
  "userId": "123",
  "action": "purchase_attempt",
  "category": "user_action",
  "message": "User action: purchase_attempt"
}
```

---

## ⚙️ **Commandes pratiques**

### **Lancer avec différents niveaux de logs**

```bash
# Développement - TOUS les logs (recommandé)
npm run dev

# Production - Seulement warnings et erreurs
npm run build && npm run start

# Tests - Seulement erreurs
npm run test
```

### **Filtrer les logs en développement**

```bash
# Voir uniquement les erreurs
npm run dev | grep '"level":"error"'

# Voir les actions utilisateur
npm run dev | grep '"category":"user_action"'

# Voir les performances
npm run dev | grep '"category":"performance"'
```

---

## 📋 **Référence rapide**

### **Niveaux par environnement**

- 🟢 **Développement** : debug, info, warn, error
- 🟡 **Production** : warn, error
- 🔴 **Tests** : error

### **Catégories disponibles**

- `user_action` - Actions utilisateur
- `system` - Événements système
- `error` - Erreurs applicatives
- `performance` - Métriques de performance
- `security` - Événements sécurité

### **✅ Bonnes pratiques**

1. **Toujours utiliser `requestId`** pour tracer les requêtes
2. **Inclure le contexte métier** (userId, productId, etc.)
3. **Ne jamais logger de données sensibles** (passwords, tokens, etc.)
4. **Utiliser les helpers** (`logUserAction`, `logError`) plutôt que `logger` direct

### **❌ À éviter**

```typescript
// Pas assez de contexte
logger.info({}, 'Something happened');

// Données sensibles
logger.info({ password: 'secret123' }, 'User login');
```

### **✅ Recommandé**

```typescript
// Contexte riche et sécurisé
logger.info(
  {
    userId: '123',
    action: 'login_success',
    requestId: 'req-456',
  },
  'User successfully authenticated'
);
```
