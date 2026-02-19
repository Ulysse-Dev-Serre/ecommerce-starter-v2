'use client';

import { useEffect, useMemo } from 'react';
import { FormInput } from '@/components/ui/form-input';
import { FormSelect } from '@/components/ui/form-select';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

import AddressAutocomplete from './AddressAutocomplete';
import { Loader2 } from 'lucide-react';
import { CheckoutAddress } from '@/lib/types/ui/checkout';
import {
  SITE_CURRENCY,
  COUNTRY_TO_CURRENCY,
  PHONE_PREFIX,
} from '@/lib/config/site';

interface AddressSectionProps {
  tempAddress: CheckoutAddress;
  setTempAddress: (address: CheckoutAddress) => void;
  tempName: string;
  setTempName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
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
  email,
  setEmail,
  phone,
  setPhone,
  isAddressReady,
  isLoading,
  onCalculateShipping,
  readOnly = false,
  onEdit,
}: AddressSectionProps) {
  const t = useTranslations('checkout');
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
      <Card className="border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="vibe-text-lg-bold text-primary">
            {t('shippingAddress')}
          </h2>
          <button
            onClick={onEdit}
            className="text-primary font-bold hover:underline underline-offset-4 inline-flex items-center vibe-text-sm"
          >
            {t('edit')}
          </button>
        </div>
        <div className="font-medium text-foreground leading-relaxed">
          <p className="vibe-mb-1 vibe-font-bold">{tempName}</p>
          <p className="vibe-text-sm vibe-text-muted-foreground vibe-mb-2">
            {email}
          </p>
          <p>{tempAddress.line1}</p>
          {tempAddress.line2 && <p>{tempAddress.line2}</p>}
          <p>
            {tempAddress.city}, {tempAddress.state} {tempAddress.zip}
          </p>
          <p>{tempAddress.country}</p>
          <p className="mt-2 vibe-text-sm vibe-text-muted-foreground">
            {phone}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-6 text-foreground border-b border-border pb-4">
        {t('shippingAddress')}
      </h2>
      <div className="space-y-4">
        {/* Name & Email & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label={t('fullName')}
            required
            value={tempName}
            data-testid="checkout-name"
            onChange={e => setTempName(e.target.value)}
          />

          <FormInput
            label={t('email')} // Assurez-vous d'avoir la clé de traduction 'email'
            type="email"
            required
            placeholder={t('emailPlaceholder')}
            value={email}
            data-testid="checkout-email"
            onChange={e => setEmail(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t('phone')} <span className="text-error ml-1">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                {PHONE_PREFIX}
              </span>
              <FormInput
                type="tel"
                value={phone}
                data-testid="checkout-phone"
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
                zip: selected.zip,
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
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
            <FormInput
              label={t('country')}
              value={instanceCountryCode}
              disabled
              readOnly
              className="bg-muted text-muted-foreground opacity-100 cursor-not-allowed"
            />
          </div>

          <FormInput
            label={t('city')}
            required
            value={tempAddress?.city || ''}
            data-testid="checkout-city"
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
              data-testid="checkout-state"
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
              data-testid="checkout-state"
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
            value={tempAddress?.zip || ''}
            data-testid="checkout-zip"
            onChange={e =>
              setTempAddress({
                ...tempAddress,
                zip: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onCalculateShipping}
          disabled={!isAddressReady || isLoading || !phone || !email}
          data-testid="confirm-address-button"
          className={`vibe-button-primary w-full h-12 vibe-h-12
            ${
              isAddressReady && !isLoading && phone && email
                ? ''
                : 'opacity-50 vibe-cursor-not-allowed vibe-shadow-none'
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
    </Card>
  );
}
