import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { SupportedCurrency } from '@/lib/config/site';
import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
} from '@/lib/config/vibe-styles';
import { ShippingRate } from '@/lib/integrations/shippo';
import { formatPrice } from '@/lib/utils/currency';

import { Card } from '@/components/ui/card';

interface OrderSummaryProps {
  summaryItems?: Array<{
    name: string;
    quantity: number;
    price: number;
    currency: SupportedCurrency;
    image?: string;
  }>;
  initialTotal: number;
  total: number;
  currency: SupportedCurrency;
  locale: string;
  selectedRate: ShippingRate | null;
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
    <Card className={`p-6 duration-500 shadow-lg ${VIBE_ANIMATION_FADE_IN}`}>
      <h2 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-4">
        {t('orderSummary')}
      </h2>

      <div className="space-y-4 text-xs text-muted-foreground">
        {/* Items List */}
        {summaryItems && summaryItems.length > 0 && (
          <div className="mb-6 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar max-h-[40vh]">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-4 duration-300 ${VIBE_ANIMATION_SLIDE_IN_RIGHT}`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image Container */}
                <div className="relative h-16 w-16 flex-shrink-0 bg-muted border border-border rounded-lg overflow-hidden">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="vibe-image-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                      <span className="text-[10px]">IMG</span>
                    </div>
                  )}
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                    {item.quantity}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-grow">
                  <h4 className="font-medium text-foreground truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.price, item.currency, locale)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {formatPrice(
                      item.price * item.quantity,
                      item.currency,
                      locale
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-b border-border pb-4 pt-2" />
          </div>
        )}

        <div className="vibe-stack-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{t('subtotal')}</span>
            <span className="font-medium text-foreground">
              {formatPrice(initialTotal, currency, locale)}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>{t('shipping')}</span>
            <span className="font-medium text-foreground">
              {formatPrice(
                selectedRate?.amount || 0,
                (selectedRate?.currency as SupportedCurrency) || currency,
                locale
              )}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-foreground">
              {t('totalToPay')}
            </span>
            <span
              className="font-extrabold text-2xl text-primary"
              data-testid="order-total"
            >
              {formatPrice(total, currency, locale)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
