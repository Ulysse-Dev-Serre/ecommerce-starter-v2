import Link from 'next/link';
import { formatPrice } from '@/lib/utils/currency';

interface OrderItemsListProps {
  items: any[];
  productData: Record<string, { image?: string; slug: string; name?: string }>;
  currency: string;
  locale: string;
  labels: {
    itemsTitle: string;
    quantity: string;
    productFallback: string;
  };
}

export function OrderItemsList({
  items,
  productData,
  currency,
  locale,
  labels,
}: OrderItemsListProps) {
  const getItemName = (item: any) => {
    const snapshot = item.productSnapshot as any;
    const currentProduct = item.productId ? productData[item.productId] : null;

    if (currentProduct?.name) return currentProduct.name;
    if (snapshot?.name) {
      if (typeof snapshot.name === 'object') {
        return (
          snapshot.name[locale] ||
          snapshot.name.en ||
          Object.values(snapshot.name)[0]
        );
      }
      return snapshot.name;
    }
    return labels.productFallback;
  };

  return (
    <div className="vibe-container vibe-bg-background vibe-p-0 vibe-overflow-hidden">
      <div className="vibe-px-8 vibe-py-6 vibe-section-divider-bottom vibe-bg-muted-extra-soft">
        <h2 className="vibe-text-xl-bold vibe-text-foreground">
          {labels.itemsTitle} ({items.length})
        </h2>
      </div>
      <ul className="vibe-divide-y">
        {items.map((item: any) => {
          const snapshot = item.productSnapshot as any;
          const currentProduct = item.productId
            ? productData[item.productId]
            : null;
          const slug = currentProduct?.slug || snapshot?.slug;
          const imageUrl = currentProduct?.image || snapshot?.image;
          const itemName = getItemName(item);

          return (
            <li
              key={item.id}
              className="vibe-p-8 vibe-flex-col sm:vibe-flex-row vibe-items-center vibe-gap-8 vibe-hover-bg-muted-extra-soft vibe-transition-colors"
            >
              <div className="vibe-w-24 vibe-h-24 vibe-bg-muted vibe-rounded-2xl vibe-overflow-hidden vibe-flex-shrink-0 vibe-border-border vibe-shadow-sm">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={itemName}
                    className="vibe-w-full vibe-h-full vibe-object-cover"
                  />
                ) : (
                  <div className="vibe-w-full vibe-h-full vibe-flex-center vibe-text-muted-soft vibe-text-3xl">
                    📦
                  </div>
                )}
              </div>
              <div className="vibe-flex-grow vibe-min-w-0 vibe-text-center sm:vibe-text-left">
                {slug ? (
                  <Link
                    href={`/${locale}/product/${slug}`}
                    className="vibe-text-xl-bold vibe-text-foreground vibe-hover-primary vibe-underline-primary vibe-transition-colors"
                  >
                    {itemName}
                  </Link>
                ) : (
                  <p className="vibe-text-xl-bold vibe-text-foreground">
                    {itemName}
                  </p>
                )}
                <p className="vibe-text-base vibe-text-muted vibe-mt-2 vibe-text-medium">
                  {labels.quantity} :{' '}
                  <span className="vibe-text-bold vibe-text-foreground">
                    {item.quantity}
                  </span>{' '}
                  × {formatPrice(item.unitPrice, currency as any, locale)}
                </p>
              </div>
              <div className="vibe-text-right vibe-whitespace-nowrap">
                <p className="vibe-text-2xl-bold vibe-text-foreground">
                  {formatPrice(item.totalPrice, currency as any, locale)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
