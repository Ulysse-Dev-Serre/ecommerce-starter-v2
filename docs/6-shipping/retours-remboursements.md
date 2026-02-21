# Gestion des Retours et Remboursements

Ce document détaille le fonctionnement du système de retours et de remboursements automatisé mis en place pour votre boutique.

---

## 1. Processus de Remboursement "Zéro Friction"

Le système de remboursement est désormais entièrement intégré avec l'API Stripe pour garantir que l'argent est réellement restitué au client dès que l'administrateur valide l'action.

### Flux Utilisateur (Client)
- Le client peut demander un remboursement depuis son portail commande pour les statuts `DELIVERED`, `SHIPPED` ou `IN_TRANSIT`.
- **Politique de transparence** : Pour les commandes déjà expédiées, un avertissement automatique précise que les frais de livraison restent à la charge du client (seul le montant des produits est remboursable).
- Si la commande est encore au statut `PAID` (non expédiée), le client peut l'annuler d'un clic.

### Flux Administrateur (Sécurisé)
- L'administrateur valide la demande depuis le dashboard.
- **Action Automatisée (`updateOrderStatus`)** :
    1. **Remboursement Stripe** : Le système communique avec Stripe pour rembourser le `PaymentIntent` original.
    2. **Mise à jour Statut** : La commande passe en `REFUNDED`.
    3. **Restauration de Stock** : Les produits sont automatiquement réintégrés à l'inventaire via une transaction SQL atomique.
    4. **Notification** : Un email de confirmation de remboursement est envoyé au client via Resend.

---

## 2. Système d'Étiquettes de Retour (Shippo)

Nous utilisons le modèle avancé de Shippo pour les retours au Canada.

### Modèle "Pay-on-Use"
- Les étiquettes de retour générées ne sont **jamais facturées** au vendeur au moment de la création.
- La facturation n'a lieu **que si le client dépose réellement le colis** et qu'il est scanné par le transporteur.
- L'étiquette PDF est générée par l'admin, puis envoyée automatiquement par email avec un bouton de téléchargement direct.

### Restrictions Internationales (USA)
- La génération automatique "Pay-on-Use" pour les retours **USA -> Canada** n'est pas supportée par les transporteurs via l'API.
- **Solution** : Pour les clients américains, l'administrateur doit générer une étiquette d'exportation standard manuellement ou demander au client de renvoyer le colis à ses frais avant remboursement.

---

## 3. Architecture Technique

| Composant | Chemin du Fichier | Description |
| :--- | :--- | :--- |
| **Logique Paiement** | `src/lib/services/payments/payment-refund.service.ts` | Gestion des remboursements Stripe et restauration de stock. |
| **Logique Transport** | `src/lib/services/shipping/order-fulfillment.service.ts` | Génération des étiquettes de retour Shippo. |
| **API Admin** | `src/app/api/admin/orders/[id]/status/route.ts` | Endpoint de changement de statut et déclenchement refund. |
| **Email Template** | `src/components/emails/order-return-label.tsx` | Design de l'email contenant l'étiquette de retour. |

---

## 4. Statuts de Commande

- `REFUND_REQUESTED` : Demande de retour initiée mais non encore validée.
- `REFUNDED` : Remboursement Stripe effectué et stock restauré.
- `CANCELLED` : Annulation complète (généralement avant expédition).