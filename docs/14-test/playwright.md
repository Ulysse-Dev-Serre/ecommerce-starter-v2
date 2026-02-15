# Documentation des Tests Playwright E2E

## 🚀 Créer un Test E2E (Checklist Rapide)

Suivez ces 4 étapes pour chaque nouveau test. Pas d'exception.

### 1. Préparer le Terrain (Config)
- [ ] Ouvrez `src/tests/e2e/config/routes.ts`.
- [ ] Ajoutez ou vérifiez l'URL de la page visée (ex: `TEST_ROUTES.ADMIN.LOGISTICS`).
  > *Centralisez les chemins ici pour faciliter la maintenance future.*

### 2. Créer l'Outil (Page Object Model)
Dans `src/tests/e2e/pom/`, créez une classe (ex: `LogisticsPage.ts`) :
- [ ] **Constructeur** : Déclarez tous vos sélecteurs (`this.btn = page.locator(...)`).
  > *Utilisez des IDs uniques ou `getByRole` pour éviter que les tests cassent au moindre changement CSS.*
- [ ] **Actions** : Une méthode par action utilisateur (ex: `createLocation()`).
  > *Enveloppez le corps de la méthode dans `await test.step('Nom Action', ...)` pour un rapport d'exécution clair.*
- [ ] **Visuel** : Ajoutez toujours une méthode `expectLoaded()`.
  > *Intégrez `await expect(page).toHaveScreenshot()` pour détecter les régressions visuelles involontaires.*

### 3. Écrire le Scénario (Spec)
Dans `src/tests/e2e/`, créez votre fichier `spec.ts` :
- [ ] Importez votre Page Object.
- [ ] Scénario simple : 
  ```typescript
  test('Mon Test', async ({ page }) => {
    const po = new LogisticsPage(page);
    await po.goto();
    await po.createLocation();
    await po.expectSuccess();
  });
  ```
- [ ] **Contrat API** : Ajoutez une vérification de données.
  > *Importez `prisma` pour comparer la valeur affichée dans l'UI (via POM) avec la valeur réelle en base de données.*

### 4. Lancer et Valider
- [ ] Commande unique : `npx playwright test --project=chromium --update-snapshots`
- [ ] **Critères de succès** :
    - ✅ Test Vert.
    - ✅ Snapshots générés/mis à jour.
    - ✅ Données vérifiées par contrat.

---

---

Cette documentation détaille la structure atomique de notre suite de tests End-to-End. Chaque test est indépendant et conçu pour valider une partie spécifique du workflow e-commerce.

---

## 🏗️ Structure des Tests

### Test 1 : Santé & Accès Dashboard Admin (Quick Check)
- **Fichier** : `src/tests/e2e/admin/dashboard.spec.ts`
- **POM Associé** : `src/tests/e2e/pom/admin/DashboardPage.ts`
- **Objectifs Validés** :
  - **Status 200** : Vérifie que le dashboard admin renvoie un code succès OK.
  - **Presence** : Vérifie la visibilité du texte "Admin Panel" dans l'interface.
  - **Auth** : Confirme que la session Clerk est active pour l'admin.
  - **Sécurité** : Vérifie que les accès anonymes sont bloqués et redirigés vers le login.
- **Exécution** : `fuser -k 3000/tcp || true && pkill -f playwright || true && npx playwright test src/tests/e2e/admin/dashboard.spec.ts --project=chromium --workers=1`

### Test 2 : Cycle de Vie Produit (Logistique & CRUD)
- **Fichier** : `src/tests/e2e/admin/product-crud.spec.ts`
- **POM Associés** : `src/tests/e2e/pom/admin/LogisticsPage.ts`, `src/tests/e2e/pom/admin/ProductPage.ts`
- **Objectifs Validés** :
  - **Logistique** : Création d'un point d'expédition (Supplier) fonctionnel.
  - **CRUD Produit** : Création d'un produit DRAFT avec données logistiques.
  - **Edition produit** : Ajout de variante (Prix/Stock) et passage au statut ACTIVE.
  - **Storefront** : Vérification que le produit est accessible en ligne (Status 200).
- **Exécution** : `fuser -k 3000/tcp || true && pkill -f playwright || true && npx playwright test src/tests/e2e/admin/product-crud.spec.ts --project=chromium --workers=1`

### Test 3 : Flux Panier & Authenticité (Produit -> Panier -> Checkout)
- **Fichier** : `src/tests/e2e/storefront/cart.spec.ts`
- **POM Associé** : `src/tests/e2e/pom/storefront/CartPage.ts`
- **Objectifs Validés** :
  - **Authenticité Zod** : Le produit est injecté via un seed validé par Zod 
  - **Flux Panier** : Ajout au panier et navigation vers la page de Checkout (Status 200).
- **Exécution** : `fuser -k 3000/tcp || true && pkill -f playwright || true && npx playwright test src/tests/e2e/storefront/cart.spec.ts --project=chromium --workers=1`

