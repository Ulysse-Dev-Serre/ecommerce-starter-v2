import Link from 'next/link';
import Image from 'next/image';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';

import {
  ProductProjection,
  ProductVariantProjection,
} from '@/lib/types/domain/product';

interface ProductRowProps {
  product: ProductProjection;
  locale: string;
  getProductName: (translations: ProductProjection['translations']) => string;
  getBasePrice: (variants: ProductVariantProjection[]) => string | null;
  getTotalStock: (variants: ProductVariantProjection[]) => number;
  handleDelete: (productId: string) => void;
  deletingId: string | null;
  statusColors: Record<string, string>;
}

export function SortableProductRow({
  product,
  locale,
  getProductName,
  getBasePrice,
  getTotalStock,
  handleDelete,
  deletingId,
  statusColors,
}: ProductRowProps) {
  const t = useTranslations('admin.products');
  const tc = useTranslations('common');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 0,
    position: 'relative' as const,
  };

  const primaryImage =
    product.media?.find(m => m.isPrimary) || product.media?.[0];

  return (
    <tr
      ref={setNodeRef}
      style={style}
      data-testid="product-row"
      data-product-slug={product.slug}
      className={`admin-table-tr ${isDragging ? 'admin-bg-info-subtle shadow-inner' : ''}`}
    >
      <td className="admin-table-td w-10">
        <button
          className="cursor-grab active:cursor-grabbing p-1 admin-text-subtle hover:admin-text-main outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="admin-table-td">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 admin-bg-subtle rounded border border-admin-border overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center admin-text-subtle">
                —
              </div>
            )}
          </div>
          <div>
            <div className="font-medium admin-text-main">
              {getProductName(product.translations)}
            </div>
            <div className="text-xs admin-text-subtle font-mono">
              {product.slug}
            </div>
          </div>
        </div>
      </td>
      <td className="admin-table-td">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            statusColors[product.status]
          }`}
        >
          {t(`filters.${product.status}`)}
        </span>
      </td>
      <td className="admin-table-td">
        <div className="admin-text-main">
          {getBasePrice(product.variants) || '—'}
        </div>
        <div className="text-xs admin-text-subtle">
          {product.variants.length} {t('variants')}
        </div>
      </td>
      <td className="admin-table-td">
        <div className="admin-text-main">{getTotalStock(product.variants)}</div>
        <div className="text-xs admin-text-subtle">{t('stats.units')}</div>
      </td>
      <td className="admin-table-td text-right font-medium">
        <div className="flex justify-end gap-2">
          <Link
            href={`/${locale}/admin/products/${product.id}/edit`}
            className="admin-link"
          >
            {tc('edit')}
          </Link>
          <button
            onClick={() => handleDelete(product.id)}
            disabled={deletingId === product.id}
            className="admin-text-danger hover:brightness-90 disabled:opacity-50"
          >
            {deletingId === product.id ? (
              tc('loading')
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
