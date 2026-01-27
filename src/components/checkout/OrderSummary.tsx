import { formatPrice } from '@/lib/utils/currency';
import { Card } from '@/components/ui/card';
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
  const t = useTranslations('Checkout');
  return (
    <Card className="p-6 animate-in fade-in duration-500 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-4">
        {t('orderSummary')}
      </h2>

      <div className="space-y-4 text-sm">
        {/* Items List */}
        {summaryItems && summaryItems.length > 0 && (
          <div className="mb-6 space-y-4 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
            {summaryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-4 items-center animate-in slide-in-from-right-2 duration-300"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Image Container */}
                <div className="relative h-16 w-16 flex-shrink-0 bg-muted border border-border rounded-lg overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
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
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(item.price, item.currency as any, locale)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {formatPrice(
                      item.price * item.quantity,
                      item.currency as any,
                      locale
                    )}
                  </p>
                </div>
              </div>
            ))}
            <div className="border-b border-border pt-2" />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-muted-foreground">
            <span>{t('subtotal')}</span>
            <span className="font-medium text-foreground">
              {formatPrice(initialTotal, currency as any, locale)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{t('shipping')}</span>
            <span className="font-medium text-foreground">
              {selectedRate
                ? formatPrice(
                    selectedRate.amount,
                    selectedRate.currency,
                    locale
                  )
                : '--'}
            </span>
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-foreground">
              {t('totalToPay')}
            </span>
            <span className="font-extrabold text-2xl text-primary">
              {formatPrice(total, currency as any, locale)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
