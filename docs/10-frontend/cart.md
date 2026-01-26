# Panier Utilisateur (Cart)

## Vue d'ensemble

Le système de panier permet aux utilisateurs (authentifiés ou anonymes) d'ajouter, visualiser et gérer des produits avant l'achat.

## Architecture

### Modèle de données (Prisma)

```prisma
model Cart {
  id          String     @id @default(cuid())
  userId      String?    // Optionnel pour invités
  anonymousId String?    // Cookie ID pour invités
  status      CartStatus @default(ACTIVE)
  currency    String     @default("CAD")
  items       CartItem[]
}

model CartItem {
  id        String   @id
  cartId    String
  variantId String
  quantity  Int
  cart      Cart
  variant   ProductVariant
}
```

### Pages et Composants

#### 1. Page Panier (`/[locale]/cart`)
**Fichier**: `src/app/[locale]/cart/page.tsx`

Page serveur qui:
- Récupère l'utilisateur connecté (Clerk) ou l'ID anonyme (cookie)
- Charge le panier avec tous les articles et détails produits
- Passe les données au composant client

#### 2. Composant Client Panier
**Fichier**: `src/app/[locale]/cart/cart-client.tsx`

Composant client qui affiche:
- Liste des articles du panier avec image, nom, SKU, prix, quantité
- Bouton "Supprimer" pour chaque article
- Récapitulatif total
- Bouton "Passer commande" (à implémenter avec Stripe)
- Message si panier vide avec lien vers la boutique

#### 3. Bouton "Ajouter au panier"
**Fichier**: `src/components/cart/add-to-cart-button.tsx`

Composant réutilisable qui:
- Appelle l'API `/api/cart/lines` en POST
- Affiche un état de chargement
- Rafraîchit la page après ajout
- Support pour `fullWidth` (page produit) ou compact (liste produits)
- Gère les traductions FR/EN
- Accepte un paramètre `quantity` pour ajouter plusieurs articles

**Usage**:
```tsx
// Sur la page boutique (compact)
<AddToCartButton
  variantId={variant.id}
  locale={locale}
  disabled={!variant?.id}
/>

// Sur la page produit (full width avec quantité)
<AddToCartButton
  variantId={variant.id}
  locale={locale}
  fullWidth
  quantity={quantity}
  disabled={!variant?.id || outOfStock}
/>
```

#### 4. Sélecteur de quantité
**Fichier**: `src/components/cart/quantity-selector.tsx`

Composant réutilisable pour ajuster les quantités avec boutons +/- et input numérique.

**Fonctionnalités**:
- Boutons incrémentation/décrémentation
- Input numérique éditable
- Validation des limites (min: 1, max: configurable)
- Appel API automatique pour mettre à jour le panier (si `cartItemId` fourni)
- Callback `onQuantityChange` pour usage local (page produit)
- États disabled pendant le chargement

**Usage**:
```tsx
// Dans le panier (mise à jour API)
<QuantitySelector
  cartItemId={item.id}
  initialQuantity={item.quantity}
  locale={locale}
/>

// Sur la page produit (callback local)
<QuantitySelector
  initialQuantity={1}
  maxQuantity={stock}
  onQuantityChange={setQuantity}
  locale={locale}
/>
```

## API Endpoints

### GET /api/cart
Récupère le panier actif de l'utilisateur

**Réponse**:
```json
{
  "success": true,
  "data": {
    "id": "cart_id",
    "items": [
      {
        "id": "item_id",
        "quantity": 2,
        "variant": {
          "id": "variant_id",
          "sku": "SKU-001",
          "pricing": [...],
          "product": {...}
        }
      }
    ]
  }
}
```

### POST /api/cart/lines
Ajoute un produit au panier

**Body**:
```json
{
  "variantId": "variant_xxx",
  "quantity": 1
}
```

**Comportement**:
- Si l'article existe déjà, augmente la quantité
- Gère automatiquement les utilisateurs anonymes (cookie)
- Vérifie le stock disponible
- Rate limiting actif

### PUT /api/cart/lines/[id]
Met à jour la quantité d'un article dans le panier

**Paramètres**: `id` = ID du CartItem

**Body**:
```json
{
  "quantity": 3
}
```

**Comportement**:
- Vérifie que la quantité est >= 1
- Vérifie le stock disponible
- Met à jour la quantité dans le panier

### DELETE /api/cart/lines/[id]
Supprime un article du panier

