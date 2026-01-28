# 🎨 Guide des Thèmes Vibe (Tailwind v4)

> **Source unique de vérité pour la personnalisation des thèmes**
> **Compatibilité**: Tailwind CSS v4.0+

---

## 🎯 Objectif

Ce guide explique comment personnaliser l'apparence de la boutique en toute sécurité, en respectant l'architecture Vibe (Zéro Hardcoding).

---

## 🔧 Système de Variables (globals.css)

Le cœur du design se trouve dans `src/app/globals.css`. C'est là que sont définies les palettes de couleurs et les variantes.

### Structure du système (v4 `theme inline`)

Avec Tailwind v4, nous utilisons la directive `@theme inline` directement dans le CSS, plus besoin de `tailwind.config.js` complexe.

```css
@theme inline {
  /* Couleurs Sémantiques */
  --color-primary: var(--primary);          /* Boutons, Liens actifs */
  --color-secondary: var(--secondary);      /* Éléments secondaires */
  --color-destructive: var(--destructive);  /* Erreurs, Suppressions */
  
  /* Couleurs Structurelles */
  --color-background: var(--background);    /* Fond de page */
  --color-card: var(--card);                /* Fond des cartes */
  --color-border: var(--border);            /* Lignes de séparation */
}
```

---

## 🚀 Comment modifier le thème ?

### 1. Changer les couleurs (La méthode facile)

Ouvrez `src/app/globals.css` et modifiez les valeurs hexadécimales dans le bloc `:root`.

**Exemple : Passer au thème "Forêt Sombre"**
```css
:root {
  /* Vert sapin pour le primaire */
  --primary: #14532d; 
  --primary-hover: #166534;
  
  /* Fond crème pour adoucir */
  --background: #fdfbf7; 
}
```

### 2. Modifier la forme des composants (La méthode architecte)

Si vous voulez changer l'apparence de **tous** les boutons ou de **toutes** les cartes, vous devez modifier la définition de l'utilitaire Vibe correspondant.

**Exemple : Arrondir tous les boutons**
Cherchez `@utility vibe-button-primary` dans `globals.css` :

```css
/* AVANT */
@utility vibe-button-primary {
  @apply px-4 py-2 rounded-md ...;
}

/* APRÈS (Boutons pill) */
@utility vibe-button-primary {
  @apply px-6 py-2 rounded-full ...; /* Changé rounded-md en rounded-full */
}
```
*Cette modification se propagera instantanément sur tout le site.*

---

## ⚠️ Gestion des Animations & Typographie

Certains styles complexes (comme les animations d'entrée ou la prose riche) ne peuvent pas être définis dans le CSS à cause des limitations de Tailwind v4.

Pour ces cas précis, nous utilisons un fichier de constantes JavaScript.

**Fichier** : `src/lib/vibe-styles.ts`

Si vous voulez changer l'animation d'apparition par défaut, modifiez la constante ici :

```typescript
// src/lib/vibe-styles.ts

// Avant (Fade In simple)
export const VIBE_ANIMATION_FADE_IN = "animate-in fade-in";

// Après (Zoom In dynamique)
export const VIBE_ANIMATION_FADE_IN = "animate-in zoom-in duration-500 ease-out";
```

---

## 📝 Checklist de Personnalisation

1.  [ ] **Couleurs** : Modifiées dans `:root` de `globals.css`.
2.  [ ] **Logo** : Remplacé dans `public/`.
3.  [ ] **Formes** : Utilitaires `vibe-*` ajustés si besoin.
4.  [ ] **Animations** : Vérifiées dans `vibe-styles.ts`.

---

**Ressources :**
- [Architecture Vibe](./01-architecture-vibe.md)
- [Documentation Tailwind v4](https://tailwindcss.com/docs)
