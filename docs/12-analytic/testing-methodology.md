# 🧪 Guide de Test de l'Analytique (Méthodologie)

Ce guide explique comment vérifier par toi-même que ton tracking fonctionne parfaitement quand tu lances des campagnes (TikTok, Instagram, etc.).

## 1. Comment créer un lien de test (UTM)

Le tracking repose sur les paramètres que tu ajoutes à la fin de ton URL. 
**Format :** `tonsite.com/?utm_source=tiktok&utm_medium=video&utm_campaign=promo_janvier`

### Les 3 mousquetaires du tracking :
- `utm_source` : La plateforme (ex: `tiktok`, `facebook`, `newsletter`).
- `utm_medium` : Le type de lien (ex: `bio`, `ad`, `story`).
- `utm_campaign` : Le nom de ton opération (ex: `black_friday`, `influenceur_martin`).

---

## 2. Workflow de Test : Scénario TikTok

Imaginons que tu veuilles tester si tes visites venant d'un compte TikTok "test" sont bien enregistrées.

### Étape 1 : Préparation du lien
Crée ton lien personnalisé : `https://ton-site.com/fr?utm_source=tiktok_test&utm_medium=bio`

### Étape 2 : Simulation de visite
1. Ouvre une fenêtre **Incognito / Navigation Privée** (très important pour ne pas mélanger avec ta session admin).
2. Colle ton lien avec les UTM et appuie sur Entrée.
3. Navigue sur le site (regarde un produit, ajoute au panier).

### Étape 3 : Vérification technique (Optionnel)
Si tu veux voir si le code "parle" bien au serveur :
1. Fais un clic droit > **Inspecter**.
2. Va dans l'onglet **Réseau (Network)**.
3. Filtre par le mot `events`. 
4. Tu devrais voir des lignes apparaître chaque fois que tu changes de page ou cliques sur un bouton.

---

## 3. Workflow de Test : Conversion Funnel

Pour vérifier que le tunnel (Funnel) de conversion est bien suivi :

1. Prends ton lien TikTok de l'étape précédente.
2. **Action 1** : Visite la page d'accueil (`page_view`).
3. **Action 2** : Clique sur un produit spécifique (`view_item`).
4. **Action 3** : Ajoute-le au panier (`add_to_cart`).
5. **Action 4** : Va jusqu'à la page de paiement (`begin_checkout`).
6. **Action 5** : Fais un achat de test (si tu as Stripe en mode test) (`purchase`).

---

## 4. Vérification dans l'Admin

Une fois tes tests finis, retourne dans ton dashboard Admin :

1. **Dashboard principal** : Regarde si le graphique de revenus a bougé (si tu as fait une vente).
2. **Page Analytics** :
   - Regarde le tableau **"Sources d'acquisition"**. Tu devrais voir `tiktok_test` apparaître.
   - Regarde le **"Tunnel de conversion"**. Tu devrais voir une progression dans chaque barre.

## 5. Astuces de Pro
- **Nettoyage** : Si tu veux refaire un test "à zéro", ferme ta fenêtre privée et réouvre-en une nouvelle. Cela générera un nouvel `Anonymous ID`.
- **Délai** : Le tracking est quasi-instantané dans ta base de données, mais rafraîchis bien la page Admin pour voir les nouveaux chiffres.
