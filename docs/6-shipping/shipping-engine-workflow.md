# 📦 Moteur de Livraison (Shipping Engine)

Ce document détaille l'intelligence derrière le calcul des frais d'expédition, l'organisation des colis et la gestion des douanes internationales.

---

## 1. Architecture "Carrier Agnostic"

Notre système utilise **Shippo** comme agrégateur (UPS, FedEx, Canada Post). Cependant, l'intelligence de calcul est gérée par notre propre "Moteur de Livraison" pour garantir des tarifs précis et optimisés.

### Composants Clés :
- **`ShippingService`** (`src/lib/services/shipping/shipping.service.ts`) : L'orchestrateur central.
- **`PackingService`** (`src/lib/services/shipping/packing.service.ts`) : Algorithme de calcul de colisage.
- **`CustomsService`** (`src/lib/services/shipping/customs.service.ts`) : Préparation des documents d'export.
- **`Shippo Integration`** (`src/lib/integrations/shippo/`) : Communication bas niveau avec l'API externe.

---

## 2. Intelligence de Colisage (3D Bin Packing)

Contrairement aux systèmes simples qui additionnent les poids, notre moteur simule physiquement le remplissage des cartons.

1.  **Récupération des dimensions** : Le système extrait la Largeur, Longueur, Hauteur et Poids de chaque variante de produit.
2.  **Simulation 3D** : À partir de notre catalogue de boîtes standard (Petit, Moyen, Grand format), l'algorithme teste laquelle peut contenir tous les objets de la commande.
3.  **Optimisation** : Si tout rentre dans une "Boîte Moyenne", Shippo est interrogé uniquement pour ce colis spécifique, garantissant le prix le plus bas possible.

---

## 3. Gestion Internationale (Douanes & Incoterms)

Pour chaque commande traversant une frontière (ex: Canada vers USA) :
- **Codes HS** : Le système récupère le code douanier harmonisé défini sur chaque fiche produit.
- **Origine** : Le pays de fabrication est automatiquement inclus.
- **Incoterms (SSOT)** : Nous gérons les protocoles **DDP** (Frais de douane payés par le vendeur) ou **DDU** (Payés par le client à la réception). La configuration est héritée du lieu d'expédition (Supplier).

---

## 4. Politique "Zero Fallback" (Sécurité Financière)

Pour éviter que la boutique ne paie de sa poche des frais de port sous-estimés, nous appliquons une politique de **Zéro Fallback** :
- Si un produit n'a pas de dimensions ou de poids défini → **Erreur 400** (Le checkout demande de contacter le support).
- Si l'adresse est incomplète (ex: manque la province pour le Canada) → **Erreur 400**.
- Si aucun transporteur ne répond → Le client ne peut pas payer.
*Cette rigueur garantit que chaque centime facturé au client correspond à un coût réel.*

---

## 5. Stratégie d'Affichage Client

Pour ne pas perdre le client dans une liste de 20 tarifs complexes, nous filtrons les résultats en deux catégories simples :
1.  **Standard** (Le moins cher des services type "Ground").
2.  **Express** (Le moins cher des services type "Next Day" ou "Priority").

---

## 6. Cycle de Vie & Webhooks

### Suivi Automatique
Une fois l'étiquette générée par l'admin, Shippo envoie des mises à jour via Webhook (`/api/webhooks/shippo`) :
- **`TRANSIT`** : La commande passe en "Expédiée".
- **`DELIVERED`** : La commande passe en "Livrée" et un email de remerciement est envoyé automatiquement.

### Sécurité du Webhook
Chaque webhook Shippo est validé par un token confidentiel configuré dans les variables d'environnement (`SHIPPO_WEBHOOK_SECRET`).
