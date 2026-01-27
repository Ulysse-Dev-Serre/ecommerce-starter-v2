'use client';

import { useEffect, useMemo } from 'react';
import { FormInput } from '@/components/ui/form-input';
import { FormSelect } from '@/components/ui/form-select';
import { useTranslations } from 'next-intl';

import AddressAutocomplete from './AddressAutocomplete';
import { Loader2 } from 'lucide-react';
import { SITE_CURRENCY, COUNTRY_TO_CURRENCY } from '@/lib/constants';

interface AddressSectionProps {
  tempAddress: any;
  setTempAddress: (address: any) => void;
  tempName: string;
  setTempName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  isAddressReady: boolean;
  isLoading: boolean;
  onCalculateShipping: () => void;
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
}: AddressSectionProps) {
  const t = useTranslations('Checkout');
  const g = useTranslations('geography');
  // Determine the target country for this instance based on SITE_CURRENCY
  // Example: If SITE_CURRENCY is 'USD', we look for keys in COUNTRY_TO_CURRENCY where value is 'USD' -> returns 'US'
  const instanceCountryCode = useMemo(() => {
    const entry = Object.entries(COUNTRY_TO_CURRENCY).find(
      ([_, currency]) => currency === SITE_CURRENCY
    );
    return entry ? entry[0] : 'CA'; // Fallback to CA if not found, or handle error
  }, []);

  // Ensure country is set to the instance default on mount or if missing
  useEffect(() => {
    if (tempAddress?.country !== instanceCountryCode) {
      setTempAddress({
        ...tempAddress,
        country: instanceCountryCode,
        state: '', // Reset state if country changed forcefully
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

  return (
    <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
      <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2 border-b border-border pb-4">
        {t('shippingAddress')}
      </h2>
      <div className="space-y-4">
        {/* Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('fullName')}
            required
            value={tempName}
            onChange={e => setTempName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t('phone')} <span className="text-error ml-1">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                +1
              </span>
              <FormInput
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="rounded-l-none"
              />
            </div>
          </div>
        </div>

        {/* Address Line 1 (Autocomplete restricted to instance Country) */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t('addressLine1')} <span className="text-error ml-1">*</span>
          </label>
          <AddressAutocomplete
            onAddressSelect={selected => {
              setTempAddress({
                ...tempAddress,
                line1: selected.line1,
                city: selected.city,
                state: selected.state,
                postal_code: selected.postal_code,
                // Force country to instance default even if autocomplete returns something else (safety)
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
            placeholder={t('addressLine1')}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            // Restrict Google Autocomplete to the instance country code (lower case for API)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            {/* Display Country as Read-Only Input since it's fixed per instance */}
            <FormInput
              label={t('country')}
              value={instanceCountryCode} // Display code since localized name map not found in dict
              disabled
              readOnly
              className="bg-muted text-muted-foreground opacity-100 cursor-not-allowed" // Style to look fixed but readable
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="mt-8">
        <button
          onClick={onCalculateShipping}
          disabled={!isAddressReady || isLoading || !phone}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98]
            ${
              isAddressReady && !isLoading && phone
                ? 'bg-primary hover:bg-primary-hover hover:shadow-primary/20'
                : 'bg-muted text-muted-foreground cursor-not-allowed border border-border shadow-none'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
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
