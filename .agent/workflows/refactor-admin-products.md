---
description: Refactoring de l'architecture Admin Products (Client vers Server Components)
---
# Refactoring Admin Products (Client vers Server Components)

Actuellement, les pages d'administration des produits (`/admin/products`, `/new`, `/[id]/edit`) sont des Client Components (`'use client'`) monolithiques. Cela empêche l'utilisation optimale de `next-intl` (Server-side translation) et n'est pas performant (chargement de tous les dictionnaires JSON côté client).

## Objectif
Migrer vers une architecture "Server Component Parent -> Client Component Form/List".

## Étapes

1. **Refactor `src/app/[locale]/admin/products/page.tsx`**
   - Transformer la `page.tsx` en `async function Page()` (Server Component).
   - Faire les fetches de données (`fetchProducts`) côté serveur via Prisma ou via API interne (si nécessaire).
   - Extraire la logique UI (Tableau, Filtres, Drag&Drop) dans un composant client : `src/components/admin/products/products-list.tsx`.
   - Passer les traductions nécessaires via `NextIntlClientProvider` ou en props (moins recommandé si beaucoup de textes).

2. **Refactor `src/app/[locale]/admin/products/[id]/edit/page.tsx`**
   - Transformer la page en Server Component.
   - Fetcher le produit (`prisma.product.findUnique`) côté serveur.
   - Extraire le formulaire d'édition dans `src/components/admin/products/product-form.tsx` (qui sera utilisé aussi pour `new`).
   - Le formulaire doit accepter `initialData` en props.

3. **Refactor `src/app/[locale]/admin/products/new/page.tsx`**
   - Transformer en Server Component.
   - Réutiliser `ProductForm` (créé à l'étape 2) sans `initialData`.

4. **Corrections i18n**
   - Supprimer les `import(../../dictionaries/${locale}.json)` dynamiques.
   - Utiliser `useTranslations` dans les composants clients, rendus possibles car les pages parentes (Server) fourniront le contexte via `NextIntlClientProvider` (déjà présent dans le layout racine normalement, vérifier s'il faut un provider spécifique pour l'admin si les namespaces diffèrent).

## Notes Techniques
- Vérifier que `NextIntlClientProvider` est bien configuré pour charger le namespace `adminDashboard` ou `admin`.
- Le formulaire produit est complexe (Drag & Drop images, variants) : garder ces parties en Client Component est normal, mais c'est la page racine qui doit être serveur.
