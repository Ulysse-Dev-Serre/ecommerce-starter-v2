import { Package, Box } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PackedParcel } from '@/lib/services/shipping/packing.service';

interface OrderPackingCardProps {
  packingResult: any; // Using any because it's stored as Json in DB
}

/**
 * Server Component displaying the optimized packing result for an order.
 * Now fully internationalized using next-intl.
 */
export async function OrderPackingCard({
  packingResult,
}: OrderPackingCardProps) {
  const t = await getTranslations('adminDashboard.orders.shipping');

  if (
    !packingResult ||
    !Array.isArray(packingResult) ||
    packingResult.length === 0
  ) {
    return (
      <div className="admin-card">
        <h3 className="admin-section-title !mb-4 text-sm">
          <Package className="h-4 w-4 text-[var(--admin-text-muted)]" />
          {t('packingInstructions')}
        </h3>
        <p className="text-sm text-[var(--admin-text-muted)] italic">
          {t('noPackingInstructions')}
        </p>
      </div>
    );
  }

  const parcels = packingResult as PackedParcel[];

  return (
    <div className="admin-card">
      <h3 className="admin-section-title !mb-4 text-sm">
        <Package className="h-4 w-4 text-[var(--admin-text-muted)]" />
        {t('packingListOptimized')}
      </h3>

      <div className="space-y-4">
        {parcels.map((parcel, idx) => (
          <div
            key={idx}
            className="p-3 bg-[var(--admin-bg)] border border-[var(--admin-border)]"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-[var(--admin-accent)]" />
                <span className="font-semibold text-sm text-[var(--admin-text-main)]">
                  {parcel.boxName}
                </span>
              </div>
              <span className="vibe-badge bg-[var(--admin-border)] border-[var(--admin-border)] text-[var(--admin-text-main)] shadow-none">
                {t('parcel')} #{idx + 1}
              </span>
            </div>

            <div className="text-xs text-[var(--admin-text-muted)] grid grid-cols-2 gap-1 mb-3">
              <p>
                {t('dimensions')}: {parcel.width}x{parcel.length}x
                {parcel.height} cm
              </p>
              <p className="text-right">
                {t('weight')}: {parcel.weight} kg
              </p>
            </div>

            <div className="border-t border-[var(--admin-border)] pt-2">
              <p className="text-[10px] font-bold text-[var(--admin-text-muted)] opacity-70 uppercase mb-1 tracking-wider">
                {t('contents')}
              </p>
              <ul className="space-y-1">
                {parcel.items.map((item, iIdx) => (
                  <li
                    key={iIdx}
                    className="text-xs flex justify-between items-center text-[var(--admin-text-main)]"
                  >
                    <span className="truncate max-w-[150px]">{item.id}</span>
                    <span className="font-medium">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
