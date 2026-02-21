# 🏗️ Architecture Frontend Vibe

Ce document définit la méthode de travail pour l'interface de votre boutique. Il vise un équilibre entre propreté du code et rapidité de développement.

---

## 1. La Stratégie Hybride (Look vs Placement)

Pour éviter la rigidité tout en gardant un design cohérent, nous séparons les responsabilités :

### 🎨 Le "Look" (Classes Vibe)
Tout ce qui définit l'identité visuelle est centralisé dans le CSS. Si on change la couleur primaire ou l'arrondi, tout le site change d'un coup.
- **Cible** : Boutons, Inputs, Cartes, Badges, Typographies de base.
- **Localisation** : `src/styles/vibe-utilities.css`.

### 🧱 Le "Placement" (Classes Tailwind)
Tout ce qui définit la position des objets sur une page spécifique reste dans le code React. C'est ce qui donne la flexibilité nécessaire pour ajuster les marges et les alignements.
- **Cible** : Flexbox, Grid, Marges (`mt-4`), Paddings de section, Gaps.
- **Localisation** : Vos fichiers `.tsx`.

---

## 2. Les Outils du Système

### A. Variables de Thème
Définies dans `src/styles/globals.css`, elles permettent de piloter tout le design par des jetons (tokens) :
- `--primary` : Couleur de marque.
- `--radius-md` : Arrondi standard des boutons.
- `--shadow-sm` : Ombres légères.

### B. Utilitaires Vibe (`vibe-*`)
Définis dans `src/styles/vibe-utilities.css` via la directive `@utility` de Tailwind v4.
- `vibe-button-primary` : Un bouton bleu, arrondi, avec ombre et animation.
- `vibe-input` : Un champ de texte stylisé avec état focus.
- `vibe-container` : Un bloc blanc avec bordure et ombre (ex-carte).

### C. Constantes de Style TS
Certaines classes Tailwind complexes (animations, plugins) sont stockées dans `src/lib/config/vibe-styles.ts`.
- `VIBE_ANIMATION_SLIDE_IN_BOTTOM` : Pour faire apparaître les éléments en glissant.

---

## 3. Guide de Contribution (Simple)

### ✅ À faire
1. Utiliser les **variables CSS** plutôt que des codes hexadécimaux bruts.
2. Utiliser les **boutons et inputs Vibe** pour garantir que tous les formulaires se ressemblent.
3. Utiliser **Tailwind** librement pour organiser vos colonnes et vos espacements.

### ❌ À éviter
1. Recréer un bouton de zéro avec 15 classes Tailwind atomiques.
2. Mettre des styles de "Placement" (comme `margin-top`) à l'intérieur d'une utilité CSS globale récupérée.

---

## 4. Exemple Concret

```tsx
// Un bloc parfaitement structuré "Vibe"
<div className="flex flex-col gap-4 p-6"> {/* Placement (Tailwind) */}
  <h3 className="vibe-h3">Produit Premium</h3> {/* Look (Vibe) */}
  <input className="vibe-input" />            {/* Look (Vibe) */}
  <button className="vibe-button-primary">   {/* Look (Vibe) */}
    Acheter
  </button>
</div>
```
