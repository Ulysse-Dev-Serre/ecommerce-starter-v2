# 🚀 Quick Start - Test Stripe

## Étapes rapides pour tester Stripe

### 1. Ajouter des produits à votre DB (si pas déjà fait)

```bash
npm run db:seed-products
```

### 2. Ajouter un produit au panier

Utilisez votre méthode habituelle (Postman, script existant, etc.)

### 3. Lancer le test Stripe

```bash
npm run test:stripe
```

### 4. Ouvrir l'URL Stripe affichée

### 5. Payer avec la carte de test

```
Numéro: 4242 4242 4242 4242
Date: 12/34
CVC: 123
```

### 6. Après paiement, vérifier la session

```bash
node tests/scripts/test-stripe-checkout.js verify cs_test_xxxxx
```

C'est tout ! 🎉
