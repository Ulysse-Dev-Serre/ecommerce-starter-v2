# Documentation Playwright E2E

Cette documentation décrit la stratégie de test et les scénarios automatisés pour garantir la stabilité de la plateforme e-commerce.

## 🚀 Méthodologies de Test

L'architecture de test est divisée en deux approches complémentaires pour maximiser la couverture tout en minimisant la fragilité.

### 1. Méthode UI-First (Tests 1 à 3)
Cible le parcours utilisateur direct via le navigateur.
- **Approche** : Utilisation intensive du **Page Object Model (POM)**.
- **Validation** : Vérifie que les éléments visuels sont présents, cliquables et que les flux de navigation de base fonctionnent.

### 2. Méthode Hybride API-Smoke & Integration (Tests 4 à 6)
Cible les processus métier critiques et les intégrations tierces (Stripe, Shippo, Resend).
- **API Smoke (Source de Vérité)** : Appels directs aux endpoints backend avec **vérification profonde en base de données (Prisma)**.
- **Isolation des Données** : Chaque test utilise ses propres produits (Slugs uniques) pour éviter les erreurs de nettoyage concurrent ou les conflits de webhooks.
- **Standard de Réponse** : Les erreurs métier (ex: annuler une commande livrée) doivent retourner un code **400 Bad Request** propre et non un crash 500.

---

## 📊 Matrice de Couverture (Hybride)

Pour les étapes critiques, nous maintenons deux versions du même test pour une robustesse maximale :

| Étape | Version API / Backend (Smoke) | Version UI (Storefront/Admin) |
| :--- | :--- | :--- |
| **4 (Checkout)** | `api-checkout-full.spec.ts` | `checkout.spec.ts` |
| **5 (Status)** | `api-order-status.spec.ts` | `order-lifecycle.spec.ts` |
| **6 (Refund)** | `api-refund.spec.ts` | `cancel-order.spec.ts` |

---

## 🏗️ Structure des Tests

### Test 1 : Santé & Accès Dashboard Admin
- **Fichier** : `src/tests/e2e/admin/dashboard.spec.ts`
- **Objectifs** : Vérifie le Status 200, la présence du texte "Admin Panel" et la redirection de sécurité si non authentifié.
- **Commande** : `npx playwright test src/tests/e2e/admin/dashboard.spec.ts --project=chromium`

### Test 2 : Cycle de Vie Produit (Logistique & CRUD)
- **Fichier** : `src/tests/e2e/admin/product-crud.spec.ts`
- **Objectifs** : Création d'un Supplier, création d'un produit DRAFT, passage en ACTIVE avec prix/stock et visibilité storefront.
- **Commande** : `npx playwright test src/tests/e2e/admin/product-crud.spec.ts --project=chromium`

### Test 3 : Flux Panier & Authenticité
- **Fichier** : `src/tests/e2e/storefront/cart.spec.ts`
- **Objectifs** : Injection de produit via seed validé par Zod, ajout au panier et accès à la page Checkout.
- **Commande** : `npx playwright test src/tests/e2e/storefront/cart.spec.ts --project=chromium`

### Test 4 : Parcours Checkout (Backend - 100% Intégration)
- **Fichier** : `src/tests/e2e/smoke/api-checkout-full.spec.ts`
- **Objectifs** : Validation profonde du moteur (Stripe Réel, Webhook ngrok, Création DB, Emails Resend).
- **Commande** : `npx playwright test src/tests/e2e/smoke/api-checkout-full.spec.ts --project=chromium --workers=1`

### Test 4.1 : Parcours Checkout (UI - Storefront)
- **Fichier** : `src/tests/e2e/storefront/checkout.spec.ts`
- **Objectifs** : Valide l'expérience utilisateur complète (remplissage formulaires, sélection tarifs Shippo via UI, iframe Stripe).
- **Commande** : `npx playwright test src/tests/e2e/storefront/checkout.spec.ts --project=chromium`
- **Note** : ⚠️ *Peut présenter des instabilités UI (Stripe Radar).*

### Test 5 : Cycle de Vie & Transitions (Backend - Smoke)
- **Fichier** : `src/tests/e2e/smoke/api-order-status.spec.ts`
- **Objectifs** : Vérifie l'intégrité technique des transitions d'états et de l'historique Prisma sans passer par l'UI.
- **Commande** : `npx playwright test src/tests/e2e/smoke/api-order-status.spec.ts --project=chromium`

### Test 5.1 : Cycle de Vie & Transitions (UI - Admin)
- **Fichier** : `src/tests/e2e/admin/order-lifecycle.spec.ts`
- **Objectifs** : Valide la visibilité des badges et des boutons d'actions (Expédier, Livrer) dans le panel Admin.
- **Commande** : `npx playwright test src/tests/e2e/admin/order-lifecycle.spec.ts --project=chromium`
- **Note** : ⚠️ *Peut générer des erreurs Clerk ("infinite redirect loop") et des ECONNRESET lors du rafraîchissement de session.*

### Test 6 : Retours & Sécurité Métier (Backend - Smoke)
- **Fichier** : `src/tests/e2e/smoke/api-refund.spec.ts`
- **Objectifs** : Teste les règles de sécurité (bloquer annulation si expédié) et le processus de remboursement via API.
- **Commande** : `npx playwright test src/tests/e2e/smoke/api-refund.spec.ts --project=chromium`

### Test 6.1 : Retours & Sécurité Métier (UI - Client/Admin)
- **Fichier** : `src/tests/e2e/storefront/cancel-order.spec.ts`
- **Objectifs** : Valide le formulaire de demande de remboursement côté client et la confirmation visuelle côté admin.
- **Commande** : `npx playwright test src/tests/e2e/storefront/cancel-order.spec.ts --project=chromium`
- **Note** : ⚠️ *Instabilités UI connues - Préférer la version Backend.*

---

## 🛠️ Guide d'Exécution Rapide

### Exécution du Backend (Suite Smoke)
C'est la commande la plus importante pour valider la robustesse technique :
```bash
# Nécessite ngrok actif pour le Test 4
npx playwright test src/tests/e2e/smoke/ --project=chromium --workers=1
```

### Exécution Individuelle (Exemple)
```bash
npx playwright test src/tests/e2e/smoke/api-order-status.spec.ts --project=chromium
```

### Règles d'Or pour les Nouveaux Tests
1. **Source de Vérité** : Toujours vérifier l'état final en base de données avec `prisma.order.findUnique`.
2. **Nettoyage Automatisé** : Utiliser `afterAll` avec un délai (`setTimeout`) de 3-5s pour laisser le temps aux webhooks Stripe de finir avant d'effacer les données.
3. **Codes ERE** : Attendre des codes `400` pour les erreurs de logique métier et `401/403` pour la sécurité. Ne jamais tolérer de `500`.

---

## 📊 Rapports & Logs
- **Rapports** : `npx playwright show-report`
- **Logs Resend** : Surveillez la console du serveur pour les messages `Email sent successfully`.
- **Logs Stripe** : Regardez le terminal ngrok pour voir les requêtes POST vers `/api/webhooks/stripe`.
