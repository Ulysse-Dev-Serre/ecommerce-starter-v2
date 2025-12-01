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

### cart-merge.test.js
```bash
npm test -- cart-merge
```
Teste la fusion du panier invité vers le panier utilisateur connecté (Issue #16). Vérifie que l'endpoint `/api/cart/merge` fonctionne avec le bypass de test, que le panier anonyme est correctement géré, et documente la logique de fusion (somme des quantités, cap stock, idempotence). Le serveur doit être démarré.

### webhooks-stripe.test.js
```bash
npm test -- webhooks-stripe
```
Teste les webhooks Stripe (Issue #49 - Webhooks Stripe sécurisés). Vérifie que l'endpoint `/api/webhooks/stripe` rejette les requêtes sans signature valide et que l'endpoint de monitoring `/api/webhooks/stripe/status` retourne les statistiques des webhooks (total, processed, successRate, event breakdown, recent failures).

### orders-status.test.js
```bash
npm test -- orders-status
```
Teste le changement de statut des commandes (Issue #45). Vérifie que l'endpoint `/api/admin/orders/[id]/status` valide le workflow (PAID → SHIPPED → DELIVERED), rejette les transitions invalides, et enregistre l'historique avec audit trail.

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
