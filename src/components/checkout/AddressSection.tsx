import AddressAutocomplete from './AddressAutocomplete';

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
  translations: any;
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
  translations: t,
}: AddressSectionProps) {
  return (
    <section className="bg-card p-6 rounded-xl shadow-sm border border-border">
      <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2 border-b border-border pb-4">
        {t.shippingAddress}
      </h2>
      <div className="space-y-4">
        {/* Name & Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t.fullName} <span className="text-error ml-1">*</span>
            </label>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t.phone} <span className="text-error ml-1">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                +1
              </span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-r-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Address Line 1 */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t.addressLine1} <span className="text-error ml-1">*</span>
          </label>
          <AddressAutocomplete
            onAddressSelect={selected => {
              setTempAddress({
                ...tempAddress,
                line1: selected.line1,
                city: selected.city,
                state: selected.state,
                postal_code: selected.postal_code,
                country: selected.country,
              });
            }}
            onInputChange={val => {
              setTempAddress({
                ...tempAddress,
                line1: val,
              });
            }}
            value={tempAddress?.line1 || ''}
            placeholder={t.addressLine1}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            countryRestriction={tempAddress?.country === 'US' ? 'us' : 'ca'}
          />
        </div>

        {/* Address Line 2 */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            {t.addressLine2}
          </label>
          <input
            type="text"
            value={tempAddress?.line2 || ''}
            onChange={e =>
              setTempAddress({ ...tempAddress, line2: e.target.value })
            }
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>

        {/* Country & City Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t.country} <span className="text-error ml-1">*</span>
            </label>
            <select
              value={tempAddress?.country || 'CA'}
              onChange={e => {
                setTempAddress({
                  ...tempAddress,
                  country: e.target.value,
                  state: '',
                });
              }}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            >
              <option value="CA">Canada (CA)</option>
              <option value="US">États-Unis (US)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t.city} <span className="text-error ml-1">*</span>
            </label>
            <input
              type="text"
              value={tempAddress?.city || ''}
              onChange={e =>
                setTempAddress({ ...tempAddress, city: e.target.value })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* State & Zip Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t.state} <span className="text-error ml-1">*</span>
            </label>
            {tempAddress?.country === 'CA' ? (
              <select
                value={tempAddress?.state || ''}
                onChange={e =>
                  setTempAddress({
                    ...tempAddress,
                    state: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="">{t.selectState}</option>
                {Object.entries<string>(t.geography.CA).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            ) : tempAddress?.country === 'US' ? (
              <select
                value={tempAddress?.state || ''}
                onChange={e =>
                  setTempAddress({
                    ...tempAddress,
                    state: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="">{t.selectState}</option>
                {Object.entries<string>(t.geography.US).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={tempAddress?.state || ''}
                onChange={e =>
                  setTempAddress({
                    ...tempAddress,
                    state: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              {t.zipCode} <span className="text-error ml-1">*</span>
            </label>
            <input
              type="text"
              value={tempAddress?.postal_code || ''}
              onChange={e =>
                setTempAddress({
                  ...tempAddress,
                  postal_code: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
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
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {t.calculating}
            </div>
          ) : (
            t.confirmAddress
          )}
        </button>
      </div>
    </section>
  );
}
