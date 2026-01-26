# CI/CD Pipeline - Guide complet

Pipeline de qualité de code automatisé : Lint, TypeCheck, Build et protection des branches.

---

## 🎯 **Les 3 étapes du CI/CD**

### **✅ Étape 1 : Outils de qualité de code**
### **✅ Étape 2 : Pipeline automatisé GitHub Actions**
### **✅ Étape 3 : Protection des branches**

---

## 🛠️ **Étape 1 : Outils de qualité de code**

### **🎯 Ce que ça fait**
Vérifie automatiquement la qualité de votre code à chaque modification.

**🔧 Outils configurés :**

**ESLint** → Vérifie les règles de code
- Variables non utilisées, imports incorrects, etc.
- Règles TypeScript et React intégrées
- Warnings en développement, strict en CI

**Prettier** → Formate automatiquement le code  
- Style uniforme (espaces, guillemets, indentation)
- Formatage automatique à chaque sauvegarde

**TypeScript** → Vérification des types
- Interfaces, fonctions, variables typées
- Erreurs bloquantes si types incorrects

### **📁 Fichiers de configuration**
- `eslint.config.mjs` → Règles ESLint
- `.prettierrc.json` → Style Prettier
- `tsconfig.json` → Configuration TypeScript

### **🚀 Commandes essentielles**
```bash
npm run typecheck     # TypeScript seulement
npm run lint          # ESLint seulement  
npm run format        # Formater le code
npm run ci            # Vérification complète (comme en CI)
npm run ci:fix        # Auto-correction + vérification
```

---

## ⚙️ **Étape 2 : Pipeline automatisé GitHub Actions**

### **🎯 Ce que ça fait**
À chaque push sur GitHub, lance automatiquement les vérifications de qualité.

**🔄 Processus automatique :**
1. **Push** → GitHub détecte le changement
2. **CI démarre** → Lance les vérifications
3. **Tests** → TypeScript + ESLint + Prettier + Build  
4. **Résultat** → ✅ Vert (OK) ou ❌ Rouge (problème)

### **📁 Fichier de configuration**
- `.github/workflows/ci.yml` → Pipeline GitHub Actions

### **🔧 Ce que fait le pipeline**
```yaml
# Étapes du pipeline :
1. Install dependencies (npm ci)
2. Check TypeScript (npm run typecheck)  
3. Check ESLint (npm run lint)
4. Check Prettier (npm run format:check)
5. Build Next.js (npm run build)
```

### **🎯 Variables d'environnement CI**
Le pipeline utilise des clés mock pour Clerk pour pouvoir faire le build :
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_mock_key_for_ci_build_only
CLERK_SECRET_KEY=sk_test_mock_key_for_ci_build_only  
NEXT_PUBLIC_CORS_ORIGIN="*"
```

---

## 🛡️ **Étape 3 : Fichier CI et vérifications automatiques**

### **🎯 Ce que fait le fichier `.github/workflows/ci.yml`**

**C'est LUI qui cause les coches rouges/vertes sur GitHub !**

**📝 Le fichier dit à GitHub :**
```yaml
# "À chaque push sur main, lance ces vérifications :"
on:
  push:
    branches: [ main ]

jobs:
  quality-check:
    name: Code Quality & Build  # ← Nom qui apparaît sur GitHub
    runs-on: ubuntu-latest     # ← Environnement Linux

    env:  # ← Variables pour que ça marche
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_mock_key_for_ci_build_only
      CLERK_SECRET_KEY: sk_test_mock_key_for_ci_build_only
      NEXT_PUBLIC_CORS_ORIGIN: "*"

    steps:
      - Checkout code           # Récupérer votre code
      - Setup Node.js          # Installer Node
      - Install dependencies    # npm ci
      - Run npm run ci         # VOS vérifications
```

### **🔄 Ce qui se passe à chaque push**

**1. Vous faites `git push origin main`**  
**2. GitHub voit le fichier `.github/workflows/ci.yml`**  
**3. GitHub dit : "Je dois lancer le CI !"**  
**4. GitHub lance un environnement Linux virtuel**  
**5. GitHub exécute `npm run ci` dans cet environnement**  
**6. Résultat :**
  - ✅ **Crochet bleu** = `npm run ci` a réussi  
  - ❌ **Croix rouge** = `npm run ci` a échoué

### **🎯 AVANT vs MAINTENANT**

**🔴 AVANT (sans ci.yml) :**
```
Push → GitHub stocke le code → FIN
(Pas de vérification, pas de coches)
```

**🔵 MAINTENANT (avec ci.yml) :**
```
Push → GitHub stocke le code → Lit ci.yml → Lance CI → ✅/❌ Résultat
```


### **🔧 Comment corriger si le CI échoue**

```bash
# 1. Corriger automatiquement
npm run ci:fix

# 2. Vérifier en local
npm run ci

# 3. Si ça passe, re-push
git add . && git commit -m "fix: resolve CI issues"
git push origin main  # → ✅ Accepté cette fois
```

### **🔧 Variables d'environnement importantes dans le CI**

**Ces variables permettent au CI de fonctionner :**
```yaml
env:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pk_test_mock_key_for_ci_build_only
  CLERK_SECRET_KEY: sk_test_mock_key_for_ci_build_only  
  NEXT_PUBLIC_CORS_ORIGIN: "*"
```

**🎯 Pourquoi on en a besoin :**
- **Next.js build** a besoin de clés Clerk pour le prerendering
- **Clés mock** permettent le build sans vraies clés  
- **CORS wildcard** évite les erreurs de configuration

### **💡 Le fichier `ci.yml` = Votre garde du corps**

**🛡️ Il empêche :**
- Push de code qui ne compile pas
- Code avec erreurs TypeScript  
- Code mal formaté
- Build qui échoue

**🚀 Il permet :**
- Push instantané si tout est propre
- Feedback précis si problème
- Développement sans surprise

---

## 📊 **Résumé des 3 étapes**

### **📝 Étape 1 : Outils configurés**
- ESLint, Prettier, TypeScript opérationnels
- Scripts `npm run ci` pour vérification locale

### **⚙️ Étape 2 : Pipeline automatique**  
- GitHub Actions exécute le CI sur chaque push
- Environnement CI configuré avec clés mock

### **🛡️ Étape 3 : Branches protégées**
- Push autorisé SEULEMENT si CI vert
- Configuration adaptée développeur solo

---

## 🔄 **Workflow final quotidien**

```bash
# Développement normal
git add .
git commit -m "feature: add new functionality"
git push origin main

# GitHub vérifie automatiquement :
# → TypeScript ✅ → ESLint ✅ → Prettier ✅ → Build ✅

# Résultat :
# Si tout passe ✅ → Push accepté
# Si problème ❌ → Push rejeté + feedback précis
```

### **🔧 Si problème détecté**

```bash
# 1. Correction automatique
npm run ci:fix

# 2. Vérification avant re-push  
npm run ci

# 3. Re-push une fois corrigé
git add . && git commit -m "fix: resolve issues"
git push origin main
```

---

## 🎯 **Avantages de ce pipeline**

### **✅ Qualité garantie**
- Impossible de push du code qui casse le build
- TypeScript + ESLint + Prettier appliqués systématiquement
- Build validé avant déploiement

### **🚀 Workflow efficace**  
- Feedback immédiat si problème
- Correction automatique avec `npm run ci:fix`
- Pas de bureaucratie inutile

### **📈 Évolutif**
- Facile d'ajouter des tests automatiques
- Prêt pour une équipe (ajouter reviews)
- Base solide pour déploiement automatique

**🏆 Résultat : Développement solo avec qualité professionnelle !**
