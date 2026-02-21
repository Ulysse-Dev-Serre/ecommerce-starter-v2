# ⚙️ Configuration SEO & Métadonnées

Ce document est un guide opérationnel pour gérer le référencement, les redirections et l'apparence sociale de votre boutique.

---

## 1. Gestion des Redirections (SEO 301)

Les redirections sont essentielles pour ne pas perdre de trafic lors d'un changement de nom de produit ou d'une migration.

### Redirections Manuelles
Pour rediriger définitivement une ancienne URL vers une nouvelle :
- **Fichier** : `next.config.ts`.
- **Méthode** : Ajoutez un objet dans la fonction `redirects()`.
- **Note** : Utilisez toujours `permanent: true` pour envoyer un code **301** (indispensable pour que Google transfère "le jus SEO" à la nouvelle page).

### Redirections de Langue
Le système gère automatiquement l'ajout de la locale (`/fr` ou `/en`). Une visite sur `boutique.com/shop` sera redirigée de manière permanente vers la version linguistique par défaut.

---

## 2. Métadonnées et Réseaux Sociaux

Le site génère automatiquement les balises nécessaires pour une apparence "Premium" lors du partage de liens.

- **Fichier Central** : `src/app/[locale]/layout.tsx`.
- **Open Graph (Facebook/LinkedIn)** : Titre, description et images de partage sont configurés dynamiquement.
- **Twitter Cards** : Formatage optimisé pour le partage sur X (ex-Twitter).
- **Traductions SEO** : Les textes des balises (Title, Description) sont stockés dans les dictionnaires JSON (`messages/fr.json` et `en.json`) sous la clé `metadata`.

---

## 3. Données Structurées (Rich Snippets)

Pour obtenir des résultats enrichis dans Google (prix, stock, avis), nous utilisons le format **JSON-LD**.

- **Composant** : `src/components/seo/json-ld.tsx`.
- **Types Implémentés** :
    - `Product` : Pour les fiches produits (enrichit la recherche avec le prix).
    - `BreadcrumbList` : Pour afficher le chemin de navigation dans Google.
    - `Organization` : Pour lier le site à l'identité officielle de la marque.

---

## 4. Guide de Maintenance

| Tâche | Localisation / Fichier |
| :--- | :--- |
| **Modifier le titre global** | `messages/[locale].json` -> `metadata.title` |
| **Ajouter une page au sitemap** | Automatique pour les Produits. Manuel dans `src/app/sitemap.ts` pour les autres. |
| **Changer le logo dans Google** | `src/components/seo/json-ld.tsx` (Organization) |
| **Bloquer une page sensible** | `src/app/robots.ts` (Disallow) |

---

## 5. IA et Indexation Moderne
Le fichier `/public/llms.txt` est présent pour aider les agents d'intelligence artificielle (comme les futurs moteurs de recherche basés sur l'IA) à comprendre instantanément la structure et le but de votre boutique.
