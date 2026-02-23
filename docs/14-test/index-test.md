# Index des Tests - E-Commerce Starter V2

Ce projet utilise une approche de test hybride pour garantir la stabilité du catalogue, du tunnel d'achat et des intégrations tierces.

## 🛠 Stack de Test

1. **[Vitest](./vitest.md)** : Tests unitaires et d'intégration pour la couche service et les utilitaires.
2. **[Playwright](./playwright.md)** : Tests de bout en bout (E2E) couvrant les parcours critiques du client et de l'administrateur.

## 📋 Stratégie de Test

### 1. Tests Unitaires (Vitest)
Ciblent la logique métier isolée :
- Calculs de prix et taxes.
- Logique de panier.
- Validation des schémas Zod.
- Services de formatage.

### 2. Tests E2E (Playwright)
Ciblent les flux complets :
- **Flux Client** : Recherche -> Panier -> Checkout -> Stripe -> Confirmation.
- **Flux Admin** : Création de produit -> Gestion du stock -> Traitement de commande.
- **Flux i18n** : Vérification du bilinguisme sur les pages clés.

## 🚀 Commandes Rapides

- `npm run test:unit` : Lance Vitest.
- `npm run test:e2e` : Lance Playwright (nécessite une base de données de test).
- `npm run ci` : Lance la suite complète (Typecheck + Lint + Build).

## ⚠️ Notes sur l'Environnement de Test
Les tests E2E nécessitent des variables d'environnement spécifiques (Clerk Test Mode, Stripe Test API) configurées dans votre `.env`.
