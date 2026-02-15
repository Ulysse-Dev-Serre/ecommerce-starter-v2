'use client';

import { useState } from 'react';
import { OrderStatus } from '@/generated/prisma';
import { Package, RefreshCcw, AlertTriangle, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import {
  updateAdminOrderStatus,
  handleAdminReturnLabel,
} from '@/lib/client/admin/orders';

interface StatusActionsProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export function StatusActions({
  orderId,
  orderNumber,
  customerName,
  totalAmount,
  currency,
  currentStatus,
  onStatusChange,
}: StatusActionsProps) {
  const router = useRouter();
  const t = useTranslations('adminDashboard.orders.statusActions');
  const tStatus = useTranslations('orders.detail');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return tStatus('statusPending');
      case OrderStatus.PAID:
        return tStatus('statusPaid');
      case OrderStatus.SHIPPED:
        return tStatus('statusShipped');
      case OrderStatus.IN_TRANSIT:
        return tStatus('statusInTransit');
      case OrderStatus.DELIVERED:
        return tStatus('statusDelivered');
      case OrderStatus.CANCELLED:
        return tStatus('statusCancelled');
      case OrderStatus.REFUNDED:
        return tStatus('statusRefunded');
      case OrderStatus.REFUND_REQUESTED:
        return tStatus('statusRefundRequested');
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Confirmations spécifiques
    if (newStatus === OrderStatus.SHIPPED) {
      if (!window.confirm(t('confirmShipped'))) return;
    }

    if (newStatus === OrderStatus.REFUNDED) {
      const confirmMsg = t('confirmRefundMessage', {
        orderNumber,
        amount: totalAmount,
        currency,
        customerName,
      });
      if (!window.confirm(confirmMsg)) return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const statusLabel = getStatusLabel(newStatus);
      await updateAdminOrderStatus(orderId, {
        status: newStatus,
        comment: t('statusChangedByAdmin', { status: statusLabel }),
      });

      if (onStatusChange) {
        onStatusChange(newStatus);
      } else {
        router.refresh();
      }
      setSuccess(t('statusUpdated', { status: statusLabel }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorUnknown');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReturnLabel = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Fetch cheapest rate for preview
      const previewData = await handleAdminReturnLabel(orderId, {
        preview: true,
      });
      const { amount, currency, provider } = previewData.data;

      // Step 2: Show confirmation with price
      const confirmMsg = t('confirmReturnLabel', {
        amount,
        currency,
        provider,
      });

      if (!window.confirm(confirmMsg)) {
        setIsLoading(false);
        return;
      }

      // Step 3: Purchase the label
      await handleAdminReturnLabel(orderId);

      setSuccess(t('labelGenerated'));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorUnknown');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // On n'affiche les boutons que si le statut actuel permet ces transitions
  const canShip = currentStatus === OrderStatus.PAID;
  const canTransit = currentStatus === OrderStatus.SHIPPED;
  const canDeliver = [OrderStatus.IN_TRANSIT].includes(currentStatus as any);
  const canRefund = [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.REFUND_REQUESTED,
  ].includes(currentStatus as any);

  // Étiquette de retour possible si la commande est payée ou au-delà (analyse cas par cas)
  const canReturn = [
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.IN_TRANSIT,
    OrderStatus.DELIVERED,
    OrderStatus.REFUND_REQUESTED,
    OrderStatus.REFUNDED,
    OrderStatus.CANCELLED,
  ].includes(currentStatus as any);

  if (!canShip && !canRefund && !canReturn && !canTransit && !canDeliver) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
        <AlertTriangle className="h-3.5 w-3.5" />
        {t('title')}
      </div>

      {error && <div className="admin-alert-error">{error}</div>}

      {success && <div className="admin-alert-success">{success}</div>}

      <div className="grid gap-2">
        {canShip && (
          <button
            onClick={() => handleStatusChange(OrderStatus.SHIPPED)}
            disabled={isLoading}
            className="admin-btn-info w-full"
          >
            <Package className="h-4 w-4" />
            {t('markShipped')}
          </button>
        )}

        {canTransit && (
          <button
            onClick={() => handleStatusChange(OrderStatus.IN_TRANSIT)}
            disabled={isLoading}
            className="admin-btn-secondary w-full"
          >
            <Truck className="h-4 w-4" />
            {t('markInTransit')}
          </button>
        )}

        {canDeliver && (
          <button
            onClick={() => handleStatusChange(OrderStatus.DELIVERED)}
            disabled={isLoading}
            className="admin-btn-success w-full"
          >
            <Package className="h-4 w-4" />
            {t('markDelivered')}
          </button>
        )}

        {canReturn && (
          <button
            onClick={handleCreateReturnLabel}
            disabled={isLoading}
            className="admin-btn-secondary w-full"
          >
            <RefreshCcw className="h-4 w-4 text-primary" />
            {t('generateReturnLabel')}
          </button>
        )}

        {canRefund && (
          <button
            onClick={() => handleStatusChange(OrderStatus.REFUNDED)}
            disabled={isLoading}
            className={cn(
              'w-full',
              currentStatus === OrderStatus.REFUND_REQUESTED
                ? 'admin-btn-danger'
                : 'admin-btn-secondary'
            )}
          >
            <RefreshCcw className="h-4 w-4" />
            {currentStatus === OrderStatus.REFUND_REQUESTED
              ? t('confirmRefund')
              : t('refund')}
          </button>
        )}
      </div>

      <p className="admin-text-tiny">{t('help')}</p>
    </div>
  );
}
