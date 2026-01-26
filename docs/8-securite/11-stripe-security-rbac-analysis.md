# Stripe Security & RBAC Analysis

## 📋 Résumé Exécutif

Cette analyse examine la sécurité et le contrôle d'accès basé sur les rôles (RBAC) pour tous les endpoints liés à Stripe dans l'application e-commerce.

**Date d'analyse :** 2025-11-16  
**Scope :** Endpoints Stripe, webhooks, checkout, vérification de commandes

---

## 🔍 Endpoints Stripe Identifiés

### 1. `/api/webhooks/stripe` (POST)
**Fonction :** Réception des événements Stripe (paiements, sessions)  
**Fichier :** `src/app/api/webhooks/stripe/route.ts`

#### État actuel de sécurité : ✅ SÉCURISÉ

**Mécanismes de sécurité en place :**
```typescript
✅ Validation signature Stripe (HMAC)
✅ Vérification STRIPE_WEBHOOK_SECRET
✅ Idempotence (webhookEvent table, payloadHash)
✅ Protection replay attacks
✅ Logging complet
```

**Vulnérabilités potentielles :** ❌ AUCUNE

**Workflow de sécurité :**
```
1. Request arrive → vérification header 'stripe-signature'
2. validateWebhookSignature() → Stripe vérifie HMAC
3. Si signature invalide → 400 Bad Request
4. generatePayloadHash() → SHA-256 du payload
5. Check webhookEvent.payloadHash → évite replay
6. Si déjà processed → skip
7. Traitement événement
8. Mark processed = true
```

**Recommandations :** ✅ AUCUNE - Implémentation excellente

---

### 2. `/api/checkout/create-session` (POST)
**Fonction :** Créer une session Stripe Checkout  
**Fichier :** `src/app/api/checkout/create-session/route.ts`

#### État actuel de sécurité : ⚠️ PARTIELLEMENT SÉCURISÉ

**Mécanismes de sécurité en place :**
```typescript
✅ Validation corps de requête (validateCreateCheckoutSession)
✅ Vérification panier non vide
✅ Réservation stock avant paiement
✅ Metadata sécurisés (cartId, userId)
✅ Session expiration (30 minutes)
```

**⚠️ Vulnérabilités identifiées :**

#### **CRITIQUE : Bypass test en production**
```typescript
// Ligne 22-37
if (
  testApiKey &&
  process.env.TEST_API_KEY &&
  testApiKey === process.env.TEST_API_KEY &&
  process.env.NODE_ENV !== 'production'  // ⚠️ DANGER
) {
  // Bypass authentication
}
```

**Problème :** Si `NODE_ENV !== 'production'` n'est pas défini correctement, ce bypass peut être exploité.

**Solution recommandée :**
```typescript
// Supprimer complètement ce bypass OU
// Vérifier explicitement que NODE_ENV === 'development' ou 'test'
if (
  process.env.NODE_ENV === 'development' &&
  testApiKey === process.env.TEST_API_KEY
) {
  // Test mode
}
```

#### **MOYEN : Utilisateurs anonymes peuvent checkout**
```typescript
// Ligne 53-58
if (!userId && !anonymousId) {
  return 400; // OK
}
// Mais si anonymousId existe → checkout autorisé sans auth
```

**Impact :** Utilisateurs non connectés peuvent acheter (par design, mais risque de fraude).

**Solution recommandée :**
```typescript
// Option 1: Forcer auth pour checkout
if (!userId) {
  return NextResponse.json(
    { error: 'Authentication required for checkout' },
    { status: 401 }
  );
}

// Option 2: Limiter montant pour anonymous
if (!userId && cartTotal > 100) {
  return NextResponse.json(
    { error: 'Please sign in for orders over $100' },
    { status: 401 }
  );
}
```

#### **BAS : Pas de rate limiting**
**Impact :** Possibilité de spam, création de nombreuses sessions Stripe.

**Solution recommandée :**
```typescript
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

export const POST = withError(
  withRateLimit(createSessionHandler, RateLimits.CHECKOUT)
);
```

---

### 3. `/api/orders/verify` (GET)
**Fonction :** Vérifier si une commande existe pour un session_id  
**Fichier :** `src/app/api/orders/verify/route.ts`

