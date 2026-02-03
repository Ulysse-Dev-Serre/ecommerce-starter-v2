import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOrCreateCart,
  cleanInvalidCartItems,
  clearCart,
} from './cart-management.service';
import { cartRepository } from '@/lib/repositories/cart.repository';
import { AppError } from '@/lib/types/api/errors';

vi.mock('@/lib/repositories/cart.repository', () => ({
  cartRepository: {
    findActiveCart: vi.fn(),
    createCart: vi.fn(),
    getInvalidItems: vi.fn(),
    removeItem: vi.fn(),
    clearCartItems: vi.fn(),
  },
}));

describe('CartManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should return an existing cart if found', async () => {
      const mockCart = { id: 'cart-1' };
      vi.mocked(cartRepository.findActiveCart).mockResolvedValue(
        mockCart as any
      );

      const result = await getOrCreateCart('user-1');

      expect(result).toEqual(mockCart);
      expect(cartRepository.createCart).not.toHaveBeenCalled();
    });

    it('should create a new cart if not found', async () => {
      vi.mocked(cartRepository.findActiveCart).mockResolvedValue(null);
      vi.mocked(cartRepository.createCart).mockResolvedValue({
        id: 'new-cart',
      } as any);

      const result = await getOrCreateCart(undefined, 'anon-1');

      expect(result.id).toBe('new-cart');
      expect(cartRepository.createCart).toHaveBeenCalledWith({
        userId: undefined,
        anonymousId: 'anon-1',
      });
    });

    it('should throw error if both userId and anonymousId are missing', async () => {
      await expect(getOrCreateCart()).rejects.toThrow(AppError);
    });
  });

  describe('cleanInvalidCartItems', () => {
    it('should remove invalid items from the cart', async () => {
      const invalidItems = [{ id: 'item-1' }, { id: 'item-2' }];
      vi.mocked(cartRepository.getInvalidItems).mockResolvedValue(
        invalidItems as any
      );

      const result = await cleanInvalidCartItems('cart-1');

      expect(result).toBe(2);
      expect(cartRepository.removeItem).toHaveBeenCalledTimes(2);
    });

    it('should return 0 if no invalid items are found', async () => {
      vi.mocked(cartRepository.getInvalidItems).mockResolvedValue([]);
      const result = await cleanInvalidCartItems('cart-1');
      expect(result).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should call repository to clear items', async () => {
      await clearCart('cart-1');
      expect(cartRepository.clearCartItems).toHaveBeenCalledWith('cart-1');
    });
  });
});
