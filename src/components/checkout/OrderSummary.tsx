import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
} from '@/lib/config/vibe-styles';
import { formatPrice } from '@/lib/utils/currency';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface OrderSummaryProps {
  summaryItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: string;
    image?: string;
  }>;
  initialTotal: number;
  total: number;
  currency: string;
  locale: string;
  selectedRate: any;
}

export function OrderSummary({
  summaryItems,
  initialTotal,
  total,
  currency,
  locale,
  selectedRate,
}: OrderSummaryProps) {
  const t = useTranslations('checkout');
  return (
    <Card className={`vibe-card-raised-p6 ${VIBE_ANIMATION_FADE_IN}`}>
      <h2 className="vibe-h2-underlined">{t('orderSummary')}</h2>

      <div className="vibe-stack-y-4 vibe-text-xs-muted">
        {/* Items List */}
        {summaryItems && summaryItems.length > 0 && (
          <div className="vibe-mb-6 vibe-list-stack vibe-scrollable-area custom-scrollbar max-h-[40vh]">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className={`vibe-flex-items-center-gap-4 vibe-animate-slide-in-right ${VIBE_ANIMATION_SLIDE_IN_RIGHT}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image Container */}
                <div className="vibe-product-thumb-sm">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="vibe-image-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="vibe-badge-img-placeholder">
                      <span className="vibe-text-img-placeholder">IMG</span>
                    </div>
                  )}
                  <div className="vibe-badge-quantity">{item.quantity}</div>
                </div>

                {/* Details */}
                <div className="vibe-flex-grow">
                  <h4 className="vibe-text-medium-foreground truncate">
                    {item.name}
                  </h4>
                  <p className="vibe-text-xs-muted">
                    {formatPrice(item.price, item.currency as any, locale)}
                  </p>
                </div>

                <div className="vibe-text-right">
                  <p className="vibe-text-bold-foreground">
                    {formatPrice(
                      item.price * item.quantity,
                      item.currency as any,
                      locale
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div className="vibe-section-divider-bottom vibe-pt-2" />
          </div>
        )}

        <div className="vibe-stack-y-2">
          <div className="vibe-flex-between-center vibe-text-muted">
            <span>{t('subtotal')}</span>
            <span className="vibe-text-medium-foreground">
              {formatPrice(initialTotal, currency as any, locale)}
            </span>
          </div>
          <div className="vibe-flex-between-center vibe-text-muted">
            <span>{t('shipping')}</span>
            <span className="vibe-text-medium-foreground">
              {formatPrice(
                selectedRate?.amount || 0,
                selectedRate?.currency || currency,
                locale
              )}
            </span>
          </div>
        </div>

        <div className="vibe-section-divider-top">
          <div className="vibe-flex-between-center">
            <span className="vibe-text-total-label">{t('totalToPay')}</span>
            <span className="vibe-text-total-value">
              {formatPrice(total, currency as any, locale)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
