# API Cart

## Endpoints

### Client/Guest
- `GET /api/cart` - Récupère panier actif (crée si n'existe pas)
  - **Auth**: Optionnel (guest ou user)
  - **Cookie**: cart_anonymous_id (auto-créé si guest)
  - **Fichier**: `src/app/api/cart/route.ts`

- `POST /api/cart/lines` - Ajoute produit au panier
  - **Auth**: Optionnel
  - **Body**: variantId, quantity
  - **Validation**: stock vérifié, quantité ≥ 1
  - **Fichier**: `src/app/api/cart/lines/route.ts`

- `PUT /api/cart/lines/[id]` - Modifie quantité ligne panier
  - **Auth**: Optionnel
  - **Body**: quantity
  - **Fichier**: `src/app/api/cart/lines/[id]/route.ts`

- `DELETE /api/cart/lines/[id]` - Supprime ligne panier
  - **Auth**: Optionnel
  - **Params**: id (cartLineId)
  - **Fichier**: `src/app/api/cart/lines/[id]/route.ts`

- `GET /api/cart/calculate` - Calcule totaux panier (taxes, frais, etc)
  - **Auth**: Optionnel
  - **Query**: currency (optionnel, défaut: SITE_CURRENCY)
  - **Fichier**: `src/app/api/cart/calculate/route.ts`

- `POST /api/cart/merge` - Fusionne panier guest → user à connexion
  - **Auth**: User connecté (idempotent)
  - **Stratégie**: Somme quantités par variante, cappée au stock
  - **Fichier**: `src/app/api/cart/merge/route.ts`

## Notes
- Panier invité: anonymousId + cookie 30j
- Panier user: lié à userId
- Statuts: ACTIVE, ABANDONED, CONVERTED
- Fusion idempotente: premier appel fusionne, appels suivants retournent panier user