#### État actuel de sécurité : 🔴 NON SÉCURISÉ

**⚠️ Vulnérabilités CRITIQUES :**

#### **CRITIQUE : Information Disclosure**
```typescript
// Ligne 7-17
async function verifyOrderHandler(request: NextRequest): Promise<NextResponse> {
  const sessionId = searchParams.get('session_id');
  
  // ❌ AUCUNE vérification d'authentification
  // N'importe qui peut vérifier n'importe quelle commande !
  
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { externalId: { contains: sessionId } },
        { transactionData: { path: ['id'], equals: sessionId } },
      ],
      status: 'COMPLETED',
    },
    include: {
      order: { /* ... */ }
    }
  });
  
  // ❌ Retourne orderNumber, orderId, createdAt
  // Sans vérifier que l'utilisateur est propriétaire !
}
```

**Impact :**
- Attaquant peut énumérer des session_ids
- Découvrir les orderNumbers des autres clients
- Voir les dates de commandes
- Potentielle fuite d'informations

**Solution OBLIGATOIRE :**
```typescript
import { auth } from '@clerk/nextjs/server';

async function verifyOrderHandler(request: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth();
  const sessionId = searchParams.get('session_id');
  
  // ✅ Vérifier authentification
  if (!clerkId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ✅ Récupérer userId from DB
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        { externalId: { contains: sessionId } },
        { transactionData: { path: ['id'], equals: sessionId } },
      ],
      status: 'COMPLETED',
      // ✅ CRITIQUE : Vérifier ownership
      order: {
        userId: user.id
      }
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          id: true,
          createdAt: true,
          userId: true, // Pour double-check
        },
      },
    },
  });
  
  // ✅ Double vérification ownership
  if (payment?.order && payment.order.userId !== user.id) {
    return NextResponse.json(
      { exists: false },
      { status: 403 } // Ou retourner 403 Forbidden
    );
  }
  
  // ... reste du code
}
```

---

### 4. `/api/checkout/success` (GET)
**Fonction :** Récupérer détails session Stripe  
**Fichier :** `src/app/api/checkout/success/route.ts`

#### État actuel de sécurité : ⚠️ À VÉRIFIER

**Action requise :** Analyser ce fichier pour vérifier l'authentification.

---

## 🔐 Matrice RBAC - Endpoints Stripe

| Endpoint | Méthode | Auth Required | Rôles autorisés | État actuel | Recommandation |
|----------|---------|---------------|-----------------|-------------|----------------|
| `/api/webhooks/stripe` | POST | ❌ (Signature Stripe) | N/A (Stripe only) | ✅ Sécurisé | Aucune |
| `/api/checkout/create-session` | POST | ⚠️ Optionnel | CLIENT, ADMIN, Anonymous | ⚠️ Bypass test mode | Supprimer bypass |
| `/api/orders/verify` | GET | ❌ Aucune | **TOUS (PUBLIC!)** | 🔴 CRITIQUE | **AJOUTER AUTH** |
| `/api/checkout/success` | GET | ❓ À vérifier | ? | ❓ | Analyser |

---

## 🚨 Vulnérabilités par Priorité

### 🔴 CRITIQUE - Action immédiate requise

1. **`/api/orders/verify` - Information Disclosure**
   - **Risque :** Énumération des commandes, fuite d'informations
   - **Action :** Ajouter authentification + vérification ownership
   - **Code fix :** Voir section ci-dessus

### ⚠️ ÉLEVÉ - À corriger rapidement

2. **`/api/checkout/create-session` - Test bypass en production**
   - **Risque :** Bypass authentification si mal configuré
   - **Action :** Restreindre à `NODE_ENV === 'development'` uniquement

3. **Absence de rate limiting**
   - **Risque :** Spam, abus de création de sessions Stripe
   - **Action :** Ajouter middleware `withRateLimit`

### 🟡 MOYEN - Amélioration recommandée

4. **Checkout anonyme sans limite**
   - **Risque :** Fraude, abus
   - **Action :** Considérer limite de montant pour anonymous

---

## 📝 Plan d'Action Recommandé

### Phase 1 - URGENT (À faire MAINTENANT)

**1. Sécuriser `/api/orders/verify`**
```bash
Priority: P0 - CRITICAL
Timeline: Immédiat
Effort: 30 minutes
```

