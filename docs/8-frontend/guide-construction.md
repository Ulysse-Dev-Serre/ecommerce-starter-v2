# 🎨 Guide de Construction Frontend

## Philosophie

Le frontend est **quasi-vide volontairement**. Chaque boutique a des besoins différents.

**Ce starter fournit :**
- ✅ Endpoints API complets → [Voir docs/5-api/](../5-api/)
- ✅ Backend robuste (panier, paiement, commandes)
- ✅ Dashboard admin identique pour tous
- ✅ UI minimal pour tester visuellement

**À vous de construire** selon chaque client :
- Structure des pages (hero ou pas, grid ou liste, etc.)
- Navigation (fixe, mega-menu, sidebar, etc.)
- Composants spécifiques (filtres, comparateur, wishlist, etc.)

---

## 🎯 UI Minimum fourni

```
frontend/
├── Navbar avec connexion Clerk
├── Page boutique basique (liste produits)
└── CSS variables pour couleurs
```

**C'est tout.** Le reste dépend des besoins du client.

---

## 📋 Construction selon besoins client

### Client veut : Page d'accueil simple

**Créer :** `src/app/[locale]/page.tsx`

**Endpoints utiles :**
- Produits featured : [GET /api/products?featured=true](../5-api/products.md#get-apiproducts)
- Catégories : [GET /api/categories](../5-api/categories.md#get-apicategories)

---

### Client veut : Page boutique avec filtres catégories

**Créer :** `src/app/[locale]/shop/page.tsx`

**Endpoints utiles :**
- Liste produits paginée : [GET /api/products](../5-api/products.md#get-apiproducts)
- Filtre par catégorie : [GET /api/products?category=slug](../5-api/products.md#get-apiproducts)
- Liste catégories : [GET /api/categories](../5-api/categories.md#get-apicategories)

**Exemple d'implémentation :**
```tsx
// Récupérer produits filtrés
const params = new URLSearchParams({
  category: categorySlug,
  page: '1',
  limit: '12',
  language: locale
});

const res = await fetch(`/api/products?${params}`);
const { data: products } = await res.json();
```

---

### Client veut : Page produit détaillée

**Créer :** `src/app/[locale]/products/[slug]/page.tsx`

**Endpoints utiles :**
- Détail produit : [GET /api/products/[slug]](../5-api/products.md#get-apiproductsslug)
- Variantes, prix, stock inclus dans la réponse

---

### Client veut : Panier persistant

**Déjà implémenté côté backend !**

**Endpoints disponibles :**
- Récupérer panier : [GET /api/cart](../5-api/cart.md#get-apicart)
- Ajouter produit : [POST /api/cart/lines](../5-api/cart.md#post-apicartlines)
- Modifier quantité : [PUT /api/cart/lines/[id]](../5-api/cart.md#put-apicartlinesid)
- Supprimer ligne : [DELETE /api/cart/lines/[id]](../5-api/cart.md#delete-apicartlinesid)

**À faire :** Créer votre composant panier (sidebar, modal, page dédiée, etc.)

---

### Client veut : Pas de page d'accueil

**Solution :** Rediriger directement vers /shop

```tsx
// src/app/[locale]/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/shop');
}
```

---

### Client veut : Page À propos

**Créer :** `src/app/[locale]/about/page.tsx`

Contenu statique, pas d'endpoint API nécessaire.

---

### Client veut : Breadcrumbs SEO

**Endpoint disponible :**
- Breadcrumb path : [GET /api/categories/[slug]](../5-api/categories.md#get-apicategoriesslug) (champ `path`)

**Utilisation :**
```tsx
const { data: category } = await fetch(`/api/categories/${slug}`).then(r => r.json());

const breadcrumbs = category.path.map(cat => ({
  name: cat.translations[0].name,
  url: `/categories/${cat.slug}`
}));
```

---

### Client veut : Recherche produits

**Endpoint disponible :**
- Recherche : [GET /api/products?search=terme&language=FR](../5-api/products.md#get-apiproducts)

**À faire :** Créer barre de recherche, page résultats.

---

### Client veut : Produits par catégorie

**Endpoint disponible :**
- Filtre catégorie : [GET /api/products?category=slug](../5-api/products.md#get-apiproducts)

**Exemples d'implémentation :**
- Page `/categories/[slug]` avec grid produits
- Sidebar avec liste catégories
- Mega-menu avec sous-catégories

---

## 📚 Ressources

**Documentation API complète :**
- [API Products](../5-api/products.md)
- [API Categories](../5-api/categories.md)
- [API Cart](../5-api/cart.md)
- [API Users](../5-api/users.md)

**Customisation :**
- [CSS Variables](theming.md)
- [i18n Configuration](../2-Language_internationalization/language-config.md)

---

## 💡 Approche recommandée

1. **Discuter besoins avec client**
2. **Identifier les endpoints nécessaires** (voir docs/5-api/)
3. **Créer les pages Next.js** selon la structure voulue
4. **Utiliser CSS variables** pour couleurs custom
5. **Pas de composants pré-faits** : chaque boutique est unique

**Avantage :** Flexibilité totale, pas de "design imposé".
