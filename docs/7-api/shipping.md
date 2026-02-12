# API Shipping (Livraison)

## Endpoints

### Client
- `POST /api/shipping/rates` - Calcule tarifs livraison en temps réel (Shippo)
  - **Auth**: Aucune (Session panier ou User connecté)
  - **Body**: addressTo { name, street1, city, state, zip, country, email, phone }
  - **Actions**: Appelle API Shippo Live rates (basé sur Warehouse Address par défaut)
  - **Retourne**: Liste des tarifs { provider, amount, currency, servicelevel, duration_terms }
  - **Fichier**: `src/app/api/shipping/rates/route.ts`

### Admin (Fulfillment)
- `POST /api/admin/orders/[id]/purchase-label` - Génère étiquette expédition (PDF)
  - **Auth**: Admin
  - **Params**: id (OrderId)
  - **Body**: rateId (Optionnel, si on veut forcer un tarif spécifique)
  - **Actions**: 
    1. Récupère détails commande
    2. Crée transaction Shippo (Achat immédiat)
    3. Sauvegarde `trackingCode`, `carrier`, `labelUrl` dans table `Shipment`
    4. Met à jour statut commande → SHIPPED (ou partiellement)
  - **Retourne**: Shipment details + Label URL
  - **Fichier**: `src/app/api/admin/orders/[id]/purchase-label/route.ts`

## Workflow Livraison

1. **Client** : Saisit adresse au checkout -> `POST /api/shipping/rates`.
2. **Client** : Choisit tarif -> `POST /api/checkout/update-intent` (MàJ Stripe).
3. **Stripe** : Paiement validé -> Webhook -> Commande créée (Statut: PAID, Shipment: Pending).
4. **Admin** :
   - Ouvre commande dans Dashboard.
   - Vérifie adresse et articles.
   - Clique "Générer Étiquette" (`POST .../purchase-label`).
   - Imprime PDF.
   - Colis remis au transporteur.

## Notes
- **Clés API** : Utilise `SHIPPO_API_KEY` (Test ou Live selon ENV).
- **Adressage** : Code postal nettoyé des espaces avant envoi.
- **Stockage** : On ne stocke pas le PDF, juste l'URL (`labelUrl`) pour réimpression.
