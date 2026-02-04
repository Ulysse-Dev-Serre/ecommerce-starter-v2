import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToCart, updateCartItem, removeFromCart, mergeCart } from './cart';

describe('Client Cart Actions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('addToCart', () => {
    it('should call fetch with correct parameters and return data', async () => {
      const mockResult = { success: true, data: { id: 'cart-1' } };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      } as Response);

      const result = await addToCart('var-123', 2);

      expect(fetch).toHaveBeenCalledWith(
        '/api/cart/lines',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ variantId: 'var-123', quantity: 2 }),
        })
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error with message if response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Stock insuffisant' }),
      } as Response);

      await expect(addToCart('var-123', 2)).rejects.toThrow(
        'Stock insuffisant'
      );
    });
  });

  describe('updateCartItem', () => {
    it('should call fetch with PUT method', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await updateCartItem('item-123', 5);

      expect(fetch).toHaveBeenCalledWith(
        '/api/cart/lines/item-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ quantity: 5 }),
        })
      );
    });
  });

  describe('removeFromCart', () => {
    it('should call fetch with DELETE method', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await removeFromCart('item-123');

      expect(fetch).toHaveBeenCalledWith(
        '/api/cart/lines/item-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('mergeCart', () => {
    it('should call fetch with credentials included', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await mergeCart();

      expect(fetch).toHaveBeenCalledWith(
        '/api/cart/merge',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });
});
