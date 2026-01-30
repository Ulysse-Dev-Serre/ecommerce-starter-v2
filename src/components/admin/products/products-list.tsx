'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Lightbulb, Save, Package } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils/currency';
import {
  getAdminProducts,
  deleteProduct,
  reorderProducts,
} from '@/lib/client/admin/products';
import { ProductStatsGrid } from './product-stats-grid';
import { SortableProductRow } from './product-row';

export interface LocalProductTranslation {
  language: string;
  name: string;
  shortDescription?: string | null;
}

export interface LocalProductVariant {
  id: string;
  sku: string;
  pricing: Array<{
    price: number;
    currency: string;
    priceType: string;
  }>;
  inventory?: {
    stock: number;
  } | null;
}

export interface LocalProduct {
  id: string;
  slug: string;
  status: string; // Updated to string to be more flexible with Prisma Enums
  isFeatured: boolean;
  sortOrder: number;
  translations: LocalProductTranslation[];
  variants: LocalProductVariant[];
  media?: { url: string; isPrimary: boolean }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'admin-badge-neutral',
  ACTIVE: 'admin-badge-success',
  INACTIVE: 'admin-badge-warning',
  ARCHIVED: 'admin-badge-danger',
};

interface ProductsListProps {
  initialProducts: LocalProduct[];
  locale: string;
}

export function ProductsList({ initialProducts, locale }: ProductsListProps) {
  const [products, setProducts] = useState<LocalProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const locale_code = useLocale();

  const t = useTranslations('admin.products');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleStatusChange = async (status: string) => {
    setStatusFilter(status);
    setLoading(true);
    try {
      const data = await getAdminProducts({
        language: locale.toUpperCase(),
        status: status,
      });
      const sorted = (data.data || []).sort(
        (a: LocalProduct, b: LocalProduct) => a.sortOrder - b.sortOrder
      );
      setProducts(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (translations: LocalProductTranslation[]) => {
    const translation =
      translations.find(tr => tr.language === locale.toUpperCase()) ||
      translations.find(tr => tr.language === 'EN') ||
      translations[0];
    return translation?.name || t('unnamedProduct');
  };

  const getBasePrice = (variants: LocalProductVariant[]) => {
    if (variants.length === 0) return null;
    const allPricing = variants
      .flatMap(v => v.pricing)
      .filter(p => p.priceType === 'base');
    if (allPricing.length === 0) return null;

    const cadPrices = allPricing
      .filter(p => p.currency === 'CAD')
      .map(p => p.price);
    const usdPrices = allPricing
      .filter(p => p.currency === 'USD')
      .map(p => p.price);

    const parts: string[] = [];

    if (cadPrices.length > 0) {
      const min = Math.min(...cadPrices);
      const max = Math.max(...cadPrices);
      parts.push(
        min === max
          ? formatPrice(min, 'CAD', locale_code)
          : `${formatPrice(min, 'CAD', locale_code)} - ${formatPrice(max, 'CAD', locale_code)}`
      );
    }

    if (usdPrices.length > 0) {
      const min = Math.min(...usdPrices);
      const max = Math.max(...usdPrices);
      parts.push(
        min === max
          ? formatPrice(min, 'USD', locale_code)
          : `${formatPrice(min, 'USD', locale_code)} - ${formatPrice(max, 'USD', locale_code)}`
      );
    }

    return parts.join(' / ');
  };

  const getTotalStock = (variants: LocalProductVariant[]) => {
    return variants.reduce((sum, v) => sum + (v.inventory?.stock || 0), 0);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    setDeletingId(productId);
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (e) {
      console.error(e);
      alert(t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex(p => p.id === active.id);
    const newIndex = products.findIndex(p => p.id === over.id);

    const movedProducts = arrayMove(products, oldIndex, newIndex);
    const updatedProducts = movedProducts.map((p, index) => ({
      ...p,
      sortOrder: index,
    }));

    setProducts(updatedProducts);

    try {
      setIsSavingOrder(true);
      const productOrders = updatedProducts.map(p => ({
        id: p.id,
        sortOrder: p.sortOrder,
      }));
      await reorderProducts(productOrders);
    } catch (err) {
      console.error('Failed to save order:', err);
      await handleStatusChange(statusFilter);
      alert(
        err instanceof Error
          ? err.message
          : t('messages.errorReorderingProducts')
      );
    } finally {
      setIsSavingOrder(false);
    }
  };

  const activeCount = products.filter(p => p.status === 'ACTIVE').length;
  const draftCount = products.filter(p => p.status === 'DRAFT').length;
  const totalStock = products.reduce(
    (sum, p) => sum + getTotalStock(p.variants),
    0
  );

  const filteredProducts = products.filter(p => {
    const name = getProductName(p.translations).toLowerCase();
    return (
      name.includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="admin-page-title">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="admin-text-tiny">
              {isSavingOrder ? t('saving') : t('orderMode')}
            </span>
            <div
              className={`h-2 w-2 rounded-full ${isSavingOrder ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}
            />
          </div>
          <Link
            href={`/${locale}/admin/products/new`}
            className="admin-btn-primary"
          >
            <Plus className="h-4 w-4" />
            {t('createProduct')}
          </Link>
        </div>
      </div>

      <ProductStatsGrid
        total={products.length}
        active={activeCount}
        draft={draftCount}
        totalStock={totalStock}
        t={t}
      />

      <div className="admin-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="admin-input pl-10"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <Search className="h-5 w-5" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {['all', 'ACTIVE', 'DRAFT', 'ARCHIVED'].map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={
                  statusFilter === status
                    ? 'admin-btn-primary px-4 py-2'
                    : 'admin-btn-secondary px-4 py-2'
                }
              >
                {t(`filters.${status}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-table-container">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="admin-table">
              <thead className="admin-table-thead">
                <tr>
                  <th className="admin-table-th w-10"></th>
                  <th className="admin-table-th">{t('table.product')}</th>
                  <th className="admin-table-th">{t('table.status')}</th>
                  <th className="admin-table-th">{t('table.price')}</th>
                  <th className="admin-table-th">{t('table.inventory')}</th>
                  <th className="admin-table-th text-right">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <SortableContext
                  items={filteredProducts.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center admin-text-subtle"
                      >
                        {t('loading')}
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center admin-text-subtle"
                      >
                        {t('noProducts')}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => (
                      <SortableProductRow
                        key={product.id}
                        product={product}
                        locale={locale}
                        getProductName={getProductName}
                        getBasePrice={getBasePrice}
                        getTotalStock={getTotalStock}
                        handleDelete={handleDelete}
                        deletingId={deletingId}
                        statusColors={statusColors}
                      />
                    ))
                  )}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>
    </div>
  );
}
