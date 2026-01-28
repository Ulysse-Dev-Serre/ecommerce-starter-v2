'use client';

import { useEffect, useMemo } from 'react';
import { FormInput } from '@/components/ui/form-input';
import { FormSelect } from '@/components/ui/form-select';
import { useTranslations } from 'next-intl';

import AddressAutocomplete from './AddressAutocomplete';
import { Loader2 } from 'lucide-react';
import { CheckoutAddress } from '@/lib/types/checkout';
import { SITE_CURRENCY, COUNTRY_TO_CURRENCY } from '@/lib/constants';

interface AddressSectionProps {
  tempAddress: CheckoutAddress;
  setTempAddress: (address: CheckoutAddress) => void;
  tempName: string;
  setTempName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  isAddressReady: boolean;
  isLoading: boolean;
  onCalculateShipping: () => void;
  readOnly?: boolean;
  onEdit?: () => void;
}

export function AddressSection({
  tempAddress,
  setTempAddress,
  tempName,
  setTempName,
  phone,
  setPhone,
  isAddressReady,
  isLoading,
  onCalculateShipping,
  readOnly = false,
  onEdit,
}: AddressSectionProps) {
  const t = useTranslations('Checkout');
  const g = useTranslations('geography');

  // Determine the target country for this instance based on SITE_CURRENCY
  const instanceCountryCode = useMemo(() => {
    const entry = Object.entries(COUNTRY_TO_CURRENCY).find(
      ([_, currency]) => currency === SITE_CURRENCY
    );
    return entry ? entry[0] : 'CA';
  }, []);

  // Ensure country is set to the instance default on mount or if missing
  useEffect(() => {
    if (tempAddress?.country !== instanceCountryCode) {
      setTempAddress({
        ...tempAddress,
        country: instanceCountryCode,
        state: '',
      });
    }
  }, [instanceCountryCode, tempAddress, setTempAddress]);

  // Dynamic State/Province options based on the active instance country
  const provinceOptions = useMemo(() => {
    const regions = g.raw(instanceCountryCode) as Record<string, string>;
    if (!regions) return [];
    return Object.entries<string>(regions).map(([code, name]) => ({
      value: code,
      label: name,
    }));
  }, [instanceCountryCode, g]);

  if (readOnly) {
    return (
      <section className="vibe-section-card vibe-border-primary/20 vibe-bg-primary/5">
        <div className="vibe-flex-between-items-center vibe-mb-4">
          <h2 className="vibe-text-lg-bold vibe-text-primary">
            {t('shippingAddress')}
          </h2>
          <button onClick={onEdit} className="vibe-link-action vibe-text-sm">
            {t('edit')}
          </button>
        </div>
        <div className="vibe-text-medium-foreground vibe-leading-relaxed">
          <p className="vibe-mb-1 vibe-font-bold">{tempName}</p>
          <p>{tempAddress.line1}</p>
          {tempAddress.line2 && <p>{tempAddress.line2}</p>}
          <p>
            {tempAddress.city}, {tempAddress.state} {tempAddress.postal_code}
          </p>
          <p>{tempAddress.country}</p>
          <p className="vibe-mt-2 vibe-text-sm vibe-text-muted-foreground">
            {phone}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="vibe-container-sm">
      <h2 className="vibe-section-title">{t('shippingAddress')}</h2>
      <div className="vibe-stack-y-4">
        {/* Name & Phone */}
        <div className="vibe-grid-form">
          <FormInput
            label={t('fullName')}
            required
            value={tempName}
            onChange={e => setTempName(e.target.value)}
          />

          <div>
            <label className="vibe-form-label">
              {t('phone')} <span className="vibe-form-required">*</span>
            </label>
            <div className="vibe-flex-row">
              <span className="vibe-input-prefix">+1</span>
              <FormInput
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="vibe-rounded-l-none"
              />
            </div>
          </div>
        </div>

        {/* Address Line 1 (Autocomplete restricted to instance Country) */}
        <div>
          <label className="vibe-form-label">
            {t('addressLine1')} <span className="vibe-form-required">*</span>
          </label>
          <AddressAutocomplete
            onAddressSelect={selected => {
              setTempAddress({
                ...tempAddress,
                line1: selected.line1,
                city: selected.city,
                state: selected.state,
                postal_code: selected.postal_code,
                country: instanceCountryCode,
              });
            }}
            onInputChange={val => {
              setTempAddress({
                ...tempAddress,
                line1: val,
              });
            }}
            value={tempAddress?.line1 || ''}
            placeholder={t('addressPlaceholder')}
            className="vibe-input-raw"
            countryRestriction={instanceCountryCode.toLowerCase()}
          />
        </div>

        {/* Address Line 2 */}
        <FormInput
          label={t('addressLine2')}
          value={tempAddress?.line2 || ''}
          onChange={e =>
            setTempAddress({ ...tempAddress, line2: e.target.value })
          }
        />

        {/* Country (Read-Only) & City */}
        <div className="vibe-grid-form">
          <div className="vibe-md-col-1">
            <FormInput
              label={t('country')}
              value={instanceCountryCode}
              disabled
              readOnly
              className="vibe-input-readonly"
            />
          </div>

          <FormInput
            label={t('city')}
            required
            value={tempAddress?.city || ''}
            onChange={e =>
              setTempAddress({ ...tempAddress, city: e.target.value })
            }
          />
        </div>

        {/* State & Zip Row */}
        <div className="vibe-grid-form">
          {provinceOptions.length > 0 ? (
            <FormSelect
              label={t('state')}
              required
              value={tempAddress?.state || ''}
              onChange={e =>
                setTempAddress({
                  ...tempAddress,
                  state: e.target.value,
                })
              }
              options={provinceOptions}
              placeholder={t('selectState')}
            />
          ) : (
            <FormInput
              label={t('state')}
              required
              value={tempAddress?.state || ''}
              onChange={e =>
                setTempAddress({
                  ...tempAddress,
                  state: e.target.value,
                })
              }
            />
          )}

          <FormInput
            label={t('zipCode')}
            required
            value={tempAddress?.postal_code || ''}
            onChange={e =>
              setTempAddress({
                ...tempAddress,
                postal_code: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="vibe-mt-8">
        <button
          onClick={onCalculateShipping}
          disabled={!isAddressReady || isLoading || !phone}
          className={`vibe-button-primary vibe-btn-full-lg vibe-h-12
            ${
              isAddressReady && !isLoading && phone
                ? ''
                : 'vibe-opacity-50 vibe-cursor-not-allowed vibe-shadow-none'
            }`}
        >
          {isLoading ? (
            <div className="vibe-loader-container">
              <Loader2 className="vibe-loader-icon" />
              {t('calculating')}
            </div>
          ) : (
            t('confirmAddress')
          )}
        </button>
      </div>
    </section>
  );
}
