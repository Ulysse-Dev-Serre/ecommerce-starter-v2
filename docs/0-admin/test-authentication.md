# 🔐 Authentification des Tests d'Intégration

Guide pour comprendre et utiliser le système d'authentification bypass pour les tests d'API admin.

---

## 🎯 Problématique

Les routes admin (`/api/admin/*`) sont protégées par **Clerk** via le middleware `withAdmin`. 
Les tests d'intégration appellent le serveur Next.js en HTTP → impossible d'authentifier sans vraie session Clerk.

**Solution** : API key de test pour bypasser l'authentification en environnement de développement.

---

## 🔑 Fonctionnement

### Principe

```
Test → Header x-test-api-key → withAuth vérifie → Admin authentifié → Route exécutée
```

1. **Test** : Ajoute le header `x-test-api-key: votre-clé-secrète`
2. **Serveur** : `withAuth` vérifie si la clé correspond à `TEST_API_KEY` en `.env`
3. **Si valide** : Authentifie automatiquement l'admin réel (ulyssebo255@gmail.com)
4. **Si invalide** : Continue avec l'authentification Clerk normale

### Sécurité intégrée

✅ **Actif uniquement si** :
- Header `x-test-api-key` présent
- Variable `TEST_API_KEY` définie dans `.env`
- Clés identiques
- `NODE_ENV !== 'production'`

❌ **Désactivé automatiquement en production**

---

## ⚙️ Configuration (une seule fois)

### 1. Générer une clé secrète

```bash
openssl rand -hex 32
```

**Exemple de sortie** :
```
6337b3d33eeac2e01824d8d0a8bf38e9127b641748f603e9b30af59a38e0348b
```

### 2. Ajouter dans `.env` ou `.env.local`

```bash
# 🧪 TESTS - API key pour bypass auth Clerk
TEST_API_KEY=6337b3d33eeac2e01824d8d0a8bf38e9127b641748f603e9b30af59a38e0348b
```

⚠️ **IMPORTANT** : Ne JAMAIS committer cette clé dans Git

### 3. Redémarrer le serveur

```bash
npm run dev
```

Les variables d'environnement sont chargées au démarrage uniquement.

---

## 💻 Utilisation dans les Tests

### Exemple complet

```javascript
// tests/integration/api/attributes-admin.test.js
const { setupTest, teardownTest } = require('../../setup/test.setup');
const { getTestAuthHeaders } = require('../../setup/auth.factory');

describe('Attributes Admin API', () => {
  let client;
  let testHeaders;

  beforeAll(async () => {
    const setup = await setupTest();
    client = setup.client;
    testHeaders = getTestAuthHeaders(); // 🔑 Génère { 'x-test-api-key': '...' }
  });

  test('should create attribute', async () => {
    const response = await client.post('/api/admin/attributes', {
      key: 'color',
      translations: [
        { language: 'EN', name: 'Color' },
        { language: 'FR', name: 'Couleur' }
      ]
    }, {
      headers: testHeaders // 📤 Passe le header d'auth
    });

    expect(response.status).toBe(201);
  });
});
```

### Fonction helper : `getTestAuthHeaders()`

Fichier : `tests/setup/auth.factory.js`

```javascript
function getTestAuthHeaders() {
  if (!process.env.TEST_API_KEY) {
    throw new Error('TEST_API_KEY non définie dans .env');
  }
  
  return {
    'x-test-api-key': process.env.TEST_API_KEY,
  };
}
```

---

## 🏗️ Architecture Simplifiée

**Flux complet** :
```
Test avec header → withAuth vérifie clé → Charge admin DB → Route exécutée
```

**Code clé** :
- `src/lib/middleware/withAuth.ts` : Vérifie `x-test-api-key` (lignes 53-95)
- `tests/setup/auth.factory.js` : Génère le header avec `getTestAuthHeaders()`
- Routes admin : Utilisent `withAdmin(handler)` pour protection

---

## 🔍 Débogage

### Vérifier que la clé est chargée

```bash
# Dans les tests
node -e "require('dotenv').config(); console.log(process.env.TEST_API_KEY)"
```

### Logs serveur

Vérifiez les logs dans le terminal où `npm run dev` tourne.

**Bypass activé** :
```
🧪 Test API key authentication used
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 405 Method Not Allowed | Clé invalide ou serveur non redémarré | Redémarrer `npm run dev` |
| TEST_API_KEY non définie | Variable manquante | Ajouter dans `.env` |
| Toujours 401 | Variable pas chargée | Vérifier `jest.setup.js` appelle `dotenv.config()` |

---

## 📁 Fichiers Impliqués

```
src/lib/middleware/
├── withAuth.ts              # Logique de bypass (lignes 53-95)
└── withAuth.test.ts         # Mock pour tests unitaires (non utilisé en intégration)

tests/setup/
├── jest.setup.js            # Charge TEST_API_KEY avec dotenv
└── auth.factory.js          # Fonction getTestAuthHeaders()

tests/integration/api/
└── attributes-admin.test.js # Exemple d'utilisation

.env                         # TEST_API_KEY=...
```

---

## 🎓 Résumé

**Avantages** :
- ✅ Code de prod intact (pas de `if (process.env.NODE_ENV === 'test')`)
- ✅ Sécurité : désactivé automatiquement en production
- ✅ Tests avec utilisateur réel (pas de mock)
- ✅ Simple à utiliser : `getTestAuthHeaders()`

**À retenir** :
1. Générer `TEST_API_KEY` une seule fois
2. L'ajouter dans `.env` (ne pas committer)
3. Redémarrer le serveur après changement
4. Utiliser `getTestAuthHeaders()` dans les tests

**Workflows** :

```bash
# Premier setup
openssl rand -hex 32 >> .env  # Ajouter TEST_API_KEY=...
npm run dev                    # Démarrer serveur

# Lancer les tests
npm test attributes-admin      # ✅ Authentifié automatiquement
```
