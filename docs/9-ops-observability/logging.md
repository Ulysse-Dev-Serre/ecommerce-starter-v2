# Conventions de Logging

## Vue d'ensemble

Ce document définit les standards de logging pour garantir la traçabilité et l'observabilité de l'application.

## Format JSON structuré

Tous les logs suivent ce format JSON :

```json
{
  "timestamp": "2025-09-11T22:53:02.313Z",
  "level": "info",
  "service": "ecommerce-frontend",
  "environment": "development",
  "requestId": "req_1757631182313_swbdbpxqr",
  "category": "user_action",
  "action": "language_change",
  "message": "User changed language"
}
```

## Niveaux de log par environnement

### Development

- `debug`: Informations détaillées pour le débogage
- `info`: Événements normaux d'application
- `warn`: Situations potentiellement problématiques
- `error`: Erreurs nécessitant une attention

### Production

- `warn`: Problèmes non-critiques mais importants
- `error`: Erreurs critiques uniquement

## Champs obligatoires

### requestId

**Obligatoire** dans tous les logs pour corréler les actions d'une même requête.

```typescript
// Génération automatique si absent
logUserAction('button_click', {
  requestId: 'req_123', // Obligatoire
});
```

### Champs standards

- `timestamp`: ISO 8601 (automatique)
- `level`: debug|info|warn|error
- `service`: "ecommerce-frontend"
- `environment`: development|production|test

## Catégories d'événements

### user_action

Actions des utilisateurs (clics, navigation, changements)

```typescript
logUserAction('language_change', {
  requestId: 'req_123',
  from: 'fr',
  to: 'en',
  component: 'navbar',
});
```

### error

Erreurs applicatives

```typescript
logError(new Error('Database connection failed'), {
  requestId: 'req_123',
  component: 'user-service',
});
```

### performance

Métriques de performance (> 2 secondes = warning)

```typescript
logPerformance('database_query', 1500, {
  requestId: 'req_123',
  operation: 'user_fetch',
});
```

### security

Événements de sécurité (toujours loggés)

```typescript
logSecurity('suspicious_activity', {
  requestId: 'req_123',
  userId: 'user_456',
  details: 'Multiple failed login attempts',
});
```

## Utilisation par composant

### Middleware

Logs minimaux (redirections et erreurs uniquement)

```typescript
// Seulement en cas de redirection ou erreur
logMiddleware(
  'WARN',
  { requestId, action: 'i18n_redirect' },
  'Redirecting user'
);
```

### Composants React

Actions utilisateur importantes

```typescript
const handleClick = () => {
  logUserAction('product_view', {
    requestId: getRequestId(),
    productId: product.id,
    locale: currentLocale,
  });
};
```

### API Routes (futures)

Toutes les opérations business

```typescript
export async function POST(req: Request) {
  const requestLogger = createRequestLogger();

  requestLogger.info({ action: 'api_call_start' }, 'Processing request');
  // ... logique
  requestLogger.info(
    { action: 'api_call_end', duration: 150 },
    'Request completed'
  );
}
```

## Que PAS logger

- Mots de passe ou tokens
- Données personnelles sensibles (emails complets, téléphones)
- Clés d'API ou secrets
- Contenu détaillé des erreurs en production (stack traces)

## Intégration future (P4)

### Sentry

```typescript
// Préparation pour Sentry
logger.error(
  {
    requestId,
    error: error.message,
    sentryEnabled: true, // Flag pour Sentry
  },
  'Error to be sent to Sentry'
);
```

### OpenTelemetry

```typescript
// Préparation pour tracing distribué
logger.info(
  {
    requestId,
    traceId: 'trace_123', // Futur OpenTelemetry trace ID
    spanId: 'span_456',
  },
  'Trace-ready log'
);
```

## Monitoring en production

Les logs sont actuellement envoyés vers :

- Console (stdout/stderr) pour Docker/Kubernetes
- Prêt pour intégration CloudWatch/Datadog/Sentry

## Configuration des niveaux de log

### Variables d'environnement

```bash
# Dans .env ou .env.local
LOG_LEVEL=warn    # Seulement warnings et erreurs
LOG_LEVEL=error   # Seulement erreurs
LOG_LEVEL=info    # Info, warnings et erreurs
LOG_LEVEL=debug   # Tous les logs (très verbeux)
```

## Tests et développement

### Mode développement

```bash
# Logs complets (par défaut)
npm run dev

# Réduire la verbosité en développement
LOG_LEVEL=warn npm run dev

# Mode debug (très verbeux)
LOG_LEVEL=debug npm run dev
```

### Simulation production

```bash
# Build et test en mode production réel
npm run build && npm start

# Ou via Docker si configuré
docker build -t mon-app .
docker run -e NODE_ENV=production mon-app
```

### Test des logs par niveau

```bash
# Tester différents niveaux sans casser Next.js
LOG_LEVEL=error npm run dev   # Seulement erreurs
LOG_LEVEL=warn npm run dev    # Warnings + erreurs
LOG_LEVEL=info npm run dev    # Normal
```
