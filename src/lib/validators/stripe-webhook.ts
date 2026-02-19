import { z } from 'zod';

/**
 * Parsing strict des items stockés dans les métadonnées Stripe.
 * Les métadonnées Stripe sont toujours des chaînes de caractères (JSON stringified).
 */
export const stripeItemSchema = z.object({
  variantId: z.string(),
  quantity: z.number().int().positive(),
});

export const stripeMetadataSchema = z.object({
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
  cartId: z.string().optional(),
  // "items" est une chaîne JSON qui doit être parsée
  items: z.string().optional(),
});

export type StripeMetadata = z.infer<typeof stripeMetadataSchema>;

export type StripeItem = z.infer<typeof stripeItemSchema>;

/**
 * Helper to safely parse metadata items
 */
export function parseStripeItems(itemsJson: string | undefined): StripeItem[] {
  if (!itemsJson) return [];
  try {
    const raw = JSON.parse(itemsJson);
    return z.array(stripeItemSchema).parse(raw);
  } catch (_error) {
    // Si le parsing échoue, on retourne un tableau vide ou on throw selon la stratégie
    // Ici on préfére retourner vide pour ne pas crasher tout le processus,
    // mais le service devra vérifier si items.length > 0
    return [];
  }
}
