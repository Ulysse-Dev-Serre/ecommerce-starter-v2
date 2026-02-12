import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
  VIBE_HOVER_GROUP,
} from '@/lib/config/vibe-styles';
import { formatPrice } from '@/lib/utils/currency';
import { useTranslations } from 'next-intl';

import { Card } from '@/components/ui/card';
import { ShippingRate } from '@/lib/integrations/shippo';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';

interface ShippingSectionProps {
  shippingRates: ShippingRate[];
  selectedRate: ShippingRate | null;
  isLoading: boolean;
  onRateSelect: (rate: ShippingRate) => void;
  locale: string;
  readOnly?: boolean;
  onEdit?: () => void;
  onConfirm?: () => void;
}

export function ShippingSection({
  shippingRates,
  selectedRate,
  isLoading,
  onRateSelect,
  locale,
  readOnly = false,
  onEdit,
  onConfirm,
}: ShippingSectionProps) {
  const t = useTranslations('checkout');

  if (readOnly && selectedRate) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="vibe-text-lg-bold text-primary">
            {t('shippingMethod')}
          </h2>
          <button
            onClick={onEdit}
            className="text-primary font-bold hover:underline underline-offset-4 inline-flex items-center vibe-text-sm"
          >
            {t('edit')}
          </button>
        </div>
        <div className="flex justify-between items-center font-medium text-foreground">
          <div className="vibe-flex-items-center-gap-2">
            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 border-primary bg-primary">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
            </div>
            <div>
              <p className="vibe-font-bold">
                {selectedRate.displayName || selectedRate.servicelevel.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRate.duration_terms || selectedRate.displayTime}
              </p>
            </div>
          </div>
          <span className="vibe-text-lg-bold">
            {formatPrice(
              selectedRate.amount,
              selectedRate.currency as any,
              locale
            )}
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={VIBE_ANIMATION_SLIDE_IN_BOTTOM}>
      <h2 className="flex items-center gap-2 border-b border-border pb-4">
        {t('shippingMethod')}
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div
              key={i}
              className={`${VIBE_HOVER_GROUP} relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 border-border bg-background hover:border-primary/50 hover:bg-accent/50 flex justify-between items-center`}
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="vibe-stack-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : shippingRates.length > 0 ? (
        <div className="space-y-6">
          <div className="space-y-3">
            {shippingRates.map((rate: ShippingRate, index: number) => {
              const rateId = rate.object_id || rate.objectId;
              const selectedId =
                selectedRate?.object_id || selectedRate?.objectId;
              const isSelected = selectedId === rateId;

              return (
                <div
                  key={rateId || index}
                  data-testid="shipping-rate-item"
                  className={`${VIBE_HOVER_GROUP} relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${isSelected ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'}`}
                  onClick={() => onRateSelect(rate)}
                >
                  <div className="flex justify-between items-center relative w-full">
                    <div className="flex items-center gap-4">
                      <div
                        className={
                          isSelected
                            ? 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 border-primary bg-primary'
                            : 'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 border-border group-hover:border-primary/50'
                        }
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-foreground">
                          {rate.displayName || rate.servicelevel.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {rate.duration_terms || rate.displayTime}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {formatPrice(rate.amount, rate.currency as any, locale)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onConfirm}
            disabled={!selectedRate}
            data-testid="confirm-shipping-button"
            className={`vibe-button-primary w-full h-12 vibe-h-12 ${!selectedRate ? 'opacity-50' : ''}`}
          >
            {t('continueToPayment')}
          </button>
        </div>
      ) : (
        <div
          className={`${VIBE_HOVER_GROUP} text-center py-12 bg-muted/50 rounded-xl border border-dashed border-border`}
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
            <MapPin className="h-12 w-12" />
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t('enterAddressToSeeShipping')}
          </p>
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="font-medium">{t('addressRequiredFields')}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
