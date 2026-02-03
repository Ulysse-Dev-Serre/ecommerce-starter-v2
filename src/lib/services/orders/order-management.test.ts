import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateOrderStatus,
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
  },
}));

vi.mock('@/lib/services/payments/payment-refund.service', () => ({
  updateOrderStatus: vi.fn(),
}));

describe('OrderManagementService - Transitions de Statut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
