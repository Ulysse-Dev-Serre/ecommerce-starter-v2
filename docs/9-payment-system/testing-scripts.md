# 🧪 Scripts de Test Stripe

## 📋 Options de test

Vous avez **2 options** pour tester l'intégration Stripe :

### Option 1 : Script Node.js (Recommandé pour débuter)

```bash
npm run test:stripe
```

**Avantages :**
- Rapide et simple
- Affiche les URLs Stripe directement
- Pas besoin de Jest
- Montre les étapes à suivre

**Script :** [tests/scripts/test-stripe-checkout.js](file:///d:/MonEntreprise/ecommerce-starter-v2/tests/scripts/test-stripe-checkout.js)

---

### Option 2 : Tests Jest d'intégration

```bash
npm test -- tests/integration/api/stripe-checkout.test.js
```

**Avantages :**
- Intégration avec votre suite de tests
- Assertions automatiques
- Peut être intégré dans CI/CD

**Test :** [tests/integration/api/stripe-checkout.test.js](file:///d:/MonEntreprise/ecommerce-starter-v2/tests/integration/api/stripe-checkout.test.js)

---

## 🚀 Utilisation du script Node.js

### Étape 1 : Préparer le panier

**Utilisez vos scripts existants** pour ajouter un produit au panier.

Le script Stripe suppose que vous avez déjà un panier avec des produits.

Si votre panier est vide, utilisez vos outils existants pour ajouter un produit avant de tester Stripe.

### Étape 2 : Lancer le test

```bash
npm run test:stripe
```

**Résultat attendu :**
```
🚀 Test Stripe Checkout Integration
════════════════════════════════════════════════════════════
🏥 Vérification de l'état du serveur...
✅ Serveur OK

🧪 Test 1: Créer une session Stripe Checkout
────────────────────────────────────────────────────────────
📦 Étape 1: Vérifier le panier...
   Panier trouvé avec 1 items

💳 Étape 2: Créer la session Stripe...
✅ Session créée avec succès!
   Session ID: cs_test_xxxxx
   URL Stripe: https://checkout.stripe.com/c/pay/cs_test_xxxxx

📋 Prochaines étapes:
   1. Ouvrir: https://checkout.stripe.com/c/pay/cs_test_xxxxx
   2. Payer avec: 4242 4242 4242 4242
   3. Vérifier la redirection vers /checkout/success
```

### Étape 3 : Payer avec Stripe

1. Copier l'URL affichée
2. Ouvrir dans le navigateur
3. Payer avec : `4242 4242 4242 4242`

### Étape 4 : Vérifier le paiement

```bash
node tests/scripts/test-stripe-checkout.js verify cs_test_xxxxx
```

**Résultat attendu :**
```
🧪 Test 2: Vérifier la session après paiement
────────────────────────────────────────────────────────────
✅ Session récupérée avec succès!
   Payment Status: paid
   Amount: 29.99 CAD
   Customer Email: test@example.com
```

---

## 🧪 Utilisation des tests Jest

### Test complet

```bash
# Lancer le serveur
npm run dev

# Dans un autre terminal
npm test -- tests/integration/api/stripe-checkout.test.js
```

### Test en mode watch

```bash
npm run test:watch -- tests/integration/api/stripe-checkout.test.js
```

---

## 🐛 Debugging

### Logs du serveur

Les logs apparaissent dans le terminal où vous avez lancé `npm run dev` :

```
[INFO] Checkout session created successfully
[INFO] sessionId: cs_test_xxxxx
```

### Vérifier dans Stripe Dashboard

[Stripe Dashboard > Payments](https://dashboard.stripe.com/test/payments)

### Vérifier dans la DB

```sql
-- Vérifier les webhooks reçus
SELECT * FROM webhook_events WHERE source = 'stripe' ORDER BY created_at DESC LIMIT 5;

-- Vérifier les paiements (après webhook)
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
```

---

## ⚠️ Prérequis

### Variables d'environnement

Assurez-vous d'avoir dans `.env` :

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Test (pour les scripts)
TEST_API_KEY=your-test-api-key
CLERK_TEST_USER_ID=user_35FX_bjnrFCAde  # Votre user ID Clerk
```

### Serveur lancé

```bash
npm run dev
```

### Panier avec produits

Le panier doit contenir au moins 1 produit avec :
- Variant valide
- Pricing actif
- Stock disponible

---

## 📊 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run test:stripe` | Lancer le script de test Stripe |
| `node tests/scripts/test-stripe-checkout.js` | Même chose (long) |
| `node tests/scripts/test-stripe-checkout.js verify SESSION_ID` | Vérifier une session |
| `npm test -- tests/integration/api/stripe-checkout.test.js` | Tests Jest |

---

## ✅ Checklist

- [ ] Serveur lancé (`npm run dev`)
- [ ] `.env` configuré avec clés Stripe
- [ ] Panier avec au moins 1 produit
- [ ] `TEST_API_KEY` dans `.env`
- [ ] Script exécuté : `npm run test:stripe`
- [ ] URL Stripe ouverte
- [ ] Paiement effectué avec `4242 4242 4242 4242`
- [ ] Session vérifiée avec `verify SESSION_ID`
