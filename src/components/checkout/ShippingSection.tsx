import { formatPrice } from '@/lib/utils/currency';
import { useTranslations } from 'next-intl';

import { ShippingRate } from '@/lib/types/checkout';
import { Skeleton } from '@/components/ui/skeleton';

interface ShippingSectionProps {
  shippingRates: ShippingRate[];
  selectedRate: ShippingRate | null;
  isLoading: boolean;
  onRateSelect: (rate: ShippingRate) => void;
  locale: string;
}

export function ShippingSection({
  shippingRates,
  selectedRate,
  isLoading,
  onRateSelect,
  locale,
}: ShippingSectionProps) {
  const t = useTranslations('Checkout');
  return (
    <section className="bg-card p-6 rounded-xl shadow-sm border border-border animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2 border-b border-border pb-4">
        {t('shippingMethod')}
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div
              key={i}
              className="p-5 border-2 border-border/50 rounded-xl flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : shippingRates.length > 0 ? (
        <div className="space-y-3">
          {shippingRates.map((rate: ShippingRate, index: number) => {
            const rateId = rate.object_id || rate.objectId;
            const selectedId =
              selectedRate?.object_id || selectedRate?.objectId;
            const isSelected = selectedId === rateId;

            return (
              <div
                key={rateId || index}
                className={`relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 group
                  ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                      : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
                  }`}
                onClick={() => onRateSelect(rate)}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-4">
                    {/* Radio Circle */}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300
                        ${isSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'}`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-foreground">
                        {rate.displayName || rate.servicelevel.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {rate.duration_terms || rate.displayTime}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-foreground">
                      {formatPrice(rate.amount, rate.currency as any, locale)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border group">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
            📍
          </div>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {t('enterAddressToSeeShipping')}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            {t('addressRequiredFields')}
          </p>
        </div>
      )}
    </section>
  );
}
