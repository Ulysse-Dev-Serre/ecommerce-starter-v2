# AI Context & Instructions

## 🧠 Business Context (CRITICAL)
This project is an **"Universal IoT E-commerce Starter"** for AgTechNest.
**Goal:** Rapidly deploy independent shops for niche IoT products (1-10 items max per shop).
**Strategy:**
- **Codebase:** One robust "Super-Starter" used as a template.
- **Database:** Full schema (Categories, Reviews...) is standard, even if unused for a mono-product shop. **DO NOT REMOVE unused tables**.
- **Dev Flow:** Clone repo -> New .env -> Skin Frontend -> Deploy.
- **Priority:** Stability & Launch Speed > Over-optimization.

## 🛠 Project Rules

Ceci est un **starter e-commerce universel** conçu pour être cloné et déployé rapidement dans différentes niches (plantes, électronique, jouets...) et différents pays. L'objectif est de pouvoir lancer une boutique en quelques jours plutôt qu'en plusieurs mois.

**Architecture multi-région** : Une même codebase peut être déployée plusieurs fois (ex: boutique Canada FR/EN + CAD, boutique USA EN + USD) avec la même base de données pour synchroniser les stocks. En développement, on travaille en mode unifié (toutes langues/devises activées) ; la configuration régionale se fait au moment du déploiement.

On utilise Next.js et l'ORM Prisma. Tu peux te référer à schema.prisma pour connaître la base de données.

Dans le dossier docs, presque toute la documentation est classée par catégories, donc il est assez facile de retrouver une information grâce à la doc.

Ici, on a déjà configuré plusieurs endpoints liés à l'authentification avec Clerk, mis en place les rôles admin avec RBAC, créé un tableau de bord admin, ajouté les endpoints nécessaires ainsi que le front-end pour ajouter, supprimer et éditer des produits avec image et description.

On utilise i18n, donc tout est traduit en français et en anglais.

Notre objectif principal est de travailler sur le backend (API, etc.). Le front-end est très minimal, uniquement pour tester le backend via une interface.

---

## 📋 Accès aux Issues GitHub via CLI

Pour analyser les issues du projet depuis le terminal, tu peux utiliser **GitHub CLI (`gh`)** :

### Vérifier que gh est installé
```bash
gh --version
```

### Lister toutes les issues
```bash
gh issue list --repo Ulysse-Dev-Serre/ecommerce-starter-v2 --limit 100 --state all --json number,title,state,labels,milestone
```

### Filtrer par milestone (P0, P1, P2, etc.)
```bash
gh issue list --repo Ulysse-Dev-Serre/ecommerce-starter-v2 --milestone "P1 – E-commerce core" --state all --json number,title,state
```

### Voir le détail d'une issue
```bash
gh issue view 23 --repo Ulysse-Dev-Serre/ecommerce-starter-v2 --json title,body,state
```

### Voir uniquement le body (checklist) d'une issue
```bash
gh issue view 23 --repo Ulysse-Dev-Serre/ecommerce-starter-v2 --json body | jq -r '.body'
```

### Boucle pour analyser plusieurs issues
```bash
for issue in 17 18 19 20; do 
  echo "=== Issue #$issue ===" 
  gh issue view $issue --repo Ulysse-Dev-Serre/ecommerce-starter-v2 --json title,body | jq -r '"\(.title)\n\(.body)\n"'
done
```

**Note** : Ces commandes permettent d'analyser l'état réel des issues sans avoir besoin d'accéder au kanban web.
