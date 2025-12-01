'use client';

import { useState } from 'react';
import { StatusActions } from './status-actions';

interface OrderDetailClientProps {
  orderId: string;
  currentStatus: string;
}

export function OrderDetailClient({
  orderId,
  currentStatus: initialStatus,
}: OrderDetailClientProps) {
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <StatusActions
        orderId={orderId}
        currentStatus={currentStatus}
        onStatusChange={setCurrentStatus}
      />
    </div>
  );
}
