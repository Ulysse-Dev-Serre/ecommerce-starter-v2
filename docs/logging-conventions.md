# Conventions de Logging

## Niveaux

- **info**: Actions utilisateur, événements business, changements d'état normaux
- **warn**: Problèmes récupérables, performance dégradée, comportements inattendus non critiques
- **error**: Erreurs graves, exceptions, échecs de système critiques

## Champs obligatoires

- `requestId`: Identifiant unique de la requête (généré automatiquement via middleware)
- `timestamp`: Horodatage ISO 8601 (automatique via Pino)
- `level`: Niveau du log (automatique)
- `message`: Description de l'événement

## Champs recommandés

- `userId`: Identifiant utilisateur quand disponible
- `action`: Type d'action (clic, navigation, soumission, etc.)
- `duration`: Temps d'exécution en millisecondes (pour les opérations lentes)
- `error`: Objet d'erreur avec stack trace (pour les erreurs)
- `from`/`to`: Valeurs avant/après (pour les changements d'état)

## Fonctions d'aide

### Créer un logger avec requestId

```typescript
import { createRequestLogger } from '@/lib/logger';

const logger = createRequestLogger('custom-request-id');
// Utilise le requestId fourni ou en génère un automatiquement
```

### Logging typé avec contexte

```typescript
import { logWithContext, LogContext } from '@/lib/logger';

// Exemple d'usage
logWithContext('info', {
  requestId: 'req-123',
  userId: 'user-456',
  action: 'language_change',
  from: 'fr',
  to: 'en'
}, 'User changed language');
```

## Exemples d'usage

### Actions utilisateur
```typescript
logger.info({
  requestId,
  userId: 'user_123',
  action: 'login'
}, 'User authenticated successfully');

logger.info({
  requestId,
  userId: 'user_123',
  action: 'cart_add',
  productId: 'prod_456'
}, 'Product added to cart');
```

### Erreurs et problèmes
```typescript
logger.warn({
  requestId,
  userId: 'user_123',
  action: 'api_call',
  duration: 2500
}, 'API call took longer than expected');

logger.error({
  requestId,
  userId: 'user_123',
  action: 'payment_failed',
  error: paymentError,
  orderId: 'order_789'
}, 'Payment processing failed');
```

### Événements système
```typescript
logger.info({
  requestId,
  action: 'cache_miss',
  key: 'products:list',
  duration: 45
}, 'Cache miss - fetching from database');

logger.info({
  requestId,
  action: 'db_query',
  table: 'users',
  queryType: 'SELECT',
  duration: 12
}, 'Database query executed');
```

## Middleware d'auto-injection

Le middleware Next.js injecte automatiquement un `requestId` unique dans chaque réponse HTTP :

```typescript
// Header ajouté automatiquement : x-request-id: uuid-v4
```

## Bonnes pratiques

1. **Utilisez des messages descriptifs** : Préférez "User authenticated via Google OAuth" à "User login"

2. **Logguez le contexte nécessaire** : Incluez suffisamment d'informations pour déboguer sans surcharger

3. **Utilisez les bons niveaux** : Reservez `error` aux vrais problèmes critiques

4. **Évitez les données sensibles** : Ne loggez jamais de mots de passe, tokens JWT, données de carte bancaire

5. **Format cohérent** : Utilisez des clés standardisées (`userId`, `action`, `duration`, etc.)

6. **Performance** : Les logs sont asynchrones, mais évitez de sérialiser de gros objets

## Structure du projet

- `src/logger.ts` : Configuration Pino et fonctions d'aide
- `src/middleware.ts` : Auto-injection du requestId
- Composants : Utilisent `logger.info()` directement ou via `logWithContext()`

## Exemple complet dans un composant

```typescript
import { logger, logWithContext } from '@/lib/logger';
// ou directement :
import logger from '@/lib/logger';

function MyComponent() {
  const handleUserAction = async () => {
    const startTime = Date.now();

    try {
      // Action utilisateur
      await performAction();

      const duration = Date.now() - startTime;

      // Log réussi avec métriques
      logWithContext('info', {
        action: 'user_action_completed',
        duration,
        userId: currentUser?.id
      }, 'User action completed successfully');

    } catch (error) {
      // Log d'erreur avec contexte
      logWithContext('error', {
        action: 'user_action_failed',
        duration: Date.now() - startTime,
        error,
        userId: currentUser?.id
      }, 'User action failed');
    }
  };
}
```

Ces conventions assurent des logs cohérents, utiles pour le débogage et le monitoring applicatif.
