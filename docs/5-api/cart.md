# API Cart - Gestion du panier

## Vue d'ensemble

Endpoints pour gérer le panier invité et utilisateur avec persistance côté serveur.

---

## GET /api/cart

Récupère le panier actif (crée automatiquement si n'existe pas).

### Requête

```bash
# Panier invité (cookie automatique)
curl http://localhost:3000/api/cart

# Panier utilisateur authentifié
curl -H "Cookie: __session=..." http://localhost:3000/api/cart
```

### Réponse (200 OK)

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "id": "cart_id",
    "userId": null,
    "anonymousId": "anon_uuid",
    "status": "ACTIVE",
    "currency": "CAD",
    "items": [
      {
        "id": "item_id",
        "variantId": "variant_id",
        "quantity": 2,
        "variant": {
          "sku": "IPH15PRO-128-BLACK",
          "product": {
            "slug": "iphone-15-pro",
            "translations": [{"language": "FR", "name": "iPhone 15 Pro"}]
          },
          "pricing": [{"price": "1299.99", "currency": "CAD"}],
          "inventory": {"stock": 50},
          "media": [{"url": "...", "isPrimary": true}]
        }
      }
    ]
  }
}
```

**Cookie créé automatiquement** : `cart_anonymous_id` (30 jours, HttpOnly)

---

## POST /api/cart/lines

Ajoute un produit au panier (ou incrémente si déjà présent).

### Body

```json
{
  "variantId": "variant_id",
  "quantity": 2
}
```

### Validation

- `quantity` ≥ 1
- Vérification stock disponible
- Produit doit être `ACTIVE`

### Requête

```bash
curl -X POST http://localhost:3000/api/cart/lines \
  -H "Content-Type: application/json" \
  -d '{"variantId":"cmgbhqtdk0033ksprcli2w698","quantity":1}'
```

### Réponse (201 Created)

```json
{
  "success": true,
  "requestId": "uuid",
  "data": { /* panier complet */ },
  "message": "Item added to cart"
}
```

### Erreurs

**400 - Quantité invalide**
```json
{"error": "Invalid request", "message": "quantity must be a positive number"}
```

**400 - Stock insuffisant**
```json
{"error": "Insufficient stock", "message": "Insufficient stock. Available: 10"}
```

**404 - Produit introuvable**
```json
{"error": "Product not found", "message": "Product variant not found"}
```

---

## PUT /api/cart/lines/[id]

Met à jour la quantité d'une ligne du panier.

### Paramètres

- `id` (path, required) - ID de la ligne de panier

### Body

```json
{
  "quantity": 3
}
```

### Requête

```bash
curl -X PUT http://localhost:3000/api/cart/lines/cart_item_id \
  -H "Content-Type: application/json" \
  -d '{"quantity":3}'
```

### Réponse (200 OK)

```json
{
  "success": true,
  "data": { /* panier complet */ },
  "message": "Cart line updated"
}
```

### Erreurs

**403 - Unauthorized** : Tentative de modifier le panier d'un autre utilisateur  
**404 - Not found** : Ligne de panier introuvable

---

## DELETE /api/cart/lines/[id]

Supprime une ligne du panier.

### Requête

```bash
curl -X DELETE http://localhost:3000/api/cart/lines/cart_item_id
```

### Réponse (200 OK)

```json
{
  "success": true,
  "data": { /* panier complet */ },
  "message": "Cart line removed"
}
```

---

## POST /api/cart/merge

Fusionne le panier invité dans le panier utilisateur à la connexion.

### Comportement

- **Requiert authentification** : Utilisateur doit être connecté via Clerk
- **Idempotent** : Peut être appelé plusieurs fois sans dupliquer
- **Stratégie de fusion** : Somme des quantités par variante, limitée au stock
- **Nettoyage** : Panier anonyme marqué `CONVERTED` et cookie supprimé

### Requête

```bash
# Appeler après connexion utilisateur
curl -X POST http://localhost:3000/api/cart/merge \
  -H "Cookie: __session=clerk_session_token"
