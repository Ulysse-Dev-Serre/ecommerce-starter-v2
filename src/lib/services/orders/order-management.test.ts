import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateOrderStatus,
  listOrdersAdmin,
  getOrderByIdAdmin,
  VALID_STATUS_TRANSITIONS,
} from './order-management.service';
import { orderRepository } from '@/lib/repositories/order.repository';
import { updateOrderStatus as updateOrderLogic } from '@/lib/services/payments/payment-refund.service';
import { OrderStatus } from '@/generated/prisma';
import { AppError, ErrorCode } from '@/lib/types/api/errors';

// Mocks
vi.mock('@/lib/repositories/order.repository', () => ({
  orderRepository: {
    findById: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('@/lib/services/payments/payment-refund.service', () => ({
  updateOrderStatus: vi.fn(),
}));

vi.mock('./order-notifications.service', () => ({
  sendStatusChangeEmail: vi.fn().mockResolvedValue(undefined),
}));

import { sendStatusChangeEmail } from './order-notifications.service';

describe('OrderManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateOrderStatus', () => {
    it('devrait refuser une transition invalide (ex: SHIPPED -> PENDING)', async () => {
      // 1. Setup : Une commande déjà expédiée
      const mockOrder = { id: 'ord_1', status: OrderStatus.SHIPPED };
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder as any);

      // 2. Action : Tenter de revenir en arrière (Pending)
      const promise = updateOrderStatus({
        orderId: 'ord_1',
        status: OrderStatus.PENDING,
        userId: 'admin_1',
      });

      // 3. Assertion : Le service doit lancer une erreur de validation
      await expect(promise).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.VALIDATION_ERROR,
        })
      );
      expect(updateOrderLogic).not.toHaveBeenCalled();
    });

    it('devrait accepter une transition valide (ex: PENDING -> PAID)', async () => {
      // 1. Setup : Une commande en attente
      const mockOrder = { id: 'ord_2', status: OrderStatus.PENDING };
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder as any);
      vi.mocked(updateOrderLogic).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      } as any);

      // 2. Action : Marquer comme payée
      const result = await updateOrderStatus({
        orderId: 'ord_2',
        status: OrderStatus.PAID,
        userId: 'admin_1',
      });

      // 3. Assertion : La logique de paiement doit être appelée
      expect(updateOrderLogic).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PAID,
        })
      );
      // 4. Assertion : L'email doit être envoyé
      expect(sendStatusChangeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ status: OrderStatus.PAID }),
        OrderStatus.PAID
      );
      expect(result.status).toBe(OrderStatus.PAID);
    });

    it("devrait lancer une erreur 404 si la commande n'existe pas", async () => {
      vi.mocked(orderRepository.findById).mockResolvedValue(null);

      const promise = updateOrderStatus({
        orderId: 'invalid_id',
        status: OrderStatus.PAID,
      });

      await expect(promise).rejects.toThrow(
        expect.objectContaining({
          code: ErrorCode.NOT_FOUND,
        })
      );
    });
  });

  describe('listOrdersAdmin', () => {
    it('devrait retourner la liste des commandes et la pagination', async () => {
      const mockOrders = [{ id: 'ord_1' }];
      const mockCount = 10;

      vi.mocked(orderRepository.findMany).mockResolvedValue(mockOrders as any);
      vi.mocked(orderRepository.count).mockResolvedValue(mockCount);

      const result = await listOrdersAdmin({}, { page: 1, limit: 10 });

      expect(result.orders).toBe(mockOrders);
      expect(result.pagination.total).toBe(mockCount);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('getOrderByIdAdmin', () => {
    it('devrait retourner une commande si elle existe', async () => {
      const mockOrder = { id: 'ord_1', status: 'PENDING' };
      vi.mocked(orderRepository.findById).mockResolvedValue(mockOrder as any);

      const result = await getOrderByIdAdmin('ord_1');
      expect(result).toBe(mockOrder);
    });

    it("devrait lancer une erreur 404 si la commande n'existe pas", async () => {
      vi.mocked(orderRepository.findById).mockResolvedValue(null);

      await expect(getOrderByIdAdmin('invalid')).rejects.toThrow(
        expect.objectContaining({ code: ErrorCode.NOT_FOUND })
      );
    });
  });
});
