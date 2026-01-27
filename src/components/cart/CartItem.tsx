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
    <div className="vibe-card flex flex-col sm:flex-row gap-4 animate-in fade-in duration-300">
      {image && (
        <div className="w-full sm:w-24 sm:h-24 aspect-square flex-shrink-0 bg-muted rounded-md overflow-hidden border border-border/50">
          <img
            src={image}
            alt={translation?.name || ''}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <Link
            href={`/${locale}/product/${item.variant.product.slug}`}
            className="font-bold text-lg mb-1 block hover:text-primary transition-colors truncate"
          >
            {translation?.name || item.variant.sku}
          </Link>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-error transition-colors p-1"
            aria-label={t('remove')}
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {t('sku')}: {item.variant.sku}
        </p>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <PriceDisplay
              pricing={item.variant.pricing}
              className="text-lg font-bold text-foreground"
              locale={locale}
            />
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('quantity')}
              </span>
              <QuantitySelector
                cartItemId={item.id}
                initialQuantity={item.quantity}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
