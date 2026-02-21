# 🌍 Architecture de l'Internationalisation (i18n)

Ce document détaille la stratégie multilingue du Starter, basée sur **next-intl** et l'App Router de Next.js.

---

## 1. Philosophie du Système

L'application utilise un **routage par locale** (`/[locale]/...`). Chaque page est préfixée par son code langue (ex: `/fr/shop`), ce qui garantit un SEO optimal pour chaque marché.

### Points Clés :
- **Source de Vérité** : Toutes les langues supportées sont définies dans `src/lib/config/site.ts`.
- **Détection Automatique** : Le middleware détecte la langue préférée du navigateur et redirige l'utilisateur vers la locale appropriée (redirection 301 permanente pour le SEO).
- **Support Statique** : Les paramètres de langue sont générés au build (`generateStaticParams`) pour une performance maximale.
- **Détection de Devise** : Le système utilise également la géolocalisation pour suggérer une devise par défaut cohérente avec la langue détectée.

---

## 2. Configuration des Langues

Pour modifier les langues disponibles, tout se passe dans un fichier central :

**Fichier** : `src/lib/config/site.ts`
- **`SUPPORTED_LOCALES`** : Liste des codes ISO (ex: `['en', 'fr']`).
- **`DEFAULT_LOCALE`** : Langue par défaut si aucune n'est détectée.

---

## 3. Gestion des Traductions (Dictionnaires)

Les textes d'interface sont stockés dans des fichiers JSON indépendants.

**Dossier** : `src/lib/i18n/dictionaries/`
- `en.json` : Traductions anglaises.
- `fr.json` : Traductions françaises.

### Bonnes Pratiques :
- **Organisation par Contextes** : Les fichiers JSON sont structurés par namespaces (`common`, `navbar`, `products`, etc.) pour faciliter la maintenance.
- **Ajout d'une langue** :
    1. Créez un nouveau fichier (ex: `es.json`) dans le dossier des dictionnaires.
    2. Ajoutez le code pays dans `SUPPORTED_LOCALES` dans `site.ts`.
    3. Traduisez les clés JSON en gardant la même structure que les fichiers existants.

---

## 4. Utilisation dans le Code

Le système distingue les composants côté Serveur et côté Client pour des raisons de performance.

### Composants Serveur (Server Components)
Utilisez les fonctions asynchrones de `next-intl/server` :
- `getTranslations` : Pour récupérer l'objet de traduction `t`.
- `getMessages` : Pour charger l'intégralité du dictionnaire (utilisé dans le layout).

### Composants Client (Client Components)
Utilisez les hooks React :
- `useTranslations` : Pour accéder aux messages.
- `useLocale` : Pour connaître la langue courante.

---

## 5. Données Dynamiques (Base de Données)

Pour le contenu provenant de la base de données (ex: noms et descriptions de produits), nous utilisons une table de **Translations** liée à l'entité principale.
- Chaque produit possède une relation `translations` dans Prisma.
- L'API filtre automatiquement la bonne traduction selon la locale de la requête.

---

## 6. Maintenance & SEO
- **Alternates** : Le layout génère automatiquement les balises `<link rel="alternate" hreflang="...">` pour indiquer à Google les versions traduites de chaque page.
- **Middleware** : Gère les redirections permanentes (301) pour éviter le contenu dupliqué.
