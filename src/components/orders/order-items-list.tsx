import { formatPrice } from '@/lib/utils/currency';
import { OrderItem } from '@/lib/types/domain/order';
import { SupportedCurrency } from '@/lib/config/site';

import Link from 'next/link';
import Image from 'next/image';

interface OrderItemsListProps {
  items: OrderItem[];
  itemData: Record<
    string,
    {
      image?: string;
      slug: string;
      name: string;
      attributes: { name: string; value: string }[];
    }
  >;
  currency: string;
  locale: string;
  labels: {
    itemsTitle: string;
    quantity: string;
    productFallback: string;
    variant: string;
  };
}

export function OrderItemsList({
  items,
  itemData,
  currency,
  locale,
  labels,
}: OrderItemsListProps) {
  const getItemName = (item: OrderItem) => {
    const info = item.variantId ? itemData[item.variantId] : null;

    if (info?.name) return info.name;

    const snapshot = item.productSnapshot as {
      name?: string | Record<string, string>;
    };
    if (snapshot?.name) {
      if (typeof snapshot.name === 'object') {
        const names = snapshot.name as Record<string, string>;
        return names[locale] || names.en || Object.values(names)[0];
      }
      return snapshot.name;
    }
    return labels.productFallback;
  };

  return (
    <div className="vibe-container bg-background vibe-p-0 vibe-overflow-hidden">
      <div className="px-8 vibe-py-6 border-b border-border pb-4 bg-muted/20">
        <h2 className="text-xl font-bold text-foreground text-foreground">
          {labels.itemsTitle} ({items.length})
        </h2>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item: OrderItem) => {
          const info = item.variantId ? itemData[item.variantId] : null;
          const snapshot = item.productSnapshot as {
            image?: string;
            slug?: string;
          };

          const slug = info?.slug || snapshot?.slug;
          const imageUrl = info?.image || snapshot?.image;
          const itemName = getItemName(item);

          return (
            <li
              key={item.id}
              className="p-8 flex flex-col sm:flex vibe-items-center vibe-gap-8 vibe-hover-bg-muted-extra-soft transition-colors"
            >
              <div className="vibe-w-24 vibe-h-24 vibe-bg-muted vibe-rounded-2xl vibe-overflow-hidden flex-shrink-0 vibe-border-border vibe-shadow-sm">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={itemName}
                    width={96}
                    height={96}
                    className="vibe-w-full vibe-h-full vibe-object-cover"
                  />
                ) : (
                  <div className="vibe-w-full vibe-h-full vibe-flex-center text-muted-foreground/30 vibe-text-3xl">
                    📦
                  </div>
                )}
              </div>
              <div className="flex-grow vibe-min-w-0 text-center sm:text-left">
                {slug ? (
                  <Link
                    href={`/${locale}/product/${slug}`}
                    className="text-xl font-bold text-foreground text-foreground hover:text-primary underline decoration-primary decoration-2 underline-offset-4 transition-colors"
                  >
                    {itemName}
                  </Link>
                ) : (
                  <p className="text-xl font-bold text-foreground text-foreground">
                    {itemName}
                  </p>
                )}

                {/* Affichage des attributs de variante (Sans badges, style sobre conforme au projet) */}
                {info?.attributes && info.attributes.length > 0 && (
                  <p className="vibe-text-base text-muted-foreground mt-1 font-medium">
                    {labels.variant} :{' '}
                    <span className="font-bold text-foreground">
                      {info.attributes.map(a => a.value).join(', ')}
                    </span>
                  </p>
                )}

                <p className="vibe-text-base text-muted-foreground mt-1 font-medium">
                  {labels.quantity} :{' '}
                  <span className="font-bold text-foreground">
                    {item.quantity}
                  </span>{' '}
                  ×{' '}
                  {formatPrice(
                    item.unitPrice,
                    currency as SupportedCurrency,
                    locale
                  )}
                </p>
              </div>
              <div className="text-right vibe-whitespace-nowrap">
                <p className="vibe-text-2xl-bold text-foreground">
                  {formatPrice(
                    item.totalPrice,
                    currency as SupportedCurrency,
                    locale
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
