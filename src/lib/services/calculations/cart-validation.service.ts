import { logger } from '@/lib/core/logger';
import { CartProjection } from '@/lib/types/domain/cart';
import { Currency, CartValidationResult } from '@/lib/types/domain/calculation';
import { getPrice } from './cart-calculation.service';

/**
 * Valide que le panier peut être converti en commande
 * Vérifie les stocks, les prix disponibles, etc.
 *
 * @param cart - Panier à valider
 * @param currency - Devise de validation
 * @returns Objet de résultat avec statut et erreurs éventuelles
 */
export function validateCartForCheckout(
  cart: CartProjection,
  currency: Currency
): CartValidationResult {
  const errors: string[] = [];

  if (cart.items.length === 0) {
    errors.push('Cart is empty');
  }

  for (const item of cart.items) {
    // Vérifier le prix
    const priceData = getPrice(item.variant.pricing, currency);
    if (!priceData) {
      errors.push(`No price available for ${item.variant.sku} in ${currency}`);
    }

    // Vérifier le stock
    if (item.variant.inventory?.trackInventory) {
      if (
        item.variant.inventory.stock < item.quantity &&
        !item.variant.inventory.allowBackorder
      ) {
        errors.push(
          `Insufficient stock for ${item.variant.sku}: ${item.variant.inventory.stock} available, ${item.quantity} requested`
        );
      }
    }
  }

  if (errors.length > 0) {
    logger.warn(
      {
        action: 'cart_validation_failed',
        cartId: cart.id,
        currency,
        errors,
      },
      'Cart validation failed'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
