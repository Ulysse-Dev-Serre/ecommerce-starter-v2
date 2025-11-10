# 🔒 Sécurité - E-Commerce Starter v2

## ✅ Mesures de Sécurité Implémentées

### 🛡️ Authentification & Autorisation

#### **Clerk Authentication**
- ✅ Toutes les routes admin protégées par middleware `withAdmin()`
- ✅ Vérification du rôle ADMIN obligatoire (`UserRole.ADMIN`)
- ✅ Webhooks Clerk validés avec signature Svix
- ✅ Logs de toutes les tentatives d'accès non autorisées

**Fichiers clés :**
- `src/lib/middleware/withAuth.ts` - Protection routes & vérification rôles
- `src/app/api/webhooks/clerk/route.ts` - Validation webhooks

#### **Protection des Routes API**

Toutes les routes `/api/admin/*` utilisent :
```typescript
export const GET = withError(withAdmin(withRateLimit(handler, RateLimits.ADMIN)));
```

**3 couches de sécurité :**
1. `withError` - Gestion d'erreurs sécurisée (pas de leak d'infos en prod)
2. `withAdmin` - Vérification rôle ADMIN
3. `withRateLimit` - Protection anti-bruteforce

### 💳 Paiements (Stripe - À implémenter)

**⚠️ TODO avant production :**
- [ ] Implémenter webhooks Stripe avec validation signature
- [ ] Stocker clés Stripe uniquement en variables d'environnement
- [ ] Utiliser Stripe Elements pour saisie sécurisée des cartes
- [ ] Implémenter 3D Secure (SCA - Strong Customer Authentication)
- [ ] Logger tous les événements de paiement

**Variables d'environnement requises :**
```bash
STRIPE_SECRET_KEY=sk_live_xxxxx  # Jamais en dur dans le code!
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 🔐 Gestion des Secrets

#### **✅ Vérifications effectuées :**
- ✅ Aucun secret/clé en dur dans le code
- ✅ Toutes les clés via `process.env.*`
- ✅ `.env.example` fourni sans valeurs sensibles
- ✅ `.gitignore` configuré pour exclure `.env`

#### **Variables d'environnement critiques :**
```bash
# Clerk Authentication
CLERK_SECRET_KEY=sk_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxxx

# Database
DATABASE_URL=postgresql://...

# Storage (si cloud)
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Stripe (à ajouter)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 🚨 Règles ESLint de Sécurité

**Erreurs bloquantes (CI fail) :**
- ❌ `@typescript-eslint/no-floating-promises` - Promises non gérées = failles potentielles
- ❌ `@typescript-eslint/ban-ts-comment` - @ts-ignore cache les vrais problèmes
- ❌ `no-debugger` - Jamais en production
- ❌ `no-var` - Scope dangereux

**Warnings (bonnes pratiques) :**
- ⚠️ `@typescript-eslint/no-explicit-any` - Perte de validation de types
- ⚠️ `@typescript-eslint/no-unused-vars` - Code mort potentiellement dangereux
- ⚠️ `react-hooks/exhaustive-deps` - Comportement React imprévisible

### 🔍 Rate Limiting

Protection DDoS/bruteforce sur toutes les routes admin :
```typescript
RateLimits.ADMIN = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requêtes max
}
```

**Fichier :** `src/lib/middleware/withRateLimit.ts`

## 🚀 CI/CD Sécurisé

### Workflow GitHub Actions

**Sur PRs/develop (rapide):**
- ✅ TypeCheck
- ✅ Lint (règles sécurité)

**Sur main (avant déploiement):**
- ✅ TypeCheck
- ✅ Lint
- ✅ Format check
- ✅ Build complet

**Fichier :** `.github/workflows/ci.yml`

## ⚠️ Checklist Pré-Production

### Avant de déployer en production :

- [ ] **Stripe** : Implémenter webhooks + validation signatures
- [ ] **Stripe** : Tester 3D Secure (SCA)
- [ ] **Stripe** : Passer aux clés `sk_live_*` (pas `sk_test_*`)
- [ ] **HTTPS** : Certificat SSL valide
- [ ] **CORS** : Configurer origins autorisés (pas `*`)
- [ ] **Headers** : Ajouter CSP, HSTS, X-Frame-Options
- [ ] **Logs** : Centraliser les logs (Datadog, Sentry, etc.)
- [ ] **Backup DB** : Stratégie de backup automatisée
- [ ] **Secrets** : Rotation des clés API/secrets
- [ ] **Tests** : Tests E2E sur flows paiement

## 📞 Contact Sécurité

Pour signaler une vulnérabilité : [AJOUTER EMAIL SÉCURITÉ]

**Ne pas créer d'issue publique pour les failles de sécurité !**

---

Dernière mise à jour : 10 novembre 2025
