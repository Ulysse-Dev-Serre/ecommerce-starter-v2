# Tests Architecture

Architecture de tests organisée par type pour faciliter l'exécution ciblée et la maintenance.

## ⚠️ Configuration requise

### TEST_API_KEY pour les tests d'intégration

Les tests d'intégration qui appellent les routes admin protégées nécessitent une API key de test.

**Configuration (une seule fois) :**

1. Générez une clé secrète aléatoire :
```bash
openssl rand -hex 32
```

2. Ajoutez-la dans `.env.local` :
```bash
TEST_API_KEY=votre-clé-générée-ici
```

3. **NE JAMAIS** committer cette clé dans Git

**Comment ça fonctionne :**
- Les tests utilisent `getTestAuthHeaders()` qui ajoute le header `x-test-api-key`
- Le middleware `withAuth` vérifie ce header (uniquement en non-production)
- Si la clé est valide, l'authentification Clerk est bypassée
- L'utilisateur admin réel (ulyssebo255@gmail.com) est utilisé pour les tests

**Voir la documentation complète dans :**
- `src/lib/middleware/withAuth.ts` - Logique de bypass
- `tests/setup/auth.factory.js` - Fonction `getTestAuthHeaders()`

---

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
