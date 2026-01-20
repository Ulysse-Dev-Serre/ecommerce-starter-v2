'use client';

import { useState } from 'react';
import { OrderStatus } from '@/generated/prisma';
import { Package, RefreshCcw, AlertTriangle } from 'lucide-react';

interface StatusActionsProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  totalAmount: string;
  currency: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.PAID]: 'Payée',
  [OrderStatus.SHIPPED]: 'Expédiée',
  [OrderStatus.IN_TRANSIT]: 'En route',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée',
  [OrderStatus.REFUNDED]: 'Confirmé Remboursé',
  [OrderStatus.REFUND_REQUESTED]: 'Demande de Remboursement',
};

export function StatusActions({
  orderId,
  orderNumber,
  customerName,
  totalAmount,
  currency,
  currentStatus,
  onStatusChange,
}: StatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    // Confirmations spécifiques
    if (newStatus === OrderStatus.SHIPPED) {
      if (!window.confirm('Avez-vous expédié le colis ?')) return;
    }

    if (newStatus === OrderStatus.REFUNDED) {
      const confirmMsg = `Êtes-vous sûr de faire le remboursement de la commande ${orderNumber} au prix de ${totalAmount} ${currency} au client ${customerName} ?\n\nSi oui, nous allons envoyer un email au client pour lui dire qu'on a initié le remboursement.`;
      if (!window.confirm(confirmMsg)) return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment: `Statut changé vers ${STATUS_LABELS[newStatus]} par l'administrateur.`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update order status');
      }

      onStatusChange(newStatus);
      setSuccess(`Statut mis à jour : ${STATUS_LABELS[newStatus]}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
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
      const previewRes = await fetch(
        `/api/admin/orders/${orderId}/return-label?preview=true`,
        {
          method: 'POST',
        }
      );

      if (!previewRes.ok) {
        const data = await previewRes.json();
        throw new Error(data.message || 'Impossible de récupérer les tarifs');
      }

      const { data: previewData } = await previewRes.json();
      const { amount, currency, provider } = previewData;

      // Step 2: Show confirmation with price
      const confirmMsg = `Le tarif le moins cher trouvé est de ${amount} ${currency} via ${provider}.\n\nVoulez-vous générer et acheter cette étiquette de retour immédiatement ?`;

      if (!window.confirm(confirmMsg)) {
        setIsLoading(false);
        return;
      }

      // Step 3: Purchase the label
      const response = await fetch(
        `/api/admin/orders/${orderId}/return-label`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Échec de la génération de l'étiquette"
        );
      }

      setSuccess('Étiquette générée et envoyée par email !');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // On n'affiche les boutons que si le statut actuel permet ces transitions
  const canShip = currentStatus === OrderStatus.PAID;
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

  if (!canShip && !canRefund && !canReturn) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
        <AlertTriangle className="h-3.5 w-3.5" />
        Actions Admin
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-100 italic">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-2 text-xs text-green-700 border border-green-100 font-bold">
          {success}
        </div>
      )}

      <div className="grid gap-2">
        {canShip && (
          <button
            onClick={() => handleStatusChange(OrderStatus.SHIPPED)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <Package className="h-4 w-4" />
            MARQUER EXPÉDIÉE
          </button>
        )}

        {canReturn && (
          <button
            onClick={handleCreateReturnLabel}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            <RefreshCcw className="h-4 w-4 text-indigo-500" />
            GÉNÉRER ÉTIQUETTE RETOUR
          </button>
        )}

        {canRefund && (
          <button
            onClick={() => handleStatusChange(OrderStatus.REFUNDED)}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98] ${
              currentStatus === OrderStatus.REFUND_REQUESTED
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-md ring-2 ring-red-100'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-700'
            }`}
          >
            <RefreshCcw className="h-4 w-4" />
            {currentStatus === OrderStatus.REFUND_REQUESTED
              ? 'CONFIRMER REMBOURSEMENT'
              : 'REMBOURSER'}
          </button>
        )}
      </div>

      <p className="text-[10px] text-gray-400 leading-tight">
        * Statuts Stripe/Shippo automatiques. Boutons de secours uniquement.
      </p>
    </div>
  );
}
