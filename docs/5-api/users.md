# API Users

## Endpoints

### Client/Admin
- `GET /api/users` - Liste tous les utilisateurs (admin uniquement)
  - **Auth**: Admin
  - **Fichier**: `src/app/api/users/route.ts`

- `POST /api/users/[id]/promote` - Toggle rôle CLIENT ↔ ADMIN
  - **Auth**: Admin
  - **Params**: id (UUID)
  - **Body**: Aucun (toggle automatique)
  - **Fichier**: `src/app/api/users/[id]/promote/route.ts`

## Notes
- Utilisateurs synchronisés via webhook Clerk
- Rôles: CLIENT, ADMIN
- Email et clerkId uniques
