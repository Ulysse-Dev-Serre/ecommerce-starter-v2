## 🎯 Vision du projet

**Un starter e-commerce universel, flexible et prêt à l'emploi** pour lancer rapidement des boutiques en ligne dans n'importe quelle niche et n'importe quel pays.

### Philosophie du starter

Ce n'est pas une boutique figée, mais **une base technique solide** que vous pouvez adapter selon vos besoins :

- **🌍 Multi-pays** : Taxes locales, devises, zones d'expédition configurables
- **🎨 Multi-niches** : Animaux, plantes, jouets, vêtements, électronique...
- **🌐 Multi-langues** : Français/Anglais par défaut, extensible à d'autres langues
- **⚡ Déploiement rapide** : De l'idée à la boutique en ligne en quelques jours

---

## 📦 Périmètre MVP (Version 2.0)

### Ce que vous obtenez out-of-the-box

#### 🛍️ **Expérience client complète**

- Catalogue produits avec variantes (taille, couleur, etc.)
- Panier intelligent (invité + utilisateur connecté)
- Checkout sécurisé avec Stripe
- Gestion des commandes et statuts
- Emails transactionnels automatiques

#### 🌍 **Multi-pays natif**

- Support Canada/USA avec taxes locales (GST/QST/Sales Tax)
- Calculs d'expédition par zones
- Format des prix, dates et adresses selon la locale
- Extensions prêtes pour autres pays

#### 🗣️ **Bilingue par conception**

- URLs localisées (`/fr/`, `/en/`)
- Contenus traduits (produits, catégories, pages)
- SEO international (hreflang, sitemaps multilingues)
- Interface admin bilingue

##### Configuration i18n et ajout de langues

Le système de traduction utilise une architecture modulaire qui permet d'ajouter facilement de nouvelles langues en quelques minutes.

###### Structure du système i18n

```
src/lib/i18n/
├── config.ts              # Configuration des langues
├── utils.ts               # Fonctions utilitaires
└── dictionaries/
    ├── fr.json           # Traductions françaises
    └── en.json           # Traductions anglaises
```

###### Ajouter une nouvelle langue

**1. Créer le fichier de dictionnaire** (`src/lib/i18n/dictionaries/es.json`) :

```json
{
  "common": {
    "signIn": "Iniciar sesión",
    "signUp": "Registrarse",
    "signOut": "Cerrar sesión"
  },
  "navbar": {
    "brand": "Tu Tienda"
  }
}
```

**2. Mettre à jour la configuration** (`src/lib/i18n/config.ts`) :

```typescript
export const i18n = {
  defaultLocale: 'fr',
  locales: ['fr', 'en', 'es'] as const, // Ajouter 'es'
} as const;
```

**3. Détecter automatiquement les langues** :

```typescript
// Fonction utilitaire pour détecter la langue depuis l'URL
export function getLocaleFromPath(pathname: string): Locale {
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : i18n.defaultLocale;

  return i18n.locales.includes(locale as Locale)
    ? (locale as Locale)
    : i18n.defaultLocale;
}
```

##### Modifier les traductions existantes

**Méthode simple** : Éditez directement les fichiers JSON :

```json
// src/lib/i18n/dictionaries/fr.json
{
  "navbar": {
    "brand": "Votre Boutique" // Changer ici
  },
  "common": {
    "signUp": "S'enregistrer" // Changer ici
  }
}
```

##### Fonctions utilitaires de traduction

```typescript
// src/lib/i18n/utils.ts
export function useTranslations() {
  return {
    t: (key: string) => {
      // Récupère la traduction selon la clé
      const keys = key.split('.');
      return getNestedValue(currentDictionary, keys);
    }
  };
}

// Utilisation dans les composants
const t = useTranslations();
return <h1>{t('navbar.brand')}</h1>;
```

##### Changer la langue par défaut

Modifiez simplement la configuration :

```typescript
// src/lib/i18n/config.ts
export const i18n = {
  defaultLocale: 'en', // Changé de 'fr' à 'en'
  locales: ['fr', 'en'] as const,
} as const;
```

##### URL et routing international

Le système détecte automatiquement la langue depuis l'URL :

```
example.com/fr/products     → Français
example.com/en/products     → Anglais
example.com/products        → Langue par défaut
```

##### Intégration avec Next.js

Pour une intégration complète avec les appareils Next.js d'internationalisation :

```typescript
// Configuration Next.js (next.config.js)
module.exports = {
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
  },
};
```

