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

### admin-access.test.js
```bash
npm test -- admin-access
```
Teste le contrôle d'accès aux routes API admin. Vérifie que les utilisateurs non-admin reçoivent une erreur **403 Forbidden** et que les requêtes non authentifiées reçoivent **401 Unauthorized**. Le serveur (`npm run dev`) doit être démarré avant d'exécuter ce test.

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
