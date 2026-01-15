# 🎯 Comment ajouter des Pixels (Facebook, TikTok, Pinterest)

Grâce à notre architecture **Google Tag Manager (GTM)**, vous n'avez **PLUS JAMAIS** besoin de modifier le code du site pour ajouter un outil publicitaire. Tout se fait dans l'interface de Google.

---

## 1. Le Principe

Le site envoie des signaux standard ("Page Vue", "Achat", "Ajout Panier") au conteneur GTM.
C'est GTM qui se charge ensuite de traduire ces signaux pour Facebook, TikTok, etc.

**Avantages :**
*   ✅ Pas de déploiement de code nécessaire.
*   ✅ Respect automatique du consentement (Cookies).
*   ✅ Performance (scripts chargés en différé).

---

## 2. Exemple : Ajouter le Pixel Facebook (Meta)

1.  **Récupérer l'ID** : Allez dans Facebook Business Manager > Events Manager. Copiez votre `Pixel ID`.
2.  **Ouvrir GTM** : Allez sur [tagmanager.google.com](https://tagmanager.google.com).
3.  **Créer la Balise** :
    *   Menu **Balises (Tags)** > **Nouvelle**.
    *   Configuration : Chercher "Facebook Pixel" (ou "Custom HTML" et coller le script Facebook si le modèle n'existe pas).
    *   *Astuce : Utilisez les modèles de la "Community Gallery" dans GTM, ils sont fiables.*
4.  **Déclencheur (Trigger)** :
    *   Pour voir toutes les pages : Choisir **Initialization - All Pages**.
5.  **Sauvegarder & Publier**.

👉 C'est tout. Le Pixel est actif sur le site immédiatement.

---

## 3. Exemple : Ajouter le Pixel TikTok

1.  **Récupérer l'ID** : Depuis TikTok Ads Manager.
2.  **Ouvrir GTM** : Nouvelle Balise.
3.  **Configuration** : Chercher le modèle officiel "TikTok Pixel" dans la galerie.
4.  **Configurer** : Coller simplement le `Pixel ID`.
5.  **Déclencheur** : **Initialization - All Pages**.
6.  **Publier**.

---

## 4. Gérer les événements spécifiques (Achat, Panier)

Pour tracker des actions précises (ex: "Purchase"), le principe est le même mais le déclencheur change.

1.  **Créer un Déclencheur** dans GTM :
    *   Type : **Événement Personnalisé (Custom Event)**.
    *   Nom de l'événement : `purchase` (c'est le nom standard que notre code envoie).
2.  **Créer la Balise** (ex: Facebook Purchase) :
    *   Lier ce nouveau déclencheur.

---

## ⚠️ Rappel Important

N'oubliez jamais de cliquer sur **"Envoyer" (Submit)** en haut à droite dans GTM. Tant que ce n'est pas fait, vos changements restent en mode "Brouillon" et ne sont pas visibles sur le site.
