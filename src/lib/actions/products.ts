'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/server';
import { prisma } from '@/lib/core/db';
import { logger } from '@/lib/core/logger';
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/services/products/product-admin.service';
import { productMediaService } from '@/lib/services/products/product-media.service';
import {
  updateVariant,
  deleteVariant,
  createSimpleVariants,
} from '@/lib/services/variants';
import {
  UpdateProductData,
  CreateProductData,
} from '@/lib/types/domain/product';
import { formatZodErrors } from '@/lib/validators';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '@/lib/validators/product';

import { Language } from '@/generated/prisma';

/**
 * Create a new product
 */
export async function createProductAction(formData: FormData | unknown) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  // If formData is FormData, convert to object, otherwise assume it's already an object (from client component)
  // Our Client Component currently passes JSON-like objects, but Server Actions usually take FormData or bound args.
  // For verify we support both or standard object.
  const rawData = formData;

  // Validate payload
  const validation = CreateProductSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('❌ Product Creation Validation Failed:', {
      rawData,
      errors: validation.error.format(),
    });
    return {
      success: false,
      error: 'Validation failed',
      errors: formatZodErrors(validation.error),
    };
  }

  const validatedData = validation.data;

  try {
    const productData: CreateProductData = {
      slug: validatedData.slug,
      status: validatedData.status,
      isFeatured: validatedData.isFeatured,
      sortOrder: validatedData.sortOrder,
      originCountry: validatedData.originCountry,
      hsCode: validatedData.hsCode,
      shippingOriginId: validatedData.shippingOriginId,
      exportExplanation: validatedData.exportExplanation,
      weight: validatedData.weight,
      dimensions: {
        length: validatedData.dimensions.length,
        width: validatedData.dimensions.width,
        height: validatedData.dimensions.height,
      },
      translations: validatedData.translations.map(t => ({
        ...t,
        language: t.language.toUpperCase() as Language,
        description: t.description ?? undefined,
        shortDescription: t.shortDescription ?? undefined,
        metaTitle: t.metaTitle ?? undefined,
        metaDescription: t.metaDescription ?? undefined,
      })),
    };

    const product = await createProduct(productData);

    logger.info(
      { requestId, action: 'create_product', userId, slug: product.slug },
      'Product created via Server Action'
    );

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${product.id}`);

    return { success: true, data: JSON.parse(JSON.stringify(product)) };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to create product');
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create product',
    };
  }
}

/**
 * Update an existing product
 */
export async function updateProductAction(productId: string, rawData: unknown) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  // Validate payload
  const validation = UpdateProductSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: formatZodErrors(validation.error),
    };
  }

  const validatedData = validation.data;

  try {
    const updateData: UpdateProductData = {};

    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.isFeatured !== undefined)
      updateData.isFeatured = validatedData.isFeatured;
    if (validatedData.sortOrder !== undefined)
      updateData.sortOrder = validatedData.sortOrder;
    if (validatedData.originCountry !== undefined)
      updateData.originCountry = validatedData.originCountry;
    if (validatedData.hsCode !== undefined)
      updateData.hsCode = validatedData.hsCode;
    if (validatedData.shippingOriginId !== undefined)
      updateData.shippingOriginId = validatedData.shippingOriginId || null;
    if (validatedData.exportExplanation !== undefined)
      updateData.exportExplanation = validatedData.exportExplanation;
    if (validatedData.weight !== undefined)
      updateData.weight = validatedData.weight;
    if (validatedData.dimensions !== undefined) {
      updateData.dimensions = validatedData.dimensions
        ? {
            length: Number(validatedData.dimensions.length),
            width: Number(validatedData.dimensions.width),
            height: Number(validatedData.dimensions.height),
          }
        : null;
    }

    if (validatedData.translations && validatedData.translations.length > 0) {
      updateData.translations = validatedData.translations.map(t => ({
        language: t.language.toUpperCase() as Language,
        name: t.name,
        description: t.description || null,
        shortDescription: t.shortDescription || null,
        metaTitle: t.metaTitle || null,
        metaDescription: t.metaDescription || null,
      }));
    }

    const updatedProduct = await updateProduct(productId, updateData);

    logger.info(
      {
        requestId,
        action: 'update_product',
        userId,
        slug: updatedProduct.slug,
      },
      'Product updated via Server Action'
    );

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);

    return { success: true, data: JSON.parse(JSON.stringify(updatedProduct)) };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to update product');
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update product',
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProductAction(productId: string) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  try {
    await deleteProduct(productId);
    logger.info(
      { requestId, action: 'delete_product', userId, productId },
      'Product deleted via Server Action'
    );

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to delete product');
    return { success: false, error: 'Failed to delete product' };
  }
}

/**
 * Reorder products
 */
export async function reorderProductsAction(
  items: { id: string; sortOrder: number }[]
) {
  await requireAdmin();

  try {
    // We can use prisma transaction directly here or add a service method if needed.
    // Ideally we should have a service method for bulk update, but for now strict prisma calls are fine in Action if auth is checked.
    await prisma.$transaction(
      items.map(item =>
        prisma.product.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    revalidatePath('/admin/products');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to reorder products' };
  }
}

/**
 * Upload Media Action
 */
export async function uploadMediaAction(formData: FormData) {
  const userId = await requireAdmin();
  const requestId = crypto.randomUUID();

  const file = formData.get('file') as File | null;
  const productId = formData.get('productId') as string | null;
  const variantId = formData.get('variantId') as string | null;
  const isPrimary = formData.get('isPrimary') === 'true';
  const alt = formData.get('alt') as string | null;
  const title = formData.get('title') as string | null;

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  try {
    const media = await productMediaService.uploadMedia({
      file,
      productId,
      variantId,
      isPrimary,
      alt,
      title,
    });

    logger.info(
      { requestId, action: 'upload_media', userId, mediaId: media.id },
      'Media uploaded via Server Action'
    );

    revalidatePath(`/admin/products/${productId || ''}`);
    return { success: true, data: media };
  } catch (error) {
    logger.error({ requestId, error, userId }, 'Failed to upload media');
    return { success: false, error: 'Failed to upload media' };
  }
}

/**
 * Delete Media Action
 */
export async function deleteMediaAction(mediaId: string) {
  await requireAdmin();
  try {
    const media = await productMediaService.deleteMedia(mediaId);
    if (media.productId) revalidatePath(`/admin/products/${media.productId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete media',
    };
  }
}

