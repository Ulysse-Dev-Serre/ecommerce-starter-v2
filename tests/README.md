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

## Structure (Migration JS → TS)

```
tests/
 ├── setup/                    # Configuration et utilitaires globaux
 │   ├── vitest.setup.ts      # Setup Vitest (ENV, Mocks globaux)
 │   ├── test-client.ts       # Client HTTP TypeScript pour tests API
 │   ├── test.setup.ts        # Utilities TS (setup/teardown)
 │   ├── auth.factory.ts      # [À MIGRER] Génération d'utilisateurs
 │   └── db.setup.js          # [HÉRITAGE] Seed et reset de la DB
 │
 ├── unit/                     # Tests unitaires (isolés, mockés)
 │   └── services/            # Tests des services métier (.test.ts)
 │
 ├── integration/              # Tests d'intégration (vraie DB)
 │   └── api/                 # Tests des endpoints API
 │       ├── health.test.ts   # Migré vers TS
 │       └── ...              # Autres fichiers .test.js (à migrer)
 │
 ├── e2e/                      # Tests end-to-end (Playwright)
 │
 ├── fixtures/                 # Données de test réutilisables
 │   └── products.fixture.js
 │
 └── scripts/                  # Scripts utilitaires Node.js
```

## Commandes (Vitest)

```bash
# Lancer tous les tests unitaires et intégration (TS)
npm run test:unit

# Lancer en mode watch (développement)
npm run test:unit:watch

# Lancer les tests E2E (Playwright)
npm run test:e2e
```
