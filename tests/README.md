# Tests

Organisation des tests pour le projet e-commerce starter v2.

## Structure

```
tests/
├── __tests__/           # Tests automatisés
│   ├── api/            # Tests des endpoints API
│   ├── integration/    # Tests d'intégration
│   └── e2e/           # Tests end-to-end
├── utils/              # Utilitaires de test
├── fixtures/           # Données de test
├── scripts/           # Scripts de test manuels
└── README.md          # Ce fichier
```

## Types de tests

### Tests API (`__tests__/api/`)

- **users.test.js** - Tests de l'API users
- **health.test.js** - Tests de l'API health
- **webhooks.test.js** - Tests des webhooks Clerk

### Tests d'intégration (`__tests__/integration/`)

- **database.test.js** - Tests des opérations base de données
- **clerk-sync.test.js** - Tests de synchronisation Clerk

### Tests E2E (`__tests__/e2e/`)

- **endpoints.test.js** - Tests end-to-end complets

## Utilitaires

### TestClient (`utils/test-client.js`)

Client HTTP unifié pour les tests avec gestion d'erreurs intégrée.

```javascript
const TestClient = require('./utils/test-client');
const client = new TestClient();

const response = await client.get('/api/users');
```

### Mock Data (`utils/mock-data.js`)

Données de test centralisées pour tous les tests.

### Setup (`utils/setup.js`)

Fonctions de configuration et nettoyage des tests.

## Scripts manuels

### Test manuel (`scripts/test-manual.js`)

Test rapide de tous les endpoints principaux.

```bash
node tests/scripts/test-manual.js
```

### Debug webhook (`scripts/webhook-debug.js`)

Serveur de debug pour intercepter les webhooks.

```bash
node tests/scripts/webhook-debug.js
```

### Test base de données (`scripts/database-test.js`)

Test des opérations CRUD sur la base de données.

```bash
node tests/scripts/database-test.js
```

## Utilisation

### Prérequis

- Serveur de développement lancé (`npm run dev`)
- Base de données configurée et accessible

### Tests automatisés

```bash
npm test                    # Tous les tests Jest
npm run test:watch          # Tests en mode watch
npm test -- --testPathPattern=api    # Tests API uniquement
```

### Tests manuels

```bash
# Test rapide des endpoints
npm run test:manual

# Debug des webhooks
npm run test:webhook

# Test de la base de données
npm run test:db

# Installer les dépendances de test
npm run test:deps
```

### Scripts directs

```bash
# Test rapide des endpoints
node tests/scripts/test-manual.js

# Debug des webhooks
node tests/scripts/webhook-debug.js

# Test de la base de données
node tests/scripts/database-test.js
```

## Migration depuis les anciens fichiers

Les anciens fichiers de test ont été refactorisés :

- `test-endpoints.js` → `tests/scripts/test-manual.js`
- `test-refactoring.js` → Fusionné dans les tests structurés
- `debug-webhook.js` → `tests/scripts/webhook-debug.js`
- `scripts/test-webhook.ts` → `tests/scripts/database-test.js`

## Bonnes pratiques

1. **Isolation** - Chaque test nettoie ses données
2. **Réutilisabilité** - Utiliser les utilitaires communs
3. **Lisibilité** - Tests bien documentés et nommés
4. **Performance** - Tests parallélisables quand possible
