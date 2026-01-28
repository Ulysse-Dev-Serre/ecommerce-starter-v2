# 🧩 Guide des Composants Vibe

> **Catalogue des composants prêts à l'emploi**
> Utilisez ces briques pour construire vos pages. N'inventez pas de nouveaux styles si ceux-ci suffisent.

---

## 🏗️ Layouts

### Conteneur de Page
Pour centrer le contenu avec une largeur maximale standard.
```tsx
<div className="vibe-layout-container">
  {/* Contenu ici */}
</div>
```

### Grilles Responsives
Pour afficher des listes de produits ou de cartes.
*   **Grid 4 colonnes** (Idéal pour produits) : `vibe-grid-4-cols`
*   **Footer Grid** : `vibe-footer-grid`

```tsx
<div className="vibe-grid-4-cols">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

### Flexbox Standards
*   **Centrer tout** : `vibe-flex-center`
*   **Écarter et centrer** (Navbar, Header) : `vibe-flex-between-items-center`

---

## 🔘 Boutons & Liens

Ne jamais styliser un `<button>` ou un `<a>` à la main.

### Actions Principales
```tsx
<button className="vibe-button-primary">
  Ajouter au panier
</button>
```

### Actions Secondaires
```tsx
<button className="vibe-button-secondary">
  En savoir plus
</button>
```

### Liens Discrets
```tsx
<Link href="/shop" className="vibe-link-action">
  Voir tout <ArrowRight />
</Link>
```

---

## 📦 Cartes & Contenu

### Carte Standard
Utilisé pour les produits, les résumés de commande, etc.
```tsx
<div className="vibe-card">
  <div className="vibe-image-container">
    {/* Image fill */}
  </div>
  <div className="p-4">
    <h3 className="vibe-text-bold">Titre</h3>
    <p className="vibe-text-muted">Description courte</p>
  </div>
</div>
```

### Typography (Titres)
*   `vibe-h1-mega` : Très gros titre (Hero)
*   `vibe-h1` : Titre de page standard
*   `vibe-section-title` : Titre de section H2/H3

---

## 📝 Formulaires

### Inputs
```tsx
<input 
  type="text" 
  className="vibe-input" 
  placeholder="Votre email" 
/>
```

### Select
```tsx
<select className="vibe-select">
  <option>Option 1</option>
</select>
```

---

## 🚫 Anti-Patterns (Ce qu'il ne faut PAS faire)

### ❌ Mauvais : Hardcoding
```tsx
// NE FAITES PAS ÇA
<button className="bg-red-500 text-white p-2 rounded hover:bg-red-600">
  Delete
</button>
```

### ✅ Bon : Utilitaire Sémantique
Si vous avez besoin d'un bouton rouge (Destructive), créez l'utilitaire dans `globals.css` s'il n'existe pas, puis utilisez-le.
```css
/* globals.css */
@utility vibe-button-destructive {
  @apply bg-destructive text-white px-4 py-2 rounded hover:opacity-90;
}
```
```tsx
/* Component */
<button className="vibe-button-destructive">
  Delete
</button>
```