##### Debugging des traductions

Si les traductions ne s'affichent pas :

1. Vérifiez la syntaxe JSON
2. Assurez-vous que la clé existe dans le dictionnaire
3. Testez avec `console.log` les valeurs retournées
4. Vérifiez que le composant importe correctement `useTranslations`

##### Points importants

- ✅ **Structure modulaire** : Chaque langue dans son propre fichier
- ✅ **Clés organisées** : Groupées par domaine (navbar, products, etc.)
- ✅ **Extensible** : Ajoutez autant de langues que nécessaire
- ✅ **Maintenable** : Modifications isolées par fichier de langue
- ✅ **Performance** : Chargement à la demande des dictionnaires

#### 🔒 **Sécurité professionnelle**

- Authentification robuste (Clerk)
- Protection contre les attaques (rate limiting, CSRF, XSS)
- Chiffrement des données sensibles
- Logs d'audit complets

#### ⚙️ **Administration complète**

- Interface admin responsive
- CRUD produits/catégories multilingues
- Gestion des commandes et utilisateurs
- Système de rôles et permissions

#### 📈 **Observabilité intégrée**

- Monitoring des performances
- Tracking des erreurs (Sentry)
- Analytics e-commerce (GA4)
- Health checks automatiques

### Exemples d'utilisation

#### 🐕 **Boutique pour chiens - France**

```
Domaine: chien-shop.fr
Langue: Français uniquement
Taxes: TVA française (20%)
Produits: Colliers, jouets, nourriture
Expédition: France + DOM-TOM
```

#### 🌱 **Boutique de plantes - Canada**

```
Domaine: plantoasis.ca
Langues: Français/Anglais
Taxes: GST/QST selon province
Produits: Plantes d'intérieur, pots, engrais
Expédition: Canada + certaines zones USA
```

#### 🧸 **Boutique de jouets - États-Unis**

```
Domaine: toyland.com
Langue: Anglais
Taxes: Sales tax par état
Produits: Jouets éducatifs, jeux de société
Expédition: USA + international
```

## 🚀 Configuration rapide par niche

### Étapes de personnalisation (2-3 jours)

1. **📝 Contenu** : Remplacer les données de demo
      - Catégories et produits de votre niche
      - Textes marketing adaptés
      - Images et médias

2. **🎨 Design** : Adapter le thème visuel
      - Couleurs de marque
      - Logo et favicon
      - Typographie

3. **🌍 Localisation** : Configurer le pays cible
      - Devises et taxes locales
      - Zones d'expédition
      - Mentions légales conformes

4. **⚙️ Intégrations** : Connecter vos services
      - Paiement (Stripe/PayPal)
      - Email (SendGrid/Mailgun)
      - Analytics (GA4)

### 🔧 Configuration des thèmes CSS

#### Système de variables CSS pour changement rapide de thème

Le projet utilise un système avancé de variables CSS qui permet de changer complètement l'apparence de votre boutique en quelques minutes, sans toucher au code des composants.

##### Structure du système de thème

```css
:root {
  /* Couleurs de marque */
  --primary: #6c47ff; /* Couleur principale */
  --primary-hover: #5b3fe6; /* Couleur au survol */

  /* Couleurs neutres */
  --background: #ffffff; /* Fond principal */
  --foreground: #171717; /* Texte principal */
  --muted: #94a3b8; /* Texte secondaire */

  /* Autres couleurs utilitaires... */
}
```

##### Méthodes de changement de thème

###### **Méthode 1: Changement direct dans CSS**

1. **Ouvrez le fichier** `src/app/globals.css`
2. **Modifiez les variables** à la racine pour votre marque :

```css
:root {
  --primary: #your-brand-color;
  --background: #your-bg-color;
  --foreground: #your-text-color;
}
```

###### **Méthode 2: Utilisation des classes de thème prédéfinies**

Ajoutez une classe au `<body>` de votre layout (`src/app/layout.tsx`) :

```tsx
<body className="theme-purple">    {/* Violet */}
<body className="theme-indigo">    {/* Bleu */}
<body className="theme-green">     {/* Vert */}
<body className="theme-light">     {/* Clair */}
<body className="theme-dark">      {/* Sombre */}
```

Exemple d'implémentation :

```tsx
// src/app/layout.tsx
<body className={`${geistSans.variable} ${geistMono.variable} ${yourThemeClass} antialiased`}>
```

