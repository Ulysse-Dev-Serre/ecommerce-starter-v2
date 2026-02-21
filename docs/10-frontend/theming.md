# 🎨 Guide du Thème (Theming)

Ce document explique comment personnaliser l'apparence visuelle de votre Starter en modifiant les jetons de design (tokens) centralisés.

---

## 1. Le Cœur du Design : `globals.css`

L'identité visuelle est pilotée par des variables CSS situées dans `src/styles/globals.css`. C'est l'unique endroit où vous devez intervenir pour changer l'ambiance du site.

### Les Groupes de Variables :
- **Colors** : Définit les teintes de la marque (Primary, Success, Error).
- **Neutrals** : Définit les fonds de page, les bordures et les couleurs de texte.
- **Aesthetic Tokens** : Pilote les arrondis (`--radius-*`) et les ombres (`--shadow-*`).

---

## 2. Personnalisation Rapide

### Changer les Couleurs de la Marque
Pour passer d'un bleu classique à un vert forêt, modifiez simplement les variables `--primary` dans le bloc `:root` :

```css
:root {
  --primary: #14532d;       /* Votre nouveau vert */
  --primary-hover: #166534; /* Variante survol */
}
```

### Harmoniser les Formes
Vous pouvez changer l'aspect de tous les boutons et champs de saisie en modifiant une seule ligne :

```css
:root {
  --radius-button: 9999px; /* Pour des boutons totalement arrondis (pill) */
  --radius-sm: 0px;        /* Pour des champs de saisie carrés (brutalisme) */
}
```

---

## 3. Liaison avec Tailwind v4

Le projet utilise le nouveau moteur de thème de Tailwind v4. Les variables CSS définies dans `:root` sont automatiquement injectées dans Tailwind via le bloc `@theme inline`.

**Exemple d'utilisation dans votre code :**
- La variable `--primary` devient la classe `bg-primary`.
- La variable `--muted` devient `bg-muted` ou `text-muted`.

---

## 4. Animations et Styles Complexes

Pour les styles qui ne peuvent pas être mis en CSS (animations groupées, typographie riche), nous utilisons un fichier de configuration JavaScript.

**Fichier** : `src/lib/config/vibe-styles.ts`

Si vous souhaitez changer l'animation d'apparition globale (ex: passer de "glissement" à "zoom"), modifiez la constante correspondante dans ce fichier.

---

## 5. Checklist de Branding

Pour déployer une nouvelle version personnalisée de la boutique :
1. [ ] **Couleurs** : Ajuster les codes HEX dans `globals.css`.
2. [ ] **Typographie** : Modifier les familles de polices (`--font-heading`, `--font-body`).
3. [ ] **Arrondis** : Définir le degré de "rondeur" via `--radius-*`.
4. [ ] **Logo** : Remplacer les fichiers dans `/public`.
