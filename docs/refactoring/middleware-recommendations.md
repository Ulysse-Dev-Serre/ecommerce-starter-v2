# Recommandations d'amélioration mineures pour /lib/middleware/

## 1. Nettoyer les commentaires obsolètes dans withAuth.ts

**Lignes concernées :** 5-29, 58-60, 232-235

**Problème :** Documentation de bypass de test qui n'existe plus dans le code.

**Action :**
- Supprimer les commentaires des lignes 5-29 (bloc "BYPASS AUTHENTICATION")
- Supprimer "// FIN DU BYPASS DE TEST" lignes 59 et 234

---

## 2. (OPTIONNEL) Centraliser les types ApiHandler

**Fichier à créer :** `/lib/middleware/types.ts`

**Contenu suggéré :**
```typescript
import { NextResponse, NextRequest } from 'next/server';

export type ApiHandler<T = any> = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse> | NextResponse;
```

**Fichiers à modifier :**
- withAuth.ts (ligne 39)
- withError.ts (ligne 6)  
- withValidation.ts (ligne 5)

**Bénéfice :** DRY (Don't Repeat Yourself)

---

## 3. (FUTUR) Prévoir migration Rate Limiting vers Redis

**Fichier :** withRateLimit.ts

**Status actuel :** ✅ Bien documenté (ligne 12 : "à remplacer par Redis en prod")

**Action future :** Quand tu passes en production, utiliser Upstash Redis ou Vercel KV.

**Aucune action immédiate requise.**
