'use client';

import { useState } from 'react';
import { Truck, ExternalLink, Printer, Box } from 'lucide-react';

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
        throw new Error(data.error || 'Failed to purchase label');
      }

      alert('Label purchased successfully');
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-red-700">
          <Truck className="h-5 w-5" />
          Shipping Information Missing
        </h2>
        <p className="text-gray-900 font-medium mb-4">
          No shipping rate ID found in this order.
        </p>
        <div className="flex gap-4">
          <button
            onClick={handlePurchaseLabel}
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 font-medium text-sm"
          >
            Generer l'étiquette (Force)
          </button>
        </div>
        <div className="mt-4 rounded bg-gray-50 p-3 text-xs font-mono border border-gray-200 overflow-auto max-h-40">
          <p className="font-bold mb-1 text-gray-700">Debug Metadata:</p>
          <pre className="text-gray-600">
            {JSON.stringify(debugMetadata, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Truck className="h-5 w-5" />
        Shipping Management
      </h2>

      <div className="space-y-4">
        {/* Résumé du choix client */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Box className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">
                  {hasLabel
                    ? shipment?.carrier || 'Carrier'
                    : 'Customer Selection'}
                </p>
                <p className="text-sm text-gray-500">
                  {hasLabel
                    ? `Tracking: ${shipment?.trackingCode || 'N/A'}`
                    : 'Standard Shipping (Calculated via Shippo)'}
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
                  Label Generated
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                  Pending Action
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
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  // Pour l'instant on utilise un site tiers ou le lien provider si dispo
                >
                  <ExternalLink className="h-4 w-4" />
                  Track Package
                </a>
              )}

              <a
                href={shipment?.labelUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Printer className="h-4 w-4" />
                Print Label
              </a>
            </div>
          ) : (
            <button
              onClick={handlePurchaseLabel}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Purchase & Generate Label
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
