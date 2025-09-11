# Stratégie d'Internationalisation (i18n)

## Vue d'ensemble

Cette configuration utilise Next.js App Router avec une approche basée sur des routes dynamiques `[locale]` pour gérer le français et l'anglais.

## Architecture

### Structure des dossiers
```
src/
├── app/
│   └── [locale]/           # Routes dynamiques par langue
│       ├── layout.tsx      # Layout avec support locale
│       └── page.tsx        # Pages traduites
├── lib/i18n/
│   └── dictionaries/       # Fichiers de traduction
│       ├── fr.json
│       └── en.json
└── middleware.ts           # Gestion des redirections
```

### Configuration des routes

- **Langue par défaut** : Français (`fr`)
- **URLs** : 
  - `/` → redirige vers `/fr`
  - `/fr/` → contenu français
  - `/en/` → contenu anglais

### Système de traduction

#### Dictionnaires JSON
Les traductions sont organisées par catégories dans des fichiers JSON :
```json
{
  "common": { "signIn": "Se connecter" },
  "navbar": { "brand": "Votre Boutique" },
  "products": { "title": "Produits" }
}
```

#### Utilisation dans les composants
```typescript
// Server Component
const messages = await import(`../dictionaries/${locale}.json`);

// Client Component  
useEffect(() => {
  import(`../dictionaries/${locale}.json`)
    .then(msgs => setMessages(msgs.default));
}, [locale]);
```

### Middleware

Le middleware combine :
- **Clerk** : Authentification
- **i18n** : Détection et redirection de langue
- **Fallback** : Redirection automatique vers le français

### Changement de langue

Les utilisateurs peuvent changer de langue via :
- Boutons FR/EN dans la navbar
- Navigation directe (`/en/products`)
- Conservation du contexte de page

### Avantages SEO

1. **URLs distinctes** : `/fr/produits` vs `/en/products`
2. **Indexation séparée** par Google
3. **Hreflang automatique** (Next.js)
4. **Performance** : Pas de JS côté client requis

### Extensibilité

Pour ajouter une nouvelle langue :
1. Créer `dictionaries/es.json`
2. Ajouter `'es'` dans `locales`
3. Créer les boutons de navigation
4. Optionnel : adapter les routes (`/es/productos`)

### Bonnes pratiques

- **Fallback** : Toujours prévoir un texte par défaut
- **Lazy loading** : Charger les dictionnaires à la demande
- **Cohérence** : Même structure JSON pour toutes les langues
- **Performance** : Éviter les re-renders inutiles
- **Maintenance** : Centraliser les traductions par catégorie