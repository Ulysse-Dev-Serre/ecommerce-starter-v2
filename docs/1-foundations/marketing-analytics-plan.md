# 📊 Stratégie Analytics, Marketing & Consentement

Ce document définit l'architecture technique pour le suivi des performances e-commerce (Analytics), l'intégration des publicités (Pixels) et la gestion légale des cookies (Consentement).

---

## 1. Philosophie : "Ne pas réinventer la roue"

### ❌ Ce que nous ne ferons PAS (Dashboard Custom)
Nous ne développerons **pas** de tableau de bord d'analyse de trafic (Sources, Medium, Campagnes) directement dans l'admin du site pour le MVP.
*   **Raison** : Complexité extrême d'attribution, coûts de stockage de données, redondance avec les outils gratuits existants.
*   **Solution** : Nous utiliserons **Google Analytics 4 (GA4)** comme source de vérité pour l'analyse.

### ✅ Ce que nous ferons (L'infrastructure de données)
Nous allons construire un "pipeline" de données robuste. Le site e-commerce doit être capable d'envoyer des signaux clairs (**Events**) à des outils tiers.

---

## 2. Architecture Technique : Google Tag Manager (GTM)

Au lieu d'installer manuellement le Pixel Facebook, puis le Tag Google Ads, puis le Pixel TikTok dans le code (ce qui alourdit le site et demande des redéploiements à chaque changement), nous utiliserons **Google Tag Manager**.

### Le Flux de Données
1.  **Next.js (App)** : Détecte une action utilisateur (ex: Ajout au panier).
2.  **Data Layer** : L'application pousse un objet JSON standardisé dans la fenêtre du navigateur.
3.  **GTM (Chef d'orchestre)** : Lit cet objet JSON.
4.  **Tags (Pixels)** : GTM distribue l'info à Facebook, Google, TikTok, Pinterest, etc.

### Pourquoi cette approche ?
*   **Flexibilité** : Vous pouvez ajouter un nouveau pixel publicitaire (ex: Snapchat) sans toucher au code du site.
*   **Performance** : GTM gère le chargement asynchrone des scripts.
*   **Standardisation** : Nous n'écrivons le code de tracking "Achat" qu'une seule fois.

---

## 3. Les Événements E-commerce (Tracking Plan)

Nous allons implémenter les événements standards recommandés par Google (GA4 Ecommerce Schema).

| Action Utilisateur | Événement GTM | Données transmises (Payload) |
| :--- | :--- | :--- |
| Voir un produit | `view_item` | Nom, ID, Prix, Catégorie, Devise |
| Ajouter au panier | `add_to_cart` | Nom, ID, Prix, Quantité |
| Voir le panier | `view_cart` | Liste des produits, Total |
| Commencer le paiement | `begin_checkout` | Liste des produits, Total |
| Ajouter infos livraison | `add_shipping_info` | Méthode de livraison choisie |
| Ajouter infos paiement | `add_payment_info` | Méthode de paiement |
| **Achat confirmé** | `purchase` | **ID Transaction, Total, Taxes, Frais de port, Produits** |

> **Note Importante sur `purchase`** : C'est l'événement le plus critique. Il doit être déclenché uniquement sur la page de confirmation ("Thank You Page") et idéalement dédupliqué.

---

## 4. Gestion du Consentement (Légal & Technique)

Pour respecter la **Loi 25 (Québec)** et le **RGPD (Europe)**, ainsi que les exigences de **Google Consent Mode v2**.

### Composants
1.  **UI (Interface)** : Une bannière discrète (Pop-up) en bas de page.
    *   *Moteur* : `vanilla-cookieconsent` (léger, accessible, gratuit).
    *   *Design* : Intégré au thème du site (pas de plugin tiers moche).
2.  **Logique (Google Consent Mode)** :
    *   Par défaut : Tracking bloqué (`denied`).
    *   Si consentement : Mise à jour de l'état GTM (`granted`).
    *   GTM déclenche alors les balises.

### Comportement par Région (Configuration Avancée)
*   **Québec / Europe** : Bannière visible. Blocage strict par défaut. (Opt-in)
*   **Reste du monde (USA)** : Bannière visible ou discrète "Info". Tracking actif par défaut avec possibilité de retrait. (Opt-out)
*   *Note pour le MVP* : Pour simplifier, nous appliquerons le standard strict (Opt-in) partout ou une version hybride simplifiée pour éviter la complexité de géolocalisation IP au démarrage.

---

## 5. Feuille de route d'implémentation (Issue #26)

1.  **Setup GTM** :
    *   Créer un compte GTM.
    *   Créer un composant `<GoogleTagManager />` dans Next.js (`layout.tsx`).
2.  **Composant Consentement** :
    *   Intégrer `vanilla-cookieconsent`.
    *   Configurer le script de configuration (`cookiecontrol.js`).
    *   Styliser en CSS pour matcher le site.
3.  **Data Layer** :
    *   Créer un utilitaire `sendGTMEvent(name, params)`.
    *   Instrumenter les pages clés :
        *   `ProductPage` -> `view_item`
        *   `Cart` -> `view_cart`
        *   `CheckoutForm` -> `begin_checkout`
        *   `OrderConfirmation` -> `purchase`
4.  **Validation** :
    *   Utiliser "Google Tag Assistant" pour vérifier que les événements partent bien.

---

## 6. Ce que le USER doit faire (Hors Code)

Pendant que je code l'intégration, vous pourrez :
1.  Créer un compte **Google Analytics 4**.
2.  Créer un conteneur **Google Tag Manager**.
3.  Me fournir l'ID du conteneur GTM (format `GTM-XXXXXXX`).
