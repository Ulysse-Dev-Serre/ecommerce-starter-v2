'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { SUPPORTED_LOCALES } from '@/lib/config/site';
import {
  uploadMediaAction,
  deleteMediaAction,
  reorderMediaAction,
  updateProductAction,
  createProductAction,
  updateVariantAction,
  deleteVariantAction,
  addVariantsAction,
} from '@/lib/actions/products';
import {
  getProductVariants,
  getProductMedia,
} from '@/lib/client/admin/products';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '@/lib/validators/product';
import { formatZodErrors } from '@/lib/validators';

import { ProductBasicInfo } from './product-basic-info';
import { ProductMediaManager } from './product-media-manager';
import { ProductShippingInfo } from './product-shipping-info';
import { ProductVariantsManager } from './product-variants-manager';
import { AdminSupplier } from '@/lib/types/domain/logistics';
import { ProductMedia, Language } from '@/generated/prisma';

// ---- Types ----
export interface Translation {
  id: string;
  language: Language;
  name: string;
  description: string | null;
  shortDescription: string | null;
}

export interface Variant {
  id: string;
  sku: string;
  pricing: {
    id: string;
    price: number;
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
}

export interface AdminProduct {
  id: string;
  slug: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  sortOrder: number;
  originCountry?: string | null;
  hsCode?: string | null;
  shippingOriginId?: string | null;
  exportExplanation?: string | null;
  weight?: string | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  } | null;
  translations: Translation[];
  variants: Variant[];
  media?: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface NewVariant {
  id: string;
  names: Record<string, string>; // { en: "", fr: "" }
  prices: Record<string, string>;
  stock: string;
}

interface ProductFormProps {
  initialProduct?: AdminProduct | null;
  locale: string;
  suppliers: AdminSupplier[];
}

export function ProductForm({
  initialProduct,
  locale,
  suppliers,
}: ProductFormProps) {
  const router = useRouter();
  const t = useTranslations('admin.products');
  const tc = useTranslations('common');

  const isEditMode = !!initialProduct;
  const productId = initialProduct?.id;

  const reorderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [variants, setVariants] = useState<Variant[]>(
    initialProduct?.variants || []
  );
  const [media, setMedia] = useState<ProductMedia[]>(
    (initialProduct?.media as unknown as ProductMedia[]) || []
  );
  const [newVariants, setNewVariants] = useState<NewVariant[]>([]);

  const [formData, setFormData] = useState({
    slug: initialProduct?.slug || '',
    status: (initialProduct?.status || 'DRAFT') as
      | 'DRAFT'
      | 'ACTIVE'
      | 'INACTIVE'
      | 'ARCHIVED',
    isFeatured: initialProduct?.isFeatured || false,
    sortOrder: initialProduct?.sortOrder || 0,
    originCountry: initialProduct?.originCountry || '',
    hsCode: initialProduct?.hsCode || '',
    shippingOriginId: initialProduct?.shippingOriginId || '',
    exportExplanation: initialProduct?.exportExplanation || '',
    weight: initialProduct?.weight ? String(initialProduct.weight) : '',
    length: initialProduct?.dimensions?.length
      ? String(initialProduct.dimensions.length)
      : '',
    width: initialProduct?.dimensions?.width
      ? String(initialProduct.dimensions.width)
      : '',
    height: initialProduct?.dimensions?.height
      ? String(initialProduct.dimensions.height)
      : '',
  });

  const [translations, setTranslations] = useState<
    Record<
      string,
      { name: string; description: string; shortDescription: string }
    >
  >({});

  useEffect(() => {
    const initialTranslations: Record<
      string,
      { name: string; description: string; shortDescription: string }
    > = {};
    const productTrans = initialProduct?.translations || [];

    SUPPORTED_LOCALES.forEach((lang: string) => {
      const existing = productTrans.find(
        pt => pt.language.toLowerCase() === lang.toLowerCase()
      );
      initialTranslations[lang] = {
        name: existing?.name || '',
        description: existing?.description || '',
        shortDescription: existing?.shortDescription || '',
      };
    });
    setTranslations(initialTranslations);
  }, [initialProduct]);

  const [uploading, setUploading] = useState(false);
  const [_reorderingMedia, setReorderingMedia] = useState(false);

  const loadVariants = async (id: string) => {
    try {
      const data = await getProductVariants(id);
      setVariants(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMedia = async (id: string) => {
    try {
      const data = await getProductMedia(id);
      setMedia(data.data || []);
    } catch (err) {
      console.error(err);
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
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('productId', productId);
        formDataUpload.append('alt', file.name);
        if (media.length === 0 && i === 0)
          formDataUpload.append('isPrimary', 'true');

        const result = await uploadMediaAction(formDataUpload);
        if (!result.success) throw new Error(result.error);
      }
      await loadMedia(productId);
      setSuccessMessage(t('messages.mediaUploaded'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('messages.errorUploadingMedia')
      );
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!productId) return;
    if (!confirm(t('deleteMediaConfirm'))) return;

    try {
      const result = await deleteMediaAction(mediaId);
      if (!result.success) throw new Error(result.error);
      setSuccessMessage(t('messages.mediaDeleted'));
      setMedia(media.filter(m => m.id !== mediaId));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('messages.errorDeletingProduct')
      );
    }
  };

  const handleMediaDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !productId) return;

    const oldIndex = media.findIndex(m => m.id === active.id);
    const newIndex = media.findIndex(m => m.id === over.id);
    const updatedMedia = arrayMove(media, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        sortOrder: index,
      })
    );

