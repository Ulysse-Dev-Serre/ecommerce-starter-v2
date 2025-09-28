# SEO Guidelines - Configuration Multilingue

## Objectif

Documentation technique pour configurer le SEO multilingue sur une nouvelle boutique e-commerce. Focus sur les éléments critiques à implémenter pour le référencement Google FR/EN.

---

## Checklist Pré-Lancement

### URLs et structure

- [ ] URLs distinctes par langue (`/fr/`, `/en/`)
- [ ] Pas de paramètres (`?lang=fr`) ou hash (`#fr`)
- [ ] Structure cohérente : `/fr/produits/categorie/nom-produit`
- [ ] Slugs traduits : `/fr/produits/` vs `/en/products/`

### Métadonnées obligatoires

- [ ] Title unique par page/langue (50-60 caractères)
- [ ] Meta description unique (150-160 caractères)
- [ ] Open Graph locale : `fr_CA`, `en_US`
- [ ] Images alt text traduit

### Configuration automatique à vérifier

- [ ] Hreflang tags générés par Next.js
- [ ] Canonical URLs par version
- [ ] Sitemap XML accessible `/sitemap.xml`
- [ ] Robots.txt configuré

### Performance

- [ ] PageSpeed > 90 mobile/desktop
- [ ] Core Web Vitals dans le vert
- [ ] Images optimisées avec noms descriptifs

---

## Configuration Technique

### Métadonnées dans layout.tsx

```typescript
export async function generateMetadata({ params: { locale } }: Props) {
  const messages = await getMessages(locale);

  return {
    title: messages.meta.title,
    description: messages.meta.description,
    openGraph: {
      locale: locale === 'fr' ? 'fr_CA' : 'en_US',
      title: messages.meta.ogTitle,
    },
  };
}
```

### Structure URLs recommandée

```
Produits :
/fr/produits/categorie/nom-produit-francais
/en/products/category/english-product-name

Catégories :
/fr/plantes/plantes-interieur
/en/plants/indoor-plants
```

### Hreflang automatique

Next.js génère automatiquement :

```html
<link rel="alternate" hreflang="fr" href="/fr/produits" />
<link rel="alternate" hreflang="en" href="/en/products" />
<link rel="alternate" hreflang="x-default" href="/fr/produits" />
```

---

## Contenu par Niche

### Mots-clés cibles

**Plantes (FR/EN) :**

- FR : "plantes d'intérieur", "plante facile entretien", "livraison plantes Québec"
- EN : "indoor plants", "low maintenance plants", "plants Canada shipping"

**Animaux (FR/EN) :**

- FR : "accessoires chien", "collier personnalisé", "jouets chat qualité"
- EN : "dog accessories", "personalized collar", "premium cat toys"

**Jouets (FR/EN) :**

- FR : "jouets éducatifs", "jouets sécuritaires bébé", "idées cadeaux enfant"
- EN : "educational toys", "safe baby toys", "kids gift ideas"

### Structure contenu

**Pages produits :**

```
H1: [Nom produit] - [Bénéfice principal]
H2: Description (150-300 mots avec mots-clés naturels)
H2: Caractéristiques
H2: Guide utilisation/entretien
H2: Avis clients
```

**Pages catégories :**

```
H1: [Catégorie] - [Proposition valeur]
H2: Guide d'achat
H2: Types de produits
H2: Comment choisir
H2: FAQ
```

---

## Monitoring Essentiel

### Google Search Console

- Propriété par langue ou filtres `/fr/`, `/en/`
- Surveillance erreurs indexation
- Mots-clés en progression
- Performance par page

### Google Analytics 4

- Segmentation par langue
- Entonnoirs conversion par source
- Revenus organiques vs payants
- Événements e-commerce trackés

### KPIs techniques

- Pages indexées vs total
- Positions moyennes par mot-clé
- CTR par page importante
- Core Web Vitals

### KPIs business

- Trafic organique % du total
- Conversion organique vs payant
- Coût acquisition client organique
- Revenus organiques mensuels

---

## Actions Post-Lancement

### Hebdomadaire

- Vérifier erreurs Search Console
- Analyser nouveaux mots-clés
- Corriger liens cassés

### Mensuel

- Optimiser pages CTR faible
- Ajouter contenu saisonnier
- Mettre à jour métadonnées performantes

### Trimestriel

- Audit technique complet
- Expansion mots-clés longue traîne
- Révision stratégie contenu

---

## Points Critiques

### Configuration obligatoire

- URLs propres par langue (pas de paramètres)
- Métadonnées uniques par page
- Sitemap multilingue fonctionnel
- Temps de chargement optimisé

### Contenu différenciant

- Mots-clés locaux (Canada, Québec)
- Descriptions produits uniques
- Contenu éducatif par niche
- Optimisation recherche vocale

### Avantages techniques

- URLs flexibles vs limitations Shopify
- Vitesse optimisée
- Structure données personnalisée
- Contrôle complet markup

### Métriques de succès

- 40-60% trafic organique visé
- Conversion organique supérieure vs pub
- Réduction coût acquisition long terme
- Indépendance plateformes publicitaires
