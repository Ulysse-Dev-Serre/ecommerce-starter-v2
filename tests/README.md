# Tests Architecture

Architecture de tests organisée par type pour faciliter l'exécution ciblée et la maintenance.

## Structure

```
tests/
 ├── setup/                    # Configuration et utilitaires globaux
 │   ├── jest.setup.js        # Configuration Jest globale
 │   ├── db.setup.js          # Seed et reset de la DB de test
 │   ├── auth.factory.js      # Génération d'utilisateurs (admin/user)
 │   ├── test.setup.js        # Setup/teardown des tests
 │   └── test-client.js       # Client HTTP pour tests API
 │
 ├── unit/                     # Tests unitaires (isolés, mockés)
 │   └── services/            # Tests des services métier
 │
 ├── integration/              # Tests d'intégration (vraie DB)
 │   └── api/                 # Tests des endpoints API
 │       ├── attributes.test.js
 │       ├── cart.test.js
 │       └── health.test.js
 │
 ├── e2e/                      # Tests end-to-end
 │
 ├── fixtures/                 # Données de test réutilisables
 │   └── products.fixture.js
 │
 └── scripts/                  # Scripts utilitaires
```

## Commandes

```bash
# Tous les tests
npm test

# Tests unitaires uniquement (rapides)
npm test -- --testPathPattern=unit

# Tests d'intégration uniquement
npm test -- --testPathPattern=integration

# Tests e2e uniquement
npm test -- --testPathPattern=e2e
```
