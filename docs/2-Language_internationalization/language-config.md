# Configuration du Système i18n

## Vue d'ensemble

Configuration Next.js App Router avec routes dynamiques `[locale]` pour gérer le français et l'anglais.

## Architecture

### Structure des dossiers

```
src/
├── app/
│   └── [locale]/           # Routes dynamiques par langue
│       ├── layout.tsx      # Layout avec support locale
│       └── page.tsx        # Pages traduites
├── lib/i18n/
│   ├── config.ts           # Configuration des langues
│   ├── utils.ts            # Fonctions utilitaires
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

---

## Système de traduction

### Dictionnaires JSON

Les traductions sont organisées par catégories :

```json
{
  "common": { 
    "signIn": "Se connecter",
    "signUp": "S'inscrire",
    "signOut": "Se déconnecter"
  },
  "navbar": { 
    "brand": "Votre Boutique",
    "home": "Accueil",
    "products": "Produits"
  },
  "products": { 
    "title": "Produits",
    "addToCart": "Ajouter au panier"
  }
}
```

### Utilisation dans les composants

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

### Mécanisme de basculement automatique

Principe de fonctionnement :

1. **`locale`** (prop reçue) → détermine la langue ("fr" ou "en")
2. **Import dynamique** → charge le dictionnaire correspondant :
   - `locale = "fr"` → charge `fr.json`
   - `locale = "en"` → charge `en.json`
3. **`messages`** → contient le dictionnaire de la langue active
4. **Changement de langue** → redirige vers nouvelle URL, recharge automatiquement

**Exemple concret :**
```typescript
// Accès aux traductions selon la locale active
{messages.common.contact}     // "Contact" (fr) / "Contact" (en)
{messages.navbar.home}        // "Accueil" (fr) / "Home" (en)
{messages.products.title}     // "Produits" (fr) / "Products" (en)
```

---

## Ajouter une nouvelle langue

### Exemple : Ajouter l'espagnol (es)

**1. Créer le fichier de dictionnaire**

Créer `src/lib/i18n/dictionaries/es.json` :

```json
{
  "common": {
    "signIn": "Iniciar sesión",
    "signUp": "Registrarse",
    "signOut": "Cerrar sesión"
  },
  "navbar": {
    "brand": "Tu Tienda",
    "home": "Inicio",
    "products": "Productos"
  },
  "products": {
    "title": "Productos",
    "addToCart": "Añadir al carrito"
  }
}
```

**2. Mettre à jour la configuration**

Modifier `src/lib/i18n/config.ts` :

```typescript
export const i18n = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'es'] as const, // Ajouter 'es'
} as const;

export type Locale = (typeof i18n)['locales'][number];
```

**3. Mettre à jour le middleware**

Modifier `src/middleware.ts` :

```typescript
const locales = ['fr', 'en', 'es']; // Ajouter 'es'
```

**4. Mettre à jour le layout**

Modifier `src/app/[locale]/layout.tsx` :

```typescript
export function generateStaticParams() {
  return [
    { locale: 'fr' },
    { locale: 'en' },
    { locale: 'es' } // Ajouter cette ligne
  ];
}
```

**5. Ajouter le bouton dans la navbar (optionnel)**

L'URL `http://localhost:3000/es` fonctionnera même sans bouton. Le bouton navbar est seulement pour l'ergonomie utilisateur.

---

## Modifier les traductions existantes

### Méthode simple

Éditer directement les fichiers JSON :

```json
// src/lib/i18n/dictionaries/fr.json
{
  "navbar": {
    "brand": "Ma Boutique Personnalisée" // Modifier ici
  },
  "common": {
    "signUp": "Créer un compte" // Modifier ici
  }
}
```

### Ajout de nouvelles clés

```json
{
  "products": {
    "title": "Produits",
    "addToCart": "Ajouter au panier",
    "outOfStock": "Rupture de stock", // Nouvelle clé
    "sale": "En promotion" // Nouvelle clé
  }
}
```

---

## Fonctions utilitaires

### Configuration principale

```typescript
// src/lib/i18n/config.ts
export const i18n = {
  defaultLocale: 'fr',
  locales: ['fr', 'en'] as const,
} as const;

export type Locale = (typeof i18n)['locales'][number];
```

### Utilitaires de traduction

