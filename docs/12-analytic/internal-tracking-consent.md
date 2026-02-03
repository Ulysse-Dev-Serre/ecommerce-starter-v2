# 📊 Architecture de l'Analytique Interne & Consentement

Ce document sert de guide technique pour comprendre comment le tracking a été implémenté et comment le rendre conforme aux lois sur les cookies (RGPD/Loi 25) dans le futur.

## 1. Carte Technique (Où sont les fichiers ?)

Pour comprendre ou modifier le tracking, voici les fichiers clés :

- **Le Cerveau (`src/lib/client/analytics.ts`)** : Contient les fonctions `trackEvent` (pour envoyer une donnée) et `captureAndSaveUTM` (pour lire l'URL).
- **Le Capteur Global (`src/components/analytics/analytics-tracker.tsx`)** : Un composant invisible dans le layout qui s'exécute à chaque changement de page.
- **Le Réceptionniste (`src/app/api/tracking/events/route.ts`)** : L'API qui reçoit les données du navigateur et les enregistre.
- **Le Stockage (`prisma/schema.prisma`)** : Modèle `AnalyticsEvent` qui définit ce qu'on enregistre (path, source, etc.).
- **L'Interface de Consentement (`src/components/analytics/cookie-consent.tsx`)** : La bannière que voit l'utilisateur.

## 2. État Actuel : "Mode Lancement" (Direct)

Actuellement, le fichier `analytics-tracker.tsx` appelle les fonctions de tracking **dès le chargement**, sans vérifier la bannière de cookies.

### Pourquoi ce choix ?
- **Données de démarrage** : Ne pas perdre une seule miette d'information sur tes 100 premiers visiteurs.
- **Données Propriétaires** : Contrairement à Google Analytics, ces données restent dans TA base de données, ce qui est moins "invasif" aux yeux de la loi mais nécessite quand même un consentement à terme.

## 3. Mode "Conformité Totale" (À activer plus tard)

Quand tu seras prêt à filtrer le tracking par consentement, voici les étapes exactes :

### Étape A : Modifier `analytics-tracker.tsx`
Il faut entourer les appels par une vérification du plugin `vanilla-cookieconsent`.

```typescript
// Localisation : src/components/analytics/analytics-tracker.tsx

import * as CookieConsent from 'vanilla-cookieconsent';

export function AnalyticsTracker() {
  // ...
  useEffect(() => {
    // 1. Vérifier si l'utilisateur a accepté la catégorie 'analytics'
    const consent = CookieConsent.getCookie();
    const hasConsent = consent?.categories?.includes('analytics');

    if (hasConsent) {
      captureAndSaveUTM();
      trackEvent('page_view', { path: pathname });
    }
  }, [pathname, searchParams]);
  // ...
}
```

### Étape B : Lier l'ID Anonyme
Le fichier `analytics.ts` crée un cookie `analytics_anon_id`. En mode conformité, ce cookie ne doit être créé que **après** le clic sur "Accepter".

## 4. Lexique des Données
- **Anonymous ID** : Un code unique stocké dans le navigateur pour savoir si la personne qui revient aujourd'hui est la même que celle d'hier.
- **UTM** : Les étiquettes (source, medium, campaign) que tu ajoutes à tes liens (ex: `?utm_source=tiktok`).

---
**Note mémorielle** : Si tu lis ceci après 6 mois, n'aie pas peur de casser le tracker. Tout est centralisé dans `src/lib/client/analytics.ts`.
