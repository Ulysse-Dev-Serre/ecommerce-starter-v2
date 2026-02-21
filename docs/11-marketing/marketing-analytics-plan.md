# Plan de Tracking & Analytics Marketing

Ce document explique comment le site capture les données de vente et les envoie aux outils marketing (Google, TikTok, Facebook, etc.).

## 🏗️ Architecture "Multiprise" (Centralisée)

Pour éviter de ralentir le site et simplifier la maintenance, tout le tracking passe par un seul point d'entrée.

### 1. Le Point de Branchement Unique
Le fichier **`src/lib/client/analytics.ts`** est le cerveau. La fonction `trackEvent` est appelée pour chaque action (vue produit, ajout panier, achat). 

Quand cette fonction est appelée, elle envoie l'info à deux endroits :
- **Audit Interne** : Ton propre serveur (pour tes logs).
- **Google Tag Manager (GTM)** : Via le `dataLayer` (pour ton marketing).

### 2. Comment ajouter un nouveau Pixel (ex: TikTok, Pinterest) ?
Tu as deux options, mais la première est recommandée :

- **Option A (Recommandée - Sans code)** : Va dans ton interface [Google Tag Manager](https://tagmanager.google.com). Ajoute une nouvelle balise TikTok. Comme le site envoie déjà tous les événements (`purchase`, `add_to_cart`), tu as juste à les "écouter" dans GTM.
- **Option B (Code personnalisé)** : Si tu dois coder un tracking spécifique, modifie simplement `src/lib/client/analytics.ts`. Ajoute ton appel API à l'intérieur de la fonction `trackEvent`. Cela se répercutera instantanément sur tout le site.

---

## 📊 Où voir tes données ?

### 📈 Google Analytics 4 (GA4)
C'est là que tu analyseras tes performances de vente et l'origine de tes clients.

- **Accès** : [analytics.google.com](https://analytics.google.com)
- **Menu Performances** : 
    - `Rapports > Monétisation > Achats e-commerce` : Pour voir ton chiffre d'affaires, tes produits stars et ton taux de conversion.
    - `Rapports > Acquisition > Acquisition de trafic` : Pour savoir d'où viennent tes acheteurs (Google Ads, Facebook, Recherche Naturelle).

### 🛠️ Mode Debug (Vérification)
Pour vérifier que tout fonctionne avant de lancer tes pubs :
- Utilise l'extension Chrome **Tag Assistant**.
- Les tags doivent apparaître en **Bleu** ou **Vert**.
- Dans GA4, consulte `Administration > DebugView` pour voir tes clics en temps réel.

---

## 📂 Fichiers Clés à Connaître
- `src/lib/client/analytics.ts` : Centralisation du tracking.
- `src/lib/client/gtm.ts` : Configuration technique de Google Tag Manager.
- `.env` : Contient ton `NEXT_PUBLIC_GTM_ID`.
- `next.config.ts` : Gère la sécurité (CSP) pour autoriser les scripts Google.
