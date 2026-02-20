import { VIBE_ANIMATION_FADE_IN } from '@/lib/config/vibe-styles';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { PriceDisplay } from '@/components/price-display';
import { QuantitySelector } from '@/components/cart/quantity-selector';

import { Card } from '@/components/ui/card';

import { CartItem as CartItemType } from '@/lib/types/ui/cart';

interface CartItemProps {
  item: CartItemType;
  locale: string;
  onRemove: (id: string) => void;
  isLoading: boolean;
}

export function CartItem({ item, locale, onRemove, isLoading }: CartItemProps) {
  const t = useTranslations('cart');
  const translation = item.variant.product.translations[0];
  const image = item.variant.product.media[0]?.url;

  return (
    <Card
      className={`flex flex-col sm:flex-row gap-4 duration-300 ${VIBE_ANIMATION_FADE_IN}`}
    >
      {image && (
        <div className="aspect-square bg-muted rounded-lg overflow-hidden border border-border relative w-full sm:w-24 sm:h-24 flex-shrink-0">
          <Image
            src={image}
            alt={translation?.name || ''}
            fill
            className="vibe-image-cover"
            sizes="(max-width: 640px) 100vw, 96px"
          />
        </div>
      )}
      <div className="flex-grow">
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
            <X className="h-5 w-5" />
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
              <span className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1.5 vibe-mb-0">
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
    </Card>
  );
}
