# Guide des Thèmes CSS

## 🎯 Objectif

Guide pratique pour personnaliser rapidement l'apparence d'une nouvelle boutique en modifiant les couleurs, typographie et style général sans toucher au code des composants.

---

## 🔧 Système de variables CSS

Le projet utilise un système de variables CSS qui permet de changer complètement l'apparence en quelques minutes.

### Structure du système de thème

```css
/* src/app/globals.css */
:root {
  /* Couleurs de marque */
  --primary: #6c47ff; /* Couleur principale (boutons, liens) */
  --primary-hover: #5b3fe6; /* Couleur au survol */
  --primary-foreground: #ffffff; /* Texte sur couleur primaire */

  /* Couleurs neutres */
  --background: #ffffff; /* Fond principal des pages */
  --foreground: #171717; /* Texte principal */
  --muted: #94a3b8; /* Texte secondaire/description */
  --muted-foreground: #64748b; /* Texte sur fond muted */

  /* Couleurs fonctionnelles */
  --destructive: #ef4444; /* Actions destructrices (supprimer) */
  --success: #22c55e; /* Actions réussies */
  --warning: #f59e0b; /* Alertes/avertissements */

  /* Interface */
  --border: #e2e8f0; /* Bordures générales */
  --input: #e2e8f0; /* Bordures des champs */
  --ring: #6c47ff; /* Focus des éléments */
  --radius: 0.5rem; /* Rayon des bordures arrondies */
}
```

---

## 🚀 Méthodes de personnalisation

### Méthode 1: Modification directe dans globals.css

**Plus rapide pour une boutique spécifique**

1. **Ouvrir** `src/app/globals.css`
2. **Modifier les variables** dans `:root` :

```css
:root {
  /* Exemple pour boutique de plantes */
  --primary: #22c55e; /* Vert émeraude */
  --primary-hover: #16a34a; /* Vert plus foncé */
  --background: #f0fdf4; /* Fond vert très pâle */
  --muted: #86efac; /* Accents verts */
}
```

### Méthode 2: Classes de thème prédéfinies

**Utile pour tester ou changer rapidement**

Ajouter une classe au `<body>` dans `src/app/[locale]/layout.tsx` :

```tsx
<body className={`${yourThemeClass} antialiased`}>
```

**Classes disponibles :**

- `theme-light` - Thème clair classique
- `theme-dark` - Thème sombre
- `theme-purple` - Violet (créatif/tech)
- `theme-green` - Vert (nature/bio)
- `theme-blue` - Bleu (corporate)

### Méthode 3: Variables dynamiques (JavaScript)

**Pour changement programmatique**

```typescript
// Changer via JavaScript
document.documentElement.style.setProperty('--primary', '#FF6B6B');
document.documentElement.style.setProperty('--background', '#F7F9FC');
```

---

## 🎨 Exemples de thèmes par niche

### 🌱 Boutique de plantes

```css
:root {
  --primary: #22c55e; /* Vert nature */
  --primary-hover: #16a34a;
  --background: #f0fdf4; /* Fond verdâtre subtil */
  --accent: #dcfce7; /* Accents verts pâles */
}
```

### 🐕 Accessoires pour animaux

```css
:root {
  --primary: #f59e0b; /* Orange chaleureux */
  --primary-hover: #d97706;
  --background: #fffbeb; /* Fond crème */
  --accent: #fef3c7; /* Accents dorés */
}
```

### 🧸 Jouets pour enfants

```css
:root {
  --primary: #ec4899; /* Rose vif */
  --primary-hover: #db2777;
  --background: #fdf2f8; /* Fond rose pâle */
  --accent: #fce7f3; /* Accents roses */
}
```

### 💻 Électronique/Tech

```css
:root {
  --primary: #3b82f6; /* Bleu tech */
  --primary-hover: #2563eb;
  --background: #f8fafc; /* Fond gris très clair */
  --accent: #e2e8f0; /* Accents gris */
}
```

---

## 🔍 Zones clés à personnaliser

### Variables CSS globales (globals.css)

- **Couleurs principales** - Impact sur boutons, liens, éléments interactifs
- **Backgrounds** - Fonds de pages et composants
- **Typographie** - Si modification des fonts nécessaire

### Éléments spécifiques dans le code

**Navbar** (`src/components/layout/navbar.tsx`)

```tsx
// Classes Tailwind à modifier si couleurs personnalisées nécessaires
className = 'bg-background border-b border-border';
```

**Boutons** (composants UI)

```tsx
// Classes Tailwind pour styles personnalisés
className = 'bg-primary hover:bg-primary-hover text-primary-foreground';
```

### Logo et favicon

- **Logo** - Remplacer dans `public/` et mettre à jour les imports
- **Favicon** - Remplacer `src/app/favicon.ico`

---

## 🛠️ Workflow de personnalisation

### Pour une nouvelle boutique

1. **Définir la palette de couleurs**
   - Couleur principale de la marque
   - Couleurs complémentaires
   - Couleurs neutres (backgrounds, textes)

2. **Modifier globals.css**
   - Remplacer les variables `--primary`, `--background`, etc.
   - Tester en temps réel (npm run dev)

3. **Ajuster les détails**
   - Vérifier les contrastes d'accessibilité
   - Tester mode sombre si activé
   - Ajuster les accents si nécessaire

4. **Assets visuels**
   - Remplacer le logo
   - Mettre à jour le favicon
   - Ajouter images de marque

---

## 🐛 Debugging des thèmes

### Problèmes courants

**Thème ne s'applique pas :**

1. Vérifier la syntaxe CSS des variables
2. Vider le cache navigateur (Ctrl+F5)
3. Vérifier que la classe est appliquée au `<body>`

**Couleurs ne changent pas :**

1. Inspecter l'élément avec DevTools
2. Vérifier que les classes Tailwind utilisent les variables CSS
3. S'assurer qu'aucun style inline n'écrase les variables

**Contraste insuffisant :**

1. Utiliser des outils de contraste (WebAIM)
2. Ajuster les couleurs pour respecter WCAG 2.1 AA
3. Tester avec différentes tailles de texte

### Outils de développement

```bash
# Voir les changements en temps réel
npm run dev

# Tester le build de production
npm run build && npm start
```

**DevTools CSS :**

- Onglet "Computed" pour voir les valeurs résolues
- Modifier les variables en temps réel pour tester
- Utiliser l'inspecteur de couleurs pour l'accessibilité

---

## 📝 Checklist de personnalisation

### Couleurs

- [ ] Variable `--primary` modifiée
- [ ] Variable `--primary-hover` ajustée
- [ ] Background principal (`--background`) défini
- [ ] Couleurs de texte (`--foreground`, `--muted`) contrastées
- [ ] Test accessibilité des contrastes

### Branding

- [ ] Logo remplacé dans `public/`
- [ ] Favicon mis à jour
- [ ] Nom de marque dans les traductions (`fr.json`, `en.json`)

### Test final

- [ ] Navigation complète du site
- [ ] Test sur mobile et desktop
- [ ] Vérification mode sombre (si activé)
- [ ] Performance (pas d'impact sur les Core Web Vitals)

---

## 🎯 Points importants

- **Zero recompilation** requise lors du changement des variables CSS
- **Application instantanée** des modifications en développement
- **Séparation parfaite** entre logique métier et présentation
- **Extensible** : ajouter autant de variables que nécessaire
- **Compatible** avec tous les composants existants

**Temps estimé** : 30 minutes pour une personnalisation complète d'une nouvelle boutique.