```typescript
// src/lib/i18n/utils.ts
export function getLocaleFromPath(pathname: string): Locale {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;

  return i18n.locales.includes(locale as Locale)
    ? (locale as Locale)
    : i18n.defaultLocale;
}

export function useTranslations(messages: any) {
  return {
    t: (key: string) => {
      const keys = key.split('.');
      return getNestedValue(messages, keys);
    }
  };
}

function getNestedValue(obj: any, keys: string[]): string {
  return keys.reduce((current, key) => current?.[key], obj) || key;
}
```

### Utilisation dans les composants

```typescript
// Dans un composant
const t = useTranslations(messages);
return <h1>{t('navbar.brand')}</h1>;

// Ou directement
return <h1>{messages.navbar.brand}</h1>;
```

---

## Changer la langue par défaut

### Exemple : Passer à l'anglais par défaut

Modifier `src/lib/i18n/config.ts` :

```typescript
export const i18n = {
  defaultLocale: 'en', // Changé de 'fr' à 'en'
  locales: ['fr', 'en'] as const,
} as const;
```

**Impact :**
- `/` redirigera vers `/en` au lieu de `/fr`
- Langue de fallback devient l'anglais
- URLs sans locale utilisent l'anglais

---

## Intégration avec Next.js

### Configuration Next.js (optionnelle)

Pour intégration complète avec les mécanismes Next.js :

```typescript
// next.config.js
module.exports = {
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    localeDetection: false, // Désactiver la détection auto
  },
};
```

**Note :** Cette configuration est optionnelle avec l'approche `[locale]` utilisée.

---

## Changement de langue

### Interface utilisateur

Les utilisateurs peuvent changer de langue via :

- **Boutons FR/EN** dans la navbar
- **Navigation directe** (`/en/products`)
- **Conservation du contexte** (reste sur la même page)

### Exemple de bouton de changement

```tsx
// Dans la navbar
<Link href={`/en${pathname}`} locale="en">
  EN
</Link>
<Link href={`/fr${pathname}`} locale="fr">
  FR
</Link>
```

---

## Avantages SEO

1. **URLs distinctes** : `/fr/produits` vs `/en/products`
2. **Indexation séparée** par Google
3. **Hreflang automatique** (Next.js)
4. **Performance** : Pas de JS côté client requis
5. **Contenu traduit** indexable indépendamment

---

## Debugging des traductions

### Problèmes courants

**1. Traductions ne s'affichent pas :**
- Vérifier la syntaxe JSON (virgules, guillemets)
- S'assurer que la clé existe dans le dictionnaire
- Tester avec `console.log(messages)` les valeurs retournées

**2. Mauvaise langue chargée :**
- Vérifier le paramètre `locale` reçu par le composant
- Inspecter l'URL dans le navigateur
- Vérifier le middleware de redirection

**3. Clés manquantes :**
- S'assurer que toutes les langues ont les mêmes clés
- Implémenter un fallback vers la langue par défaut
- Utiliser un outil de validation JSON

### Outils de debugging

```typescript
// Debug dans un composant
console.log('Current locale:', locale);
console.log('Available messages:', Object.keys(messages));
console.log('Specific translation:', messages.navbar?.brand);
```

---

## Bonnes pratiques

### Organisation des traductions

- **Fallback** : Toujours prévoir un texte par défaut
- **Lazy loading** : Charger les dictionnaires à la demande
- **Cohérence** : Même structure JSON pour toutes les langues
- **Performance** : Éviter les re-renders inutiles
- **Maintenance** : Centraliser les traductions par catégorie

### Structure des clés

```json
{
  "pages": {
    "home": { "title": "Accueil", "description": "..." },
    "products": { "title": "Produits", "description": "..." }
  },
  "components": {
    "navbar": { "brand": "...", "menu": "..." },
    "footer": { "copyright": "...", "links": "..." }
  },
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer"
  }
}
```

### Performance

- **Import dynamique** : Chargement à la demande par langue
- **Pas de bundle** : Évite d'inclure toutes les langues
- **Cache navigateur** : Fichiers JSON mis en cache
- **Séparation claire** : Logique i18n isolée du code métier

---

## Points importants

- **Structure modulaire** : Chaque langue dans son propre fichier
- **Clés organisées** : Groupées par domaine (navbar, products, etc.)
- **Extensible** : Ajouter autant de langues que nécessaire
- **Maintenable** : Modifications isolées par fichier de langue
- **Performance** : Chargement à la demande des dictionnaires
- **SEO-friendly** : URLs distinctes et contenu indexable
- **Type-safe** : TypeScript pour la configuration des locales
