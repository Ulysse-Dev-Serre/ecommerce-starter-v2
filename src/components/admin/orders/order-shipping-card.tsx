import { getTranslations } from 'next-intl/server';
import { Truck, Phone } from 'lucide-react';

interface OrderShippingCardProps {
  address: any;
  user?: any;
}

export async function OrderShippingCard({
  address,
  user,
}: OrderShippingCardProps) {
  const t = await getTranslations('adminDashboard.orders.detail');
  const shippingAddr = address as any;

  return (
    <div className="admin-card">
      <h3 className="admin-section-title !mb-4 text-sm">
        <Truck className="h-4 w-4 text-gray-500" />
        {t('shippingAddress')}
      </h3>
      {shippingAddr ? (
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-900">
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
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 inline" /> {shippingAddr.phone}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">{t('noShippingAddress')}</p>
      )}
    </div>
  );
}
