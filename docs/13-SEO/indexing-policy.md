# 🔍 Politique d'Indexation (SEO)

Ce document détaille la stratégie de référencement naturel appliquée au Starter, visant à maximiser la visibilité sur les moteurs de recherche tout en protégeant les données sensibles.

---

## 1. Stratégie d'Exploration (Crawling)

Nous utilisons une approche sélective pour guider les robots de Google et Bing vers les zones à forte valeur ajoutée.

### Pages Exclues (`noindex`)
Les routes suivantes sont interdites via `robots.txt` et les balises Meta pour éviter le contenu dupliqué et sécuriser les accès :
- **Administration** : `/admin/*`
- **Tunnel d'Achat** : `/cart`, `/checkout/*`
- **Données Utilisateurs** : `/orders/*`, `/account/*`
- **Technique** : `/api/*`, `/_next/*`

### Gestion des Variantes
Pour concentrer toute la puissance SEO sur une seule fiche produit, nous utilisons une **URL Unique par Produit**.
- Les changements de couleurs ou de tailles ne modifient pas l'URL (état client).
- Cela garantit que tous les liens externes (`backlinks`) pointent vers la même page, renforçant son autorité.

---

## 2. Internationalisation & SEO Local

Le site est nativement bilingue (EN/FR) et utilise les standards les plus stricts pour éviter les pénalités :

- **Sitemap Dynamique** (`sitemap.xml`) : Généré en temps réel, il liste tous les produits actifs dans chaque langue supportée.
- **Balises Hreflang** : Présentes dans le `<head>` et le sitemap, elles indiquent explicitement à Google quelle version de la page afficher selon la localisation de l'utilisateur.
- **Canonicals** : Chaque URL inclut une balise `canonical` pour neutraliser les paramètres de tracking (UTM) et confirmer la source de référence.

---

## 3. Maillage Interne & Structure

### Hiérarchie Sémantique
Nous utilisons des données structurées **JSON-LD** pour aider les moteurs à comprendre l'organisation du site :
- **Breadcrumbs** (Fils d'Ariane) : `Accueil > Boutique > Catégorie > Produit`.
- **Product Schema** : Envoie le prix, la disponibilité et les avis directement à Google pour affichage dans les résultats de recherche.

### Performance & Web Vitals
L'architecture Next.js (App Router) garantit un chargement ultra-rapide et un score élevé sur les "Core Web Vitals", un facteur majeur de classement SEO depuis 2021.

---

## 4. Maintenance Technique

| Composant | Fichier | Rôle |
| :--- | :--- | :--- |
| **Robots Policy** | `src/app/robots.ts` | Gère les permissions d'exploration. |
| **Sitemap Engine** | `src/app/sitemap.ts` | Génère la liste des URLs publiques. |
| **Meta Headers** | `src/app/[locale]/layout.tsx` | Configure les titres et descriptions SEO globaux. |