**2. Retirer/Sécuriser le test bypass**
```bash
Priority: P1 - HIGH
Timeline: Aujourd'hui
Effort: 15 minutes
```

### Phase 2 - Court terme (Cette semaine)

**3. Ajouter rate limiting**
```bash
Priority: P1 - HIGH
Timeline: 2-3 jours
Effort: 1 heure
```

**4. Audit `/api/checkout/success`**
```bash
Priority: P2 - MEDIUM
Timeline: Cette semaine
Effort: 30 minutes
```

### Phase 3 - Moyen terme (Ce mois)

**5. Considérer restrictions checkout anonyme**
```bash
Priority: P3 - LOW
Timeline: 1-2 semaines
Effort: 2 heures (discussion + implémentation)
```

**6. Ajouter monitoring & alertes**
```bash
Priority: P2 - MEDIUM
Timeline: 2 semaines
Effort: 4 heures
```

---

## 🛡️ Recommandations Générales

### 1. Politique d'authentification stricte
```typescript
// Créer middleware auth réutilisable
// src/lib/middleware/withAuth.ts
export function withAuth(handler: Function, options?: {
  roles?: UserRole[];
  allowAnonymous?: boolean;
}) {
  return async (req: NextRequest) => {
    const { userId } = await auth();
    
    if (!userId && !options?.allowAnonymous) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Vérifier rôles si spécifié
    if (options?.roles && userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true }
      });
      
      if (!user || !options.roles.includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    return handler(req);
  };
}

// Utilisation
export const GET = withError(
  withAuth(verifyOrderHandler, { allowAnonymous: false })
);
```

### 2. Validation ownership systématique
Pour tous les endpoints retournant des données utilisateur :
```typescript
// Toujours vérifier que userId correspond
if (resource.userId !== requestingUserId) {
  return 403 Forbidden;
}
```

### 3. Logging et monitoring
```typescript
// Logger tous les accès sensibles
logger.warn({
  endpoint: '/api/orders/verify',
  userId,
  sessionId,
  success: false,
  reason: 'Unauthorized access attempt'
}, 'Security: Unauthorized access');
```

### 4. Configuration environnement
```bash
# .env.production
NODE_ENV=production
DISABLE_TEST_BYPASS=true

# Vérifier dans le code
if (process.env.DISABLE_TEST_BYPASS === 'true') {
  // Bloquer tout bypass
}
```

---

## ✅ Points Forts Actuels

1. **Webhook Stripe** - Excellente implémentation (Issue #49)
    - Signature validation HMAC-SHA256 ✅
    - Idempotence avec payloadHash ✅
    - Replay protection via table WebhookEvent ✅
    - Retry logic avec tracking (retryCount, lastError) ✅
    - Alertes Slack automatiques en cas d'erreur ✅
    - Monitoring endpoint `/api/webhooks/stripe/status` ✅

2. **Metadata sécurisés** - cartId, userId dans sessions Stripe

3. **Expiration sessions** - 30 minutes (bonne pratique)

4. **Logging complet** - Traçabilité des événements et alertes sécurité

---

## 📊 Score de Sécurité Stripe

| Catégorie | Score | Note |
|-----------|-------|------|
| Webhook Security | 10/10 | ✅ Excellent |
| Checkout Security | 6/10 | ⚠️ Améliorations nécessaires |
| Order Verification | 2/10 | 🔴 Critique - non sécurisé |
| Rate Limiting | 0/10 | ❌ Absent |
| **GLOBAL** | **4.5/10** | 🔴 **Action requise** |

---

## 🎯 Conclusion

**Statut actuel :** 🔴 VULNÉRABILITÉS CRITIQUES IDENTIFIÉES

**Actions prioritaires :**
1. ✅ Webhooks Stripe : Bien sécurisés
2. 🔴 `/api/orders/verify` : **CORRIGER IMMÉDIATEMENT**
3. ⚠️ Checkout : Améliorer (bypass test, rate limit)

**Temps estimé pour sécurisation complète :** 2-3 heures

**Impact business si non corrigé :**
- Fuite d'informations clients
- Énumération de commandes
- Potentielle fraude
- Non-conformité RGPD/PCI-DSS
