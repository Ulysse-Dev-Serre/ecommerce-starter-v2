# Documentation SEO et Indexation

Ce document récapitule l'organisation du SEO dans le projet et explique comment maintenir les redirections et les métadonnées.

---

## 1. Redirections (Migration et SEO)

Pour protéger le référencement, nous utilisons deux types de redirections :

### A. Redirections Automatiques (Middleware)
Le fichier `src/middleware.ts` gère l'ajout automatique de la locale (`/fr` ou `/en`) si elle est manquante dans l'URL.
- **Statut** : Redirection 301 (Permanente).
- **Fonctionnement** : `boutique.com/produits` -> 301 -> `boutique.com/fr/produits`.

### B. Redirections Manuelles (Mapping)
Si vous modifiez le nom d'un produit (Slug) ou si vous migres d'une ancienne plateforme, vous devez configurer les redirections manuellement.
- **Fichier** : `next.config.ts`
- **Emplacement** : Dans la fonction `redirects()`.
- **Exemple** :
```typescript
async redirects() {
  return [
    {
      source: '/anciennes-graines',
      destination: '/fr/produits/graines-bio-premium',
      permanent: true, // Applique le code 301
    },
  ];
}
```

---

## 2. Internationalisation (i18n)

### Balises Hreflang et Canonical
- **Fichier principal** : `src/app/[locale]/layout.tsx`
- **Logique** : Le système utilise `generateMetadata` dans le fichier layout racine pour injecter les balises `<link rel="alternate" hreflang="...">` pour chaque langue et définit une `x-default` vers la langue par défaut.
- **Canonical** : L'URL canonique est générée dynamiquement pour chaque page afin d'éviter le contenu dupliqué.

### Métadonnées Dynamiques
- Utilisation de `generateMetadata` dans les layouts et pages.
- Support des balises Open Graph et Twitter Cards pour le partage sur les réseaux sociaux.

---

## 3. Indexation et Visibilité

### Sitemap et Robots
- **Sitemap dynamique** : `src/app/sitemap.ts` génère automatiquement la liste des pages statiques et de tous les produits.
- **URL** : `/sitemap.xml`
- **Robots.txt** : `src/app/robots.ts` autorise l'indexation et pointe vers le sitemap.

### Données Structurées (Schema.org)
- **Fichier** : `src/components/seo/json-ld.tsx`
- **Type** : `Product` et `Organization`.
- **Bénéfice** : Permet l'affichage des informations produits (prix, avis) directement dans les résultats de recherche Google.

---

## 4. Maintenance Rapide

| Besoin | Fichier à modifier |
| :--- | :--- |
| Ajouter une redirection 301 | `next.config.ts` |
| Modifier les titres/descriptions par défaut | `messages/fr.json` ou `en.json` |
| Exclure une page de l'indexation | `src/app/robots.ts` |
| Modifier la structure du Sitemap | `src/app/sitemap.ts` |

---

## 5. IA et Agents
- **llms.txt** : Ce fichier à la racine (`/public/llms.txt`) aide les outils d'IA à comprendre rapidement la structure du projet.
