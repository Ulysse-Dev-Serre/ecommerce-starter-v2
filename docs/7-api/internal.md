# API Internal

## Endpoints

### Health & Monitoring
- `GET /api/internal/health` - Santé application
  - **Auth**: Aucune (public)
  - **Retourne**: status, timestamp, database.connected, database.userCount, environment, version
  - **Usage**: Load balancer health check, monitoring
  - **Fichier**: `src/app/api/internal/health/route.ts`

## Notes
- Aucune authentification requise
- Ne requête BDD (vérification connectivité)
- Utilisé par orchestrateurs (Kubernetes, Docker, etc)
- Timeout court recommandé (< 5s)
- Pas d'exposition infos sensibles
