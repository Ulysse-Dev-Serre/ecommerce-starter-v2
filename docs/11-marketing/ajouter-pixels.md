# 🎯 Guide des Pixels Publicitaires (Meta, TikTok, Pinterest)

Ce document explique comment intégrer et configurer vos outils de suivi marketing (Pixels) via **Google Tag Manager (GTM)**.

---

## 1. Philosophie : Zéro Code

Grâce à notre architecture centralisée, vous n'avez **jamais** besoin de modifier le code source du site pour ajouter un nouveau Pixel. Tout le déploiement se fait via l'interface de Google Tag Manager.

### Avantages :
- **Agilité** : Lancez une nouvelle campagne en quelques minutes sans attendre un développeur.
- **Conformité RGPD** : Le site est configuré en **Consent Mode**. Les pixels ne s'activent que si l'utilisateur accepte les cookies.
- **Performance** : Les scripts sont chargés de manière asynchrone pour ne pas ralentir la boutique.

---

## 2. Configuration Standard (Exemple : Meta/Facebook)

1.  **Récupérer votre ID** : Dans votre Business Manager, copiez votre `Pixel ID`.
2.  **Ouvrir GTM** : Accédez à votre conteneur [Tag Manager](https://tagmanager.google.com).
3.  **Créer la Balise** :
    - Menu **Balises** > **Nouvelle**.
    - Recherchez le modèle "Facebook Pixel" dans la galerie communautaire (fiable et maintenu).
    - Collez votre ID.
4.  **Déclencheur (Trigger)** :
    - Pour le suivi de base : Choisissez **Initialization - All Pages**.
5.  **Publier** : Cliquez sur "Envoyer" pour mettre en ligne.

---

## 3. Liste des Événements Trackés

Notre boutique envoie automatiquement des signaux standard ("DataLayer Events") que vous pouvez utiliser dans GTM pour vos campagnes de conversion :

| Événement GTM | Action Client | Données envoyées (Metadata) |
| :--- | :--- | :--- |
| `page_view` | Consultation d'une page | URL, Titre de la page. |
| `view_item` | Consultation d'un produit | ID, Nom, Prix, Catégorie. |
| `add_to_cart` | Ajout d'un produit au panier | ID, Nom, Quantité, Prix. |
| `begin_checkout` | Début du processus de paiement | Montant du panier. |
| `purchase` | Paiement réussi | ID Commande, Total, Taxe, Liste des produits. |

---

## 4. Consentement et Cookies

**Point Critique :** Le site utilise un mode de consentement strict. 
- Par défaut, GTM bloque l'envoi de données publicitaires (`ad_storage: denied`).
- Lorsqu'un utilisateur clique sur "Accepter" dans la bannière de cookies du site, le signal de consentement est mis à jour.
- Vos balises dans GTM doivent être configurées pour respecter ce consentement (c'est le cas par défaut des modèles officiels Meta/TikTok).

---

## 5. Maintenance et Débogage

Pour vérifier que vos pixels fonctionnent correctement :
1. Utilisez le bouton **"Prévisualiser"** dans GTM.
2. Naviguez sur votre site.
3. Vérifiez dans la console GTM que vos balises (`purchase`, `add_to_cart`) se déclenchent lors des actions correspondantes.
