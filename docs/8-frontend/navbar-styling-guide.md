# 🎨 Guide de Styling Centralisé - Navbar & Hero

## Vue d'ensemble

Ce guide explique le système de styling centralisé pour la navbar et la section hero, permettant de modifier l'apparence sans toucher au code React.

## Sections couvertes

- **Navbar** : Logo, navigation, boutons utilisateur
- **Hero** : Image de fond, texte, overlays

## Architecture

### Séparation logique/styling

```
📁 src/components/layout/navbar.tsx  → Logique + structure HTML
📁 src/app/globals.css              → Tous les styles centralisés
```

### Avantages

- ✅ Modifications uniquement dans `globals.css`
- ✅ Code React plus propre
- ✅ Maintenance simplifiée
- ✅ Réutilisabilité des styles

---

## Classes CSS Centralisées

### 1. Texte "MANOR LEAF"

#### `.manor-leaf-text`
Style de base pour le conteneur du texte logo :
```css
.manor-leaf-text {
  font-size: 1.875rem;           /* text-3xl */
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  font-weight: 700;              /* font-bold */
  letter-spacing: 0.025em;       /* tracking-wide */
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  margin-left: -2rem;            /* -ml-8 */
  margin-bottom: 0.25rem;        /* mb-1 */
}
```

#### `.manor-text-3d`
Effet 3D pour "MANOR" :
```css
.manor-text-3d {
  color: #3a2415;  /* Brun chocolat profond */
  text-shadow:
    1px 1px 0 #c49a6c,    /* Bord clair */
    2px 2px 0 #c49a6c,    /* Épaisseur */
    3px 3px 0 #c49a6c,
    4px 4px 0 #8f7250,    /* Transition */
    6px 8px 15px rgba(0,0,0,0.45);  /* Ombre portée */
}
```

#### `.leaf-text-3d`
Effet 3D pour "LEAF" :
```css
.leaf-text-3d {
  color: #1E3812;  /* Vert forêt sombre */
  text-shadow:
    1px 1px 0 #8CB852,    /* Bord clair */
    2px 2px 0 #8CB852,    /* Épaisseur */
    3px 3px 0 #8CB852,
    4px 4px 0 #6e9440,    /* Transition */
    5px 5px 0 #4E7F2A,    /* Plus sombre */
    8px 10px 20px rgba(0,0,0,0.4);  /* Ombre portée */
}
```

### 2. Bouton Dashboard Admin

#### `.dashboard-extreme-right`
Style complet pour le bouton Dashboard :
```css
.dashboard-extreme-right {
  background: linear-gradient(to right, #b45309, #facc15, #b45309);
  color: white;
  padding: 0.375rem 0.75rem;      /* px-3 py-1.5 */
  border-radius: 0.375rem;        /* rounded-md */
  font-size: 0.875rem;            /* text-sm */
  font-weight: 700;               /* font-bold */
  margin-left: auto;              /* ml-auto - poussé à droite */
  transition: all 0.15s ease-in-out;
}

.dashboard-extreme-right:hover {
  background: linear-gradient(to right, #92400e, #fde047, #92400e);
}
```

### 3. Section Hero

#### `.bamboo-gradient`
Background principal de la navbar et footer :
```css
.bamboo-gradient {
  background: linear-gradient(
    90deg,
    #c2b078 0%,    /* Beige clair */
    #d7c58b 10%,   /* Beige moyen */
    #c2b078 20%,
    #d7c58b 30%,
    #c2b078 40%,
    #d7c58b 50%
  );
}
```

#### Effets Hero (overlay)
```css
/* Overlay dégradé sur l'image hero */
.absolute.inset-0.bg-gradient-to-t.from-black\/30.via-transparent.to-black\/20
```

---

## Section Hero - Configuration

### Structure HTML
```tsx
<section className="bg-gradient-to-r from-muted to-accent bamboo-texture -mt-4 relative overflow-hidden">
  <img
    src="/hero22.png"
    alt="Hero Image"
    className="w-full h-[28rem] object-cover opacity-70"
  />
  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20"></div>
</section>
```

### Personnalisation Hero

#### Changer l'image de fond
```tsx
<img src="/nouvelle-image.jpg" ... />
```

#### Modifier l'opacité
```css
/* Dans globals.css ou inline */
opacity: 0.8;  /* Plus visible */
opacity: 0.6;  /* Plus transparent */
```

#### Changer l'overlay
```css
/* Plus sombre */
bg-gradient-to-t from-black/50 via-transparent to-black/30

/* Plus clair */
bg-gradient-to-t from-black/20 via-transparent to-black/10
```

#### Hauteur personnalisée
```tsx
className="w-full h-[32rem] object-cover ..."  /* Plus haut */
className="w-full h-[24rem] object-cover ..."  /* Plus bas */
```

