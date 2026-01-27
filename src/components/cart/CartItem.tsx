import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PriceDisplay } from '@/components/price-display';
import { QuantitySelector } from '@/components/cart/quantity-selector';

interface CartItemProps {
  item: {
    id: string;
    quantity: number;
    variant: {
      id: string;
      sku: string;
      pricing: Array<{
        price: string;
        currency: string;
      }>;
      product: {
        slug: string;
        translations: Array<{
          name: string;
        }>;
        media: Array<{
          url: string;
        }>;
      };
    };
  };
  locale: string;
  onRemove: (id: string) => void;
  isLoading: boolean;
}

export function CartItem({ item, locale, onRemove, isLoading }: CartItemProps) {
  const t = useTranslations('cart');
  const translation = item.variant.product.translations[0];
  const image = item.variant.product.media[0]?.url;

  return (
    <div className="flex gap-4 border border-border rounded-lg p-4 bg-card shadow-sm animate-in fade-in duration-300">
      {image && (
        <div className="w-24 h-24 flex-shrink-0">
          <img
            src={image}
            alt={translation?.name || ''}
            className="w-full h-full object-cover rounded shadow-sm border border-border/50"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link
          href={`/${locale}/product/${item.variant.product.slug}`}
          className="font-semibold text-lg mb-1 block hover:text-primary transition-colors truncate"
        >
          {translation?.name || item.variant.sku}
        </Link>
        <p className="text-sm text-muted-foreground mb-2">
          {t('sku')}: {item.variant.sku}
        </p>
        <PriceDisplay
          pricing={item.variant.pricing}
          className="text-lg font-bold mb-3 block text-foreground"
          locale={locale}
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t('quantity')}:
          </span>
          <QuantitySelector
            cartItemId={item.id}
            initialQuantity={item.quantity}
            locale={locale}
          />
        </div>
      </div>
      <div className="flex flex-col items-end justify-between gap-2">
        <button
          onClick={() => onRemove(item.id)}
          disabled={isLoading}
          className="text-error hover:text-error/80 text-sm font-medium transition-colors disabled:opacity-50"
          aria-label={t('remove')} // need to check if 'remove' exists
        >
          {t('remove')}
        </button>
      </div>
    </div>
  );
}
