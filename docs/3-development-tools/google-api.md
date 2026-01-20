# Google Maps & Places API

Cette documentation résume l'intégration de l'autocomplétion d'adresse pour le tunnel de commande (Checkout).

## 🛠 Configuration Cloud
Le projet utilise les nouvelles APIs de 2025 (**Places API New**). Pour que l'autocomplétion fonctionne, les services suivants doivent être activés dans la console Google Cloud :
1. **Places API**
2. **Places API (New)**
3. **Maps JavaScript API**

### Sécurité & Restrictions
La clé API est configurée avec une restriction **Referrer HTTP** pour autoriser uniquement :
- `http://localhost:3000/*` (Développement)
- Vos futurs domaines de production.

## 💰 Surveillance des Coûts
Bien que Google offre un crédit gratuit mensuel, il est crucial de surveiller l'utilisation pour éviter les surprises, surtout avec les APIs "Places" qui sont facturées à la requête ou à la session.

**Lien direct vers la facturation :**
[Console Google Cloud Billing](https://console.cloud.google.com/billing/0143E3-42B1AB-5A54F7?project=eng-particle-484919-k1)

## 💻 Implémentation technique
- **Composant** : `src/components/checkout/AddressAutocomplete.tsx`
- **API utilisée** : `google.maps.places.AutocompleteSuggestion` (Places New SDK).
- **Optimisation** : Utilisation de `AutocompleteSessionToken` pour regrouper les frappes de touches en une seule session de facturation.
