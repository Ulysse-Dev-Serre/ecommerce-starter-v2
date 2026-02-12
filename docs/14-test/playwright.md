# Tests End-to-End (E2E) - Playwright

Cette section documente la suite de tests E2E qui valide les parcours critiques de l'application (Storefront et Admin).

## 🚀 Exécuter les tests (Procédure Recommandée)

Pour éviter les conflits de base de données (ex: plusieurs tests modifiant le même produit en même temps), il est **fortement recommandé** de lancer les tests de manière séquentielle.

### ✅ Commande de Validation Complète (Stable)
Cette commande exécute tous les tests un par un, dans l'ordre optimal, pour garantir un résultat fiable à 100%. L'option `--workers=1` est impérative pour éviter les conflits de données.

```bash
npx playwright test src/tests/e2e/auth.setup.ts src/tests/e2e/admin/dashboard.spec.ts src/tests/e2e/admin/products.spec.ts src/tests/e2e/admin/product-edit.spec.ts src/tests/e2e/storefront/cart.spec.ts src/tests/e2e/storefront/checkout.spec.ts src/tests/e2e/admin/orders.spec.ts src/tests/e2e/admin/order-lifecycle.spec.ts --workers=1 --project=chromium
```

### 🏎️ Exécution Rapide (Peut échouer)
Si vous lancez `npx playwright test` sans option, Playwright utilisera plusieurs "workers" en parallèle. Cela peut causer des erreurs (faux négatifs) si deux tests essaient de modifier la même commande ou le même produit en même temps.

---

### Exécution par étape (Manuel)
Si vous souhaitez valider étape par étape :

1. **Initialiser l'Admin (Auth)**
   ```bash
   npx playwright test auth.setup.ts
   ```

2. **Tester le Storefront (Client)**
   ```bash
   npx playwright test src/tests/e2e/storefront/
   ```

3. **Tester l'Admin (Gestion)**
   ```bash
   npx playwright test src/tests/e2e/admin/dashboard.spec.ts src/tests/e2e/admin/products.spec.ts src/tests/e2e/admin/orders.spec.ts
   ```

4. **Valider les Cycles Complexes (Remboursement)**
   ```bash
   npx playwright test src/tests/e2e/admin/order-lifecycle.spec.ts
   ```

---

## 📂 Architecture des Tests

Les tests sont situés dans `src/tests/e2e/` et organisés par domaine :

### 🛍️ Storefront (`src/tests/e2e/storefront/`)
Ces tests simulent le parcours d'un client lambda (Guest ou Connecté).

| Fichier | Scénarios couverts |
| :--- | :--- |
| **`product-discovery.spec.ts`** | Navigation catalogue, Filtres, Vue détail produit. |
| **`cart.spec.ts`** | Ajout au panier, Modification quantité, Suppression. |
| **`checkout.spec.ts`** | Parcours d'achat complet (Guest + Stripe Test Card), Validation formulaire. |

### 🛠️ Admin (`src/tests/e2e/admin/`)
Ces tests nécessitent une authentification Admin (gérée via `auth.setup.ts`).

| Fichier | Scénarios couverts |
| :--- | :--- |
| **`dashboard.spec.ts`** | Accès au dashboard, KPIs de base. |
| **`products.spec.ts`** | Liste des produits, Création, Modification, Statut (Draft/Active). |
| **`orders.spec.ts`** | Liste commandes, Vue détail, **Génération d'étiquette d'expédition**. |
| **`order-lifecycle.spec.ts`** | **Cycle complet Remboursement** : <br>1. Client : Annulation (si Paid)<br>2. Admin : Marquer Expédié -> Livré<br>3. Client : Demande remboursement (si Livré)<br>4. Admin : Confirmation remboursement. |

---

## 🔄 Flux Critique : Cycle de Vie & Remboursement

Le fichier `order-lifecycle.spec.ts` est particulièrement important car il valide la logique métier complexe des statuts de commande.

**Étapes validées automatiquement :**
1. **PAID** : Le client voit le bouton "Cancel delivery".
2. **SHIPPED** : L'admin marque la commande expédiée. Le client voit un warning "Wait for delivery".
3. **DELIVERED** : L'admin marque (via API) la commande livrée.
4. **REFUND REQUEST** : Le client demande un remboursement.
5. **REFUNDED** : L'admin valide la demande, le statut passe à "Refunded".

---

## ⚙️ Configuration & Prérequis

- **Authentification** : Le fichier `auth.setup.ts` connecte automatiquement un utilisateur Admin avant de lancer les tests du dossier `admin/`. L'état d'authentification est sauvegardé dans `.auth/admin.json`.
- **Base de données** : Les tests utilisent la base de données de développement locale. Assurez-vous que votre serveur local tourne (`npm run dev`) ou que la DB est accessible.
- **Stripe** : Les tests de paiement utilisent la carte de test Stripe standard (`4242...`).

## 🛠 Bonnes Pratiques pour la Stabilité

Pour garantir des tests E2E qui passent à 100% même dans des environnements lents :

1.  **Sélecteurs Précis (Contre les Faux Positifs)** :
    - Évitez `page.locator('text=Status')` qui peut matcher un bouton ou un label.
    - Privilégiez les classes CSS spécifiques : `page.locator('.vibe-badge').filter({ hasText: /Paid/i })`.

2.  **Synchronisation Post-Action** :
    - Après un clic sur un bouton d'action (ex: "Mark as Shipped"), attendez que le bouton disparaisse (`toBeHidden`) avant de vérifier le changement de statut. Cela garantit que le serveur a fini de traiter la demande et de rafraîchir l'UI.

3.  **Timeouts Généreux** :
    - La configuration globale est fixée à **300s** (5 min) pour le test et **60s** pour les `expect`. Cela laisse le temps aux APIs externes (Stripe, Shippo) de répondre.

4.  **Gestion de la Pollution des Données** :
    - Dans les listes (ex: Admin Orders), ne prenez pas la première ligne par défaut. Recherchez dynamiquement une ligne correspondant à l'état attendu (`filter({ hasText: 'Paid' })`).

## 🛠 Troubleshooting

**"Error: Checkout form not visible"**
- Vérifiez que vous n'avez pas de bloqueur de scripts ou que la clé publique Stripe est bien configurée dans `.env.local`.

**Tests Admin échouent sur le login**
- Supprimez le dossier `.auth/` et relancez les tests pour forcer une nouvelle authentification :
  ```bash
  rm -rf src/tests/e2e/playwright/.auth/ && npx playwright test src/tests/e2e/auth.setup.ts
  ```

**Erreurs de type "Invalid status transition"**
- Souvent dû à un test précédent qui n'a pas fini de mettre à jour la DB. Assurez-vous de toujours utiliser `--workers=1`.
- Si le problème persiste, tuez les processus orphelins : `pkill -f playwright`.
