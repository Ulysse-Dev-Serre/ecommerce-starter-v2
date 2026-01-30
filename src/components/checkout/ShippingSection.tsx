import {
  VIBE_ANIMATION_FADE_IN,
  VIBE_ANIMATION_ZOOM_IN,
  VIBE_ANIMATION_SLIDE_IN_RIGHT,
  VIBE_ANIMATION_SLIDE_IN_BOTTOM,
  VIBE_HOVER_GROUP,
} from '@/lib/config/vibe-styles';
import { formatPrice } from '@/lib/utils/currency';
import { useTranslations } from 'next-intl';

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
      <section className="vibe-section-card vibe-border-primary/20 vibe-bg-primary/5">
        <div className="vibe-flex-between-items-center vibe-mb-4">
          <h2 className="vibe-text-lg-bold vibe-text-primary">
            {t('shippingMethod')}
          </h2>
          <button onClick={onEdit} className="vibe-link-action vibe-text-sm">
            {t('edit')}
          </button>
        </div>
        <div className="vibe-flex-between-center vibe-text-medium-foreground">
          <div className="vibe-flex-items-center-gap-2">
            <div className="vibe-custom-radio vibe-custom-radio-selected">
              <div className="vibe-custom-radio-inner" />
            </div>
            <div>
              <p className="vibe-font-bold">
                {selectedRate.displayName || selectedRate.servicelevel.name}
              </p>
              <p className="vibe-text-xs-muted">
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
      </section>
    );
  }

  return (
    <section className={`vibe-section-card ${VIBE_ANIMATION_SLIDE_IN_BOTTOM}`}>
      <h2 className="vibe-section-header">{t('shippingMethod')}</h2>

      {isLoading ? (
        <div className="vibe-list-container">
          {[1, 2].map(i => (
            <div
              key={i}
              className={`${VIBE_HOVER_GROUP} vibe-selectable-card vibe-selectable-card-inactive vibe-flex-between-center`}
            >
              <div className="vibe-flex-items-center-gap-4">
                <Skeleton className="vibe-skeleton-icon" />
                <div className="vibe-stack-y-2">
                  <Skeleton className="vibe-skeleton-text-md" />
                  <Skeleton className="vibe-skeleton-text-sm" />
                </div>
              </div>
              <Skeleton className="vibe-skeleton-price" />
            </div>
          ))}
        </div>
      ) : shippingRates.length > 0 ? (
        <div className="vibe-stack-y-6">
          <div className="vibe-stack-y-3">
            {shippingRates.map((rate: ShippingRate, index: number) => {
              const rateId = rate.object_id || rate.objectId;
              const selectedId =
                selectedRate?.object_id || selectedRate?.objectId;
              const isSelected = selectedId === rateId;

              return (
                <div
                  key={rateId || index}
                  className={`${VIBE_HOVER_GROUP} vibe-selectable-card ${isSelected ? 'vibe-selectable-card-selected' : 'vibe-selectable-card-inactive'}`}
                  onClick={() => onRateSelect(rate)}
                >
                  <div className="vibe-flex-between-center vibe-relative-full">
                    <div className="vibe-flex-items-center-gap-4">
                      <div
                        className={
                          isSelected
                            ? 'vibe-custom-radio vibe-custom-radio-selected'
                            : 'vibe-custom-radio vibe-custom-radio-inactive'
                        }
                      >
                        {isSelected && (
                          <div className="vibe-custom-radio-inner" />
                        )}
                      </div>

                      <div>
                        <div className="vibe-text-bold-foreground">
                          {rate.displayName || rate.servicelevel.name}
                        </div>
                        <div className="vibe-text-xs-muted">
                          {rate.duration_terms || rate.displayTime}
                        </div>
                      </div>
                    </div>
                    <div className="vibe-text-right">
                      <div className="vibe-text-price-xl">
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
            className={`vibe-button-primary vibe-btn-full-lg vibe-h-12 ${!selectedRate ? 'vibe-opacity-50' : ''}`}
          >
            {t('continueToPayment')}
          </button>
        </div>
      ) : (
        <div className={`${VIBE_HOVER_GROUP} vibe-empty-placeholder`}>
          <div className="vibe-empty-icon">
            <MapPin className="vibe-icon-xl" />
          </div>
          <p className="vibe-text-xs-muted vibe-container-sm">
            {t('enterAddressToSeeShipping')}
          </p>
          <div className="vibe-flex-between-center vibe-text-muted">
            <span className="vibe-text-medium">
              {t('addressRequiredFields')}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
