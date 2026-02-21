# 🧩 Guide des Composants Vibe

Ce guide répertorie les blocs visuels réutilisables du Starter. Suivez ces exemples pour maintenir la cohérence de l'interface tout en gardant la flexibilité du placement.

---

## 1. Interactions & Formulaires

Ces classes définissent le style (Look) des éléments interactifs.

### Boutons
- **Primaire** : `vibe-button-primary` (Bouton d'action principal, bleu par défaut).
- **Secondaire** : `vibe-button-secondary` (Bouton gris anthracite).

```tsx
<button className="vibe-button-primary h-12 px-6">Valider</button>
<button className="vibe-button-secondary h-12 px-6">Annuler</button>
```

### Champs de saisie
- **Input** : `vibe-input` (Champ texte standard avec bordures et focus).
- **Select** : Combinez `vibe-input` et `vibe-bg-select` pour un menu déroulant stylisé.

```tsx
<input type="text" className="vibe-input" placeholder="Nom..." />
<select className="vibe-input vibe-bg-select">
  <option>Option 1</option>
</select>
```

---

## 2. Structure & Conteneurs

### La "Carte" Vibe (`vibe-container`)
C'est le bloc de base pour regrouper du contenu. Il possède un fond blanc, une bordure légère et une ombre subtile.

```tsx
<div className="vibe-container p-6">
  <h3 className="vibe-h3">Titre de carte</h3>
  <p>Mon contenu textuel ici.</p>
</div>
```

### Boîte d'Information (`vibe-info-box`)
Utilisé pour les messages d'absence de contenu (ex: "Panier vide") ou les alertes douces.
- Bordures en pointillés et fond grisé.

```tsx
<div className="vibe-info-box">
  <p>Aucun produit trouvé.</p>
</div>
```

---

## 3. Éléments UI Additionnels

- **Badge** : `vibe-badge` (Pour les tags, statuts ou catégories).
- **Pagination** : `vibe-pagination-item` (Cercle ou carré pour la navigation numérotée).

```tsx
<span className="vibe-badge bg-primary/10 text-primary border-primary/20">
  Nouveau
</span>
```

---

## 4. Animations & Effets (TS Constants)

Pour les effets complexes, utilisez les constantes définies dans `src/lib/config/vibe-styles.ts`.

| Constante | Effet |
| :--- | :--- |
| `VIBE_ANIMATION_SLIDE_IN_BOTTOM` | Glissement doux du bas vers le haut. |
| `VIBE_ANIMATION_FADE_IN` | Apparition en fondu. |
| `VIBE_ANIMATION_ZOOM_IN` | Zoom léger à l'apparition. |

---

## 5. Exemples de Layout (Placement)

Utilisez **Tailwind** pour organiser vos composants Vibe en grilles ou en flexbox.

### Grille de Produits (4 colonnes)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
  {products.map(p => (
    <div key={p.id} className="vibe-container p-4">
      {/* Contenu du produit */}
    </div>
  ))}
</div>
```

### Barre d'Actions Centrée
```tsx
<div className="flex items-center justify-between vibe-container p-4">
  <span>{totalItems} Commandes</span>
  <button className="vibe-button-primary px-4 py-2">Exporter</button>
</div>
```
