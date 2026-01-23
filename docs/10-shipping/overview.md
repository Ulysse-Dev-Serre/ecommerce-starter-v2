# 📦 Système de Livraison (Shipping)

## Vue d'ensemble

Notre système de livraison repose sur l'intégration de l'API **Shippo**.  
Shippo agit comme un agrégateur qui nous connecte à plusieurs transporteurs (UPS, Canada Post, FedEx) via une seule interface simplifiée.

## Configuration & Transporteurs

- **Service utilisé** : Shippo
- **Transporteur principal** : UPS (configuré par défaut pour les calculs)
- **Mode de fonctionnement** :
  1. **Calcul des tarifs (Automatique)** : Le client voit les vrais prix (Standard, Express) lors du checkout en fonction de son adresse.
  2. **Génération d'étiquette (Manuelle)** : Pour éviter les erreurs et les coûts inutiles, l'achat de l'étiquette et le débit carte se font **manuellement** depuis le Dashboard Admin.

## Architecture Technique Simplifiée

Voici les fichiers clés qui gèrent la livraison :

- **Configuration & Service** :  
  `src/lib/services/shippo.ts`  
  *Contient la logique de connexion à Shippo (Clés API, appels).*

- **API Tarif (Client)** :  
  `src/app/api/shipping/rates/route.ts`  
  *Interrogé par le checkout pour afficher les prix.*

- **Base de Données** :  
  Nous stockons l'URL de l'étiquette (PDF) dans la table `Shipment` (colonne `labelUrl`) pour permettre la réimpression facile.

- **Webhook (Retour d'information)** :
  `src/app/api/webhooks/shippo/route.ts`
  *Reçoit les mises à jour de statut de Shippo (ex: DELIVERED) pour mettre à jour la commande automatiquement.*

## Automatisation (Webhook)

Pour que le statut de la commande passe automatiquement à **DELIVERED** (et envoie l'email de livraison), nous utilisons un Webhook Shippo.

### Configuration
1. **URL** : `https://<votre-domaine>/api/webhooks/shippo?token=VOTRE_SECRET`
2. **Event** : `track_updated`
3. **Sécurité** : Le token dans l'URL est vérifié contre la variable d'environnement `SHIPPO_WEBHOOK_SECRET`.

### Fonctionnement
*   Shippo détecte que le colis est livré.
*   Il appelle notre API Webhook.
*   Le système trouve la commande grâce au numéro de suivi.
*   Le statut passe à `DELIVERED`.
*   L'email `OrderDeliveredEmail` est envoyé au client.

## Clés API

- **Dev/Test** : Utilise des clés de test (`shippo_test_...`) qui génèrent de faux labels gratuits.
- **Production** : Nécessite une clé Live (`shippo_live_...`) pour générer de vrais affranchissements payants.
