import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import { SITE_CURRENCY } from '@/lib/config/site';

export interface CreateLocationData {
  name: string;
  type: 'LOCAL_STOCK' | 'DROPSHIPPER' | 'OTHER';
  incoterm: 'DDP' | 'DDU';
  address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    email: string;
    phone: string;
  };
}

export type UpdateLocationData = Partial<CreateLocationData>;

export const logisticsLocationService = {
  /**
   * Get all active logistics locations (Suppliers)
   */
  async getLocations() {
    return prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get a single location by ID
   */
  async getLocationById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
    });
  },

  /**
   * Create a new logistics location
   */
  async createLocation(data: CreateLocationData) {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        type: data.type,
        incoterm: data.incoterm,
        address: data.address as Prisma.InputJsonValue,
        isActive: true,
        defaultCurrency: SITE_CURRENCY,
      },
    });

    logger.info({ supplierId: supplier.id }, 'Created new logistics location');
    return supplier;
  },

  /**
   * Update an existing location
   */
  async updateLocation(id: string, data: UpdateLocationData) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        incoterm: data.incoterm,
        address: data.address
          ? (data.address as Prisma.InputJsonValue)
          : undefined,
      },
    });

    logger.info({ supplierId: supplier.id }, 'Updated logistics location');
    return supplier;
  },

  /**
   * Delete (Deactivate) a location
   * Safely drafts associated active products before deactivation
   */
  async deleteLocation(id: string) {
    return prisma.$transaction(async tx => {
      // 1. Find all ACTIVE products using this origin
      const affectedProducts = await tx.product.findMany({
        where: {
          shippingOriginId: id,
          status: 'ACTIVE',
        },
        select: { id: true, slug: true },
      });

      if (affectedProducts.length > 0) {
        // 2. Force DRAFT status
        await tx.product.updateMany({
          where: {
            id: { in: affectedProducts.map(p => p.id) },
          },
          data: {
            status: 'DRAFT',
          },
        });

        logger.warn(
          {
            supplierId: id,
            count: affectedProducts.length,
            products: affectedProducts.map(p => p.slug),
          },
          'Cascade Deactivation: Products forced to DRAFT due to Supplier deactivation'
        );
      }

      // 3. Deactivate Supplier
      await tx.supplier.update({
        where: { id },
        data: { isActive: false },
      });

      return { success: true, affectedProductsCount: affectedProducts.length };
    });
  },
};
