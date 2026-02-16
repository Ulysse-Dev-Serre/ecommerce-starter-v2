/**
 * Centralized Admin Product Actions
 */

import { API_ROUTES } from '@/lib/config/api-routes';
import {
  CreateProductData,
  UpdateProductData,
} from '@/lib/types/domain/product';
import {
  UpdateVariantData,
  SimpleVariantData,
} from '@/lib/types/domain/variant';

/**
 * Fetch products list for admin (filtered by status and language)
 */
export async function getAdminProducts(params: {
  language: string;
  status?: string;
}) {
  const queryParams = new URLSearchParams({
    language: params.language,
    ...(params.status && params.status !== 'all' && { status: params.status }),
  });

  const response = await fetch(`${API_ROUTES.PRODUCTS.LIST}?${queryParams}`);

  if (!response.ok) {
    throw new Error('Failed to fetch admin products');
  }

  return await response.json();
}

/**
 * Create a new product
 */
export async function createProduct(payload: CreateProductData) {
  const response = await fetch(API_ROUTES.ADMIN.PRODUCTS.BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create product');
  }

  return data;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: string,
  payload: UpdateProductData
) {
  const response = await fetch(API_ROUTES.ADMIN.PRODUCTS.ITEM(productId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update product');
  }

  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  const response = await fetch(API_ROUTES.ADMIN.PRODUCTS.ITEM(productId), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete product');
  }

  return await response.json();
}

/**
 * Reorder products
 */
export async function reorderProducts(
  productOrders: { id: string; sortOrder: number }[]
) {
  const response = await fetch(API_ROUTES.ADMIN.PRODUCTS.REORDER, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: productOrders }),
  });

  if (!response.ok) {
    throw new Error('Failed to reorder products');
  }

  return await response.json();
}

/**
 * Fetch product variants
 */
export async function getProductVariants(productId: string) {
  const response = await fetch(API_ROUTES.ADMIN.PRODUCTS.VARIANTS(productId));

  if (!response.ok) {
    throw new Error('Failed to fetch product variants');
  }

  return await response.json();
}

/**
 * Update a product variant
 */
export async function updateProductVariant(
  productId: string,
  variantId: string,
  payload: UpdateVariantData
) {
  const response = await fetch(
    API_ROUTES.ADMIN.PRODUCTS.VARIANT_ITEM(productId, variantId),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update product variant');
  }

  return await response.json();
}

/**
 * Delete a product variant
 */
export async function deleteProductVariant(
  productId: string,
  variantId: string
) {
  const response = await fetch(
    API_ROUTES.ADMIN.PRODUCTS.VARIANT_ITEM(productId, variantId),
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error('Failed to delete product variant');
  }

  return await response.json();
}

/**
 * Add simple new variants to a product
 */
export async function addSimpleVariants(
  productId: string,
  variants: SimpleVariantData[]
) {
  const response = await fetch(
    API_ROUTES.ADMIN.PRODUCTS.VARIANTS_SIMPLE(productId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add simple variants');
  }

  return await response.json();
}

/**
 * Upload product media
 */
export async function uploadProductMedia(formData: FormData) {
  const response = await fetch(API_ROUTES.ADMIN.MEDIA.UPLOAD, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to upload media');
  }

  return await response.json();
}

/**
 * Delete product media
 */
export async function deleteProductMedia(mediaId: string) {
  const response = await fetch(API_ROUTES.ADMIN.MEDIA.ITEM(mediaId), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete media');
  }

  return await response.json();
}

/**
 * Reorder product media
 */
export async function reorderProductMedia(
  mediaOrders: { id: string; sortOrder: number }[]
) {
  const response = await fetch(API_ROUTES.ADMIN.MEDIA.REORDER, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media: mediaOrders }),
  });

  if (!response.ok) {
    throw new Error('Failed to reorder media');
  }

  return await response.json();
}

/**
 * Fetch product media
 */
export async function getProductMedia(productId: string) {
  const response = await fetch(
    `${API_ROUTES.ADMIN.MEDIA.BASE}?productId=${productId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch media');
  }

  return await response.json();
}
