import { MapPin, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Address } from '@/generated/prisma';

interface CustomerAddressBookProps {
  addresses: Address[];
}

export async function CustomerAddressBook({
  addresses,
}: CustomerAddressBookProps) {
  const t = await getTranslations('adminDashboard.customers.detail');

  return (
    <div className="admin-card">
      <h3 className="admin-section-title">{t('savedAddresses')}</h3>
      <div className="grid gap-6 sm:grid-cols-2">
        {addresses.length === 0 ? (
          <p className="text-sm text-gray-500 italic col-span-2">
            {t('noAddresses')}
          </p>
        ) : (
          addresses.map(addr => (
            <div key={addr.id} className="admin-info-card">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 admin-text-subtle mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="admin-text-subtle">{addr.street}</p>
                  {addr.street2 && (
                    <p className="admin-text-subtle">{addr.street2}</p>
                  )}
                  <p className="admin-text-subtle">
                    {addr.city}, {addr.state} {addr.zipCode}
                  </p>
                  <p className="admin-text-subtle">{addr.country}</p>
                  {addr.phone && (
                    <p className="mt-2 text-xs flex items-center gap-1 admin-text-subtle">
                      <Phone className="h-3 w-3" /> {addr.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