---

## Variables CSS Globales

### Couleurs du thème
```css
:root {
  --primary: #B79354;        /* Brun bambou principal */
  --primary-hover: #8A673E;  /* Brun plus foncé */
  --background: #FEFEFE;     /* Blanc crème */
  --foreground: #2D3748;     /* Gris foncé */
  --muted: #94A3B8;          /* Gris moyen */
}
```

### Utilisation
```css
.mon-element {
  color: var(--primary);
  background: var(--background);
}
```

---

## Animations Globales

### Pulse (utilisé sur MANOR LEAF)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Slide-in (utilisé pour les toasts)
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
```

---

## Responsive Design

### Breakpoints utilisés
```css
/* Mobile first */
@media (min-width: 640px)  /* sm: */
@media (min-width: 768px)  /* md: */
@media (min-width: 1024px) /* lg: */
@media (min-width: 1280px) /* xl: */
```

### Exemple responsive
```css
.hero-text {
  font-size: 1.5rem;  /* Mobile */
}

@media (min-width: 768px) {
  .hero-text {
    font-size: 2rem;  /* Desktop */
  }
}
```

---

## Optimisation Performance

### Images
- Utilisez des formats modernes (WebP, AVIF)
- Optimisez la taille avec des outils comme ImageOptim
- Lazy loading pour les images hors écran

### CSS
- Minimisez les repaint/reflow coûteux
- Utilisez `transform` au lieu de `margin/padding` pour les animations
- Combinez les propriétés CSS similaires

### Bundle
- Code splitting pour les composants lourds
- Lazy loading des routes
- Optimisation automatique via Next.js

---

## Tests Visuels

### Outils recommandés
- **Browser DevTools** : Inspecter les styles
- **Responsively** : Tester tous les breakpoints
- **Color Contrast Checker** : Accessibilité des couleurs
- **Lighthouse** : Performance globale

### Checklist pré-déploiement
- [ ] Styles cohérents sur tous les navigateurs
- [ ] Responsive fonctionnel sur mobile/tablette
- [ ] Contraste suffisant pour l'accessibilité
- [ ] Animations fluides (60fps minimum)
- [ ] Temps de chargement optimisé

---

```

## Utilisation dans le Code

### HTML/JSX
```tsx
// Dans navbar.tsx - seulement les classes CSS
<span className="manor-leaf-text">
  <span className="manor-text-3d">ANOR</span>
  <span className="leaf-text-3d ml-1">LEAF</span>
</span>

// Bouton Dashboard
<Link className="dashboard-extreme-right">
  Dashboard
</Link>
```

### Modification des Styles

Pour changer l'apparence, modifiez uniquement `globals.css` :

```css
/* Exemple : changer la couleur de MANOR */
.manor-text-3d {
  color: #8B4513;  /* Plus rouge */
}

/* Exemple : changer le dégradé du bouton */
.dashboard-extreme-right {
  background: linear-gradient(to right, #DC2626, #F59E0B, #DC2626);
}
```

---

## Personnalisation

### Couleurs
- Utilisez les variables CSS existantes ou définissez de nouvelles couleurs
- Respectez la palette terreuse du thème ManorLeaf

### Effets 3D
- Les `text-shadow` créent l'effet de profondeur
- Plusieurs couches pour un rendu réaliste
- Ajustez les valeurs pour plus/moins d'intensité

### Animations
- Animation `pulse` sur le texte principal
- `transition` sur les hover des boutons

### Responsive
- Les classes utilisent déjà les breakpoints Tailwind
- Ajoutez des media queries si nécessaire pour mobile

---

## Migration Future

### Pour ajouter de nouveaux éléments stylisés :

1. **Créer la classe CSS** dans `globals.css`
2. **Appliquer la classe** dans le composant React
3. **Tester** l'apparence

### Exemple : Nouveau bouton stylisé
```css
/* Dans globals.css */
.custom-button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: transform 0.2s;
}

.custom-button:hover {
  transform: translateY(-2px);
}
```

```tsx
// Dans le composant
<button className="custom-button">
  Mon Bouton
</button>
```

---

## Dépannage

### Le style ne s'applique pas
- Vérifiez que la classe est définie dans `globals.css`
- Vérifiez que la classe est appliquée dans le JSX
- Vérifiez les conflits de spécificité CSS

### Animation ne fonctionne pas
- Vérifiez que l'élément a la classe d'animation
- Testez avec les DevTools du navigateur

### Responsive cassé
- Vérifiez les breakpoints Tailwind
- Testez sur différentes tailles d'écran

---

## Ressources

- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Guide des thèmes](../theming.md)
- [Architecture frontend](../architecture.md)

---

**Dernière mise à jour :** Décembre 2024
**Version :** 1.0 - Système centralisé
