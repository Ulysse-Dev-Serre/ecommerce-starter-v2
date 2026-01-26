# Implementation Technique : Next-intl

Ce document explique les details techniques de l'integration de la bibliotheque `next-intl` au sein du projet.

---

## 1. Fonctionnement du Middleware

Le middleware (`src/middleware.ts`) joue un rôle crucial dans le systeme i18n :
- **Detection de la Locale** : Si une URL est acccedee sans prefixe (ex: `/shop`), le middleware redirige l'utilisateur vers la locale par defaut (`/fr/shop` ou `/en/shop`).
- **Redirection 301** : Les redirections de locales sont configurees en mode permanent (301) pour optimiser le referencement (SEO).
- **Detection de la Devise** : Le middleware utilise la geolocalisation (headers IP) pour suggerer une devise par defaut via un cookie.

---

## 2. Chargement des Messages (Server Side)

L'importation dynamique des traductions est geree par le fichier `src/lib/i18n/request.ts`.

```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  // Fallback si la locale est invalide
  if (!locale || !i18n.locales.includes(locale as any)) {
    locale = i18n.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./dictionaries/${locale}.json`)).default,
  };
});
```

---

## 3. Utilisation dans les Composants

### Server Components
Pour les composants serveurs, utilisez `getTranslations`. Cela permet de charger les traductions de maniere asynchrone sans surcharger le bundle client.

```typescript
import { getTranslations } from 'next-intl/server';

async function MyComponent() {
  const t = await getTranslations('common');
  return <h1>{t('title')}</h1>;
}
```

### Client Components
Pour les composants clients, utilisez le hook `useTranslations`.

```typescript
'use client';
import { useTranslations } from 'next-intl';

function MyClientComponent() {
  const t = useTranslations('navbar');
  return <nav>{t('home')}</nav>;
}
```

---

## 4. Maintenance et Mise a jour

### Mise a jour de la bibliotheque
`next-intl` est integre via le plugin Next.js dans `next.config.ts`. Si vous mettez a jour la version de la bibliotheque, verifiez que le fichier `src/lib/i18n/request.ts` respecte toujours la signature attendue par `getRequestConfig`.

### Bonnes pratiques
- **Contextes** : Organisez vos fichiers JSON par contextes (`common`, `navbar`, `products`, etc.) pour eviter de charger des fichiers trop volumineux.
- **Fallbacks** : Le systeme est configure pour rediriger vers la langue par defaut en cas de locale inexistante ou mal formee dans l'URL.
