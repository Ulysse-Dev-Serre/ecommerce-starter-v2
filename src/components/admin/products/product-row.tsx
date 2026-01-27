'use client';

import Link from 'next/link';
import Image from 'next/image';
import { GripVertical, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductRowProps {
  product: {
    id: string;
    slug: string;
    status: string;
    translations: any[];
    variants: any[];
    media?: Array<{ url: string; isPrimary: boolean }>;
  };
  locale: string;
  getProductName: (translations: any[]) => string;
  getBasePrice: (variants: any[]) => string | null;
  getTotalStock: (variants: any[]) => number;
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
      className={`admin-table-tr ${isDragging ? 'bg-blue-50/50 shadow-inner' : ''}`}
    >
      <td className="admin-table-td w-10">
        <button
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="admin-table-td">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 bg-gray-100 rounded border overflow-hidden">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                —
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {getProductName(product.translations)}
            </div>
            <div className="text-xs text-gray-500 font-mono">
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
          {product.status}
        </span>
      </td>
      <td className="admin-table-td">
        <div className="text-gray-900">
          {getBasePrice(product.variants) || '—'}
        </div>
        <div className="text-xs text-gray-500">
          {product.variants.length} variantes
        </div>
      </td>
      <td className="admin-table-td">
        <div className="text-gray-900">{getTotalStock(product.variants)}</div>
        <div className="text-xs text-gray-500">unités en stock</div>
      </td>
      <td className="admin-table-td text-right font-medium">
        <div className="flex justify-end gap-2">
          <Link
            href={`/${locale}/admin/products/${product.id}/edit`}
            className="text-primary hover:text-primary/80"
          >
            Modifier
          </Link>
          <button
            onClick={() => handleDelete(product.id)}
            disabled={deletingId === product.id}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {deletingId === product.id ? '...' : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
}
