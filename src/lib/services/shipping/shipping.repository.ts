import { prisma } from '@/lib/core/db';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

import { Prisma } from '@/generated/prisma';
import { ProductVariantInclude } from '@/generated/prisma/models/ProductVariant';

/**
 * Strict definition of the relations required for shipping calculations.
 * Using a constant and satisfying the type ensures that any changes to
 * these requirements will be caught at compile time.
 */
export const SHIPPING_VARIANT_INCLUDE = {
  pricing: { orderBy: { validFrom: 'desc' }, take: 1 },
  product: {
    include: {
      translations: true,
      shippingOrigin: true,
    },
  },
} satisfies ProductVariantInclude;

export type ShippingVariantWithRelations = Prisma.ProductVariantGetPayload<{
  include: typeof SHIPPING_VARIANT_INCLUDE;
}>;

export interface ShippingItem {
  variant: ShippingVariantWithRelations;
  quantity: number;
}

export class ShippingRepository {
  /**
   * Resolves shipping items from a cartId or a manual list of variant IDs.
   * Centralizes Prisma logic for data enrichment.
   */
  static async resolveItems(
    cartId?: string,
    manualItems?: { variantId: string; quantity: number }[]
  ): Promise<ShippingItem[]> {
    let shippingItems: ShippingItem[] = [];

    const includeFields =
      SHIPPING_VARIANT_INCLUDE satisfies Prisma.ProductVariantInclude;

    if (manualItems && manualItems.length > 0) {
      const variantIds = manualItems.map(i => i.variantId);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: includeFields,
      });

      shippingItems = manualItems.map(item => {
        const variant = variants.find(v => v.id === item.variantId);
        if (!variant) {
          throw new AppError(
            ErrorCode.NOT_FOUND,
            `Variant not found: ${item.variantId}`,
            404
          );
        }
        return {
          quantity: item.quantity,
          variant: variant as ShippingVariantWithRelations,
        };
      });
    } else if (cartId) {
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              variant: {
                include: includeFields,
              },
            },
          },
        },
      });

      if (cart && cart.items.length > 0) {
        shippingItems = cart.items.map(item => ({
          quantity: item.quantity,
          variant: item.variant as ShippingVariantWithRelations,
        }));
      }
    }

    return shippingItems;
  }
}
