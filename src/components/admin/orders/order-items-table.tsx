import { getTranslations, getLocale } from 'next-intl/server';
import { Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils/currency';
import { SupportedCurrency } from '@/lib/config/site';
import { OrderItem } from '@/lib/types/domain/order';

interface AdminOrderItem extends OrderItem {
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
    <div className="admin-items-list divide-y divide-gray-200">
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
        } else if (snapshot?.name?.en) {
          productName = snapshot.name.en;
        } else {
          // Fallback to live product/variant data
          const liveProduct = item.product || item.variant?.product;
          if (liveProduct) {
            const translation = liveProduct.translations?.find(
              tr => tr.language === locale.toUpperCase()
            );
            const enTranslation = liveProduct.translations?.find(
              tr => tr.language === 'EN'
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
              liveProduct?.media?.find((m: any) => m.isPrimary) ||
              liveProduct?.media?.[0];
            if (productMedia) {
              imageUrl = productMedia.url;
            }
          }
        }

        return (
          <div key={item.id} className="px-6 py-4 flex items-center">
            <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={productName}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="ml-4 flex-1">
              <p className="font-medium text-gray-900">{productName}</p>
              <p className="text-sm text-gray-500">
                {t('sku')}: {item.variant?.sku || t('na')}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-sm font-medium text-gray-900">
                {item.quantity} ×{' '}
                {formatPrice(
                  item.unitPrice,
                  currency as SupportedCurrency,
                  locale
                )}
              </p>
              <p className="text-sm text-gray-500">
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