**Paramètres**: `id` = ID du CartItem

## Flux utilisateur

### 1. Utilisateur Anonyme
1. Visite la boutique `/[locale]/shop`
2. Clique sur "Ajouter" sur un produit
3. Un `cart_anonymous_id` est créé et stocké en cookie
4. Le panier est créé avec `anonymousId`
5. L'utilisateur peut voir son panier en cliquant sur 🛒 (visible uniquement si connecté)

**Note**: Pour l'instant, le lien panier dans la navbar est visible uniquement pour les utilisateurs connectés.

### 2. Utilisateur Connecté
1. Se connecte avec Clerk
2. Ajoute des produits au panier
3. Le panier est lié à son `userId`
4. Accède au panier via le lien 🛒 dans la navbar
5. Peut supprimer des articles
6. Voir le total calculé automatiquement

### 3. Fusion de paniers (merge)
**Endpoint**: `POST /api/cart/merge`

Utilisé pour fusionner le panier anonyme avec le panier utilisateur après connexion.

## Traductions (i18n)

Les traductions sont dans `src/lib/i18n/dictionaries/`:

**Français**:
```json
{
  "cart": {
    "title": "Panier",
    "empty": "Votre panier est vide",
    "total": "Total",
    "quantity": "Quantité",
    "checkout": "Passer commande",
    "continueShopping": "Continuer vos achats"
  }
}
```

**Anglais**: Similaire avec traductions EN.

## Styles

Le panier utilise:
- Classes CSS variables (`primary`, `border`, etc.)
- Grid layout responsive (mobile -> desktop)
- Transitions smooth sur les interactions
- États disabled pour les boutons

## Corrections apportées

### Conversion des types Decimal
Les objets `Decimal` de Prisma ne peuvent pas être passés directement aux Client Components. Ils sont maintenant convertis en `string` dans la page serveur:

```typescript
const serializedCart = cart
  ? {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        variant: {
          ...item.variant,
          pricing: item.variant.pricing.map(p => ({
            ...p,
            price: p.price.toString(), // Conversion Decimal → string
          })),
        },
      })),
    }
  : null;
```

### Gestion des images produits
Les images sont affichées avec la priorité suivante:
1. **Image primaire au niveau produit** (`product.media` avec `isPrimary: true`)
2. **Image du variant** (`variant.media[0]`)
3. **Fallback**: Message "Pas d'image" / "No image"

Cette logique est appliquée sur:
- Page d'accueil (produits en vedette)
- Page boutique
- Page produit individuel
- Page panier

## Améliorations récentes

### Widget de sélection de quantité
Un composant `QuantitySelector` a été ajouté pour gérer les quantités:

**Emplacements**:
- ✅ **Page panier**: Modifier la quantité d'un article existant
- ✅ **Page produit**: Sélectionner la quantité avant l'ajout au panier
- ❌ **Page boutique**: Pas de sélecteur (ajout direct)
- ❌ **Page d'accueil**: Pas de sélecteur (ajout direct)

**Fonctionnement**:
- Boutons +/- pour incrémenter/décrémenter
- Input numérique pour saisie directe
- Validation automatique des limites (min: 1, max: stock disponible)
- Mise à jour API en temps réel dans le panier
- Callback local sur la page produit

## Prochaines étapes

1. **Intégration Stripe**: Connecter le bouton "Checkout" à Stripe
2. **Indicateur panier**: Afficher le nombre d'articles dans l'icône 🛒
3. **Panier persistant**: Implémenter la fusion automatique à la connexion
4. **Validation stock**: Vérifier le stock en temps réel avant checkout
5. **Notifications**: Toast/snackbar pour confirmer l'ajout au panier

## Testing

Pour tester le panier:

1. **Démarrer le serveur**:
```bash
npm run dev
```

2. **Créer des produits** (via `/admin/products`)

3. **Tester en tant que client**:
   - Aller sur `/shop`
   - Se connecter (Clerk)
   - Cliquer sur "Ajouter" sur des produits
   - Cliquer sur 🛒 dans la navbar
   - Vérifier l'affichage du panier
   - Supprimer un article
   - Vérifier que le total est correct

## Sécurité

- ✅ Rate limiting sur POST `/api/cart/lines`
- ✅ Validation des IDs (variantId, cartId)
- ✅ Vérification du stock disponible
- ✅ Cookie httpOnly pour anonymousId
- ✅ Autorisation: un utilisateur ne peut que voir/modifier son propre panier
