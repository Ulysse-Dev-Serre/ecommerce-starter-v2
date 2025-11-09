# Rate Limiting - Limitation de taux

## Vue d'ensemble

Système de rate limiting pour protéger l'API contre les abus et garantir une utilisation équitable des ressources.

## Configuration

### Limites par type d'endpoint

| Type | Limite | Fenêtre | Description |
|------|--------|---------|-------------|
| **PUBLIC** | 60 req | 1 minute | Routes publiques (GET products, cart) |
| **CART_WRITE** | 50 req | 1 minute | Opérations panier (ajout/modification/suppression) |
| **ADMIN** | 30 req | 1 minute | Routes administrateur (CRUD produits) |
| **WEBHOOK** | 100 req | 1 minute | Webhooks Clerk |
| **STRICT** | 5 req | 15 minutes | Actions sensibles (future) |

### Endpoints protégés

#### Routes publiques (60 req/min)
- `GET /api/products`
- `GET /api/products/[id]`
- `GET /api/cart`

#### Routes panier (50 req/min)
- `POST /api/cart/lines` - Ajouter au panier
- `PUT /api/cart/lines/[id]` - Modifier quantité
- `DELETE /api/cart/lines/[id]` - Supprimer item

#### Routes admin (30 req/min)
- `POST /api/products` - Créer produit
- `PUT /api/products/[id]` - Modifier produit
- `DELETE /api/products/[id]` - Supprimer produit
- `POST /api/users/[id]/promote` - Changer rôle

#### Webhooks (100 req/min)
- `POST /api/webhooks/clerk` - Synchronisation Clerk

## Identification utilisateur

Le rate limiting identifie les utilisateurs par :

1. **Priorité 1** : `clerkId` (utilisateurs authentifiés)
2. **Priorité 2** : Adresse IP (invités)

Headers vérifiés pour l'IP :
- `x-forwarded-for` (premier IP si multiple)
- `x-real-ip`
- IP de connexion directe

## Réponse lors de dépassement

### HTTP 429 Too Many Requests

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 45,
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

### Headers de réponse

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-01-08T12:01:00.000Z
```

## Implémentation

### Utilisation dans un endpoint

```typescript
import { withRateLimit, RateLimits } from '@/lib/middleware/withRateLimit';

async function handler(req: NextRequest): Promise<NextResponse> {
  // Votre logique
}

// Appliquer le rate limiting
export const POST = withError(
  withRateLimit(handler, RateLimits.CART_WRITE)
);
```

### Configuration personnalisée

```typescript
export const POST = withError(
  withRateLimit(handler, {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 requêtes max
    message: 'Custom message' // Message personnalisé
  })
);
```

## Stockage

### Version actuelle (Développement)
- **Stockage** : En mémoire (Map JavaScript)
- **Nettoyage** : Automatique toutes les 5 minutes
- **Limitation** : Perdu au redémarrage du serveur

### Production recommandée
- **Upstash Redis** : Stockage distribué persistant
- **Avantages** :
  - Partage entre instances Next.js
  - Persistance lors des redémarrages
  - Performance optimale
  - API Edge Runtime compatible

## Logs

### Dépassement de limite

```json
{
  "level": "warn",
  "action": "rate_limit_exceeded",
  "identifier": "ip:192.168.1.1",
  "path": "/api/cart/lines",
  "count": 51,
  "maxRequests": 50,
  "retryAfter": 45
}
```

### Nettoyage périodique

```json
{
  "level": "debug",
  "action": "rate_limit_cleanup",
  "cleaned": 127,
  "remaining": 45
}
```

## Tests

### Tester le rate limiting

```bash
# Script de test (bombarder un endpoint)
for i in {1..60}; do
  curl -X POST http://localhost:3000/api/cart/lines \
    -H "Content-Type: application/json" \
    -d '{"variantId":"test","quantity":1,"anonymousId":"test"}'
  echo " - Request $i"
done
```

**Résultat attendu** :
- Requêtes 1-50 : `200 OK` ou `404` (selon validité du variant)
- Requêtes 51+ : `429 Too Many Requests`

### Vérifier les headers

```bash
curl -i http://localhost:3000/api/products

# Voir les headers :
# X-RateLimit-Limit: 60
# X-RateLimit-Remaining: 59
```

## Migration vers Redis (Production)

### 1. Installer Upstash Redis

```bash
npm install @upstash/redis
```

### 2. Configuration

```env
# .env
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 3. Modifier le middleware

```typescript
// lib/middleware/withRateLimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Remplacer Map par Redis
const count = await redis.incr(key);
await redis.expire(key, Math.ceil(windowMs / 1000));
```

## Bonnes pratiques

### ✅ À faire
- Adapter les limites selon l'usage réel
- Monitorer les 429 en production
- Informer les utilisateurs du délai (`retryAfter`)
- Utiliser Redis en production

### ❌ À éviter
- Limites trop strictes (frustration utilisateurs)
- Limites trop permissives (abus possibles)
- Oublier les webhooks (taux élevé normal)
- Bloquer les IPs définitivement (utiliser fenêtres glissantes)

## Surveillance

### Métriques à suivre
- Taux de 429 par endpoint
- Temps de réponse sous charge
- Utilisateurs fréquemment limités
- Efficacité du nettoyage

### Alertes recommandées
- 429 > 5% du trafic total
- Même IP/user avec 100+ 429/heure
- Mémoire utilisée > 100MB (stockage Map)

## Roadmap

- [ ] Migration Redis (production)
- [ ] Dashboard monitoring
- [ ] Limites dynamiques (ajustement auto)
- [ ] Whitelist IPs de confiance
- [ ] Burst allowance (rafales courtes)
