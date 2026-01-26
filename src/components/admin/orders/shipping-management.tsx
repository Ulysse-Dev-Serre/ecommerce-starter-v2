'use client';

import { useState } from 'react';
import { Truck, ExternalLink, Printer, Box } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ShippingManagementProps {
  orderId: string;
  shipment?: {
    id: string;
    status: string;
    currency?: string;
    carrier?: string | null;
    trackingCode?: string | null;
    labelUrl?: string | null;
  } | null;
  shippingRateId?: string;
  shippingCost?: number;
  currency?: string;
  debugMetadata?: any;
}

export function ShippingManagement({
  orderId,
  shipment,
  shippingRateId,
  shippingCost,
  currency,
  debugMetadata,
}: ShippingManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('adminDashboard.orders.shipping');

  // Si on a déjà une URL d'étiquette, c'est que l'expédition est gérée
  const hasLabel = !!shipment?.labelUrl;

  const handlePurchaseLabel = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}/purchase-label`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errorPurchase'));
      }

      alert(t('successPurchase'));
      // Rafraîchir la page pour voir les changements
      window.location.reload();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!shippingRateId && !hasLabel) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-yellow-800">
          <Truck className="h-5 w-5" />
          {t('actionRequired')}
        </h2>
        <p className="text-gray-900 font-medium mb-4">{t('rateNotFound')}</p>
        <div className="flex gap-4">
          <button onClick={handlePurchaseLabel} className="admin-btn-primary">
            <Truck className="h-4 w-4" />
            {t('generateLabel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Truck className="h-4 w-4 text-gray-500" />
        {t('title')}
      </h3>

      <div className="space-y-4">
        {/* Résumé du choix client */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {hasLabel
                    ? shipment?.carrier || t('carrierDefault')
                    : t('customerSelection')}
                </p>
                <p className="text-sm text-gray-500">
                  {hasLabel
                    ? `${t('tracking')}: ${shipment?.trackingCode || 'N/A'}`
                    : t('standardShipping')}
                </p>
              </div>
            </div>
            <div className="text-right">
              {shippingCost && (
                <p className="font-medium">
                  {shippingCost} {currency}
                </p>
              )}
              {hasLabel ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  {t('labelGenerated')}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  {t('pendingAction')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          {hasLabel ? (
            <div className="flex gap-3">
              {shipment?.trackingCode && (
                <a
                  href={`https://parcelsapp.com/en/tracking/${shipment.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn-secondary"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('trackPackage')}
                </a>
              )}

              <a
                href={shipment?.labelUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-primary"
              >
                <Printer className="h-4 w-4" />
                {t('printLabel')}
              </a>
            </div>
          ) : (
            <button
              onClick={handlePurchaseLabel}
              disabled={isLoading}
              className="admin-btn-primary"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              {t('purchaseLabel')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
