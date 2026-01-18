# Documentation Technique : Envoi d'Emails Transactionnels (Resend)

Ce document décrit l'architecture et le flux technique mis en œuvre pour l'envoi des emails de confirmation de commande via **Resend**.

## Flux 1 : Confirmation de Commande

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

## Flux 2 : Notification d'Expédition (Shipping)

Le déclencheur est une **action manuelle** dans le panneau d'administration.

1.  **Admin (`/admin/orders/[id]`)**
    *   L'administrateur change le statut de la commande à `SHIPPED`.
    *   L'API (`/api/admin/orders/[id]/status`) délègue la mise à jour au service centralisé.

2.  **Service Commande (`order.service.ts`)**
    *   La fonction `updateOrderStatus` détecte le passage au statut `SHIPPED`.
    *   Elle récupère les informations de suivi (`trackingCode`) depuis la relation `Shipments`.
    *   Elle envoie l'email "Votre commande est en route" via Resend.

## Flux 3 : Remboursement (Refund)

*   **Déclencheur** : Changement de statut à `REFUNDED` ou `CANCELLED` dans l'admin.
*   **Action Stripe** : Le système tente automatiquement d'émettre un remboursement via l'API Stripe (lié au PaymentIntent original) lorsque le statut passe à `REFUNDED`.
*   **Action Email** : Envoi automatique de l'email "Remboursement effectué" au client.

## Flux 4 : Notification Admin (Nouvelle Commande)

*   **Déclencheur** : Création d'une nouvelle commande (après paiement réussi).
*   **Action** : Envoi d'une alerte "💰 Nouvelle Commande" à l'email défini dans `ADMIN_EMAIL`.

## Fichiers Clés

| Rôle | Fichier | Description |
| :--- | :--- | :--- |
| **Configuration** | `src/lib/resend.ts` | Initialisation du client Resend. |
| **Service** | `src/lib/services/order.service.ts` | Logique centrale : gère la création (confirmation) et la mise à jour (expédition). |
| **Template Client** | `src/components/emails/order-confirmation.tsx` | Email "Merci pour votre commande" (Après paiement). |
| **Template Client** | `src/components/emails/order-shipped.tsx` | Email "Votre commande est en route" (Après expédition). |
| **Template Client** | `src/components/emails/order-refunded.tsx` | Email "Remboursement effectué" (Après remboursement). |
| **Template Admin** | `src/components/emails/admin-new-order.tsx` | Notification interne pour l'administrateur. |

## Internationalisation (i18n) & Multi-Devises

Le système s'adapte automatiquement sans configuration complexe :

*   **Langue (FR/EN)** : Basée sur la langue de l'utilisateur lors de l'achat (prop `locale`).
*   **Devise & Région** : Le format des prix (ex: `$10.00` vs `10,00 $`) est déduit automatiquement de la devise de la commande (`CAD` -> Format Canadien, `USD` -> Format US).

## Variables d'Environnement

*   `RESEND_API_KEY` : Clé secrète de l'API Resend.
*   `FROM_EMAIL` : Adresse expéditeur (Doit être un domaine vérifié ou `onboarding@resend.dev` en test).
*   `ADMIN_EMAIL` : (Optionnel) Email recevant les notifications de nouvelles commandes.