### Test 4 : Parcours Checkout Complet (Shippo & Stripe Radar)
- **Fichier** : `src/tests/e2e/storefront/checkout.spec.ts`
- **POM Associé** : `src/tests/e2e/pom/storefront/CheckoutPage.ts`
- **Objectifs Validés** :
  - **Logistique** : Saisie d'adresse et récupération des tarifs Shippo réels.
  - **Sécurité** : Validation des cartes de test Stripe (Success 4242, Fraude 0531, Review 0701).
  - **Succès** : Confirmation de commande et redirection finale.
- **Exécution** : `fuser -k 3000/tcp || true && pkill -f playwright || true && npx playwright test src/tests/e2e/storefront/checkout.spec.ts --project=chromium --workers=1`

### Test 5 : Validation Statuts & Emails (High Fidelity)
- **Fichier** : `src/tests/e2e/admin/order-status-verification.spec.ts`
- **POM Associé** : `src/tests/e2e/pom/admin/OrderPage.ts`
- **Objectifs Cibles** :
  - **Workflow** : Transition UI (Paid -> Shipped -> Delivered).
  - **Visuel** : Badges de statut corrects (Snapshot).
  - **Email Contract** : Appel API Resend pour prouver l'envoi réel.
- **Exécution** : `fuser -k 3000/tcp || true && pkill -f playwright || true && npx playwright test src/tests/e2e/admin/order-status-verification.spec.ts --project=chromium --workers=1`

### Test 6 : Gestion des Retours & Annulations
- **Fichier** : `src/tests/e2e/storefront/order-returns.spec.ts`
- **POM Associé** : `src/tests/e2e/pom/storefront/AccountPage.ts`
- **Objectifs Cibles** :
  -  **Client** : Flux d'annulation et demande remboursement.
  -  **Admin** : Réception de la demande.
  -  **Notification** : Vérification email confirmation.
- **Exécution** : `fuser -k 3000/tcp || true && pkill -f playwright || true && npx playwright test src/tests/e2e/storefront/order-returns.spec.ts --project=chromium --workers=1`

---

## 🛠 Guide d'Exécution Global

Pour lancer l'intégralité de la suite de manière séquentielle (recommandé pour la stabilité) et générer les rapports :

```bash
# 1. Lancer tous les tests avec le projet configuré (Auth auto)
npx playwright test --project=chromium --workers=1

# 2. En cas d'échec visuel (Snapshot)
npx playwright test --update-snapshots

# 3. Visualiser le rapport détaillé
npx playwright show-report
```

## 🧠 Bonnes Pratiques Avancées (Points de Vigilance)

### 1. Gestion de l'État et Parallélisme
- **Risque** : Conflits de données si plusieurs tests manipulent la même ressource (ex: produits) en parallèle.
- **Solution** : Utilisez des identifiants uniques dans vos tests (ex: `const email = \`test-user-${Date.now()}@example.com\``) pour garantir l'isolation totale.

### 2. Visual Regression (Tolérance)
- **Risque** : Les polices ou le rendu peuvent varier légèrement entre TA machine (Ubuntu) et la CI (GitHub Actions), causant des faux positifs.
- **Solution** : Configurez un seuil de tolérance dans `playwright.config.ts` ou dans l'appel :
  ```typescript
  await expect(page).toHaveScreenshot({ maxDiffPixels: 100 });
  ```

### 3. Optimisation des APIs Tiers (Shippo/Stripe)
- **Risque** : Les appels réels sont lents, coûteux et fragiles (réseau).
- **Solution** : Utilisez **MSW (Mock Service Worker)** pour les tests fréquents (ex: Test 3 Panier). Gardez les appels réels uniquement pour les tests "High Fidelity" (ex: Test 5 Order Status).

## 🚑 Troubleshooting & Synchronisation

### 1. Synchronisation de la Base de Données
- **Risque** : Le serveur Next.js et Playwright pointent vers des bases différentes (ex: `.env` vs `.env.local`).
- **Solution** : 
  - Utilisez toujours `path.resolve(__dirname, '.env')` dans `playwright.config.ts`.
  - Lancez les tests via le script synchronisé : `npm run test:e2e` (qui utilise `dotenv-cli`).
  - Vérifiez les logs : `NEXT.JS DB URL` et `PLAYWRIGHT DB URL` doivent être identiques.

### 2. Stratégie "UI-First" pour Prisma
- **Risque** : Prisma peut être "aveugle" aux données si le test s'exécute dans un contexte différent du serveur.
- **Principe** : Si Playwright valide une redirection (ex: `waitForURL(/\/products\/[ID]/)`), c'est la preuve ultime que le serveur a créé l'objet. Ne laissez pas un échec de lecture Prisma bloquer un test dont le flux UI est parfait. Utilisez l'ID extrait de l'URL pour vos requêtes Prisma.

### 3. Debugging Avancé (Trace Viewer)
- **Outil** : Utilisez le **Trace Viewer** de Playwright pour inspecter chaque action, capture d'écran, et requête réseau après un échec.
- **Commande** : `npx playwright show-trace path/to/trace.zip`
- **Utilisation** : Survolez la timeline pour voir l'état exact du DOM à n'importe quel milliseconde du test.
