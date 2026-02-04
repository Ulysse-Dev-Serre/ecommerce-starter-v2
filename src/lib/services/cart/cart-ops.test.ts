import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addToCart,
  updateCartLine,
  removeCartLine,
  mergeAnonymousCartToUser,
} from './cart-ops.service';
import { cartRepository } from '@/lib/repositories/cart.repository';
import { getOrCreateCart } from './cart-management.service';
import { AppError, ErrorCode } from '@/lib/types/api/errors';
import { prisma } from '@/lib/core/db';

vi.mock('@/lib/repositories/cart.repository', () => ({
  cartRepository: {
    findVariantForCart: vi.fn(),
    findCartItem: vi.fn(),
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    findItemWithContext: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('./cart-management.service', () => ({
  getOrCreateCart: vi.fn(),
}));

vi.mock('@/lib/core/db', () => ({
  prisma: {
    cart: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(cb => cb(prisma)),
    cartItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('CartOpsService', () => {
  const mockCart = { id: 'cart-123', items: [] };
  const mockVariant = {
    id: 'var-123',
    product: { status: 'ACTIVE' },
    inventory: { trackInventory: true, stock: 10, allowBackorder: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrCreateCart).mockResolvedValue(mockCart as any);
  });

  describe('addToCart', () => {
    it('should add a new item to the cart', async () => {
      vi.mocked(cartRepository.findVariantForCart).mockResolvedValue(
        mockVariant as any
      );
      vi.mocked(cartRepository.findCartItem).mockResolvedValue(null);

      await addToCart({ variantId: 'var-123', quantity: 2 }, 'user-1');

      expect(cartRepository.addItem).toHaveBeenCalledWith({
        cartId: 'cart-123',
        variantId: 'var-123',
        quantity: 2,
      });
    });

    it('should update quantity if item already exists', async () => {
      vi.mocked(cartRepository.findVariantForCart).mockResolvedValue(
        mockVariant as any
      );
      vi.mocked(cartRepository.findCartItem).mockResolvedValue({
        id: 'item-1',
        quantity: 1,
      } as any);

      await addToCart({ variantId: 'var-123', quantity: 2 }, 'user-1');

      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(
        'item-1',
        3
      );
    });

    it('should throw error if stock is insufficient', async () => {
      vi.mocked(cartRepository.findVariantForCart).mockResolvedValue(
        mockVariant as any
      );

      await expect(
        addToCart({ variantId: 'var-123', quantity: 11 }, 'user-1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateCartLine', () => {
    it('should update item quantity after validation', async () => {
      const mockItem = {
        id: 'item-1',
        cartId: 'cart-123',
        quantity: 1,
        cart: { userId: 'user-1' },
        variant: mockVariant,
      };
      vi.mocked(cartRepository.findItemWithContext).mockResolvedValue(
        mockItem as any
      );

      await updateCartLine('item-1', { quantity: 5 }, 'user-1');

      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(
        'item-1',
        5
      );
    });

    it('should throw forbidden if user does not own the cart', async () => {
      const mockItem = {
        id: 'item-1',
        cart: { userId: 'other-user' },
        variant: mockVariant,
      };
      vi.mocked(cartRepository.findItemWithContext).mockResolvedValue(
        mockItem as any
      );

      await expect(
        updateCartLine('item-1', { quantity: 5 }, 'user-1')
      ).rejects.toThrow(/Unauthorized/);
    });
  });

  describe('removeCartLine', () => {
    it('should remove the item', async () => {
      const mockItem = { id: 'item-1', cart: { userId: 'user-1' } };
      vi.mocked(cartRepository.findItemWithContext).mockResolvedValue(
        mockItem as any
      );

      await removeCartLine('item-1', 'user-1');

      expect(cartRepository.removeItem).toHaveBeenCalledWith('item-1');
    });
  });

  describe('mergeAnonymousCartToUser', () => {
    it('should merge anonymous items into user cart', async () => {
      const mockAnonCart = {
        id: 'anon-cart',
        items: [
          {
            variantId: 'var-1',
            quantity: 2,
            variant: { inventory: { stock: 10, trackInventory: true } },
          },
        ],
      };
      const mockUserCart = { id: 'user-cart', items: [] };

      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockAnonCart as any);
      vi.mocked(getOrCreateCart).mockResolvedValue(mockUserCart as any);
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      await mergeAnonymousCartToUser('user-1', 'anon-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'user-cart', variantId: 'var-1', quantity: 2 },
      });
      expect(prisma.cart.update).toHaveBeenCalledWith({
        where: { id: 'anon-cart' },
        data: { status: 'CONVERTED' },
      });
    });

    it('should cap quantity during merge if it exceeds stock', async () => {
      const mockAnonCart = {
        id: 'anon-cart',
        items: [
          {
            variantId: 'var-1',
            quantity: 15,
            variant: {
              inventory: {
                stock: 10,
                trackInventory: true,
                allowBackorder: false,
              },
            },
          },
        ],
      };
      const mockUserCart = { id: 'user-cart', items: [] };

      vi.mocked(prisma.cart.findFirst).mockResolvedValue(mockAnonCart as any);
      vi.mocked(getOrCreateCart).mockResolvedValue(mockUserCart as any);
      vi.mocked(prisma.cartItem.findUnique).mockResolvedValue(null);

      await mergeAnonymousCartToUser('user-1', 'anon-1');

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'user-cart', variantId: 'var-1', quantity: 10 },
      });
    });
  });
});
