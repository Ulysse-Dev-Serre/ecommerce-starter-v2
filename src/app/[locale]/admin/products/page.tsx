'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Package, Plus, Search, Filter, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductTranslation {
  language: string;
  name: string;
  shortDescription?: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  pricing: Array<{
    price: number;
    currency: string;
    priceType: string;
  }>;
  inventory?: {
    stock: number;
  };
}

interface Product {
  id: string;
  slug: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  sortOrder: number;
  translations: ProductTranslation[];
  variants: ProductVariant[];
  media?: { url: string; isPrimary: boolean }[];
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-red-100 text-red-800',
};

interface SortableProductRowProps {
  product: Product;
  locale: string;
  getProductName: (translations: ProductTranslation[]) => string;
  getBasePrice: (variants: ProductVariant[]) => string | null;
  getTotalStock: (variants: ProductVariant[]) => number;
  handleDelete: (productId: string) => void;
  deletingId: string | null;
  messages: any;
}

function SortableProductRow({
  product,
  locale,
  getProductName,
  getBasePrice,
  getTotalStock,
  handleDelete,
  deletingId,
  messages,
}: SortableProductRowProps) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const t = messages.admin.products;
  const tc = messages.common;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'bg-gray-100' : ''}`}
    >
      <td className="px-3 py-4">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Image miniature */}
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {product.media && product.media.length > 0 ? (
              <img
                src={product.media.find(m => m.isPrimary)?.url || product.media[0].url}
                alt={getProductName(product.translations)}
                className="h-full w-full object-cover opacity-80"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Infos produit */}
          <div>
            <div className="font-medium text-gray-900">
              {getProductName(product.translations)}
            </div>
            <div className="text-sm text-gray-500">{product.slug}</div>
            {product.isFeatured && (
              <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                {t.featured}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[product.status]}`}
        >
          {product.status}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {getBasePrice(product.variants) || t.noPricing}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {getTotalStock(product.variants)}{' '}
        {getTotalStock(product.variants) !== 1 ? t.units : t.unit}
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {product.variants.length}{' '}
        {product.variants.length !== 1
          ? t.variants.toLowerCase()
          : t.variant}
      </td>
      <td className="px-6 py-4 text-right text-sm">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/${locale}/admin/products/${product.id}/edit`}
            className="text-gray-600 hover:text-gray-900"
          >
            {tc.edit}
          </Link>
          <button
            onClick={() => handleDelete(product.id)}
            disabled={deletingId === product.id}
            className="text-red-600 hover:text-red-900 disabled:opacity-50"
            title={tc.delete}
          >
            {deletingId === product.id ? (
              <span className="text-xs">{t.deleting}</span>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const [messages, setMessages] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load translations
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(
          `../../../../lib/i18n/dictionaries/${locale}.json`
        );
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        const msgs = await import(`../../../../lib/i18n/dictionaries/en.json`);
        setMessages(msgs.default);
      }
    };
    loadMessages();
  }, [locale]);

  useEffect(() => {
    if (messages) {
      fetchProducts();
    }
  }, [statusFilter, messages]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        language: 'EN',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      // Trier par sortOrder
      const sortedProducts = (data.data || []).sort(
        (a: Product, b: Product) => a.sortOrder - b.sortOrder
      );
      setProducts(sortedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (translations: ProductTranslation[]) => {
    const enTranslation = translations.find(t => t.language === 'EN');
    return enTranslation?.name || translations[0]?.name || 'Unnamed Product';
  };

  const getBasePrice = (variants: ProductVariant[]) => {
    if (variants.length === 0) return null;

    const prices = variants
      .flatMap(v => v.pricing)
      .filter(p => p.priceType === 'base')
      .map(p => p.price);

    if (prices.length === 0) return null;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(2)}`;
    }
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  };

  const getTotalStock = (variants: ProductVariant[]) => {
    return variants.reduce((sum, v) => sum + (v.inventory?.stock || 0), 0);
  };

  const filteredProducts = products.filter(product => {
    const name = getProductName(product.translations).toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = async (productId: string) => {
    if (!messages) return;
    const t = messages.admin.products;

    if (!confirm(t.deleteConfirm)) {
      return;
    }

    setDeletingId(productId);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = products.findIndex(p => p.id === active.id);
    const newIndex = products.findIndex(p => p.id === over.id);

    // Réorganiser localement
    const newProducts = arrayMove(products, oldIndex, newIndex);

    // Mettre à jour les sortOrder
    const updatedProducts = newProducts.map((product, index) => ({
      ...product,
      sortOrder: index,
    }));

    setProducts(updatedProducts);

    // Sauvegarder l'ordre sur le serveur
    try {
      setIsSavingOrder(true);

      const payload = {
        products: updatedProducts.map(p => ({
          id: p.id,
          sortOrder: p.sortOrder,
        })),
      };

      const response = await fetch('/api/admin/products/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save product order');
      }
    } catch (err) {
      console.error('Failed to save order:', err);
      // Recharger les produits en cas d'erreur
      fetchProducts();
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to save product order. Please try again.'
      );
    } finally {
      setIsSavingOrder(false);
    }
  };

  if (!messages || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {messages?.admin?.products?.title || 'Products'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {messages?.admin?.products?.manageYourCatalog ||
                'Manage your product catalog'}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">
            {messages?.common?.loading || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const t = messages.admin.products;
  const tc = messages.common;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{t.manageYourCatalog}</p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-12 text-center shadow-sm">
          <p className="text-red-600">
            {tc.error}: {error}
          </p>
          <button
            onClick={fetchProducts}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {tc.retry || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-2 text-sm text-gray-600">{t.manageVariants}</p>
        </div>
        <Link
          href={`/${locale}/admin/products/new`}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          {t.newProduct}
        </Link>
      </div>

      {/* Indicateur de sauvegarde */}
      {isSavingOrder && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            💾 {t.savingOrder || 'Saving product order...'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-gray-100 p-2">
              <Package className="h-5 w-5 text-gray-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">
              {t.totalProducts}
            </h3>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {products.length}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-green-100 p-2">
              <Package className="h-5 w-5 text-green-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">{t.active}</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {products.filter(p => p.status === 'ACTIVE').length}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-gray-100 p-2">
              <Package className="h-5 w-5 text-gray-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">{t.draft}</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {products.filter(p => p.status === 'DRAFT').length}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-700" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-600">{t.featured}</h3>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {products.filter(p => p.isFeatured).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`${tc.search} ${t.title.toLowerCase()}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="all">{t.allStatus}</option>
            <option value="DRAFT">{t.draft}</option>
            <option value="ACTIVE">{t.active}</option>
            <option value="INACTIVE">{t.inactive}</option>
            <option value="ARCHIVED">{t.archived}</option>
          </select>
        </div>
      </div>

      {/* Products list */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchTerm ? t.noProductsFound : t.noProductsYet}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {searchTerm ? t.adjustFilters : t.getStarted}
          </p>
          {!searchTerm && (
            <Link
              href={`/${locale}/admin/products/new`}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              {t.createProduct}
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="mb-4 rounded-t-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-700">
              💡 {t.dragToReorder || 'Drag and drop products to reorder them'}
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-3 py-3"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.product}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.price}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.stock}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.variants}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <SortableContext
                items={filteredProducts.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredProducts.map(product => (
                    <SortableProductRow
                      key={product.id}
                      product={product}
                      locale={locale}
                      getProductName={getProductName}
                      getBasePrice={getBasePrice}
                      getTotalStock={getTotalStock}
                      handleDelete={handleDelete}
                      deletingId={deletingId}
                      messages={messages}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
}
