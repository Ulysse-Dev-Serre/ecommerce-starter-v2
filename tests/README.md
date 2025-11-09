# Tests

Organisation des tests pour le projet e-commerce starter v2.

## Structure

```
tests/
├── __tests__/           # Tests Jest automatisés
│   └── api/            # Tests des endpoints API
│       ├── health.test.js
│       └── cart.test.js
├── scripts/            # Scripts de test standalone
│   ├── database-test.js      # Test connexion DB
│   ├── validate-features.js  # Validation complète (recommandé)
│   └── webhook-debug.js      # Serveur debug webhooks
├── utils/              # Utilitaires de test
│   ├── test-client.js  # Client HTTP pour tests
│   └── setup.js        # Setup/teardown
├── jest.setup.js       # Configuration Jest
└── README.md          # Ce fichier
```

## Types de tests

### Tests API Jest (`__tests__/api/`)

- **health.test.js** - Tests de l'API health (3 tests)
- **cart.test.js** - Tests de l'API panier (1 test)

## Scripts de test

### 🎯 Validation complète (`scripts/validate-features.js`) **RECOMMANDÉ**

Script principal de validation - teste toutes les fonctionnalités clés :
- Health check API
- Connexion database
- Endpoints produits
- Protection admin
- Gestion des rôles
- Opérations panier
- Validation stock
- Webhooks Clerk

```bash
node tests/scripts/validate-features.js
```

**Résultat** : 8 tests - taux de réussite 100%

### 🗄️ Test base de données (`scripts/database-test.js`)

Test rapide de la connexion et opérations DB (CRUD utilisateur).

```bash
npm run test:db
# ou
node tests/scripts/database-test.js
```

### 🔧 Debug webhook (`scripts/webhook-debug.js`)

Serveur de debug pour intercepter et inspecter les webhooks Clerk.

```bash
npm run test:webhook
# ou
node tests/scripts/webhook-debug.js
```

Expose un serveur sur `http://localhost:3001/test-webhook`

## Utilitaires

### TestClient (`utils/test-client.js`)

Client HTTP unifié pour les tests avec gestion d'erreurs intégrée.

```javascript
const TestClient = require('./utils/test-client');
const client = new TestClient();

const response = await client.get('/api/products');
```

### Setup (`utils/setup.js`)

Fonctions de configuration et nettoyage des tests.

```javascript
const { setupTest, teardownTest } = require('./utils/setup');
```

## Utilisation

### Prérequis

- Serveur de développement lancé (`npm run dev`)
- Base de données configurée et accessible

### Tests automatisés (Jest)

```bash
npm test                    # Tous les tests Jest (health + cart)
npm run test:watch          # Tests en mode watch
```

**Tests inclus** :
- 3 tests health API ✅
- 1 test panier ✅
- **Total : 4 tests**

### Scripts de validation

```bash
# Recommandé : Validation complète de toutes les fonctionnalités
node tests/scripts/validate-features.js

# Test connexion database
npm run test:db

# Serveur debug webhooks
npm run test:webhook
```

## Bonnes pratiques

1. **Isolation** - Chaque test nettoie ses données
2. **Réutilisabilité** - Utiliser les utilitaires communs
3. **Lisibilité** - Tests bien documentés et nommés
4. **Performance** - Tests parallélisables quand possible
