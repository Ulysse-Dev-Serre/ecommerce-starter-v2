# Architecture de l'Internationalisation (i18n)

Ce document decrit la structure globale du systeme multilingue et la procedure pour ajouter de nouvelles langues.

---

## 1. Organisation Generale

Le projet utilise Next.js App Router avec une structure dynamiquement segmentee par locale. Chaque route est prefixee par le code de la langue (ex: `/fr/produits`).

### Structure des fichiers clefs
- `src/app/[locale]/` : Contient toutes les pages bilingues.
- `src/lib/i18n/config.ts` : Definition des langues supportees et de la langue par defaut.
- `src/lib/i18n/dictionaries/` : Dossier contenant les fichiers de traduction JSON.
- `src/lib/i18n/request.ts` : Configuration du chargement des messages pour `next-intl`.
- `src/middleware.ts` : Gere les redirections vers les locales et la detection de la devise.

---

## 2. Guide : Ajouter une nouvelle langue

Pour ajouter une nouvelle langue au projet (ex: Espagnol `es`), suivez ces etapes :

### Etape 1 : Creer le fichier de traduction
Creez un nouveau fichier JSON dans `src/lib/i18n/dictionaries/es.json`.
Copiez la structure d'un fichier existant (`fr.json`) et traduisez les valeurs.

### Etape 2 : Mettre a jour la configuration
Modifiez le fichier `src/lib/i18n/config.ts` pour inclure la nouvelle langue dans le tableau `locales`.

```typescript
export const i18n = {
  defaultLocale: 'en',
  locales: ['fr', 'en', 'es'] as const, // Ajoutez 'es' ici
} as const;
```

### Etape 3 : Verifier les Redirections (SEO)
Le middleware detectera automatiquement la nouvelle langue grace a la modification dans `config.ts`. Assurez-vous que les redirections sont bien prises en compte pour le SEO permanent (301).

---

## 3. Modularite du systeme

Le systeme est conçu pour etre modulaire :
- **Configuration isolee** : Changer la langue par defaut se fait en une seule ligne dans `config.ts`.
- **Traductions decouplees** : Les fichiers JSON sont independants du code React, ce qui permet des mises a jour simples.
- **Routing dynamique** : L'utilisation du segment `[locale]` permet d'ajouter des langues sans modifier la structure des dossiers de pages.