    setMedia(updatedMedia);

    if (reorderTimeoutRef.current) clearTimeout(reorderTimeoutRef.current);

    reorderTimeoutRef.current = setTimeout(async () => {
      try {
        setReorderingMedia(true);
        const mediaOrders = updatedMedia.map(m => ({
          id: m.id,
          sortOrder: m.sortOrder,
        }));
        await reorderMediaAction(mediaOrders, productId);
      } catch (err) {
        console.error(err);
        await loadMedia(productId);
        setError(t('messages.errorReorderingMedia'));
      } finally {
        setReorderingMedia(false);
        reorderTimeoutRef.current = null;
      }
    }, 1000);
  };

  const handleUpdateProduct = async () => {
    setSaving(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      // 1. Préparation du payload brut pour validation
      const rawPayload = {
        ...formData,
        translations: Object.entries(translations)
          .filter(([_, data]) => data.name && data.name.trim() !== '')
          .map(([lang, data]) => ({
            language: lang,
            name: data.name.trim(),
            description: data.description || undefined,
            shortDescription: data.shortDescription || undefined,
          })),
        dimensions: {
          length: formData.length,
          width: formData.width,
          height: formData.height,
        },
      };

      // 2. Validation Client-side avec Zod
      // On utilise le même schéma que le serveur pour une cohérence totale
      const schema = productId ? UpdateProductSchema : CreateProductSchema;
      const validation = schema.safeParse(rawPayload);

      if (!validation.success) {
        const errors = formatZodErrors(validation.error);
        const errorsObj: Record<string, string> = {};
        errors.forEach(err => {
          errorsObj[err.field] = err.message;
        });
        setFieldErrors(errorsObj);
        throw new Error(t('messages.validationError'));
      }

      // 3. Envoi des données validées
      const validatedPayload = validation.data;
      console.log('📦 Sending Validated Product Payload:', validatedPayload);

      let result;
      if (productId) {
        result = await updateProductAction(productId, validatedPayload);
      } else {
        result = await createProductAction(validatedPayload);
      }

      if (!result.success) {
        if (result.errors) {
          const errorsObj: Record<string, string> = {};
          result.errors.forEach((err: { field: string; message: string }) => {
            errorsObj[err.field] = err.message;
          });
          setFieldErrors(errorsObj);
          throw new Error(t('messages.validationError'));
        }
        throw new Error(result.error || 'Error');
      }

      /* Server Actions revalidate path, so we don't strictly need returned data unless we update local state immediately.
         However, the router.push/refresh below will handle the UI update.
       */

      setSuccessMessage(
        productId ? t('messages.productUpdated') : t('messages.productCreated')
      );

      if (!productId) {
        router.push(`/${locale}/admin/products`);
      } else {
        router.refresh();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('error'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVariant = async (
    variantId: string,
    updates: {
      prices?: Record<string, number>;
      stock?: number;
    }
  ) => {
    if (!productId) return;
    try {
      const payload: {
        prices?: Record<string, number>;
        inventory?: { stock: number };
      } = {};
      if (updates.prices) {
        payload.prices = updates.prices;
      }
      if (updates.stock !== undefined) {
        payload.inventory = { stock: updates.stock };
      }

      const result = await updateVariantAction(productId, variantId, payload);
      if (!result.success) throw new Error(result.error);

      await loadVariants(productId);
      setSuccessMessage(t('messages.variantUpdated'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('messages.errorUpdatingProduct')
      );
    }
  };

  const handleDeleteVariant = async (
    variantId: string,
    variantName: string
  ) => {
    if (!productId || !confirm(t('deleteVariantConfirm', { sku: variantName })))
      return;
    try {
      const result = await deleteVariantAction(productId, variantId);
      if (!result.success) throw new Error(result.error);

      await loadVariants(productId);
      setSuccessMessage(t('messages.variantDeleted'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('messages.errorDeletingProduct')
      );
    }
  };

  const handleSaveNewVariants = async () => {
    if (!productId || newVariants.length === 0) return;
    try {
      const variantPayload = newVariants.map(v => ({
        names: v.names,
        prices: Object.fromEntries(
          Object.entries(v.prices).map(([c, p]) => [
            c,
            p ? parseFloat(p) : null,
          ])
        ),
        stock: parseInt(v.stock) || 0,
      }));
      const result = await addVariantsAction(productId, variantPayload);
      if (!result.success) throw new Error(result.error);

      await loadVariants(productId);
      setNewVariants([]);
      setSuccessMessage(t('messages.variantsAdded'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('messages.errorCreatingProduct')
      );
    }
  };

  const isSlugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin/products`}
            className="admin-btn-secondary p-2"
          >
            <ArrowLeft className="h-5 w-5 admin-text-subtle" />
          </Link>
          <div>
            <h1 className="admin-page-title">
              {isEditMode ? t('editProduct') : t('createProduct')}
            </h1>
            <p className="admin-page-subtitle">
              {translations['en']?.name || t('productInfo')}
            </p>
          </div>
        </div>
        <button
          onClick={handleUpdateProduct}
          disabled={saving}
          className="admin-btn-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? t('saving') : tc('save')}
        </button>
      </div>

      {successMessage && (
        <div className="admin-alert-success">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold">{tc('success')}</h3>
            <p className="mt-0.5 text-sm opacity-90">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert-error">
          <X className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold">{tc('error')}</h3>
            <p className="mt-0.5 text-sm opacity-90">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="hover:opacity-70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProductBasicInfo
            formData={formData}
            setFormData={setFormData}
            translations={translations}
            setTranslations={setTranslations}
            isSlugValid={isSlugValid}
            fieldErrors={fieldErrors}
            t={t}
            tc={tc}
            isEditMode={isEditMode}
          />

          {isEditMode && (
            <ProductMediaManager
              media={media}
              productId={productId}
              onUpload={handleFileUpload}
              onDelete={handleDeleteMedia}
              onDragEnd={handleMediaDragEnd}
              uploading={uploading}
              t={t}
              tc={tc}
            />
          )}

          <ProductShippingInfo
            formData={formData}
            setFormData={setFormData}
            suppliers={suppliers}
            fieldErrors={fieldErrors}
            t={t}
          />

          {isEditMode && (
            <ProductVariantsManager
              variants={variants}
              newVariants={newVariants}
              setNewVariants={setNewVariants}
              productId={productId}
              onUpdateVariant={handleUpdateVariant}
              onDeleteVariant={handleDeleteVariant}
              onSaveNewVariants={handleSaveNewVariants}
              locale={locale}
              t={t}
              tc={tc}
            />
          )}
        </div>

        <div className="space-y-6">
          <div className="admin-card">
            <h3 className="admin-section-title">{t('quickActions')}</h3>
            <div className="space-y-2">
              <button
                onClick={handleUpdateProduct}
                disabled={saving}
                className="admin-btn-primary w-full justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {tc('saveChanges')}
              </button>
              <p className="admin-text-tiny text-center italic">
                {t('lastUpdated', {
                  date: initialProduct
                    ? new Date(initialProduct.updatedAt).toLocaleString()
                    : '-',
                })}
              </p>
            </div>
          </div>

          <div className="admin-card admin-card-tip">
            <h3 className="text-sm admin-tip-title mb-2">{t('proTip')}</h3>
            <p className="text-xs admin-tip-text">{t('seoProTip')}</p>
          </div>
        </div>
      </div>

      <div className="admin-footer-bar">
        <Link
          href={`/${locale}/admin/products`}
          className="admin-btn-secondary"
        >
          {tc('cancel')}
        </Link>
        <button
          onClick={handleUpdateProduct}
          disabled={saving}
          className="admin-btn-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? t('saving') : tc('save')}
        </button>
      </div>
    </div>
  );
}
