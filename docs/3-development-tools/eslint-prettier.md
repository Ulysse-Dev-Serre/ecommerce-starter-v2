# ESLint & Prettier - Configuration

Ce document décrit la configuration des outils de qualité de code du projet.

## 🎯 **Philosophie**

**Approche pragmatique** : Configuration moins bloquante en développement local, plus stricte en CI/CD.
- **Warnings localement** pour ne pas casser le flow de développement
- **Errors en CI** pour maintenir la qualité du code en production

---

## 🛠️ **Scripts disponibles**

```bash
# Formater le code avec Prettier
npm run format

# Vérifier la qualité avec ESLint
npm run lint

# Auto-fix des problèmes ESLint
npm run lint:fix
```

---

## ⚙️ **Configuration ESLint**

### **Fichiers de configuration**
- **`eslint.config.mjs`** - Configuration principale ESLint moderne (flat config)
- **`tsconfig.eslint.json`** - Configuration TypeScript spécifique pour ESLint

### **Extensions utilisées**
- `next/core-web-vitals` - Règles NextJS optimisées
- `next/typescript` - Support TypeScript NextJS
- `prettier` - Intégration avec Prettier

### **Règles principales**

#### **TypeScript - Warnings par défaut**
```javascript
'@typescript-eslint/no-unused-vars': 'warn'          // Variables non utilisées
'@typescript-eslint/no-explicit-any': 'warn'         // Type any explicite
'@typescript-eslint/explicit-function-return-type': 'warn'  // Types retour fonctions
'@typescript-eslint/no-floating-promises': 'warn'    // Promises non gérées
```

#### **Imports & Organisation**
```javascript
'import/order': 'warn'        // Ordre des imports
'import/no-duplicates': 'warn' // Imports dupliqués
'import/no-unresolved': 'error' // Imports non résolus
```

#### **React/JSX**
```javascript
'react/prop-types': 'off'                    // Pas de PropTypes (TypeScript)
'react/jsx-props-no-spreading': 'warn'       // Spreading props
'react/jsx-boolean-value': 'warn'            // Valeurs booléennes
```

#### **Général**
```javascript
'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
'no-debugger': 'error'
'prefer-const': 'warn'
'prefer-template': 'warn'
```

### **Fichiers ignorés**
- `node_modules/**`
- `.next/**`
- `build/**`, `dist/**`
- `next-env.d.ts`

### **Overrides pour tests**
Les fichiers de test (`**/*.test.ts`, `scripts/**`, `tests/**`) ont des règles moins strictes :
- Pas de type de retour obligatoire
- `any` autorisé
- Promises flottantes acceptées

---

## 🎨 **Configuration Prettier**

### **Fichier : `.prettierrc.json`**

```json
{
  "semi": true,              // Point-virgules obligatoires
  "trailingComma": "es5",    // Virgules traînantes (ES5)
  "singleQuote": true,       // Guillemets simples
  "tabWidth": 2,             // Indentation 2 espaces
  "printWidth": 80,          // Largeur maximale ligne
  "bracketSpacing": true,    // Espaces dans objets { foo }
  "arrowParens": "avoid"     // Pas de parenthèses arrow functions
}
```

### **Exemples de formatage**

**Avant :**
```typescript
const user={name:"John",age:30,}
const getName=(user)=>user.name
```

**Après :**
```typescript
const user = { name: 'John', age: 30 };
const getName = user => user.name;
```

---

## 🔧 **Intégration IDE**

### **VSCode (recommandé)**

**Extensions à installer :**
- ESLint
- Prettier - Code formatter

**Paramètres VSCode (`.vscode/settings.json`) :**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["typescript", "typescriptreact"]
}
```

---

## 🚀 **Workflow recommandé**

### **1. Développement**
- **Format automatique** à la sauvegarde (Prettier)
- **Warnings ESLint** visibles mais non bloquants
- **Auto-fix** des problèmes simples

### **2. Pre-commit** (futur)
```bash
# Hook pré-commit (à configurer)
npm run lint
npm run format
```

### **3. CI/CD**
```bash
# Vérifications strictes en CI
npm run lint        # Fail si errors
npm run format:check # Fail si non formaté
```

---

## 🐛 **Dépannage**

### **Erreur "Import not resolved"**
```bash
# Vérifier la configuration TypeScript
npx tsc --noEmit
```

### **Conflit ESLint/Prettier**
- Vérifier que `prettier` est dans les extends ESLint
- Redémarrer l'extension VSCode ESLint

### **Performance lente**
```bash
# Cache ESLint
npx eslint --cache .
```

---

## 📝 **Configuration personnalisée**

Pour ajuster les règles selon vos besoins :

1. **Modifier `eslint.config.mjs`**
2. **Tester localement** : `npm run lint`

