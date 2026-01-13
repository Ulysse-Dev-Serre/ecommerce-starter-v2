'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { OrderStatus } from '@/generated/prisma';

interface StatusActionsProps {
  orderId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

// Workflow de transition d'état valide (doit être en sync avec le backend)
// Workflow de transition d'état valide (doit être en sync avec le backend)
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
  [OrderStatus.SHIPPED]: [], // La livraison est gérée automatiquement par l'API (Webhook)
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.PAID]: 'Payée',
  [OrderStatus.SHIPPED]: 'Expédiée',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée',
  [OrderStatus.REFUNDED]: 'Remboursée',
};

export function StatusActions({
  orderId,
  currentStatus,
  onStatusChange,
}: StatusActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const validNextStates = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  const hasValidTransitions = validNextStates.length > 0;

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          comment: `Statut changé vers ${STATUS_LABELS[newStatus]}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update order status');
      }

      onStatusChange(newStatus);
      setShowDropdown(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasValidTransitions) {
    return (
      <div className="text-sm text-gray-500">
        <p>Aucune transition disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">Changer le statut</h3>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isLoading}
          className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
        >
          <span>Sélectionner un statut</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-10 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
            {validNextStates.map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0"
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Transitions disponibles:{' '}
        {validNextStates.map(s => STATUS_LABELS[s]).join(', ')}
      </p>
    </div>
  );
}
