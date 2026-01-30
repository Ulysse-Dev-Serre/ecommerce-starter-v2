import { cookies } from 'next/headers';
import { OptionalAuthContext } from '@/lib/middleware/withAuth';
import { CART_COOKIE_NAME } from '@/lib/config/site';

export interface CartIdentity {
  userId?: string;
  anonymousId?: string;
  newAnonymousId?: string;
}

/**
 * Résout l'identité du panier (User vs Guest)
 * Centralise la logique de récupération de l'ID depuis AuthContext ou Cookies
 * @param authContext Le contexte d'auth fourni par le middleware
 * @param createAnonymousId Si true, génère un nouvel ID anonyme s'il n'existe pas
 */
export async function resolveCartIdentity(
  authContext: OptionalAuthContext,
  createAnonymousId: boolean = false
): Promise<CartIdentity> {
  // Si l'utilisateur est authentifié, on utilise son ID
  if (authContext.isAuthenticated && authContext.userId) {
    return { userId: authContext.userId };
  }

  // Sinon, on cherche l'ID anonyme dans les cookies
  const cookieStore = await cookies();
  let anonymousId = cookieStore.get(CART_COOKIE_NAME)?.value;
  let newAnonymousId: string | undefined;

  // Si on doit créer un ID (ex: ajout panier) et qu'il n'y en a pas
  if (!anonymousId && createAnonymousId) {
    newAnonymousId = crypto.randomUUID();
    anonymousId = newAnonymousId;
  }

  return { userId: undefined, anonymousId, newAnonymousId };
}
