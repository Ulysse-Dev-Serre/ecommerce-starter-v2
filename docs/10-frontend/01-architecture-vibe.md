# 🏗️ Architecture Frontend Vibe

> **Source Unique de Vérité** pour le développement Frontend sur ce projet.
> **Version**: 2.0 (Migration Tailwind v4)

---

## 1. Philosophie : Structure vs Style

Nous suivons une séparation stricte des responsabilités pour garantir la maintenabilité à long terme.

*   **HTML/React (`.tsx`) = Structure**
    *   Doit contenir UNIQUEMENT la logique et la hiérarchie des composants.
    *   Ne doit JAMAIS contenir de style atomique (pas de `p-4 flex bg-red-500`).
*   **CSS (`globals.css`) = Style**
    *   Doit contenir TOUTES les définitions de design.
    *   Utilise la directive `@utility` de Tailwind v4.

### 🚫 L'erreur à ne jamais commettre (Hardcoding)
```tsx
// ❌ INTERDIT : Hardcoding de classes utilitaires
<div className="flex justify-between items-center p-4 bg-white shadow-md">
  <button className="bg-blue-500 text-white rounded px-4 py-2">Click me</button>
</div>
```

### ✅ La Règle d'Or (Centralisation)
```tsx
// ✅ APPROUVÉ : Utilisation de composants sémantiques "Vibe"
<div className="vibe-card-header">
  <button className="vibe-button-primary">Click me</button>
</div>
```
*Toutes les classes `vibe-*` sont définies dans `src/app/globals.css`.*

---

## 2. Système de Classes Vibe

Pour éviter d'inventer des noms de classes au hasard, nous utilisons une nomenclature stricte.

### 🧩 Layouts & Conteneurs
*   `vibe-layout-container` : Conteneur principal centré avec max-width.
*   `vibe-section-py` : Padding vertical standard pour les sections.
*   `vibe-grid-4-cols` : Grille responsive (1 col mobile -> 4 cols desktop).
*   `vibe-flex-center` : Flexbox centré absolu (X et Y).
*   `vibe-flex-between-items-center` : Flexbox écarté (`justify-between`).

### 🎨 Composants UI
*   `vibe-card` : Carte standard (bordure, padding, fond blanc).
*   `vibe-button-primary` : Bouton d'action principal.
*   `vibe-button-secondary` : Bouton secondaire (outline).
*   `vibe-input` : Champ de formulaire standardisé.

### ✍️ Typographie
*   `vibe-h1-mega`, `vibe-h1`, `vibe-h2` : Titres.
*   `vibe-text-body` : Paragraphe standard.
*   `vibe-text-muted` : Texte gris secondaire.

---

## 3. Gestion des Exceptions (Tailwind v4)

La version 4 de Tailwind impose des limitations techniques strictes sur l'utilisation de `@apply` avec des plugins dynamiques. Pour contourner cela PROPREMENT, nous utilisons des **Constantes Centralisées**.

### Le Fichier `src/lib/vibe-styles.ts`
Ce fichier est le **seul endroit autorisé** pour stocker des chaînes de caractères de classes complexes qui ne peuvent pas aller dans le CSS.

**Cas d'usage obligatoires :**
1.  **Typography Plugin** (`prose`)
2.  **Animations** (`animate-in`, `fade-in`)
3.  **Group Hover** complexes (`group`)

**Exemple :**
```typescript
// src/lib/vibe-styles.ts
export const VIBE_TYPOGRAPHY_PROSE = "prose prose-stone dark:prose-invert max-w-none";
```

**Utilisation dans le code :**
```tsx
import { VIBE_TYPOGRAPHY_PROSE } from '@/lib/vibe-styles';

<article className={VIBE_TYPOGRAPHY_PROSE}>
  {content}
</article>
```

---

## 4. Checklist de contribution

Avant de commiter un changement Frontend :

1.  [ ] Ai-je utilisé une classe `vibe-*` existante ?
2.  [ ] Si j'ai besoin d'un nouveau style, l'ai-je ajouté dans `globals.css` via `@utility` ?
3.  [ ] Ai-je vérifié qu'aucune classe Tailwind brute (`flex`, `mt-4`) ne traîne dans mon JSX ?
4.  [ ] Si j'utilise `prose` ou `animate`, est-ce importé depuis `vibe-styles.ts` ?