/**
 * Reorder Media Action
 */
export async function reorderMediaAction(
  items: { id: string; sortOrder: number }[],
  productId?: string
) {
  await requireAdmin();
  try {
    await productMediaService.reorderMedia(items);
    if (productId) revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to reorder media' };
  }
}

/**
 * Variant Actions Wrapper
 */
export async function updateVariantAction(
  productId: string,
  variantId: string,
  payload: {
    prices?: Record<string, number>;
    inventory?: { stock: number };
  }
) {
  await requireAdmin();
  try {
    await updateVariant(variantId, payload);
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update variant' };
  }
}

export async function deleteVariantAction(
  productId: string,
  variantId: string
) {
  await requireAdmin();
  try {
    await deleteVariant(variantId);
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete variant' };
  }
}

export async function addVariantsAction(
  productId: string,
  variants: Array<{
    names: Record<string, string>;
    prices: Record<string, number | null>;
    stock: number;
  }>
) {
  await requireAdmin();
  try {
    const payload = variants.map(v => ({
      ...v,
      prices: Object.fromEntries(
        Object.entries(v.prices).map(([c, p]) => [c, p ?? 0])
      ) as Record<string, number>,
    }));
    await createSimpleVariants(productId, payload);
    revalidatePath(`/admin/products/${productId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to add variants' };
  }
}
/**
 * Update media metadata (alt text, title) for SEO
 */
export async function updateMediaMetadataAction(
  mediaId: string,
  payload: { alt?: string; title?: string }
) {
  await requireAdmin();
  const requestId = crypto.randomUUID();

  try {
    logger.info(
      { requestId, action: 'update_media_metadata', mediaId, ...payload },
      'Updating media metadata'
    );

    const media = await productMediaService.updateMetadata(mediaId, payload);

    // Revalidate potential pages where this media appears
    if (media.productId) {
      revalidatePath(`/admin/products/${media.productId}`);
    }

    return { success: true, data: media };
  } catch (error) {
    logger.error(
      {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Failed to update media metadata'
    );
    return { success: false, error: 'Failed to update media metadata' };
  }
}
