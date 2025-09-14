# Guidelines SEO pour Site Multilingue

## Configuration technique

### URLs et structure

**✅ Bonne pratique actuelle :**

- `/fr/` pour le français
- `/en/` pour l'anglais
- URLs distinctes par langue

**❌ À éviter :**

- Paramètres d'URL (`?lang=fr`)
- Hash fragments (`#fr`)
- Détection automatique sans choix utilisateur

### Métadonnées par langue

#### Dans layout.tsx

```typescript
export async function generateMetadata({ params: { locale } }: Props) {
  const messages = await getMessages(locale);

  return {
    title: messages.meta.title,
    description: messages.meta.description,
    openGraph: {
      locale: locale === 'fr' ? 'fr_CA' : 'en_US',
    },
  };
}
```

#### Hreflang tags

Next.js gère automatiquement les tags hreflang :

```html
<link rel="alternate" hreflang="fr" href="/fr/" />
<link rel="alternate" hreflang="en" href="/en/" />
<link rel="alternate" hreflang="x-default" href="/fr/" />
```

### Contenu et traduction

#### Stratégie de contenu

- **Traduction complète** : Pas de contenu mixte
- **Adaptation culturelle** : Prix, dates, formats
- **Images localisées** : Texte dans les images traduit
- **Devise et unités** : CAD vs USD, km vs miles

#### URLs localisées

```
/fr/produits/categorie-a
/en/products/category-a
```

### Performance SEO

#### Sitemap multilingue

Générer un sitemap avec toutes les versions :

```xml
<url>
  <loc>https://monsite.com/fr/produits</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://monsite.com/en/products"/>
  <xhtml:link rel="alternate" hreflang="fr" href="https://monsite.com/fr/produits"/>
</url>
```

#### Indexation

- **Robots.txt** : Pas de restriction par langue
- **Canonical URLs** : Une par version linguistique
- **Schema markup** : Adapter la langue

### Redirections et erreurs

#### Gestion 404

- Page 404 dans la langue de l'URL
- Suggestions dans la bonne langue
- Liens de navigation traduits

#### Redirections

- **301** : Changement permanent de structure
- **302** : Redirection temporaire (détection géo)
- **JavaScript** : Changement côté client uniquement

### Analytics et suivi

#### Segmentation

- **Google Analytics** : Vues par langue
- **Search Console** : Propriétés séparées ou filtres
- **Mots-clés** : Recherche par marché linguistique

#### KPIs spécifiques

- Taux de conversion par langue
- Temps de session par marché
- Pages populaires par région

### Checklist de lancement

**Technique :**

- [ ] URLs propres par langue
- [ ] Hreflang configuré
- [ ] Sitemap multilingue
- [ ] Meta descriptions traduites

**Contenu :**

- [ ] Traductions complètes
- [ ] Images localisées
- [ ] Formats adaptés (prix, dates)
- [ ] Navigation traduite

**Monitoring :**

- [ ] Analytics segmenté
- [ ] Search Console configuré
- [ ] Tests de vitesse par région
- [ ] Suivi des erreurs 404
