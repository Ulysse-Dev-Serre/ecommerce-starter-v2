# 🔒 Sécurité Stripe

## Comment c'est sécurisé ?

### 1. Les clés API sont séparées

- **Clé publique** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) → Utilisée côté client, pas de danger si elle est exposée
- **Clé secrète** (`STRIPE_SECRET_KEY`) → Utilisée côté serveur uniquement, jamais exposée au client
- **Secret webhook** (`STRIPE_WEBHOOK_SECRET`) → Utilisé pour vérifier que les webhooks viennent vraiment de Stripe

### 2. Le client ne touche jamais aux paiements

Toute la logique de paiement se passe côté serveur. Le client ne fait que :
1. Demander une URL de paiement
2. Être redirigé vers Stripe
3. Revenir après le paiement

Le client ne peut pas créer de commandes directement, ni manipuler les montants.

### 3. Validation cryptographique des webhooks

**Fichier :** `src/lib/stripe/webhooks.ts`

Quand Stripe envoie un webhook, il l'accompagne d'une signature cryptographique. On vérifie cette signature pour être sûr que le webhook vient vraiment de Stripe et n'a pas été falsifié.

```typescript
const signature = headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body, 
  signature, 
  STRIPE_WEBHOOK_SECRET
);
```

Si la signature est invalide, on rejette le webhook immédiatement.

### 4. Protection contre les doublons (idempotence)

**Fichier :** `src/lib/stripe/webhooks.ts`

Stripe peut envoyer le même webhook plusieurs fois (retry automatique). Pour éviter de créer 2 commandes pour le même paiement, on :

1. Calcule un hash unique du webhook
2. Vérifie dans la table `WebhookEvent` si on l'a déjà traité
3. Si oui, on ignore et retourne 200 OK
4. Si non, on traite et on marque comme "processed"

### 5. Rate limiting

**Fichier :** `src/app/api/checkout/create-session/route.ts`

On limite le nombre de sessions de paiement qu'un utilisateur peut créer (max 10 par minute) pour éviter :
- Le spam
- Les attaques DDoS
- Les abus

Middleware utilisé : `withRateLimit` (déjà configuré dans le projet).

### 6. Validation des données

Avant de créer une session Stripe, on vérifie :
- Que le panier n'est pas vide
- Que tous les produits existent
- Que le stock est disponible
- Que les prix sont cohérents

## Les webhooks : pourquoi c'est important ?

Les webhooks sont **la seule source de vérité** pour les paiements. Voici pourquoi :

### Pourquoi ne pas créer la commande sur la page `/checkout/success` ?

❌ **Problème :** Le client peut modifier l'URL, rafraîchir la page, ou partir avant que la page ne charge.

✅ **Solution :** Le webhook est envoyé par Stripe directement à votre serveur, de manière fiable et sécurisée. C'est lui qui crée la commande.

### Les événements webhook gérés

**Fichier :** `src/lib/stripe/webhooks.ts`

| Événement | Action |
|-----------|--------|
| `payment_intent.succeeded` | Paiement réussi → Créer la commande + décrémenter le stock |
| `payment_intent.payment_failed` | Paiement échoué → Libérer le stock réservé |
| `checkout.session.expired` | Session expirée → Libérer le stock réservé |

### Comment on traite un webhook ?

1. **Valider la signature** (authentification)
2. **Vérifier l'idempotence** (éviter les doublons)
3. **Traiter l'événement** (créer commande, etc.)
4. **Répondre 200 OK** rapidement (< 5 secondes)
5. **Logger tout** dans `WebhookEvent` et `AuditLog`

## Logs et traçabilité

Tout est enregistré dans la base de données :

- **WebhookEvent** → Tous les webhooks reçus (avec hash, date, statut)
- **AuditLog** → Toutes les actions (création commande, décrémentation stock, etc.)
- **Payment** → Chaque paiement avec son ID Stripe (`externalId`)

Ça permet de débugger, de vérifier les paiements, et de prouver qu'une transaction a eu lieu.

## En résumé

**3 niveaux de sécurité :**

1. **Authentification** → Validation signature webhook + clés API séparées
2. **Protection** → Rate limiting + idempotence + validation des données
3. **Traçabilité** → Logs complets dans WebhookEvent et AuditLog

Si quelqu'un vous demande comment c'est sécurisé, vous répondez :
> "Les paiements passent par Stripe qui est certifié PCI-DSS. Côté serveur, on vérifie cryptographiquement que les webhooks viennent de Stripe grâce à une signature secrète. On a aussi du rate limiting pour empêcher le spam, et toutes les actions sont loggées dans la base de données."
