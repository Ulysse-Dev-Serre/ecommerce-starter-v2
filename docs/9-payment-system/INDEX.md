#  Système de Paiement Stripe


## Les 4 fichiers de documentation

1. **INDEX.md** (ce fichier) - Vue d'ensemble
2. **ARCHITECTURE.md** - Comment ça fonctionne (workflow + fichiers utilisés)
3. **SECURITY.md** - Comment c'est sécurisé + webhooks
4. **TESTING.md** - Comment tester avec des cartes de test

## Variables d'environnement requises

```bash
# Dans votre fichier .env
STRIPE_SECRET_KEY=sk_test_...                      # Clé secrète Stripe (côté serveur)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...    # Clé publique (côté client)
STRIPE_WEBHOOK_SECRET=whsec_...                    # Pour vérifier les webhooks
```

Récupérez ces clés sur [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) (mode test).

## Le flow en 1 phrase

Le client clique sur "Passer commande" →  backend crée une session Stripe → le client paie sur Stripe → Stripe envoie un webhook → créez la commande dans la base de données.

## Prochaines étapes

1. Lire [ARCHITECTURE.md](./ARCHITECTURE.md) pour comprendre comment ça marche
2. Lire [SECURITY.md](./SECURITY.md) pour comprendre la sécurité
3. Lire [TESTING.md](./TESTING.md) pour tester avec des cartes fictives
