'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ExternalLink, Printer, Box, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { purchaseOrderLabel } from '@/lib/client/admin/orders';

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
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('adminDashboard.orders.shipping');

  const hasLabel = !!shipment?.labelUrl;

  const handlePurchaseLabel = async () => {
    try {
      setIsLoading(true);

      // 1. Fetch real price preview
      const response = await fetch(
        `/api/admin/orders/${orderId}/purchase-label`
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'errorPurchase');
      }

      const preview = await response.json();
      const realPrice = `${preview.amount} ${preview.currency}`;
      const customerPaid = shippingCost
        ? `${shippingCost} ${currency}`
        : t('na');

      // 2. Ask for confirmation
      const confirmMessage = `${t('purchaseConfirmPrice', { price: realPrice })}\n${t('purchaseConfirmPaid', { amount: customerPaid })}\n\n${t('purchaseConfirmQuestion')}`;

      if (!window.confirm(confirmMessage)) {
        setIsLoading(false);
        return;
      }

      // 3. Proceed with purchase
      await purchaseOrderLabel(orderId);

      alert(t('successPurchase'));
      router.refresh();
    } catch (error: any) {
      alert(t('errorPrefix', { message: t(error.message) }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!shippingRateId && !hasLabel) {
    return (
      <div className="admin-card border-yellow-200 bg-yellow-50/50">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          {t('actionRequired')}
        </h2>
        <p className="text-gray-900 font-medium mb-4">{t('rateNotFound')}</p>
        <div className="flex gap-4">
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
            {t('generateLabel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h3 className="admin-section-title flex items-center gap-2">
        <Truck className="h-4 w-4 admin-text-subtle" />
        {t('title')}
      </h3>

      <div className="space-y-4">
        {/* Résumé du choix client */}
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="h-5 w-5 admin-text-subtle" />
              <div>
                <p className="font-medium text-gray-900">
                  {hasLabel
                    ? shipment?.carrier || t('carrierDefault')
                    : t('customerSelection')}
                </p>
                <p className="text-sm admin-text-subtle">
                  {hasLabel
                    ? `${t('tracking')}: ${shipment?.trackingCode || t('na')}`
                    : t('standardShipping')}
                </p>
              </div>
            </div>
            <div className="text-right">
              {shippingCost && (
                <p className="font-bold text-gray-900">
                  {shippingCost} {currency}
                </p>
              )}
              {hasLabel ? (
                <span className="admin-badge-success">
                  {t('labelGenerated')}
                </span>
              ) : (
                <span className="admin-badge-warning">
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
