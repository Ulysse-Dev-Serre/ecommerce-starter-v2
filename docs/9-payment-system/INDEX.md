# 💳 Système de Paiement Stripe

## 📋 Vue d'ensemble

Ce module gère l'intégration complète de Stripe pour le paiement des commandes e-commerce.

## 🎯 Objectifs

- **Backend-first** : Toute la logique métier côté serveur
- **Sécurité maximale** : Validation signatures webhooks, rate limiting, logging
- **Idempotence** : Éviter les doublons de commandes via `WebhookEvent.payloadHash`
- **Multi-devises** : Support CAD/USD (extensible)
- **Gestion stock** : Réservation pendant paiement, décrémentation après confirmation

## 🗂️ Documentation

- [**architecture.md**](./architecture.md) - Architecture technique et flux de données
- [**endpoints.md**](./endpoints.md) - Documentation des API endpoints
- [**webhooks.md**](./webhooks.md) - Gestion des événements Stripe
- [**testing.md**](./testing.md) - Guide de test avec Stripe CLI

## 🔑 Variables d'environnement

```bash
# Stripe API Keys (Test mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Webhooks
STRIPE_WEBHOOK_SECRET=whsec_...

# Production (à configurer plus tard)
# STRIPE_SECRET_KEY=sk_live_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 🚀 Flow principal

```
1. Client ajoute produits au panier
2. Client clique "Checkout"
3. Backend crée Stripe Checkout Session
4. Client est redirigé vers Stripe
5. Client paie avec carte
6. Stripe envoie webhook payment_intent.succeeded
7. Backend crée Order dans DB
8. Backend décrémente stock
9. Client est redirigé vers /checkout/success
10. Client voit sa commande dans /orders/[orderId]
```

## 📊 Schémas DB utilisés

- `Order` - Commande client
- `OrderItem` - Items de la commande
- `Payment` - Enregistrement des paiements (avec `externalId` = Stripe payment_intent_id)
- `WebhookEvent` - Traçage des événements webhooks
- `ProductVariantInventory` - Gestion du stock (`stock`, `reservedStock`)
- `AuditLog` - Logs de toutes les actions

## 🛠️ Prochaines étapes

- [ ] Setup initial avec clés test Stripe
- [ ] Créer endpoint `/api/checkout/create-session`
- [ ] Créer endpoint `/api/webhooks/stripe`
- [ ] Tester paiement avec cartes de test
- [ ] Implémenter gestion stock
- [ ] Ajouter gestion des erreurs/refunds
