# Système de Logging - Configuration

Ce document décrit le système de logging structuré du projet pour un monitoring efficace et un debugging facilité.

---

## 🎯 **Philosophie du Logging**

**Logging intelligent par environnement** :
- **Développement** : Logs verbeux pour debugging (`debug`, `info`, `warn`, `error`)
- **Production** : Logs essentiels seulement (`warn`, `error`)
- **Tests** : Logs d'erreur uniquement (`error`)

**Logs structurés JSON** pour faciliter l'analyse et l'intégration avec des outils de monitoring.

---

## 📁 **Fichiers concernés**

- **`src/lib/logger.ts`** - Configuration principale du système de logging
- **`dev.log`** - Fichier de logs développement local *(optionnel)*
- **`src/lib/middleware/withError.ts`** - Middleware de gestion d'erreurs centralisée

---

## ⚙️ **Configuration des niveaux**

### **Variables d'environnement**
```env
# Optionnel - Override du niveau de log en développement
LOG_LEVEL=debug
NODE_ENV=development
```

### **Niveaux par environnement**
```typescript
const LOG_LEVELS = {
  development: ['debug', 'info', 'warn', 'error'],  // Verbose
  production: ['warn', 'error'],                    // Essentiel
  test: ['error']                                   // Minimal
};
```

---

## 🛠️ **Utilisation du Logger**

### **Logger de base**
```typescript
import { logger } from '@/lib/logger';

// Logs avec données structurées
logger.info({ userId: '123', action: 'login' }, 'User logged in');
logger.warn({ database: 'slow_query', duration: 2500 }, 'Slow database query');
logger.error({ error: 'Connection failed' }, 'Database connection error');
```

### **Logger avec contexte (recommandé)**
```typescript
import { createRequestLogger } from '@/lib/logger';

// Crée un logger avec requestId automatique
const requestLogger = createRequestLogger();
requestLogger.info({ userId: '123' }, 'Processing user request');
requestLogger.error({ step: 'validation' }, 'Validation failed');
```

### **Helpers spécialisés**

#### **Actions utilisateur**
```typescript
import { logUserAction } from '@/lib/logger';

logUserAction('product_view', {
  userId: '123',
  productId: 'prod-456',
  locale: 'fr'
});
```

#### **Erreurs**
```typescript
import { logError } from '@/lib/logger';

try {
  // ... code
} catch (error) {
  logError(error, {
    userId: '123',
    component: 'checkout',
    requestId: 'req-789'
  });
}
```

#### **Performance**
```typescript
import { logPerformance } from '@/lib/logger';

const startTime = Date.now();
// ... opération
const duration = Date.now() - startTime;

logPerformance('database_query', duration, {
  query: 'getUserOrders',
  userId: '123'
});
```

#### **Sécurité (toujours loggé)**
```typescript
import { logSecurity } from '@/lib/logger';

logSecurity('failed_login_attempt', {
  userId: '123',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
});
```

---

## 📊 **Format des logs**

### **Structure JSON**
```json
{
  "timestamp": "2025-09-13T02:11:41.295Z",
  "level": "info",
  "service": "ecommerce-frontend",
  "environment": "development",
  "requestId": "id_1726191101295_abc123def",
  "userId": "123",
  "action": "product_view",
  "category": "user_action",
  "message": "User action: product_view"
}
```

### **Catégories disponibles**
- `user_action` - Actions utilisateur
- `system` - Événements système
- `error` - Erreurs applicatives
- `performance` - Métriques de performance
- `security` - Événements sécurité

---

## 🔧 **Intégration dans les APIs**

### **Exemple Route API**
```typescript
// app/api/users/route.ts
import { createRequestLogger } from '@/lib/logger';

export async function GET(request: Request) {
  const logger = createRequestLogger();
  
  try {
    logger.info({ path: '/api/users' }, 'Fetching users');
    
    const users = await getUsersFromDB();
    
    logger.info({ 
      userCount: users.length,
      duration: Date.now() - startTime 
    }, 'Users fetched successfully');
    
    return NextResponse.json(users);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch users');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### **Middleware d'erreurs**
```typescript
// src/lib/middleware/withError.ts
import { logError } from '@/lib/logger';

export const withError = (handler: Function) => async (req: Request) => {
  try {
    return await handler(req);
  } catch (error) {
    logError(error, {
      path: req.url,
      method: req.method,
      userAgent: req.headers.get('user-agent')
    });
    
    return new Response('Internal Server Error', { status: 500 });
  }
};
```

---

## 🚀 **Monitoring en production**

### **Intégration future**
```typescript
// Configuration pour services externes
const logger = {
  // Développement: console
  // Production: Datadog, Sentry, CloudWatch...
};
```

### **Métriques importantes à surveiller**
- Erreurs par endpoint
- Temps de réponse API
- Actions utilisateur suspectes
- Tentatives de connexion échouées

---

## 🐛 **Debugging**

### **Activer logs debug localement**
```bash
# Variable d'environnement
LOG_LEVEL=debug npm run dev
```

### **Filtrer les logs par catégorie**
```bash
# Voir uniquement les erreurs
npm run dev | grep '"level":"error"'

# Voir les actions utilisateur
npm run dev | grep '"category":"user_action"'
```

---

## ✅ **Bonnes pratiques**

1. **Toujours utiliser `requestId`** pour tracer les requêtes
2. **Inclure le contexte métier** (userId, productId, etc.)
3. **Logger les erreurs avec stack trace**
4. **Mesurer les performances** des opérations critiques
5. **Sécurité : logger sans exposer de données sensibles**

**Exemple à éviter :**
```typescript
// ❌ Pas assez de contexte
logger.info({}, 'Something happened');

// ❌ Données sensibles
logger.info({ password: 'secret123' }, 'User login');
```

**Exemple recommandé :**
```typescript
// ✅ Contexte riche et sécurisé
logger.info({ 
  userId: '123', 
  action: 'login_success',
  requestId: 'req-456' 
}, 'User successfully authenticated');
```
