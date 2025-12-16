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

## Clés API

- **Dev/Test** : Utilise des clés de test (`shippo_test_...`) qui génèrent de faux labels gratuits.
- **Production** : Nécessite une clé Live (`shippo_live_...`) pour générer de vrais affranchissements payants.
