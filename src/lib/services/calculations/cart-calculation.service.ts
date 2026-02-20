import { Decimal } from '@prisma/client/runtime/library';

import { logger } from '@/lib/core/logger';
import {
  Currency,
  CalculatedLineItem,
  CartCalculation,
  SerializedCartCalculation,
} from '@/lib/types/domain/calculation';
import { CartProjection } from '@/lib/types/domain/cart';

import { roundHalfEven } from './math-utils.service';

/**
 * Récupère le prix d'une variante pour une devise donnée (STRICT)
 *
 * @param pricing - Tableau de prix de la variante
 * @param preferredCurrency - Devise souhaitée
 * @returns Le prix et la devise ou null
 */
export function getPrice(
  pricing: Array<{ price: Decimal | number | string; currency: string }>,
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
 *
 * @param cart - Projection du panier
 * @param currency - Devise de calcul
 * @returns Objet CartCalculation complet
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

  // Journalisation
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
 * Convertit le calcul en format sérialisable pour l'API
 *
 * @param calculation - Le calcul a sérialiser
 * @returns Objet sérialisé (chaînes de caractères au lieu de Decimals/Dates)
 */
export function serializeCalculation(
  calculation: CartCalculation
): SerializedCartCalculation {
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
