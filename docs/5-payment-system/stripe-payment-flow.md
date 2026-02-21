# 🔄 Flux de Paiement & Sécurité Stripe

Ce document décrit le cycle de vie d'un paiement, de l'initialisation du panier à la confirmation de la commande via les webhooks, ainsi que les mesures de sécurité critiques mises en place.

---

## 1. Comment c'est sécurisé ?

### A. Séparation des Responsabilités (Clés API)
- **Clé publique** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) : Utilisée côté client (Stripe Elements) pour collecter les informations de carte de manière sécurisée sans que les données ne transitent par notre serveur.
- **Clé secrète** (`STRIPE_SECRET_KEY`) : Utilisée uniquement côté serveur pour créer les sessions de paiement.
- **Secret Webhook** (`STRIPE_WEBHOOK_SECRET`) : Clé cryptographique unique permettant de vérifier que les messages reçus sur l'endpoint `/api/webhooks/stripe` viennent réellement de Stripe.

### B. Validation Cryptographique
**Fichiers :** `src/lib/integrations/stripe/webhooks.ts` et `src/app/api/webhooks/stripe/route.ts`

Chaque webhook envoyé par Stripe possède une signature `stripe-signature`. Notre serveur recalcule cette signature avec son secret local pour valider l'authenticité de l'expéditeur. Si la signature ne correspond pas, la requête est rejetée (400 Bad Request).

### C. Protection contre les Doublons (Idempotence)
Stripe peut renvoyer plusieurs fois le même événement en cas de problème réseau (retry automatique). Pour éviter de créer deux commandes ou de décrémenter le stock deux fois :
1. Chaque webhook reçu est enregistré dans la table `WebhookEvent`.
2. Nous vérifions si l'ID d'événement de Stripe a déjà été marqué comme `processed`.
3. Si oui, nous répondons `200 OK` sans rien faire de plus.

### D. Rate Limiting & Validation
- **Rate Limit** : Un utilisateur est limité dans la création de sessions de paiement pour éviter les attaques par force brute ou le spam.
- **Validation Backend** : Avant de rediriger vers Stripe, nous vérifions à nouveau les stocks et les prix en base de données. Le client ne peut pas "injecter" un prix modifié.

---

## 2. Le Flux du Paiement (Step-by-Step)

### Étape 1 : Initialisation
Le client clique sur "Payer". Le serveur crée une `Checkout Session` Stripe en envoyant uniquement les IDs de produits. Stripe utilise ses propres données de prix (configurées via dashboard ou passées via signature sécurisée).

### Étape 2 : Redirection
Le client est redirigé vers l'hébergement sécurisé de Stripe (`checkout.stripe.com`). À ce stade, le stock est souvent **réservé** temporairement en base de données locale pour garantir la disponibilité.

### Étape 3 : Le Webhook (Source de Vérité)
Une fois le paiement validé par la banque, Stripe envoie un message à notre serveur. C'est l'étape la plus fiable du processus.

**Fichier central :** `src/lib/services/orders/stripe-webhook.service.ts`

| Événement | Action métier |
| :--- | :--- |
| `checkout.session.completed` | Analyse de la session et préparation de la commande. |
| `payment_intent.succeeded` | **Confirmation finale** : Création de la commande, envoi de l'email de confirmation, et décrémentation définitive du stock. |
| `payment_intent.payment_failed` | Alerte sur le tableau de bord et libération du stock réservé. |
| `checkout.session.expired` | Libération du stock réservé (le client a abandonné son panier). |

---

## 3. Traçabilité et Audit

Pour chaque transaction, nous gardons une trace indélébile en base de données :
- **Table `WebhookEvent`** : Historique technique de tous les échanges avec Stripe (utile pour le débuggage).
- **Table `AuditLog`** : Journalisation de toutes les actions sensibles (ex: "Commande #123 créée suite au paiement Stripe ID X").
- **Table `Payment`** : Lien entre notre commande interne et la transaction externe.

---

## 4. En Résumé

Si un auditeur de sécurité vous interroge :
> "Notre flux de paiement est basé sur le modèle asynchrone sécurisé de Stripe. Aucune donnée de carte ne touche nos serveurs (Conformité PCI-DSS simplifiée). La sécurité repose sur la validation cryptographique des signatures de webhooks, une protection contre l'idempotence pour éviter les doubles commandes, et une centralisation de la logique métier dans des services backend protégés par rate-limiting."
