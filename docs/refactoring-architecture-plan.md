# Plan de Refactorisation de l'Architecture

## 🎯 Analyse Actuelle

### ✅ **Points Forts**
- Structure Next.js 15 App Router correcte
- Intégration Clerk bien implémentée  
- Système de logging complet
- Configuration i18n de base
- TypeScript utilisé partout

### ⚠️ **Problèmes Identifiés**
1. **API mal organisée** : `test-db` mélangé avec les endpoints production
2. **Logique métier dans les routes** : Prisma directement dans les handlers
3. **i18n non implémentée** : `utils.ts` contient du code placeholder
4. **Pas de couche service** : Business logic dans les API routes
5. **Structure des tests manquante**
6. **Types globaux manquants**
7. **Client Prisma dupliqué** partout

---

## 🏗️ **Architecture Cible**

```
src/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Pages i18n
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── api/
│       ├── (public)/             # APIs publiques
│       │   └── users/
│       │       └── route.ts
│       └── (internal)/           # APIs internes/webhooks
│           ├── health/
│           │   └── route.ts
│           └── webhooks/
│               └── clerk/
│                   └── route.ts
│
├── lib/                          # Logique métier & utilitaires
│   ├── db/
│   │   └── prisma.ts            # Client Prisma singleton
│   ├── services/                 # Couche service
│   │   ├── user.service.ts
│   │   └── webhook.service.ts
│   ├── validation/               # Schemas Zod
│   │   └── user.schema.ts
│   ├── i18n/                     # next-intl configuration
│   │   ├── index.ts
│   │   └── dictionaries/
│   │       ├── fr.json
│   │       └── en.json
│   ├── logger/
│   │   └── index.ts
│   ├── utils/                    # Utilitaires purs
│   │   ├── env.ts
│   │   ├── errors.ts
│   │   └── constants.ts
│   └── middleware/               # Middlewares API
│       └── withError.ts
│
├── types/                        # Types TypeScript globaux
│   ├── user.d.ts
│   ├── api.d.ts
│   └── env.d.ts
│
├── components/                   # Composants React
│   ├── ui/                       # Composants réutilisables
│   │   ├── Button/
│   │   └── Modal/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── features/                 # Composants par fonctionnalité
│       ├── auth/
│       └── users/
│
├── hooks/                        # Hooks React personnalisés
│   ├── useAuth.ts
│   └── useLocale.ts
│
└── tests/                        # Tests isolés
    ├── unit/
    │   ├── services/
    │   │   └── user.service.test.ts
    │   └── utils/
    ├── integration/
    │   └── api/
    │       └── users.test.ts
    └── __mocks__/
        └── prisma.ts
```

---

## 🚀 **Plan de Migration - 8 Étapes**

### **Étape 1 : Créer la Structure de Base**
```bash
# Nouveaux dossiers
mkdir -p src/lib/{db,services,validation,utils,middleware}
mkdir -p src/types
mkdir -p src/tests/{unit,integration,__mocks__}
mkdir -p src/hooks
mkdir -p src/components/{ui,features}
```

### **Étape 2 : Client Prisma Singleton**
- Créer `src/lib/db/prisma.ts`
- Remplacer tous les `new PrismaClient()` 
- Éliminer les `$disconnect()` manuels

### **Étape 3 : Couche Service**
- Extraire logique métier vers `src/lib/services/`
- Créer `user.service.ts` et `webhook.service.ts`
- Fonctions pures, facilement testables

### **Étape 4 : Middleware d'Erreur**
- Créer `src/lib/middleware/withError.ts`
- Centraliser gestion d'erreur et logging
- Routes API deviennent des "thin controllers"

### **Étape 5 : Réorganiser APIs**
- Déplacer vers structure `(public)` / `(internal)`
- `test-db` → `(internal)/health` ou supprimer
- Webhooks restent dans `(internal)`

### **Étape 6 : Types Globaux**
- Créer `src/types/env.d.ts` pour variables d'environnement
- Créer `src/types/user.d.ts` et `api.d.ts`
- Validation env avec Zod

### **Étape 7 : i18n Propre**
- Installer `next-intl`
- Remplacer utils placeholder
- Migrer composants vers vraie i18n

### **Étape 8 : Tests & Finalisation**
- Configuration Vitest
- Tests unitaires pour services
- Tests d'intégration pour APIs
- Supprimer ancien code

---

## 📋 **Fichiers à Déplacer/Refactorer**

### **Haute Priorité**
1. **`src/app/api/test-db/`** → `src/app/api/(internal)/health/` ou supprimer
2. **`src/app/api/webhooks/clerk/route.ts`** → extraire logique vers service
3. **`src/app/api/users/route.ts`** → thin controller + service
4. **`src/lib/i18n/utils.ts`** → remplacer par next-intl

### **Moyenne Priorité**
1. **`src/components/layout/navbar.tsx`** → découper en composants plus petits
2. **`src/lib/logger.ts`** → déplacer vers `src/lib/logger/index.ts`

### **Basse Priorité**
1. Améliorer structure des composants
2. Ajouter hooks personnalisés
3. Optimiser middleware i18n

---

## 🧪 **Configuration des Tests**

### **Vitest + Testing Library**
```json
// vitest.config.ts
{
  "test": {
    "environment": "jsdom",
    "setupFiles": ["./tests/setup.ts"]
  }
}
```

### **Scripts Package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## ✅ **Bénéfices Attendus**

1. **Séparation des responsabilités** : Chaque couche a un rôle défini
2. **Testabilité** : Services isolés, facilement mockables  
3. **Maintenabilité** : Code organisé, facile à naviguer
4. **Scalabilité** : Ajout de features par modules
5. **Performance** : Singleton Prisma, pas de fuites de connexion
6. **Sécurité** : APIs internes/publiques séparées
7. **DX** : Types stricts, erreurs détectées tôt

---

## 🎯 **Prochaines Étapes**

1. **Confirmer le plan** avec votre équipe
2. **Commencer par l'étape 1** : Création des dossiers
3. **Migration progressive** : Une étape à la fois
4. **Tests à chaque étape** : Vérifier que tout fonctionne
5. **Documentation** : Mettre à jour README et guides

Voulez-vous que je commence la refactorisation par une étape spécifique ?
