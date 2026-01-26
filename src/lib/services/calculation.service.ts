import { Decimal } from '@prisma/client/runtime/library';

import { logger } from '../logger';
import { CartProjection } from './cart.service';

import { SUPPORTED_CURRENCIES } from '../constants';
import { SupportedCurrency } from '../constants';

export type Currency = SupportedCurrency;

export interface CalculatedLineItem {
  cartItemId: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: Decimal;
  lineTotal: Decimal;
  currency: Currency;
}

export interface CartCalculation {
  currency: Currency;
  items: CalculatedLineItem[];
  subtotal: Decimal;
  itemCount: number;
  calculatedAt: Date;
}

/**
 * Arrondi banquier (half-even) pour les calculs financiers
 * Réduit le biais statistique sur de grands volumes de transactions
 */
export function roundHalfEven(value: Decimal, decimals: number = 2): Decimal {
  const multiplier = new Decimal(10).pow(decimals);
  const shifted = value.times(multiplier);
  const truncated = shifted.floor();
  const remainder = shifted.minus(truncated);

  if (remainder.lessThan(0.5)) {
    return truncated.dividedBy(multiplier);
  } else if (remainder.greaterThan(0.5)) {
    return truncated.plus(1).dividedBy(multiplier);
  } else {
    // Exactement 0.5 → arrondir vers le pair le plus proche
    if (truncated.mod(2).equals(0)) {
      return truncated.dividedBy(multiplier);
    } else {
      return truncated.plus(1).dividedBy(multiplier);
    }
  }
}

/**
 * Récupère le prix d'une variante pour une devise donnée
 * Retourne null si aucun prix n'est disponible pour cette devise
 */
function getPriceForCurrency(
  pricing: { price: any; currency: string }[],
  currency: Currency
): Decimal | null {
  const priceEntry = pricing.find(p => p.currency === currency);
  if (!priceEntry) return null;

  return new Decimal(priceEntry.price.toString());
}

/**
 * Récupère le prix d'une variante pour une devise donnée (STRICT)
 */
function getPrice(
  pricing: { price: any; currency: string }[],
  preferredCurrency: Currency
): { price: Decimal; currency: Currency } | null {
  const priceEntry = pricing.find(p => p.currency === preferredCurrency);

  if (priceEntry) {
    return {
      price: new Decimal(priceEntry.price.toString()),
      currency: preferredCurrency,
    };
  }

  return null;
}

/**
 * Calcule les totaux du panier pour une devise donnée
 * Source de vérité côté serveur pour tous les calculs de prix
 */
export function calculateCart(
  cart: CartProjection,
  currency: Currency
): CartCalculation {
  const startTime = Date.now();
  const calculatedItems: CalculatedLineItem[] = [];
  let subtotal = new Decimal(0);
  let itemCount = 0;

  for (const item of cart.items) {
    const priceData = getPrice(item.variant.pricing, currency);

    if (!priceData) {
      logger.error(
        {
          action: 'calculation_error',
          cartId: cart.id,
          variantId: item.variantId,
          sku: item.variant.sku,
          currency,
        },
        `No price found for variant ${item.variant.sku} in ${currency}`
      );
      continue;
    }

    const unitPrice = priceData.price;
    const lineTotal = roundHalfEven(unitPrice.times(item.quantity));

    calculatedItems.push({
      cartItemId: item.id,
      variantId: item.variantId,
      sku: item.variant.sku,
      productName:
        item.variant.product.translations[0]?.name || item.variant.sku,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      currency: priceData.currency,
    });

    subtotal = subtotal.plus(lineTotal);
    itemCount += item.quantity;
  }

  // Arrondi final du sous-total
  subtotal = roundHalfEven(subtotal);

  const calculation: CartCalculation = {
    currency,
    items: calculatedItems,
    subtotal,
    itemCount,
    calculatedAt: new Date(),
  };

  // Journalisation des inputs/outputs
  logger.info(
    {
      action: 'cart_calculated',
      cartId: cart.id,
      currency,
      inputItemsCount: cart.items.length,
      outputItemsCount: calculatedItems.length,
      subtotal: subtotal.toString(),
      itemCount,
      durationMs: Date.now() - startTime,
    },
    `Cart calculated: ${subtotal.toString()} ${currency}`
  );

  return calculation;
}

/**
 * Valide que le panier peut être converti en commande
 * Vérifie les stocks, les prix disponibles, etc.
 */
export function validateCartForCheckout(
  cart: CartProjection,
  currency: Currency
): { valid: boolean; errors: string[] } {
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

/**
 * Convertit le calcul en format sérialisable pour l'API
 */
export function serializeCalculation(calculation: CartCalculation): {
  currency: Currency;
  items: Array<{
    cartItemId: string;
    variantId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
    currency: Currency;
  }>;
  subtotal: string;
  itemCount: number;
  calculatedAt: string;
} {
  return {
    currency: calculation.currency,
    items: calculation.items.map(item => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
    subtotal: calculation.subtotal.toString(),
    itemCount: calculation.itemCount,
    calculatedAt: calculation.calculatedAt.toISOString(),
  };
}
