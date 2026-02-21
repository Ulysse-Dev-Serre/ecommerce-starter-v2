# 📊 Plan de Tracking & Stratégie Analytics

Ce document détaille l'architecture de capture de données du Starter, conçue pour réconcilier performance publicitaire et souveraineté des données.

---

## 1. Architecture "Dual-Stream"

Contrairement à une installation classique, notre système envoie les données simultanément vers deux flux distincts via une seule fonction centralisée (`trackEvent`).

### Flux A : Marketing (Google Tag Manager)
- **Cible** : Plateformes publicitaires externes (Google Ads, Meta, TikTok).
- **Rôle** : Optimisation des campagnes et reciblage (retargeting).
- **Moteur** : `dataLayer` de GTM.

### Flux B : Opérationnel (Audit Interne)
- **Cible** : Votre base de données locale.
- **Rôle** : Analyse de performance brute, détection d'erreurs de tunnel d'achat et logs de sécurité.
- **Moteur** : API interne `/api/tracking/events`.

---

## 2. Centralisation du Code

Tous les événements du site convergent vers un point unique. Cela évite d'éparpiller des scripts de tracking dans vos composants UI.

**Emplacement Clé** : `src/lib/client/analytics.ts`

Lorsqu'un développeur appelle `trackEvent('purchase')`, le système se charge automatiquement de :
1. Récupérer les données **UTM** (source de la visite).
2. Récupérer l'**ID Anonyme** (pour l'analyse de parcours).
3. Envoyer l'information à GTM.
4. Archiver l'événement dans nos logs internes.

---

## 3. Analyse des Performances (GA4)

Le site est configuré pour alimenter nativement **Google Analytics 4**. Les rapports recommandés pour le pilotage du shop sont :

- **Rapport de Monétisation** : Pour suivre le Chiffre d'Affaires (CA), le panier moyen et les produits les plus performants.
- **Rapport d'Acquisition** : Pour Identifier quels canaux (SEO, Médias Sociaux, Email) génèrent le meilleur Retour sur Investissement (ROI).
- **Exploration du Chemin** : Pour identifier où les clients abandonnent leur panier.

---

## 4. Maintenance Technique

| Composant | Rôle | Fichier / Lieu |
| :--- | :--- | :--- |
| **GTM ID** | Identifiant du conteneur | `.env` (`NEXT_PUBLIC_GTM_ID`) |
| **Sécurité scripts** | Autorisation des domaines | `next.config.ts` (CSP Headers) |
| **Consentement** | Blocage/Autorisation cookies | `components/analytics/cookie-consent.tsx` |
| **Dictionnaire** | Liste des événements | `lib/config/analytics-events.ts` |

---

## 5. Mode Debug et Validation

Pour tester la chaîne de tracking :
1. Activez le mode **Preview** dans GTM.
2. Ouvrez la **DebugView** dans l'administration de Google Analytics 4.
3. Effectuez un parcours complet (Home > Produit > Panier > Achat).
4. Vérifiez que chaque étape apparaît en temps réel dans les consoles de débogage.
