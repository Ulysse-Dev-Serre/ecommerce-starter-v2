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
    <div className="vibe-container bg-background p-0 overflow-hidden">
      <div className="px-8 py-6 border-b border-border bg-muted/10">
        <h2 className="text-xl font-bold text-foreground">
          {labels.itemsTitle} ({items.length})
        </h2>
      </div>
      <ul className="divide-y divide-border">
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
              className="p-8 flex flex-col sm:flex-row items-center gap-8 hover:bg-muted/5 transition-colors"
            >
              <div className="w-24 h-24 bg-muted rounded-2xl overflow-hidden flex-shrink-0 border border-border shadow-sm">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={itemName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-3xl">
                    📦
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                {slug ? (
                  <Link
                    href={`/${locale}/product/${slug}`}
                    className="text-xl font-extrabold text-foreground hover:text-primary hover:underline underline-offset-4 decoration-2 transition-colors"
                  >
                    {itemName}
                  </Link>
                ) : (
                  <p className="text-xl font-extrabold text-foreground">
                    {itemName}
                  </p>
                )}
                <p className="text-base text-muted-foreground mt-2 font-medium">
                  {labels.quantity} :{' '}
                  <span className="text-foreground font-bold">
                    {item.quantity}
                  </span>{' '}
                  × {formatPrice(item.unitPrice, currency as any, locale)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-foreground">
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