##### **Méthodes 3: Variables CSS dynamiques (programmatique)**

```javascript
// Changer en JavaScript/TypeScript
document.documentElement.style.setProperty('--primary', '#FF6B6B');
document.documentElement.style.setProperty('--background', '#F7F9FC');
```

##### Classes de thème prédéfinis disponibles

| Classe          | Description  | Utilisation                  |
| --------------- | ------------ | ---------------------------- |
| `.theme-light`  | Thème clair  | Pour sites web classiques    |
| `.theme-dark`   | Thème sombre | Pour une expérience nocturne |
| `.theme-purple` | Thème violet | Boutique créative/high-tech  |
| `.theme-indigo` | Thème indigo | Applications corporates      |
| `.theme-green`  | Thème vert   | Écologie & nature            |

##### Exemple concret pour une boutique de plantes

```css
/* Ajoutez dans src/app/globals.css */
:root {
  --primary: #22c55e; /* Vert émeraude */
  --primary-hover: #16a34a; /* Vert plus foncé */
  --accent: #f0fdf4; /* Vert très pâle pour accents */
  --muted: #86efac; /* Vert pâle pour texte secondaire */
}
```

##### Points importants

- ✅ **Zéro recompilation** requise lors du changement des variables CSS
- ✅ **Application instantanée** des modifications
- ✅ **Séparation parfaite** entre logique métier et présentation
- ✅ **Mode sombre automatique** si détecté dans le navigateur
- ✅ **Extensible** : Ajoutez autant de variables que nécessaire

##### Debugging des thèmes

Si votre thème ne s'applique pas correctement :

1. Vérifiez la syntaxe des variables CSS
2. Assurez-vous que la classe est bien appliquée au `<body>`
3. Videz le cache du navigateur (Ctrl+F5)
4. Utilisez les DevTools pour inspecter les valeurs de variables

---

## 🛠️ Stack technique

- **Frontend** : Next.js 14 + TypeScript + Tailwind CSS
- **Backend** : Next.js API Routes + Prisma ORM
- **Base de données** : PostgreSQL
- **Paiements** : Stripe Payment Element
- **Authentification** : Clerk
- **Déploiement** : Vercel/Railway/DigitalOcean
- **Monitoring** : Sentry + Uptime monitoring

---

## 📋 Phases de développement

### Phase 0 (P0) - Fondations ✅

- Architecture technique de base
- Sécurité et authentification
- Base de données et migrations
- CI/CD et qualité code

### Phase 1 (P1) - Core E-commerce 🚧

- Catalogue produits et API
- Panier et checkout Stripe
- Gestion des commandes
- Pages publiques essentielles

### Phase 2 (P2) - International & SEO 📋

- i18n complet (FR/EN)
- SEO multilingue avancé
- Optimisations performances
- Meta tags dynamiques

### Phase 3 (P3) - Admin & Sécurité 📋

- Interface d'administration
- Sécurité avancée (2FA, audits)
- Tests automatisés (unit + E2E)
- Monitoring et alertes

### Phase 4 (P4) - Production Ready 📋

- Documentation complète
- Conformité légale
- Analytics et tracking
- Déploiement et maintenance

---

## 🎯 Objectifs du starter

### Pour les entrepreneurs

- **Time-to-market** : Lancez votre boutique en 1 semaine au lieu de 6 mois
- **Coûts réduits** : Base technique éprouvée, pas de développement from scratch
- **Scalabilité** : Architecture pensée pour grandir avec votre business

### Pour les développeurs

- **Code quality** : TypeScript, tests, documentation, standards
- **Maintenabilité** : Architecture modulaire, séparation des responsabilités
- **Extensibilité** : APIs bien définies, hooks personnalisables

### Pour les agences

- **Réutilisabilité** : Une base pour tous vos projets e-commerce
- **Personnalisation** : Thèmes et configurations par client
- **Support** : Documentation complète et communauté active

---

## 📄 Licence

MIT License - Utilisez librement pour vos projets commerciaux.

---

## 🤝 Contribution

Consultez [CONTRIBUTING.md](CONTRIBUTING.md) pour les règles de contribution.

---

## 📚 Documentation

- [Setup du projet](docs/1-foundations/setup.md)
- [Architecture technique](docs/1-foundations/architecture.md)
- [Guide i18n](docs/6-i18n-seo/i18n-strategy.md)
- [Documentation API](docs/4-api/openapi.yaml)
