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
  import(`../dictionaries/${locale}.json`).then(msgs =>
    setMessages(msgs.default)
  );
}, [locale]);
```

#### Mécanisme de basculement automatique

Le système fonctionne avec ce principe simple :

1. **`locale`** (prop reçue) → détermine quelle langue utiliser ("fr" ou "en")
2. **Import dynamique** → charge le bon dictionnaire selon la locale :
   - `locale = "fr"` → charge `fr.json`
   - `locale = "en"` → charge `en.json`
3. **`messages`** → contient tout le dictionnaire de la langue active
4. **Changement de langue** → redirige vers la nouvelle URL avec la nouvelle locale, rechargeant automatiquement le composant avec le nouveau dictionnaire

**Exemple concret dans la navbar :**
```typescript
// Accès aux traductions selon la locale active
{messages.common.contact}     // "Contact" (fr) / "Contact" (en)
{messages.common.home}        // "Accueil" (fr) / "Home" (en)
{messages.products.title}     // "Produits" (fr) / "Products" (en)
{messages.navbar.brand}       // "Votre Boutique" (fr) / "Your Shop" (en)
```


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

Pour ajouter une nouvelle langue (exemple : arabe "ar") :

#### **Étapes obligatoires (fonctionnalité de base)**
1. **Créer le dictionnaire** : `src/lib/i18n/dictionaries/ar.json`
2. **Modifier `src/middleware.ts`** : `const locales = ['fr', 'en', 'ar'];`
3. **Modifier `src/app/[locale]/layout.tsx`** : ajouter `{ locale: 'ar' }` dans `generateStaticParams()`

#### **Étape optionnelle (interface utilisateur)**
4. **Ajouter le bouton AR dans la navbar** pour permettre aux utilisateurs de changer facilement

#### **Important à retenir**
- **L'URL `http://localhost:3000/ar` fonctionnera** même sans le bouton navbar
- **Le bouton navbar** = seulement **interface utilisateur** pour l'ergonomie
- **La logique de routage i18n** est complètement indépendante de l'interface
- Vous pouvez tester avec l'URL manuelle avant d'ajouter les boutons

### Bonnes pratiques

- **Fallback** : Toujours prévoir un texte par défaut
- **Lazy loading** : Charger les dictionnaires à la demande
- **Cohérence** : Même structure JSON pour toutes les langues
- **Performance** : Éviter les re-renders inutiles
- **Maintenance** : Centraliser les traductions par catégorie