```

### Réponse (200 OK) - Fusion réussie

```json
{
  "success": true,
  "requestId": "uuid",
  "data": {
    "id": "user_cart_id",
    "userId": "user_id",
    "anonymousId": null,
    "items": [
      {
        "variantId": "variant_1",
        "quantity": 5
      }
    ]
  },
  "message": "Cart merged successfully"
}
```

### Réponse (200 OK) - Aucun panier à fusionner

```json
{
  "success": true,
  "requestId": "uuid",
  "message": "No anonymous cart to merge"
}
```

### Réponse d'erreur (401)

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Règles de fusion

**Même variante dans les 2 paniers :**
```
Panier invité: variant_A x 2
Panier utilisateur: variant_A x 3
→ Résultat: variant_A x 5
```

**Stock insuffisant :**
```
Panier invité: variant_A x 10
Panier utilisateur: variant_A x 5
Stock disponible: 12
→ Résultat: variant_A x 12 (cappé au stock)
```

**Variantes différentes :**
```
Panier invité: variant_A x 2, variant_B x 1
Panier utilisateur: variant_C x 1
→ Résultat: variant_A x 2, variant_B x 1, variant_C x 1
```

### Idempotence

Le panier anonyme est marqué `status: CONVERTED` après fusion :
- Premier appel : fusion effectuée
- Appels suivants : retourne panier utilisateur sans refusionner

---

## Tester avec Postman

**1. Créer/récupérer panier**
```
GET http://localhost:3000/api/cart
```

**2. Ajouter produit**
```
POST http://localhost:3000/api/cart/lines
Body: {"variantId":"cmgbhqtdk0033ksprcli2w698","quantity":1}
```

**3. Mettre à jour quantité**
```
PUT http://localhost:3000/api/cart/lines/{cart_item_id}
Body: {"quantity":3}
```

**4. Supprimer ligne**
```
DELETE http://localhost:3000/api/cart/lines/{cart_item_id}
```

**5. Stock insuffisant (test erreur)**
```
POST http://localhost:3000/api/cart/lines
Body: {"variantId":"...","quantity":9999}
```

**6. Fusionner panier à la connexion**
```
POST http://localhost:3000/api/cart/merge
Headers: Cookie: __session=clerk_token
```

**7. Test idempotence (2e fusion)**
```
POST http://localhost:3000/api/cart/merge
Headers: Cookie: __session=clerk_token
# Devrait retourner "No anonymous cart to merge"
```

---

## Notes techniques

### Gestion invité vs utilisateur

- **Invité** : Cookie `cart_anonymous_id` (auto-créé, 30 jours)
- **Utilisateur** : Lié au `userId` PostgreSQL
- **Transition** : Issue 5 - fusion panier invité → utilisateur à la connexion

### Validation stock

- Vérifie `trackInventory` sur variante
- Compare quantité vs `stock` disponible
- Autorise si `allowBackorder: true`

### Nettoyage automatique

Service `cleanInvalidCartItems()` disponible pour :
- Produits supprimés
- Produits inactifs
- Stock insuffisant

### Journalisation

Toutes les opérations loggées avec :
- `cartId`, `userId`, `anonymousId`
- Action (add, update, remove)
- Quantités before/after

### Performance

- Cookie HttpOnly, SameSite=Lax
- Expiration panier invité : 30 jours
- Panier utilisateur : permanent

### Fusion automatique

**Workflow recommandé :**
1. Client ajoute des produits en tant qu'invité (cookie créé)
2. Client se connecte via Clerk
3. Frontend appelle `POST /api/cart/merge` automatiquement
4. Panier invité fusionné dans panier utilisateur
5. Cookie `cart_anonymous_id` supprimé

**Intégration frontend (Next.js) :**
```typescript
// app/components/SignInButton.tsx
const handleSignIn = async () => {
  await signIn();
  
  // Appeler merge après connexion réussie
  await fetch('/api/cart/merge', { method: 'POST' });
  
  router.refresh();
};
```
