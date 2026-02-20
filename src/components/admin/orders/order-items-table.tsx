import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';

import { SupportedCurrency, DEFAULT_LOCALE } from '@/lib/config/site';
import { OrderItem } from '@/lib/types/domain/order';
import { formatPrice } from '@/lib/utils/currency';

export interface AdminOrderItem extends OrderItem {
  variant?: {
    sku: string;
    media?: Array<{ url: string; isPrimary: boolean }>;
    product?: {
      slug: string;
      translations: Array<{ language: string; name: string }>;
      media?: Array<{ url: string; isPrimary: boolean }>;
    } | null;
  } | null;
  product?: {
    slug: string;
    translations: Array<{ language: string; name: string }>;
    media?: Array<{ url: string; isPrimary: boolean }>;
  } | null;
}

interface OrderItemsTableProps {
  items: AdminOrderItem[];
  currency: string;
}

export async function OrderItemsTable({
  items,
  currency,
}: OrderItemsTableProps) {
  const locale = await getLocale();
  const t = await getTranslations({
    locale,
    namespace: 'adminDashboard.orders.detail',
  });

  return (
    <div className="admin-items-list divide-y admin-border-subtle">
      {items.map(item => {
        const snapshot = item.productSnapshot as {
          name?: string | Record<string, string>;
          image?: string;
          sku?: string;
        };

        // Name resolution
        let productName = t('unnamedProduct');

        if (typeof snapshot?.name === 'string') {
          productName = snapshot.name;
        } else if (snapshot?.name?.[locale]) {
          productName = snapshot.name[locale];
        } else if (snapshot?.name?.[DEFAULT_LOCALE]) {
          productName = snapshot.name[DEFAULT_LOCALE];
        } else {
          // Fallback to live product/variant data
          const liveProduct = item.product || item.variant?.product;
          if (liveProduct) {
            const translation = liveProduct.translations?.find(
              tr => tr.language === locale.toUpperCase()
            );
            const enTranslation = liveProduct.translations?.find(
              tr => tr.language === DEFAULT_LOCALE.toUpperCase()
            );

            productName =
              translation?.name ||
              enTranslation?.name ||
              liveProduct.slug ||
              t('unnamedProduct');
          }
        }

        // Image resolution
        let imageUrl = snapshot?.image;
        if (!imageUrl) {
          // Try variant media first
          const variantMedia =
            item.variant?.media?.find(m => m.isPrimary) ||
            item.variant?.media?.[0];
          if (variantMedia) {
            imageUrl = variantMedia.url;
          } else {
            // Try product media
            const liveProduct = item.product || item.variant?.product;
            const productMedia =
              liveProduct?.media?.find(m => m.isPrimary) ||
              liveProduct?.media?.[0];
            if (productMedia) {
              imageUrl = productMedia.url;
            }
          }
        }

        return (
          <div key={item.id} className="px-6 py-4 flex items-center">
            <div className="h-12 w-12 flex-shrink-0 admin-bg-subtle rounded overflow-hidden">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={productName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="ml-4 flex-1">
              <p className="font-medium admin-text-main">{productName}</p>
              <p className="text-sm admin-text-subtle">
                {t('sku')}: {item.variant?.sku || t('na')}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm font-medium admin-text-main">
                {item.quantity} ×{' '}
                {formatPrice(
                  item.unitPrice,
                  currency as SupportedCurrency,
                  locale
                )}
              </p>
              <p className="text-sm admin-text-subtle">
                {formatPrice(
                  item.totalPrice,
                  currency as SupportedCurrency,
                  locale
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
