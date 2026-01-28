import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
} from '@/lib/vibe-styles';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
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
    <div
      className={`vibe-card vibe-product-list-item ${VIBE_ANIMATION_FADE_IN}`}
    >
      {image && (
        <div className="vibe-image-container vibe-product-thumb-container">
          <Image
            src={image}
            alt={translation?.name || ''}
            fill
            className="vibe-image-cover"
            sizes="(max-width: 640px) 100vw, 96px"
          />
        </div>
      )}
      <div className="vibe-flex-grow">
        <div className="vibe-flex-between-start">
          <Link
            href={`/${locale}/product/${item.variant.product.slug}`}
            className="vibe-product-name-link"
          >
            {translation?.name || item.variant.sku}
          </Link>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isLoading}
            className="vibe-icon-btn-error"
            aria-label={t('remove')}
          >
            <X className="vibe-icon-sm" />
          </button>
        </div>

        <p className="vibe-text-meta">
          {t('sku')}: {item.variant.sku}
        </p>

        <div className="vibe-flex-footer-stack">
          <div className="vibe-stack-y-3">
            <PriceDisplay
              pricing={item.variant.pricing}
              className="vibe-text-price-lg"
              locale={locale}
            />
            <div className="vibe-flex-items-center-gap-3">
              <span className="vibe-form-label-bold !mb-0">
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
