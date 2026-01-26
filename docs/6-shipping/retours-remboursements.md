# Gestion des Retours et Remboursements

Ce document détaille le fonctionnement du système de retours et de remboursements automatisé mis en place pour AgTechNest.

## 1. Processus de Remboursement

Le système de remboursement suit un workflow semi-automatisé pour garantir un contrôle total à l'administrateur.

### Flux Utilisateur (Client)
- Le client peut demander un remboursement directement depuis son portail de commande pour les commandes dont le statut est `DELIVERED`, `SHIPPED` ou `IN_TRANSIT`.
- Pour les commandes déjà expédiées, un avertissement est affiché précisant que les frais de livraison ne seront pas remboursés.
- Si la commande est encore au statut `PAID` (non expédiée), le client voit un bouton "Annuler la livraison".

### Flux Administrateur
- Une fois la demande reçue, l'administrateur voit le bouton **"CONFIRMER REMBOURSEMENT"** dans le panneau de détails de la commande.
- Une boîte de confirmation détaillée affiche le montant, le nom du client et le numéro de commande.
- **Action suite à confirmation :**
    1. Le statut de la commande passe à `REFUNDED`.
    2. Un email automatique est envoyé au client pour confirmer le remboursement.
    3. *Note :* Le remboursement monétaire réel doit être effectué manuellement sur le dashboard Stripe pour le moment.

## 2. Système d'Étiquettes de Retour (Shippo)

Nous avons intégré un système de génération d'étiquettes de retour automatisé via l'API Shippo.

### Fonctionnement (Canada uniquement)
- **Modèle "Pay-on-Use" :** Les étiquettes générées pour les retours domestiques (Canada vers Canada) ne sont facturées à AgTechNest que si le client dépose réellement le colis et qu'il est scanné par le transporteur.
- **Confirmation de prix :** Avant de générer l'étiquette, le système interroge Shippo pour obtenir le tarif le moins cher et demande une confirmation explicite à l'administrateur avec le montant affiché.
- **Envoi automatique :** Une fois générée, l'étiquette PDF est envoyée par email au client via un template optimisé pour Gmail contenant un bouton de téléchargement et un lien de secours.

### Limitations et Restrictions (USA -> Canada)
- **Non-supporté actuellement :** La génération automatique d'étiquettes de retour pour les clients aux **États-Unis** ne fonctionne pas de manière automatisée pour le moment.
- **Raison technique :** Les transporteurs (USPS/UPS) ne supportent pas le mode "Pay-on-Use" pour les retours internationaux via l'API standard.
- **Solution de contournement :** Pour les clients US, le remboursement ou l'envoi d'étiquette doit être géré **manuellement** ou à l'amiable (le client paie son retour et est remboursé, ou une étiquette standard prépayée est générée manuellement depuis le dashboard Shippo).

## 3. Statuts de Commande liés aux Retours

- `REFUND_REQUESTED` : Demande initiée par le client.
- `REFUNDED` : Remboursement confirmé par l'administrateur.
- `CANCELLED` : Commande annulée avant expédition.

## 4. Maintenance Technique
- Les services liés se trouvent dans : `src/lib/services/order.service.ts` (`createReturnLabel`)
- L'API de gestion : `src/app/api/admin/orders/[id]/return-label/route.ts`
- Le template d'email : `src/components/emails/order-return-label.tsx`



Prochains Objectifs:

🛡️ Connexion Stripe Refund : Connecter le bouton de confirmation admin à l'API Stripe pour déclencher le remboursement monétaire réel sur la carte du client.
📸 Enrichissement Client : Ajouter l'option d'envoi de photos et de descriptions détaillées dans le formulaire de demande de remboursement utilisateur.
🚀 Validation Finale : Effectuer les tests de bout en bout et le commit/push final.