# 🧪 Méthodologie de Test Analytics

Ce guide détaille les étapes pour valider la chaîne de tracking, de l'origine du trafic (UTM) jusqu'à la conversion finale.

---

## 1. Création de Liens de Test (UTM)

Le tracking repose sur les paramètres ajoutés à la fin de vos URLs. Utilisez-les systématiquement pour vos campagnes influenceurs ou publicitaires.

**Structure recommandée :**
`https://votre-site.com/fr?utm_source=tiktok&utm_medium=video_bio&utm_campaign=promo_ete`

| Paramètre | Définition | Exemple |
| :--- | :--- | :--- |
| `utm_source` | La plateforme d'origine | `tiktok`, `facebook`, `newsletter` |
| `utm_medium` | Le format du lien | `ad`, `bio`, `story`, `email` |
| `utm_campaign` | Le nom de l'opération | `lancement_produit`, `influenceur_martin` |

---

## 2. Protocole de Validation

Pour tester sans polluer vos données réelles, suivez systématiquement ce protocole :

### A. Phase d'Isolation
1. Ouvrez une fenêtre **Incognito / Navigation Privée**.
2. Cela garantit que vous n'êtes pas connecté à votre compte Admin (ce qui pourrait fausser ou filtrer certains événements).

### B. Phase de Navigation (User Journey)
Collez votre lien avec UTM et effectuez un parcours client classique :
- **Entrée** : Arrivée sur la Home ou un produit (`page_view`).
- **Découverte** : Consultation d'un produit (`view_item`).
- **Intention** : Ajout au panier (`add_to_cart`).
- **Action** : Début du Checkout (`begin_checkout`).
- **Conversion** : Paiement réussi (`purchase`).

---

## 3. Débogage Technique

Si vous souhaitez vérifier techniquement que le code communique avec le serveur :
1. Faites un clic droit > **Inspecter** > onglet **Réseau (Network)**.
2. Filtrez par le mot clé **`events`**.
3. Chaque action doit déclencher une ligne `POST` vers `/api/tracking/events` avec un code `200 OK`.

---

## 4. Vérification dans l'Interface Admin

Rendez-vous dans la section **Analytics** de votre tableau de bord Admin :
- **Acquisition** : Vérifiez que votre `utm_source` (ex: `tiktok_test`) apparaît dans le tableau des sources.
- **Entonnoir de Conversion** : Vérifiez que les barres de progression reflètent bien chacune de vos étapes de test.
- **Revenus** : Si vous avez complété un achat (mode test), le chiffre d'affaires doit être mis à jour instantanément.

---

## 5. Astuces de Maintenance
- **Réinitialisation** : Pour simuler un "Nouvel Utilisateur", fermez et réouvrez simplement votre fenêtre privée. Un nouvel `Anonymous ID` sera généré.
- **DebugView GA4** : Si vous avez accès à Google Analytics, utilisez la `DebugView` dans l'administration pour voir vos événements passer en temps réel avec leurs paramètres associés.
