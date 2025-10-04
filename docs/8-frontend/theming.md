# 🎨 Customisation CSS - Variables de base

## Vue d'ensemble

Variables CSS pour personnaliser couleurs et polices. **Chaque boutique peut avoir une structure HTML/composants complètement différente.**

---

## Variables disponibles

```css
/* src/styles/themes/neutral.css */
:root {
  /* Couleurs principales */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --secondary: #64748b;
  
  /* Couleurs UI */
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
  
  /* Fond et texte */
  --background: #ffffff;
  --foreground: #0f172a;
  --border: #e2e8f0;
  
  /* Polices */
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

---

## Personnaliser

```bash
# 1. Copier le fichier
cp src/styles/themes/neutral.css src/styles/themes/ma-boutique.css

# 2. Modifier les couleurs
# Éditer src/styles/themes/ma-boutique.css

# 3. Activer dans globals.css
# Ligne 8: @import '../styles/themes/ma-boutique.css';
```

---

## Utilisation dans votre code

```tsx
// Composant custom
<button className="bg-[var(--primary)] text-white">
  Acheter
</button>

<h1 className="font-[family-name:var(--font-heading)]">
  Titre
</h1>
```

---

## Important

⚠️ **Ce fichier définit SEULEMENT les couleurs/polices.**  
⚠️ **La structure HTML/composants est à vous de créer selon chaque boutique.**

Voir [Guide de Construction](guide-construction.md) pour construire vos pages.
