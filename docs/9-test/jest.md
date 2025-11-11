# Tests Jest

## Tests d'intégration

### attributes-admin.test.js
```bash
npm test -- tests/integration/api/attributes-admin.test.js
```
Teste les endpoints admin de gestion des attributs produit.

### health.test.js
```bash
npm test -- tests/integration/api/health.test.js
```
Teste l'endpoint de health check de l'API.

## Commandes globales

### Tous les tests
```bash
npm test
```
Exécute tous les tests Jest du projet.

### Mode watch
```bash
npm test:watch
```
Exécute Jest en mode watch pour développement continu.

### Tests d'intégration uniquement
```bash
npm test -- --testPathPattern=integration
```
Exécute uniquement les tests d'intégration.
