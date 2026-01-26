'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { i18n } from '@/lib/i18n/config';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/lib/constants';

interface Translation {
  id: string;
  language: SupportedLocale;
  name: string;
  description: string | null;
  shortDescription: string | null;
}

interface Variant {
  id: string;
  sku: string;
  pricing: {
    id: string;
    price: string;
    currency: string;
  }[];
  inventory: {
    id: string;
    stock: number;
  } | null;
  attributeValues: {
    attributeValue: {
      translations: { language: string; displayName: string }[];
    };
  }[];
  weight?: number; // kg
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
}

interface Product {
  id: string;
  slug: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  sortOrder: number;
  originCountry?: string | null;
  hsCode?: string | null;
  shippingOriginId?: string | null;
  exportExplanation?: string | null;
  incoterm?: string | null;
  weight?: string | null; // using string for easier form handling, converted on submit
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  } | null;
  translations: Translation[];
}

interface NewVariant {
  id: string;
  nameEN: string;
  nameFR: string;
  priceCAD: string;
  priceUSD: string;
  stock: string;
  weight: string;
  length: string;
  width: string;
  height: string;
}

interface SortableMediaItemProps {
  item: any;
  onDelete: (id: string) => void;
  t: any;
  tc: any;
}

function SortableMediaItem({ item, onDelete, t, tc }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square overflow-hidden rounded-lg border border-gray-200 ${
        isDragging ? 'z-50 shadow-2xl' : ''
      }`}
    >
      <img
        src={item.url}
        alt={item.alt || 'Product image'}
        className="h-full w-full object-cover"
      />
      {item.isPrimary && (
        <div className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
          {t.primary}
        </div>
      )}
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-2 left-2 cursor-grab rounded bg-gray-900 bg-opacity-75 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="absolute right-2 top-2 rounded bg-red-600 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
        title={tc.delete}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce ref

  const [locale, setLocale] = useState(i18n.defaultLocale);
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariants, setNewVariants] = useState<NewVariant[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    slug: '',
    status: 'DRAFT' as 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    isFeatured: false,
    sortOrder: 0,
    originCountry: '',
    hsCode: '',
    shippingOriginId: '',
    exportExplanation: '',
    incoterm: '',
    weight: '',
    length: '',
    width: '',
    height: '',
  });

  const [translations, setTranslations] = useState<
    Record<
      string,
      {
        name: string;
        description: string;
        shortDescription: string;
      }
    >
  >({});

  useEffect(() => {
    // Initialize translations state once SUPPORTED_LOCALES is available
    const initialTranslations: Record<string, any> = {};
    SUPPORTED_LOCALES.forEach(lang => {
      initialTranslations[lang] = {
        name: '',
        description: '',
        shortDescription: '',
      };
    });
    setTranslations(initialTranslations);
  }, []);

  // Media upload states
  const [media, setMedia] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reorderingMedia, setReorderingMedia] = useState(false);

  // Sensors pour drag & drop des médias
  const mediaSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    void params.then(p => {
      setProductId(p.id);
      setLocale(p.locale as any); // Type cast to fix lint error
      void loadProduct(p.id);
      void loadVariants(p.id);
      void loadMedia(p.id);
      void loadSuppliers();
    });
  }, [params]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await import(
          `../../../../../../lib/i18n/dictionaries/${locale}.json`
        );
        setMessages(msgs.default);
      } catch (error) {
        console.error('Failed to load translations:', error);
        const msgs = await import(
          `../../../../../../lib/i18n/dictionaries/en.json`
        );
        setMessages(msgs.default);
      }
    };
    void loadMessages();
  }, [locale]);

  const loadProduct = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load product');
      }

      const data = await response.json();
      const productData = data.data;
      setProduct(productData);

      setFormData({
        slug: productData.slug,
        status: productData.status,
        isFeatured: productData.isFeatured,
        sortOrder: productData.sortOrder,
        originCountry: productData.originCountry || '',
        hsCode: productData.hsCode || '',
        shippingOriginId: productData.shippingOriginId || '',
        exportExplanation: productData.exportExplanation || '',
        incoterm: productData.incoterm || '',
        weight: productData.weight ? String(productData.weight) : '',
        length: productData.dimensions?.length
          ? String(productData.dimensions.length)
          : '',
        width: productData.dimensions?.width
          ? String(productData.dimensions.width)
          : '',
        height: productData.dimensions?.height
          ? String(productData.dimensions.height)
          : '',
      });

      const updatedTranslations = { ...translations };
      productData.translations.forEach((t: any) => {
        const langCode = t.language.toLowerCase();
        updatedTranslations[langCode] = {
          name: t.name || '',
          description: t.description || '',
          shortDescription: t.shortDescription || '',
        };
      });
      setTranslations(updatedTranslations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/variants`);
      if (!response.ok) {
        console.error('Failed to load variants');
        return;
      }

      const data = await response.json();
      setVariants(data.data || []);
    } catch (err) {
      console.error('Failed to load variants:', err);
    }
  };

  const loadMedia = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/media?productId=${id}`);
      if (!response.ok) {
        console.error('Failed to load media');
        return;
      }

      const data = await response.json();
      setMedia(data.data || []);
    } catch (err) {
      console.error('Failed to load media:', err);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/logistics/locations');
      if (!response.ok) {
        console.error('Failed to load suppliers');
        return;
      }
      const data = await response.json();
      setSuppliers(data.data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!productId) return;

    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productId', productId);
        formData.append('alt', file.name);

        // Définir la première image comme principale si aucune image n'existe
        if (media.length === 0 && i === 0) {
          formData.append('isPrimary', 'true');
        }

        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to upload file');
        }
      }

      // Recharger les médias
      await loadMedia(productId);
      setSuccessMessage(t.messages.mediaUploaded);

      // Effacer le message après 3 secondes
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.messages.errorUploadingMedia
      );
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!productId) return;
    if (!messages) return;

    const t = messages.admin.products;
    if (!confirm(t.deleteMediaConfirm)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t.messages.errorDeletingProduct);
      }

      await loadMedia(productId);
      setSuccessMessage(t.messages.mediaDeleted);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.messages.errorDeletingProduct
      );
    }
  };

  const handleMediaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !productId) {
      return;
    }

    const oldIndex = media.findIndex(m => m.id === active.id);
    const newIndex = media.findIndex(m => m.id === over.id);

    // Réorganiser localement
    const newMedia = arrayMove(media, oldIndex, newIndex);

    // Mettre à jour les sortOrder
    const updatedMedia = newMedia.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    setMedia(updatedMedia);

    // DEBOUNCE: Annuler l'appel précédent s'il y en a un
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }

    // Lancer un nouvel appel différé (1000ms)
    reorderTimeoutRef.current = setTimeout(async () => {
      try {
        setReorderingMedia(true);

        const payload = {
          media: updatedMedia.map(m => ({
            id: m.id,
            sortOrder: m.sortOrder,
          })),
        };

        const response = await fetch(`/api/admin/media/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to save media order');
        }
        console.log('✅ Media order saved successfully (Debounced)');
      } catch (err) {
        console.error('Failed to save media order:', err);
        // En cas d'erreur serveur, on recharge pour remettre l'UI d'équerre
        void loadMedia(productId);
        setError('Failed to save media order. Please try again.');
      } finally {
        setReorderingMedia(false);
        reorderTimeoutRef.current = null;
      }
    }, 1000); // 1 seconde de délai
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Préparer les données avec les traductions
      const payload = {
        ...formData,
        translations: Object.entries(translations).map(([lang, data]) => ({
          language: lang,
          name: data.name,
          description: data.description || null,
          shortDescription: data.shortDescription || null,
        })),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
        },
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.messages.errorUpdatingProduct);
      }

      setSuccessMessage(t.messages.productUpdated);

      // Recharger les données du produit
      await loadProduct(productId);

      // Scroll to top pour voir le message de succès
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (
    variantId: string,
    updates: {
      priceCAD?: string;
      priceUSD?: string;
      stock?: number;
      weight?: number;
      dimensions?: { length?: number; width?: number; height?: number };
    }
  ) => {
    if (!productId) return;

    try {
      const payload: any = {};

      if (updates.priceCAD !== undefined) {
        payload.pricingCAD = {
          price: parseFloat(updates.priceCAD),
          currency: 'CAD',
        };
      }

      if (updates.priceUSD !== undefined) {
        payload.pricingUSD = {
          price: parseFloat(updates.priceUSD),
          currency: 'USD',
        };
      }

      if (updates.stock !== undefined) {
        payload.inventory = {
          stock: updates.stock,
        };
      }

      if (updates.weight !== undefined) {
        payload.weight = updates.weight;
      }

      if (updates.dimensions !== undefined) {
        payload.dimensions = updates.dimensions;
      }

      const response = await fetch(
        `/api/admin/products/${productId}/variants/${variantId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(t.messages.errorUpdatingProduct);
      }

      await loadVariants(productId);
      setSuccessMessage(t.messages.variantUpdated);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.messages.errorUpdatingProduct
      );
    }
  };

  const handleDeleteVariant = async (
    variantId: string,
    variantName: string
  ) => {
    if (!productId) return;
    if (!messages) return;

    const t = messages.admin.products;
    if (!confirm(t.deleteVariantConfirm.replace('{{sku}}', variantName))) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/variants/${variantId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error(t.messages.errorDeletingProduct);
      }

      await loadVariants(productId);
      setSuccessMessage(t.messages.variantDeleted);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.messages.errorDeletingProduct
      );
    }
  };

  const handleAddNewVariant = () => {
    const newVariant: NewVariant = {
      id: crypto.randomUUID(),
      nameEN: '',
      nameFR: '',
      priceCAD: '',
      priceUSD: '',
      stock: '0',
      weight: '',
      length: '',
      width: '',
      height: '',
    };
    setNewVariants([...newVariants, newVariant]);
  };

  const handleNewVariantChange = (
    id: string,
    field:
      | 'nameEN'
      | 'nameFR'
      | 'priceCAD'
      | 'priceUSD'
      | 'stock'
      | 'weight'
      | 'length'
      | 'width'
      | 'height',
    value: string
  ) => {
    setNewVariants(
      newVariants.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleDeleteNewVariant = (id: string) => {
    setNewVariants(newVariants.filter(v => v.id !== id));
  };

  const handleSaveNewVariants = async () => {
    if (!productId || newVariants.length === 0) return;

    try {
      const variantsPayload = {
        variants: newVariants.map(v => ({
          nameEN: v.nameEN,
          nameFR: v.nameFR,
          priceCAD: v.priceCAD ? parseFloat(v.priceCAD) : null,
          priceUSD: v.priceUSD ? parseFloat(v.priceUSD) : null,
          stock: parseInt(v.stock) || 0,
          weight: v.weight ? parseFloat(v.weight) : null,
          length: v.length ? parseFloat(v.length) : null,
          width: v.width ? parseFloat(v.width) : null,
          height: v.height ? parseFloat(v.height) : null,
        })),
      };

      const response = await fetch(
        `/api/admin/products/${productId}/variants/simple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variantsPayload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create variants');
      }

      setNewVariants([]);
      await loadVariants(productId);
      setSuccessMessage(t.messages.variantsAdded);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.messages.errorCreatingProduct
      );
    }
  };

  const getVariantName = (variant: Variant): string => {
    if (variant.attributeValues.length === 0) return variant.sku;
    const translation =
      variant.attributeValues[0].attributeValue.translations.find(
        t => t.language === locale.toUpperCase()
      );
    return (
      translation?.displayName ||
      variant.attributeValues[0].attributeValue.translations[0]?.displayName ||
      variant.sku
    );
  };

  if (!messages) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const t = messages.admin.products;
  const tc = messages.common;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t.editProduct}
            </h1>
            <p className="mt-2 text-sm text-gray-600">{tc.loading}</p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-500">{tc.loading}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t.editProduct}
            </h1>
          </div>
        </div>
        <div className="admin-card text-center py-12">
          <p className="text-red-600 font-medium">{t.productNotFound}</p>
          <Link
            href={`/${locale}/admin/products`}
            className="mt-4 admin-btn-secondary"
          >
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/products`}
            className="admin-btn-secondary p-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="admin-page-title">{t.editProduct}</h1>
            <p className="admin-page-subtitle">
              {translations['en']?.name || t.productInfo}
            </p>
          </div>
        </div>
        <button
          onClick={handleUpdateProduct}
          disabled={saving}
          className="admin-btn-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? t.saving : tc.save}
        </button>
      </div>

      {/* Messages de succès et d'erreur */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-3 w-3 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-green-900">{tc.success}</h3>
              <p className="mt-1 text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <X className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">{tc.error}</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Layout en 2 colonnes pour grands écrans */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche - Informations de base */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="admin-card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t.basicInfo}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.slug} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.status}
                </label>
                <select
                  value={formData.status}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      status: e.target.value as typeof formData.status,
                    })
                  }
                  className="admin-input"
                >
                  <option value="DRAFT">{t.draft}</option>
                  <option value="ACTIVE">{t.active}</option>
                  <option value="INACTIVE">{t.inactive}</option>
                  <option value="ARCHIVED">{t.archived}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={e =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <label
                  htmlFor="isFeatured"
                  className="text-sm font-medium text-gray-700"
                >
                  {t.featured}
                </label>
              </div>
            </div>
          </div>

          {/* Shipping & Customs */}
          <div className="admin-card">
            <div className="mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t.shippingCustoms}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.shippingOrigin}
                </label>
                <div className="relative">
                  <select
                    value={formData.shippingOriginId}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        shippingOriginId: e.target.value,
                      })
                    }
                    className="admin-input appearance-none bg-white"
                  >
                    <option value="">{t.selectOrigin}</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-1 text-gray-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t.shippingOriginHelp}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.originCountry}
                </label>
                <input
                  type="text"
                  value={formData.originCountry}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      originCountry: e.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                  maxLength={2}
                  placeholder="e.g. CA, US, CN"
                  className="admin-input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.originCountryHelp}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.hsCode}
                </label>
                <input
                  type="text"
                  value={formData.hsCode}
                  onChange={e =>
                    setFormData({ ...formData, hsCode: e.target.value })
                  }
                  placeholder="e.g. 6109.10"
                  className="admin-input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.hsCodeHelp}
                  <a
                    href="https://www.hts.usitc.gov/"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 text-blue-600 hover:underline"
                  >
                    {t.searchHSCodes}
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.exportExplanation}
                </label>
                <input
                  type="text"
                  value={formData.exportExplanation}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      exportExplanation: e.target.value,
                    })
                  }
                  placeholder="e.g. LED Grow Lights, T-Shirt"
                  className="admin-input"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t.exportExplanationHelp}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.incotermOverride}
                </label>
                <select
                  value={formData.incoterm}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      incoterm: e.target.value,
                    })
                  }
                  className="admin-input"
                >
                  <option value="">Default (Inherit from Warehouse)</option>
                  <option value="DDU">DDU (Customer pays duties)</option>
                  <option value="DDP">DDP (Sender pays duties)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">{t.incotermHelp}</p>
              </div>

              {/* Weight & Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.weightKg}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.weight}
                    onChange={e =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    placeholder="0.0"
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.dimensionsCm}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.length}
                      onChange={e =>
                        setFormData({ ...formData, length: e.target.value })
                      }
                      placeholder="L"
                      title="Length (cm)"
                      className="admin-input"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.width}
                      onChange={e =>
                        setFormData({ ...formData, width: e.target.value })
                      }
                      placeholder="W"
                      title="Width (cm)"
                      className="admin-input"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={e =>
                        setFormData({ ...formData, height: e.target.value })
                      }
                      placeholder="H"
                      title="Height (cm)"
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="admin-card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t.media}
            </h2>

            {/* Upload Zone */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {t.uploadMedia}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, WebP, GIF, MP4 - Max 50MB
                </p>
                <label className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  {uploading ? t.uploading : t.selectFiles}
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Media Grid with Drag & Drop */}
            {media.length > 0 && (
              <>
                {reorderingMedia && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-sm text-blue-700">💾 {t.savingOrder}</p>
                  </div>
                )}

                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                  <p className="text-xs text-blue-700">
                    💡 {t.dragToReorderMedia}
                  </p>
                </div>

                <DndContext
                  sensors={mediaSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleMediaDragEnd}
                >
                  <SortableContext
                    items={media.map(m => m.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {media.map(item => (
                        <SortableMediaItem
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteMedia}
                          t={t}
                          tc={tc}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )}
          </div>
        </div>

        {/* Colonne droite - Traductions */}
        <div className="space-y-6">
          {SUPPORTED_LOCALES.map(lang => (
            <div key={lang} className="admin-card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 border-b pb-2">
                {lang.toUpperCase()}
                {lang === 'en' && <span className="ml-1 text-red-500">*</span>}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.productName}{' '}
                    {lang === 'en' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={translations[lang]?.name || ''}
                    onChange={e =>
                      setTranslations({
                        ...translations,
                        [lang]: { ...translations[lang], name: e.target.value },
                      })
                    }
                    className="admin-input"
                    required={lang === 'en'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.shortDescription}
                  </label>
                  <input
                    type="text"
                    value={translations[lang]?.shortDescription || ''}
                    onChange={e =>
                      setTranslations({
                        ...translations,
                        [lang]: {
                          ...translations[lang],
                          shortDescription: e.target.value,
                        },
                      })
                    }
                    placeholder={t.shortDescriptionPlaceholder}
                    className="admin-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.fullDescription}
                  </label>
                  <textarea
                    value={translations[lang]?.description || ''}
                    onChange={e =>
                      setTranslations({
                        ...translations,
                        [lang]: {
                          ...translations[lang],
                          description: e.target.value,
                        },
                      })
                    }
                    placeholder={t.fullDescriptionPlaceholder}
                    rows={6}
                    className="admin-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Variantes - Pleine largeur */}
      <div className="admin-card p-0 overflow-hidden">
        <h2 className="p-6 pb-2 text-lg font-semibold text-gray-900">
          {t.variants} ({variants.length})
        </h2>

        {variants.length > 0 && (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead className="admin-table-thead">
                <tr>
                  <th className="admin-table-th">{t.variant}</th>
                  <th className="admin-table-th">{t.sku}</th>
                  <th className="admin-table-th">{t.price} CAD</th>
                  <th className="admin-table-th">{t.price} USD</th>
                  <th className="admin-table-th">{t.stock}</th>
                  <th className="admin-table-th text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {variants.map(variant => (
                  <tr key={variant.id} className="admin-table-tr">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {getVariantName(variant)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {variant.sku}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={
                          variant.pricing.find(p => p.currency === 'CAD')
                            ?.price || ''
                        }
                        placeholder="—"
                        onBlur={e =>
                          e.target.value &&
                          handleUpdateVariant(variant.id, {
                            priceCAD: e.target.value,
                          })
                        }
                        className="w-24 admin-input py-1"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={
                          variant.pricing.find(p => p.currency === 'USD')
                            ?.price || ''
                        }
                        placeholder="—"
                        onBlur={e =>
                          e.target.value &&
                          handleUpdateVariant(variant.id, {
                            priceUSD: e.target.value,
                          })
                        }
                        className="w-24 admin-input py-1"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <input
                        type="number"
                        defaultValue={variant.inventory?.stock || 0}
                        onBlur={e =>
                          handleUpdateVariant(variant.id, {
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 admin-input py-1"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteVariant(
                            variant.id,
                            getVariantName(variant)
                          )
                        }
                        className="text-red-600 hover:text-red-900"
                        title={tc.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nouvelles variantes à ajouter */}
      <div className="admin-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {tc.add} {t.variants}
          </h2>
          <button
            type="button"
            onClick={handleAddNewVariant}
            className="admin-btn-primary bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            {tc.add} {t.variant}
          </button>
        </div>

        {newVariants.length > 0 && (
          <>
            <div className="space-y-4">
              {newVariants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {t.variant} #{index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteNewVariant(variant.id)}
                      className="text-red-600 hover:text-red-900"
                      title={tc.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.productName} (EN){' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.nameEN}
                        onChange={e =>
                          handleNewVariantChange(
                            variant.id,
                            'nameEN',
                            e.target.value
                          )
                        }
                        placeholder="Green"
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.productName} (FR){' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.nameFR}
                        onChange={e =>
                          handleNewVariantChange(
                            variant.id,
                            'nameFR',
                            e.target.value
                          )
                        }
                        placeholder="Vert"
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.price} ($ CAD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.priceCAD}
                        onChange={e =>
                          handleNewVariantChange(
                            variant.id,
                            'priceCAD',
                            e.target.value
                          )
                        }
                        placeholder="49.99"
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.price} ($ USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.priceUSD}
                        onChange={e =>
                          handleNewVariantChange(
                            variant.id,
                            'priceUSD',
                            e.target.value
                          )
                        }
                        placeholder="36.99"
                        className="admin-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t.stock}
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={e =>
                          handleNewVariantChange(
                            variant.id,
                            'stock',
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className="admin-input"
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <p className="text-xs text-gray-500">
                        💡 Au moins un prix (CAD ou USD) est requis
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSaveNewVariants}
                className="admin-btn-primary bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                {tc.save} {newVariants.length} {t.variant}
                {newVariants.length > 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer avec boutons d'action */}
      <div className="flex items-center justify-between admin-card p-4">
        <Link
          href={`/${locale}/admin/products`}
          className="admin-btn-secondary"
        >
          {tc.cancel}
        </Link>
        <button
          onClick={handleUpdateProduct}
          disabled={saving}
          className="admin-btn-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? t.saving : tc.save}
        </button>
      </div>
    </div>
  );
}
