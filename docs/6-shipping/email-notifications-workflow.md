# 📧 Flux des Notifications Emails (Resend)

Ce document décrit l'architecture et le cycle de vie des emails transactionnels envoyés aux clients et aux administrateurs.

---

## 1. Moteur d'Email (React Email + Resend)

Nous utilisons une stack moderne pour garantir des emails beaux, responsifs et fiables :
- **React Email** : Permet de coder les templates en React (TSX) avec des composants stylisés.
- **Resend** : Service d'envoi d'emails haute performance avec une excellente délivrabilité.
- **Service Dédié** : `OrderNotificationsService` centralise toute la logique d'envoi.

---

## 2. Flux Transactionnels Clés

### A. Confirmation de Commande (Après Paiement)
- **Déclencheur** : Webhook Stripe (`payment_intent.succeeded`).
- **Logique** : Une fois la commande créée en base, `OrderNotificationsService.sendOrderConfirmation` est appelé.
- **Template** : `order-confirmation.tsx`.
- **Données** : Récapitulatif complet des produits, prix, taxes et adresse de livraison.

### B. Notification Expédition (En route)
- **Déclencheur** : L'administrateur génère l'étiquette et marque la commande comme `SHIPPED`.
- **Logique** : `OrderNotificationsService.sendShippingNotification` est appelé avec le numéro de suivi.
- **Template** : `order-shipped.tsx`.
- **Contenu** : Lien direct vers le suivi Shippo et rappel des articles expédiés.

### C. Confirmation de Livraison (Livré)
- **Déclencheur** : Webhook Shippo (`track_updated` -> `DELIVERED`).
- **Logique** : Le système détecte la livraison finale et appelle `sendDeliveryNotification`.
- **Template** : `order-delivered.tsx`.

### D. Gestion des Remboursements
- **Déclencheur** : Action de remboursement initiée dans l'admin.
- **Action** : `sendRefundNotification`.
- **Template** : `order-refunded.tsx`.

---

## 3. Notifications Administrateur (Interne)

Le système alerte l'équipe en temps réel :
- **Nouvelle Commande** : `sendAdminNewOrderAlert` envoie un résumé des ventes à `ADMIN_EMAIL`.
- **Échec Webhook** : Alerte critique si une intégration (Stripe/Shippo) rencontre une erreur persistante.

---

## 4. Architecture des Fichiers

| Rôle | Chemin du Fichier | Description |
| :--- | :--- | :--- |
| **Configuration** | `src/lib/integrations/resend/client.ts` | Client Resend configuré. |
| **Logic (Service)** | `src/lib/services/orders/order-notifications.service.ts` | **Cœur du système** : Envoi et compilation. |
| **Templates** | `src/components/emails/` | Dossier contenant tous les composants React Email. |
| **Styles** | `src/components/emails/styles.ts` | Design system partagé (Couleurs, Typo) pour les emails. |

---

## 5. Internationalisation (i18n)

Les emails respectent la **langue de l'acheteur** :
1. La `locale` (fr/en) est capturée lors de la création du Payment Intent.
2. Elle est stockée dans la `Order` via `metadata`.
3. Le service de notification utilise cette locale pour traduire les textes et formater les dates/devises.

---

## 6. Variables d'Environnement

- `RESEND_API_KEY` : Clé secrète de production.
- `FROM_EMAIL` : L'adresse officielle d'expédition (ex: `Boutique AgTech <noreply@votre-domaine.com>`).
- `ADMIN_EMAIL` : Reçoit les alertes de gestion.
