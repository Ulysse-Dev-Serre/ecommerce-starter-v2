# Test Authentication - API Key Bypass

Routes admin protégées par Clerk. Pour les tests d'intégration, utiliser une API key de test qui bypasse Clerk.

---

## Configuration (une seule fois)

1. **Générer clé secrète:**
```bash
openssl rand -hex 32
```

2. **Ajouter dans `.env`:**
```bash
TEST_API_KEY=<votre-clé-générée>
```

3. **Redémarrer le serveur:**
```bash
npm run dev
```

---

## Utilisation dans les tests

**Helper function** (fichier: `tests/setup/auth.factory.js`):
```javascript
function getTestAuthHeaders() {
  return {
    'x-test-api-key': process.env.TEST_API_KEY,
  };
}
```

**Dans un test:**
```javascript
const response = await client.post('/api/admin/attributes', body, {
  headers: getTestAuthHeaders()
});
```

---

## Sécurité

- ✅ Actif uniquement si `TEST_API_KEY` défini dans `.env`
- ✅ Actif uniquement si `NODE_ENV !== 'production'`
- ✅ En production: variable absence + NODE_ENV=production désactivent le bypass
- ✅ Vérification: `src/lib/middleware/withAuth.ts` lignes 53-95

---

## Débogage

| Erreur | Cause |
|--------|-------|
| 401 Unauthorized | TEST_API_KEY absent ou serveur pas redémarré |
| 405 Method Not Allowed | Clé invalide |

Vérifier que NODE_ENV n'est pas production en dev: `echo $NODE_ENV`
