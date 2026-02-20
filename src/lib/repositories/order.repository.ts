import { prisma } from '@/lib/core/db';

import { Prisma, OrderStatus } from '@/generated/prisma';

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export class OrderRepository {
  /**
   * List orders with filters and pagination for Admin
   */
  async findMany(filters: OrderFilters, pagination: PaginationParams) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        {
          user: {
            firstName: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          user: { lastName: { contains: filters.search, mode: 'insensitive' } },
        },
      ];
    }

    return prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                slug: true,
                translations: true,
              },
            },
            variant: {
              select: {
                sku: true,
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  /**
   * Count orders for pagination
   */
  async count(filters: OrderFilters): Promise<number> {
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return prisma.order.count({ where });
  }

  /**
   * Find order by ID with full details (Admin)
   */
  async findById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            clerkId: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                translations: true,
                media: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
              },
            },
          },
        },
        payments: true,
        shipments: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}

export const orderRepository = new OrderRepository();
