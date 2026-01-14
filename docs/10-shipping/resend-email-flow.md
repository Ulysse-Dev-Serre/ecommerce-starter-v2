# Documentation Technique : Envoi d'Emails Transactionnels (Resend)

Ce document décrit l'architecture et le flux technique mis en œuvre pour l'envoi des emails de confirmation de commande via **Resend**.

## Architecture du Flux

Le déclencheur de l'envoi d'email est la **confirmation du paiement via Stripe**.

1.  **Frontend (`checkout-client.tsx`) - Initier le flux**
    *   Lors du calcul des frais de port (`update-intent`), le frontend envoie explicitement l'**adresse de livraison** et l'**email utilisateur** au backend.
    *   *Pourquoi ?* Pour garantir que ces données soient attachées au `PaymentIntent` de Stripe et reviennent intactes lors du webhook.

2.  **Backend (`/api/checkout/update-intent`) - Persistance**
    *   Reçoit les infos du front et met à jour le `PaymentIntent` Stripe.
    *   Champs clés mis à jour : `shipping` (adresse) et `receipt_email`.

3.  **Stripe -> Webhook (`/api/webhooks/stripe`) - Déclencheur**
    *   Écoute l'événement `payment_intent.succeeded`.
    *   Reçoit le payload complet contenant l'email et l'adresse.

4.  **Service Commande (`order.service.ts`) - Envoi**
    *   Appelé par le webhook via `createOrderFromCart`.
    *   Récupère l'email destinataire (Priorité : `receipt_email` de Stripe).
    *   Compile le template React-Email.
    *   Envoie via l'API Resend.

## Fichiers Clés

| Rôle | Fichier | Description |
| :--- | :--- | :--- |
| **Configuration** | `src/lib/resend.ts` | Initialisation du client Resend. |
| **Service** | `src/lib/services/order.service.ts` | Logique métier : décision d'envoi et appel API Resend. |
| **Template** | `src/components/emails/order-confirmation.tsx` | Design et contenu HTML de l'email (React Email). |
| **Script Test** | `scripts/test-resend.ts` | Script autonome pour valider la clé API et l'envoi (hors flux commande). |

## Variables d'Environnement

*   `RESEND_API_KEY` : Clé secrète de l'API Resend.
*   `FROM_EMAIL` : Adresse expéditeur (Doit être un domaine vérifié ou `onboarding@resend.dev` en test).
