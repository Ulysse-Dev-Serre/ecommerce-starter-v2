# Politique d'Indexation et Maillage Interne

Ce document détaille les règles d'indexation (SEO) appliquées au projet et la stratégie de maillage interne.

---

## 1. Indexation (Google / Bing)

### Pages Exclues (`noindex`)
Pour éviter le "duplicate content" et protéger les données privées, les routes suivantes sont configurées en `noindex, nofollow` via les métadonnées Next.js et `robots.txt` :

| Route | Raison |
| :--- | :--- |
| `/admin/*` | Interface d'administration privée. |
| `/cart` | Panier utilisateur, contenu variable et sans valeur SEO. |
| `/checkout/*` | Processus de paiement, données sensibles. |
| `/orders/*` | Historique des commandes personnel. |
| `/api/*` | Points de terminaison techniques. |

### Gestion des Variantes (Couleurs, Tailles, Prix)
Le projet utilise une approche de **URL unique par produit** :
- Les variantes (ex: couleur rouge vs bleu) sont gérées via un état client (`ProductClient.tsx`).
- Le changement de variante ne modifie pas l'URL (pas de paramètre `?variant=...` par défaut).
- Avantage SEO : Tout le poids SEO est concentré sur la fiche produit principale. Pas de risque de pages quasi-identiques indexées séparément.

### Utilisation des Canonicals
Chaque page publique possède une balise `<link rel="canonical">` pour indiquer à Google la version de référence, même si des paramètres de suivi (UTM) sont ajoutés à l'URL.

---

## 2. Maillage Interne (Internal Linking)

### Fils d'Ariane (Breadcrumbs)
Les pages produits incluent des données structurées JSON-LD pour les Breadcrumbs, aidant Google à comprendre la hiérarchie :
`Accueil > Boutique > Nom du Produit`

### Navigation Principale
- **Navbar** : Liens directs vers la Boutique et les catégories principales.
- **Footer** : Liens vers la Boutique, le Panier et les pages Légales.

### Prochaines étapes (Optimisation)
- [ ] Ajouter une section "Produits Similaires" au bas de chaque fiche produit.
- [ ] Listes des catégories populaires dans le footer.
- [ ] Optimisation des slugs pour inclure les mots-clés de la niche.

---

## 3. Configuration Technique

- **robots.txt** : Situé dans `src/app/robots.ts`, il bloque l'exploration des dossiers sensibles.
- **sitemap.xml** : Généré dynamiquement dans `src/app/sitemap.ts`, il liste toutes les pages publiques, produits et catégories actifs.
