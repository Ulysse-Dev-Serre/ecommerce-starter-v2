# Configuration Stripe Tax

## État de l'implémentation
Le système est configuré pour utiliser **Stripe Tax Automatic** sur les `PaymentIntents`.

### 1. Configuration Code
Le code backend (`src/app/api/checkout/update-intent/route.ts`) active dynamiquement les taxes lorsque l'adresse de livraison est disponible :

```typescript
if (process.env.STRIPE_AUTOMATIC_TAX === 'true') {
   updatePayload.automatic_tax = { enabled: true };
}
```

Un bloc `try/catch` entoure cette activation pour permettre au checkout de fonctionner même si Stripe rejette le paramètre (ce qui est le cas en Sandbox).

### 2. Configuration Dashboard
Pour que cela fonctionne en Production, le compte Stripe doit avoir :
1.  **Adresse d'origine** définie (Settings > Tax > Registrations).
2.  **Preset Tax Category** défini (ex: "General - Tangible Goods").
3.  **Mode "Start Collecting"** activé.
4.  Option **"Include tax in prices"** réglée sur **Automatic** (recommandé pour Canada/USA).

## ⚠️ Limitation Critique : Environnement Sandbox
Lors du développement (Janvier 2026), nous avons confirmé une limitation majeure de l'environnement Stripe Test/Sandbox sur les nouveaux comptes :

> **"Tax integrations aren't available in test mode."**

Cette limitation (affichée dans le Dashboard Stripe Workbench à droite) empêche l'API `PaymentIntent` d'accepter le paramètre `automatic_tax`. L'API retourne l'erreur :
`Received unknown parameter: automatic_tax`

### Conséquences
1.  En mode **Dev / Test**, les taxes **NE S'AFFICHENT PAS** dans le checkout.
2.  Le site reste fonctionnel (le paiement passe hors taxes) grâce au fallback `try/catch`.

## ✅ Comment Valider les Taxes (Vraie Méthode)
La seule méthode viable pour valider le calcul des taxes avec cette configuration est d'opérer en **Mode Live (Production)** :

1.  Déployer le site en Production (Vercel).
2.  Configurer les clés API **Live** (`pk_live_...`, `sk_live_...`) dans les variables d'environnement.
3.  Effectuer un **achat réel** avec une vraie carte bancaire (pour un petit montant).
4.  Vérifier que la taxe est bien appliquée au total.
5.  **Rembourser** la transaction immédiatement depuis le Dashboard Stripe.

Cette procédure contourne la restriction du mode Sandbox.
