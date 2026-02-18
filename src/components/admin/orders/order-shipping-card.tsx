import { getTranslations } from 'next-intl/server';
import { Truck, Phone } from 'lucide-react';

import { Address } from '@/lib/types/domain/order';
import { User } from '@/generated/prisma';

interface OrderShippingCardProps {
  address: Address | null | undefined;
  user?: User | null;
}

export async function OrderShippingCard({
  address,
  user,
}: OrderShippingCardProps) {
  const t = await getTranslations('adminDashboard.orders.detail');
  const shippingAddr = address;

  return (
    <div className="admin-card">
      <h2 className="admin-section-title !mb-4 text-sm">
        <Truck className="h-4 w-4 admin-text-subtle" />
        {t('shippingAddress')}
      </h2>
      {shippingAddr ? (
        <div className="text-sm admin-text-subtle space-y-1">
          <p className="font-medium admin-text-main">
            {shippingAddr.name ||
              (user ? user.firstName + ' ' + user.lastName : '')}
          </p>
          <p>{shippingAddr.line1 || shippingAddr.street1}</p>
          {(shippingAddr.line2 || shippingAddr.street2) && (
            <p>{shippingAddr.line2 || shippingAddr.street2}</p>
          )}
          <p>
            {shippingAddr.city}
            {shippingAddr.state ? `, ${shippingAddr.state}` : ''}{' '}
            {shippingAddr.postal_code || shippingAddr.zip}
          </p>
          <p className="uppercase">{shippingAddr.country}</p>
          {shippingAddr.phone && (
            <div className="mt-2 pt-2 border-t admin-border-subtle">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 inline" /> {shippingAddr.phone}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm admin-text-subtle italic opacity-60">
          {t('noShippingAddress')}
        </p>
      )}
    </div>
  );
}
