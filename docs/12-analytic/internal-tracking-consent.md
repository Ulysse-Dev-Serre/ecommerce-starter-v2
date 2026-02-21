# 📊 Analytique Interne & Conformité

Ce document explique la gestion du consentement et la structure technique de notre système de tracking propriétaire.

---

## 1. Flux des Données

Nous opérons deux niveaux de tracking distincts pour équilibrer le respect de la vie privée et les besoins opérationnels :

### Niveau 1 : Analytique Opérationnelle (Interne)
- **État** : Activé par défaut.
- **But** : Mesurer la santé technique du site (pages d'erreur, succès des commandes) et la performance brute des ventes.
- **Impact** : Les données restent exclusivement sur votre serveur (Base de données Prisma).
- **Fichiers** : `src/components/analytics/analytics-tracker.tsx`.

### Niveau 2 : Analytique Marketing (Externe / Pixels)
- **État** : Soumis au consentement.
- **But** : Publicité ciblée (Meta, Google Ads, TikTok).
- **Mécanisme** : Google Tag Manager avec **Consent Mode**.
- **Fichiers** : `src/components/analytics/cookie-consent.tsx`.

---

## 2. Gestion du Consentement (Loi 25 / RGPD)

Le site utilise `vanilla-cookieconsent` pour recueillir l'accord de l'utilisateur.

### Fonctionnement actuel : "Mode Lancement"
Par défaut, le site est configuré en mode **`granted`** (Autorisé). Cela permet de récolter 100% des données lors de ta phase de lancement sans attendre l'interaction de l'utilisateur avec la bannière.

### 🔒 Comment repasser en "Mode Strict" ?
Lorsque ton volume de trafic augmentera, tu pourras activer le filtrage strict :
1. Ouvre : `src/components/analytics/google-tag-manager.tsx`.
2. Change les valeurs de **`'granted'`** vers **`'denied'`** dans le bloc `gtag('consent', 'default', ...)`.
3. Désormais, les pixels (Meta, TikTok) attendront le signal du composant `cookie-consent.tsx` pour s'activer.

---

## 3. Lexique Technique

- **Anonymous ID** : Identifiant unique généré par `analytics.ts` (`analytics_anon_id`) permettant de regrouper les actions d'un même utilisateur sans connaître son identité.
- **UTM Data** : Paramètres capturés dans l'URL (`?utm_source=...`) pour identifier l'origine du trafic. Ils sont persistés durant la session pour être liés à la commande finale.

---

## 4. Maintenance Évolutive

Si vous souhaitez soumettre le **Niveau 1 (Interne)** au consentement dans le futur :
- Modifiez `AnalyticsTracker.tsx`.
- Ajoutez une condition vérifiant le cookie de consentement avant d'appeler `trackEvent`.

```typescript
// Exemple de condition future :
if (CookieConsent.getCookie().categories.includes('analytics')) {
  trackEvent('page_view');
}
```
